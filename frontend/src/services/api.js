import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';
const DEFAULT_TIMEOUT_MS = 60000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  let signal = controller.signal;
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } finally {
    clearTimeout(id);
  }
};

const customFetch = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (!isGet) {
    return fetchWithTimeout(url, options, DEFAULT_TIMEOUT_MS);
  }

  try {
    const response = await fetchWithTimeout(url, options, DEFAULT_TIMEOUT_MS);
    if (!response.ok && response.status >= 500) {
      return await fetchWithTimeout(url, options, DEFAULT_TIMEOUT_MS);
    }
    return response;
  } catch {
    return await fetchWithTimeout(url, options, DEFAULT_TIMEOUT_MS);
  }
};

const getErrorMessage = async (response, fallbackMessage) => {
  try {
    const result = await response.json();
    return result?.error?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('You must be signed in to manage listings');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

export const fetchProperties = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const activeParams = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(query)) {
      if (value) activeParams.append(key, value);
  }
  const response = await customFetch(`${API_BASE_URL}/api/properties/?${activeParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch properties');
  const result = await response.json();
  return { 
    data: result.data || [], 
    total: result.total || 0,
    page: result.page,
    limit: result.limit
  };
};

export const submitEnquiry = async (enquiryData) => {
  const response = await customFetch(`${API_BASE_URL}/api/enquiries/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enquiryData)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to submit enquiry'));
  const result = await response.json();
  return result.data;
};

export const fetchPropertyBySlug = async (slug) => {
  const response = await customFetch(`${API_BASE_URL}/api/properties/${slug}`);
  if (!response.ok) throw new Error('Property not found');
  const result = await response.json();
  return result.data;
};

export const fetchSimilarProperties = async (slug) => {
  const response = await customFetch(`${API_BASE_URL}/api/properties/similar/${slug}`);
  if (!response.ok) throw new Error('Similar properties missing');
  const result = await response.json();
  return result.data || [];
};

export const createProperty = async (propertyData) => {
  const headers = await getAuthHeaders();

  const response = await customFetch(`${API_BASE_URL}/api/properties/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(propertyData)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to create property'));
  const result = await response.json();
  return result.data;
};

export const fetchMyProperties = async () => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/properties/mine`, { headers });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch your properties'));
  const result = await response.json();
  return result.data || [];
};

export const fetchEditableProperty = async (propertyId) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/properties/manage/${propertyId}`, { headers });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch listing details'));
  const result = await response.json();
  return result.data;
};

export const updatePropertyStatus = async (propertyId, status) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/properties/${propertyId}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to update property status'));
  const result = await response.json();
  return result.data;
};

export const updateProperty = async (propertyId, propertyData) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/properties/manage/${propertyId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(propertyData)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to update property'));
  const result = await response.json();
  return result.data;
};

export const deleteProperty = async (propertyId) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/properties/manage/${propertyId}`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to delete property'));
  const result = await response.json();
  return result.data;
};

export const fetchMyProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/profile/me`, { headers });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch profile'));
  const result = await response.json();
  return result.data;
};

export const updateProfile = async (profileData) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/profile/update`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(profileData)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to update profile'));
  const result = await response.json();
  return result.data;
};

export const updateAgentProfile = async (agentData) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/profile/agent-update`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(agentData)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to update agent details'));
  const result = await response.json();
  return result.data;
};

export const setupProfile = async (data) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Authentication required');

  const response = await customFetch(`${API_BASE_URL}/api/auth/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to setup profile');
  }
  return response.json();
};

export const fetchMyEnquiries = async () => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/enquiries/mine`, { headers });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch enquiries'));
  const result = await response.json();
  return result.data;
};

export const updateEnquiryStatus = async (enquiryId, status) => {
  const headers = await getAuthHeaders();
  const response = await customFetch(`${API_BASE_URL}/api/enquiries/${enquiryId}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to update enquiry status'));
  const result = await response.json();
  return result.data;
};

export const fetchAgentProfile = async (agentId) => {
  const response = await customFetch(`${API_BASE_URL}/api/profile/agents/${agentId}`);
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Agent not found'));
  const result = await response.json();
  return result.data;
};
