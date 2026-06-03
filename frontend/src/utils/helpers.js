export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffTime = Math.abs(new Date() - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays <= 1) return 'Posted today';
  if (diffDays < 30) return `Posted ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Posted 1 month ago';
  return `Posted ${diffMonths} months ago`;
};

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  
  // Strip trailing slashes and check for invalid segments
  const clean = trimmed.replace(/\/+$/, '');
  if (clean === 'null' || clean === 'undefined') return false;
  if (clean.endsWith('/null') || clean.endsWith('/undefined')) return false;
  
  return true;
};

const parsePostgresArray = (str) => {
  if (typeof str !== 'string') return [];
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return [];
  
  const content = trimmed.slice(1, -1).trim();
  if (!content) return [];
  
  const results = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      results.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current || content.endsWith(',')) {
    results.push(current.trim());
  }
  
  return results.map(item => {
    let cleaned = item;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.replace(/\\(.)/g, '$1').trim();
  });
};

export const getPropertyImages = (property) => {
  if (!property) return [];
  
  let urls = [];
  
  // 1. Add main image if valid
  if (isValidImageUrl(property.main_image_url)) {
    urls.push(property.main_image_url.trim());
  }
  
  // 2. Parse and validate image_urls
  if (property.image_urls) {
    let parsedUrls = [];
    if (Array.isArray(property.image_urls)) {
      parsedUrls = property.image_urls;
    } else if (typeof property.image_urls === 'string') {
      const trimmed = property.image_urls.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsedUrls = parsePostgresArray(trimmed);
      } else {
        try {
          parsedUrls = JSON.parse(trimmed);
          if (!Array.isArray(parsedUrls)) {
            parsedUrls = [parsedUrls];
          }
        } catch (e) {
          // If not valid JSON, treat as comma-separated or single string
          if (trimmed.includes(',')) {
            parsedUrls = trimmed.split(',').map(s => s.trim());
          } else {
            parsedUrls = [trimmed];
          }
        }
      }
    }
    
    // Filter and add valid URLs
    parsedUrls.forEach(url => {
      if (isValidImageUrl(url)) {
        urls.push(url.trim());
      }
    });
  }
  
  // Remove duplicates while keeping order
  return [...new Set(urls)];
};

export const getPropertyImage = (property) => {
  const images = getPropertyImages(property);
  return images.length > 0 ? images[0] : FALLBACK_IMAGE;
};
