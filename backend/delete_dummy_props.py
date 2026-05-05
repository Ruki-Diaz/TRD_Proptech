import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Supabase env vars missing.")
    sys.exit(1)

supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

dummy_ids = [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
    "44444444-4444-4444-4444-444444444444",
    "55555555-5555-5555-5555-555555555555",
    "66666666-6666-6666-6666-666666666666",
    "77777777-7777-7777-7777-777777777777",
    "88888888-8888-8888-8888-888888888888"
]

print("Deleting dummy properties...")
for pid in dummy_ids:
    try:
        supabase_admin.table('properties').delete().eq('id', pid).execute()
        print(f"Deleted property {pid}")
    except Exception as e:
        print(f"Failed to delete {pid}: {e}")

print("Done deleting dummy properties.")
