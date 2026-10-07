import uuid
import random
from app.database import supabase_admin
from app.services.property_service import generate_slug

def run_seed():
    print("Starting demo data seed...")
    
    # 1. Use a consistent dummy agent profile
    AGENT_EMAIL = 'samantha.perera@squarelanka.demo'
    
    # Check if agent exists
    existing_agent = supabase_admin.table('profiles').select('*').eq('email', AGENT_EMAIL).execute()
    
    if existing_agent.data:
        agent_id = existing_agent.data[0]['id']
        print(f"Found existing dummy agent profile: {agent_id}")
    else:
        print(f"Creating new dummy auth user for agent...")
        try:
            res = supabase_admin.auth.admin.create_user({
                'email': AGENT_EMAIL,
                'password': 'password123',
                'email_confirm': True,
                'user_metadata': {'full_name': 'Samantha Perera'}
            })
            agent_id = res.user.id
        except Exception as e:
            print(f"Could not create auth user: {e}")
            # Try to get the existing user from auth
            try:
                users_res = supabase_admin.auth.admin.list_users()
                for u in users_res:
                    if u.email == AGENT_EMAIL:
                        agent_id = u.id
                        break
            except Exception as e2:
                print("Failed to list users", e2)
            
            if not agent_id:
                print("Could not find agent_id, aborting.")
                return
        
        print(f"Upserting dummy agent profile: {agent_id}")
        
        agent_profile_data = {
            'id': agent_id,
            'full_name': 'Samantha Perera',
            'email': AGENT_EMAIL,
            'role': 'agent',
            'phone_number': '+94 77 987 6543',
            'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
        }
        supabase_admin.table('profiles').upsert(agent_profile_data).execute()
        
    # Upsert Agent Details
    agent_details = {
        'profile_id': agent_id,
        'company_name': 'SquareLanka Elite Realty',
        'license_number': 'SL-RE-2026-001',
        'bio': 'Specializing in luxury properties and prime lands across Sri Lanka with over 15 years of industry experience.',
        'is_verified': True
    }
    supabase_admin.table('agent_profiles').upsert(agent_details, on_conflict='profile_id').execute()
    
    # 2. Properties Data
    print("Preparing 8 demo properties...")
    
    properties_to_create = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "title": "Luxury Penthouse with Ocean View",
            "description": "Stunning penthouse in the heart of Colombo 7 featuring panoramic ocean views, private elevator access, and a rooftop infinity pool.",
            "purpose": "sale",
            "property_type": "apartment",
            "price": 250000000.0,
            "city": "Colombo 7",
            "district": "Colombo",
            "bedrooms": 4,
            "bathrooms": 4,
            "area_sqft": 3500.0,
            "features": ["Ocean View", "Private Pool", "Gym", "24/7 Security"],
            "main_image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600566753086-00f18efc2291?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "title": "Colonial Style Heritage House",
            "description": "Beautifully restored colonial house located near Kandy lake. Features a lush tropical garden and traditional architecture.",
            "purpose": "sale",
            "property_type": "house",
            "price": 180000000.0,
            "city": "Kandy",
            "district": "Kandy",
            "bedrooms": 5,
            "bathrooms": 5,
            "area_sqft": 4200.0,
            "features": ["Large Garden", "Heritage Architecture", "Courtyard", "Staff Quarters"],
            "main_image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "title": "Boutique Villa near Galle Fort",
            "description": "Exquisite modern villa located just outside Galle Fort. Ideal for a holiday home or rental investment.",
            "purpose": "sale",
            "property_type": "house",
            "price": 220000000.0,
            "city": "Galle",
            "district": "Galle",
            "bedrooms": 4,
            "bathrooms": 4,
            "area_sqft": 3100.0,
            "features": ["Private Pool", "Fully Furnished", "Tourist Area"],
            "main_image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "44444444-4444-4444-4444-444444444444",
            "title": "Scenic Nuwara Eliya Bungalow",
            "description": "Cozy tea-country bungalow overlooking the mountains. Features a fireplace, large garden, and antique furnishings.",
            "purpose": "sale",
            "property_type": "house",
            "price": 120000000.0,
            "city": "Nuwara Eliya",
            "district": "Nuwara Eliya",
            "bedrooms": 3,
            "bathrooms": 2,
            "area_sqft": 2500.0,
            "features": ["Mountain View", "Fireplace", "Large Garden"],
            "main_image_url": "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "55555555-5555-5555-5555-555555555555",
            "title": "Modern Apartment for Rent in Negombo",
            "description": "Fully furnished modern apartment with sea views. Walking distance to supermarkets and restaurants.",
            "purpose": "rent",
            "property_type": "apartment",
            "price": 150000.0,
            "city": "Negombo",
            "district": "Gampaha",
            "bedrooms": 2,
            "bathrooms": 2,
            "area_sqft": 1100.0,
            "features": ["Furnished", "Sea View", "AC", "Backup Generator"],
            "main_image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "66666666-6666-6666-6666-666666666666",
            "title": "Prime Beachfront Land in Matara",
            "description": "Rare beachfront land suitable for a boutique hotel or luxury villa. Clear deeds and direct beach access.",
            "purpose": "sale",
            "property_type": "land",
            "price": 95000000.0,
            "city": "Matara",
            "district": "Matara",
            "land_size": 40.0,
            "land_size_unit": "perches",
            "features": ["Beachfront", "Clear Deeds", "Tourist Zone"],
            "main_image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "77777777-7777-7777-7777-777777777777",
            "title": "Holiday Villa in Ella",
            "description": "Turn-key holiday villa in Ella with magnificent views of Ella Rock. Currently operating as a successful short-term rental.",
            "purpose": "sale",
            "property_type": "house",
            "price": 160000000.0,
            "city": "Ella",
            "district": "Badulla",
            "bedrooms": 6,
            "bathrooms": 6,
            "area_sqft": 4000.0,
            "features": ["Fully Furnished", "Mountain View", "Running Business"],
            "main_image_url": "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
            ]
        },
        {
            "id": "88888888-8888-8888-8888-888888888888",
            "title": "Commercial Space in Jaffna Town",
            "description": "Newly built commercial property in the heart of Jaffna town. Ideal for a bank, retail store, or office space.",
            "purpose": "sale",
            "property_type": "commercial",
            "price": 140000000.0,
            "city": "Jaffna",
            "district": "Jaffna",
            "area_sqft": 3000.0,
            "features": ["Main Road Facing", "Parking", "High Foot Traffic"],
            "main_image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            "image_urls": [
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"
            ]
        }
    ]
    
    for prop in properties_to_create:
        prop["user_id"] = agent_id
        prop["slug"] = generate_slug(prop["title"])
        prop["status"] = "available"
        prop["listed_by"] = "agent"
        prop["agent_name"] = "Samantha Perera"
        prop["phone_number"] = "+94 77 987 6543"
        prop["whatsapp_number"] = "+94 77 987 6543"
        prop["is_published"] = True
        prop["is_verified"] = True
        prop["featured"] = prop["id"] in ["11111111-1111-1111-1111-111111111111", "33333333-3333-3333-3333-333333333333"]
        
        print(f"Upserting property: {prop['title']}")
        supabase_admin.table('properties').upsert(prop, on_conflict='id').execute()
        
    print("Demo data seeded successfully!")

if __name__ == "__main__":
    run_seed()
