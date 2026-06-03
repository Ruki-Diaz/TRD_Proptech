import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing!');
}

// Sanitize URL: trim whitespace, remove trailing slashes, and strip '/rest/v1' if present
supabaseUrl = supabaseUrl.trim().replace(/\/+$/, '');
if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.substring(0, supabaseUrl.length - 8);
}

if (supabaseKey) {
  supabaseKey = supabaseKey.trim();
}

export const supabase = createClient(supabaseUrl, supabaseKey);
