import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY;

// Temporary safe debug log
console.log({
  hasSupabaseUrl: Boolean(supabaseUrl),
  supabaseUrlIncludesRestV1: supabaseUrl?.includes('/rest/v1'),
  supabaseUrlLooksValid: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co'),
  hasSupabaseKey: Boolean(supabaseAnonKey),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL
});

// Prepare trimmed variables
const rawUrl = supabaseUrl ? supabaseUrl.trim() : '';
const rawKey = supabaseAnonKey ? supabaseAnonKey.trim() : '';

// Validation checks
const hasUrl = Boolean(rawUrl);
const startsWithHttps = rawUrl.startsWith('https://');
const includesSupabaseCo = rawUrl.includes('.supabase.co');
const includesRestV1 = rawUrl.includes('/rest/v1');

const hasKey = Boolean(rawKey);
const isPlaceholderKey =
  rawKey.includes('your_supabase_key') ||
  rawKey.includes('your_supabase_publishable_key') ||
  rawKey.includes('your_supabase_anon_key') ||
  rawKey === 'your_supabase_key';

const isConfigValid =
  hasUrl &&
  startsWithHttps &&
  includesSupabaseCo &&
  !includesRestV1 &&
  hasKey &&
  !isPlaceholderKey;

if (!isConfigValid) {
  console.error(
    "Invalid Supabase frontend config. VITE_SUPABASE_URL must be the base project URL, e.g. https://xxxxx.supabase.co. Do not use /rest/v1/."
  );
}

// Final URL sanitization for createClient: remove trailing slashes
let sanitizedUrl = rawUrl.replace(/\/+$/, '');
// Strip '/rest/v1' if present (to recover gracefully if possible)
if (sanitizedUrl.endsWith('/rest/v1')) {
  sanitizedUrl = sanitizedUrl.substring(0, sanitizedUrl.length - 8);
}

export const supabase = createClient(sanitizedUrl, rawKey);

