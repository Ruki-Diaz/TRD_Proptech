import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase_admin = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

# Get all users from auth
try:
    users = supabase_admin.auth.admin.list_users()
    print(f"Found {len(users)} users in auth.")
    
    # Check profiles
    for user in users:
        prof = supabase_admin.table('profiles').select('*').eq('id', user.id).execute()
        if not prof.data:
            print(f"Profile missing for {user.email}. Creating...")
            supabase_admin.table('profiles').insert({
                'id': user.id,
                'email': user.email,
                'full_name': user.user_metadata.get('full_name', user.email.split('@')[0]) if user.user_metadata else user.email.split('@')[0],
                'role': 'admin' # Making them admin just in case
            }).execute()
            print(f"Profile created for {user.email}")
        else:
            print(f"Profile exists for {user.email}")
except Exception as e:
    print(f"Error: {e}")
