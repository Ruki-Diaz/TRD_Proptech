import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

try:
    res = supabase.table('profiles').select('*').execute()
    if res.data:
        print("PROFILES FOUND:")
        for p in res.data:
            print(f"- Email: {p['email']}, Role: {p['role']}")
    else:
        print("No profiles found yet.")
except Exception as e:
    print("Error:", e)
