import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Supabase environment variables missing.")
    sys.exit(1)

supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

email = "samantha.perera@squarelanka.demo"

res = supabase_admin.auth.admin.list_users()
users_list = res if isinstance(res, list) else getattr(res, 'users', [])

target_user = None
for u in users_list:
    if getattr(u, 'email', None) == email or (isinstance(u, dict) and u.get('email') == email):
        target_user = u
        break

if target_user:
    user_id = getattr(target_user, 'id', None) or (isinstance(target_user, dict) and target_user.get('id'))
    print(f"Deleting user {user_id} ({email})...")
    try:
        supabase_admin.table('properties').delete().eq('profile_id', user_id).execute()
    except Exception as e:
        print(f"Properties delete error (ignoring): {e}")
    try:
        supabase_admin.table('agent_profiles').delete().eq('profile_id', user_id).execute()
    except Exception as e:
        print(f"Agent profiles delete error (ignoring): {e}")
    try:
        supabase_admin.table('profiles').delete().eq('id', user_id).execute()
    except Exception as e:
        print(f"Profiles delete error (ignoring): {e}")
        
    supabase_admin.auth.admin.delete_user(user_id)
    print("Done!")
else:
    print(f"User {email} not found in Supabase Auth.")
