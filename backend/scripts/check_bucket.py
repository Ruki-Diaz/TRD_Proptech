import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

try:
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]
    if "property-images" not in bucket_names:
        print("Creating property-images bucket...")
        supabase.storage.create_bucket("property-images", {"public": True})
        print("Bucket created!")
    else:
        print("Bucket already exists.")
except Exception as e:
    print("Error:", e)
