import os
import json
import uuid
import random
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") # Ensure this is the SERVICE ROLE KEY if bypassing RLS

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Define dummy properties
dummy_properties = [
    {
        "title": "Luxury Apartment in Colombo 7",
        "description": "A beautiful and modern luxury apartment situated in the heart of Colombo 7. Features an amazing view of the city, premium fittings, and full air conditioning.",
        "purpose": "sale",
        "property_type": "apartment",
        "price": 45000000,
        "district": "Colombo",
        "city": "Colombo 07",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1500,
        "main_image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "image_urls": [
            "https://images.unsplash.com/photo-1502672260266-1c1de2d96674?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ],
        "status": "available",
        "is_published": True
    },
    {
        "title": "Modern House in Nugegoda",
        "description": "Spacious two-story house located in a quiet neighborhood. Perfect for a family. Includes a large garden and covered parking for two vehicles.",
        "purpose": "rent",
        "property_type": "house",
        "price": 120000,
        "district": "Colombo",
        "city": "Nugegoda",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 2400,
        "land_size": 15,
        "land_size_unit": "perches",
        "main_image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "image_urls": [],
        "status": "available",
        "is_published": True
    },
    {
        "title": "Prime Land for Commercial Development",
        "description": "Highly valuable commercial land facing the main road. Ideal for building a retail complex or an office building. Excellent investment opportunity.",
        "purpose": "sale",
        "property_type": "land",
        "price": 150000000,
        "district": "Gampaha",
        "city": "Kelaniya",
        "land_size": 40,
        "land_size_unit": "perches",
        "main_image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        "image_urls": [],
        "status": "available",
        "is_published": True
    },
    {
        "title": "Cozy Annex in Dehiwala",
        "description": "Fully furnished annex with a separate entrance. Ideal for a student or a single professional. Rent includes water and electricity bills.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 45000,
        "district": "Colombo",
        "city": "Dehiwala",
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 500,
        "main_image_url": "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80",
        "image_urls": [],
        "status": "available",
        "is_published": True
    }
]

def generate_slug(title: str) -> str:
    base = title.lower().replace(' ', '-').replace(',', '').replace('.', '')
    return f"{base}-{uuid.uuid4().hex[:6]}"

def seed_database():
    logger.info("Starting database seed...")
    
    # 1. We need a valid user ID to bypass foreign key constraints (if any) and RLS.
    # We will try to fetch the first user from the auth.users table (or profiles table).
    try:
        profiles_res = supabase.table('profiles').select('id').limit(1).execute()
        if not profiles_res.data:
            logger.error("No users found in the database. Please create at least one user account through the website first before running the seeder.")
            return
        
        user_id = profiles_res.data[0]['id']
        logger.info(f"Using user_id: {user_id} for dummy properties.")
    except Exception as e:
        logger.error(f"Failed to fetch user profiles. Ensure you are using the Service Role Key. Error: {e}")
        return

    # 2. Insert dummy properties
    inserted_count = 0
    for prop in dummy_properties:
        prop['user_id'] = user_id
        prop['slug'] = generate_slug(prop['title'])
        
        try:
            res = supabase.table('properties').insert(prop).execute()
            if res.data:
                inserted_count += 1
                logger.info(f"Inserted: {prop['title']}")
        except Exception as e:
            logger.error(f"Failed to insert property '{prop['title']}': {e}")
            
    logger.info(f"Successfully seeded {inserted_count} properties!")

if __name__ == "__main__":
    seed_database()
