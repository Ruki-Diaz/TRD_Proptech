from supabase import create_client, Client
from app.config import Config
import os

supabase_url = Config.SUPABASE_URL or os.environ.get('SUPABASE_URL')
supabase_key = Config.SUPABASE_KEY or os.environ.get('SUPABASE_KEY') or os.environ.get('SUPABASE_ANON_KEY')
supabase_service_key = Config.SUPABASE_SERVICE_ROLE_KEY or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    # Just a placeholder mock for if env vars are missing so process doesn't crash on import
    supabase_url = "https://placeholder.supabase.co"
    supabase_key = "placeholder"

supabase: Client = create_client(supabase_url, supabase_key)

# Admin client with service role key to bypass RLS (fallback to anon key if not set)
supabase_admin: Client = create_client(supabase_url, supabase_service_key) if supabase_service_key else supabase
