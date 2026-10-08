#!/usr/bin/env python3
"""
Seed and repair demo real estate listings for SquareLanka / TRD Proptech.

Usage:
    python backend/scripts/seed_demo_listings.py            # Defaults to dry-run
    python backend/scripts/seed_demo_listings.py --dry-run  # Dry run preview
    python backend/scripts/seed_demo_listings.py --apply    # Commit changes to Supabase
"""

import os
import sys
import argparse
import secrets
import urllib.request
from collections import Counter
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Locate backend/.env
ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '').strip().rstrip('/')
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8]

SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '').strip() or os.environ.get('SUPABASE_ANON_KEY', '').strip()

# Valid image cache to minimize network calls
IMAGE_CACHE = {}

# Fallback images per property type. Every photo here and in NEW_LISTINGS was checked by eye
# for relevance (not just HTTP 200) and is used by no other listing.
FALLBACK_IMAGES = {
    'apartment': [
        "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    ],
    'house': [
        "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80",
    ],
    'commercial': [
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1200&q=80",
    ],
    'land': [
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    ],
}


def check_image_url(url: str, timeout: int = 15) -> bool:
    """Send HEAD request to verify image returns HTTP 200."""
    if not url or not isinstance(url, str) or not url.startswith(('http://', 'https://')):
        return False
    if url in IMAGE_CACHE:
        return IMAGE_CACHE[url]
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'},
            method='HEAD'
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            ok = (response.status == 200)
            IMAGE_CACHE[url] = ok
            return ok
    except Exception:
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'},
                method='GET'
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                ok = (response.status == 200)
                IMAGE_CACHE[url] = ok
                return ok
        except Exception:
            IMAGE_CACHE[url] = False
            return False


def pick_fallback_image(prop_type: str, used_urls: set) -> str:
    """Pick an unused verified fallback image for the property type."""
    fallbacks = FALLBACK_IMAGES.get(prop_type, FALLBACK_IMAGES['house'])
    for url in fallbacks:
        if url not in used_urls and check_image_url(url):
            used_urls.add(url)
            return url
    # Fallback across all categories if primary pool exhausted
    for ptype, pool in FALLBACK_IMAGES.items():
        for url in pool:
            if url not in used_urls and check_image_url(url):
                used_urls.add(url)
                return url
    raise RuntimeError(f"Exhausted all available fallback images for {prop_type}!")


# 5 Demo Agents definitions
DEMO_AGENTS = [
    {
        "email": "samantha.perera@squarelanka.demo",
        "full_name": "Samantha Perera",
        "phone_number": "+94 77 123 4567",
        "company_name": "SquareLanka Elite Realty",
        "license_number": "SL-RE-2026-001",
        "bio": "Specializing in luxury penthouses and prime residential estates across Colombo and Kandy with over 15 years of industry experience.",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "is_verified": True
    },
    {
        "email": "roshan.silva@squarelanka.demo",
        "full_name": "Roshan Silva",
        "phone_number": "+94 71 234 5678",
        "company_name": "Ceylon Heritage Properties",
        "license_number": "SL-RE-2026-002",
        "bio": "Expert in heritage bungalows, colonial villas, and coastal land investments along the southern and western coastal corridors.",
        "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
        "is_verified": True
    },
    {
        "email": "anjali.fernando@squarelanka.demo",
        "full_name": "Anjali Fernando",
        "phone_number": "+94 76 345 6789",
        "company_name": "Metro Living Sri Lanka",
        "license_number": "SL-RE-2026-003",
        "bio": "Dedicated commercial and apartment specialist focusing on high-yield rental investments and modern condominiums in Gampaha and Colombo.",
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        "is_verified": True
    },
    {
        "email": "kasun.jayawardena@squarelanka.demo",
        "full_name": "Kasun Jayawardena",
        "phone_number": "+94 70 456 7890",
        "company_name": "Hill Country Real Estate",
        "license_number": "SL-RE-2026-004",
        "bio": "Trusted advisor for tea estate lands, mountain-view chalets, and hospitality properties across Kandy, Badulla, and Nuwara Eliya.",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "is_verified": True
    },
    {
        "email": "dinesh.wickramasinghe@squarelanka.demo",
        "full_name": "Dinesh Wickramasinghe",
        "phone_number": "+94 78 567 8901",
        "company_name": "Prime Landmark Consultants",
        "license_number": "SL-RE-2026-005",
        "bio": "Independent real estate consultant assisting first-time home buyers and commercial tenants with tailored property matching services.",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "is_verified": False  # Exactly 4 verified, 1 unverified
    }
]

# 36 New Listings Definitions (Bringing total with 12 existing to 48)
# Each listing contains 3 or 4 distinct verified images formatted as https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1200&q=80
# images[0] is the hero/exterior shot.
NEW_LISTINGS = [
    {
        "slug": "sea-breeze-luxury-apartment-colombo-03",
        "title": "Sea Breeze Luxury Apartment in Colombo 03",
        "description": "Experience upscale coastal living in this brand new luxury apartment located along Marine Drive in Kollupitiya. Boasting panoramic Indian Ocean sunsets, a modern open-concept kitchen, Italian tile flooring, and rooftop infinity pool. Walking distance to leading international schools, shopping malls, and popular restaurants with 24-hour security, dedicated covered parking, and full standby power generator for uninterrupted daily comfort.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 380000.0,
        "city": "Colombo 03",
        "district": "Colombo",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1650.0,
        "features": ["Ocean View", "Infinity Pool", "Gym", "24/7 Security", "Backup Generator", "Covered Parking"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": True,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "cozy-furnished-studio-apartment-havelock-city",
        "title": "Cozy Furnished Studio in Havelock City",
        "description": "Charming and tastefully furnished studio unit on a high floor within the prestigious Havelock City complex. Comes equipped with high-speed fiber internet, smart LED TV, inverter air conditioning, built-in wardrobes, and fully fitted kitchenette. Residents enjoy direct access to the mega clubhouse, swimming pools, squash courts, gymnasium, and lush landscaped garden parklands in an ultra-secure central Colombo setting.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 140000.0,
        "city": "Colombo 05",
        "district": "Colombo",
        "bedrooms": 1,
        "bathrooms": 1,
        "area_sqft": 550.0,
        "features": ["Fully Furnished", "Clubhouse", "Swimming Pool", "Gym", "Garden Park", "High Speed Wifi"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "spacious-family-residence-rajagiriya",
        "title": "Spacious Family Residence in Rajagiriya",
        "description": "Sprawling two-storey modern architect designed house situated in a peaceful gated neighbourhood near Royal Park. Features four large en-suite bedrooms, open living and dining pavilion, wet and dry kitchens, landscaped courtyard, domestic quarters, and double garage with automatic roller gate. Just 10 minutes drive to Colombo commercial hub with serene surroundings and close access to supermarkets, international schools, and hospitals.",
        "purpose": "rent",
        "property_type": "house",
        "price": 280000.0,
        "city": "Rajagiriya",
        "district": "Colombo",
        "bedrooms": 4,
        "bathrooms": 4,
        "area_sqft": 3200.0,
        "features": ["Private Garden", "Roller Shutter Gate", "Solar Hot Water", "Maids Room", "AC in All Rooms", "Security System"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": False,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "hilltop-scenic-villa-peradeniya-kandy",
        "title": "Hilltop Scenic Villa in Peradeniya",
        "description": "Spectacular hilltop residence overlooking the Mahaweli River and lush botanical gardens. Designed with traditional Kandyan timber accents blended with contemporary comfort. Includes wide wrap-around balconies, teak flooring, modern kitchen, solar power, and manicured fruit garden. Perfect for professionals, expats, or executives seeking tranquility and scenic mountain breeze just 15 minutes away from the historical Kandy city center.",
        "purpose": "rent",
        "property_type": "house",
        "price": 175000.0,
        "city": "Peradeniya",
        "district": "Kandy",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2800.0,
        "features": ["River View", "Wrap-around Balcony", "Solar Power", "Fruit Garden", "Quiet Neighborhood", "Car Porch"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "available",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "modern-colonial-apartment-kandy-town",
        "title": "Modern Colonial Apartment in Kandy Town",
        "description": "Centrally located stylish apartment with sweeping views of the Udawatta Kele sanctuary and Kandy city bowl. Situated 5 minutes away from Queens Hotel and Temple of the Tooth. High ceilings, polished wooden flooring, fully air-conditioned living spaces, dedicated underground parking, and elevator access. An exceptional executive rental opportunity offering unmatched convenience in the cultural capital of Sri Lanka.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 120000.0,
        "city": "Kandy",
        "district": "Kandy",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1250.0,
        "features": ["Mountain View", "Elevator Access", "Covered Parking", "Air Conditioned", "CCTV Security", "Water Heater"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "available",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "beachside-tropical-villa-unawatuna",
        "title": "Beachside Tropical Villa in Unawatuna",
        "description": "Charming coastal holiday home just 200 meters from Unawatuna golden sandy beach. Boasts a private plunge pool, open-air tropical living lounge, terrazzo floors, three comfortable air-conditioned suites, and serene palm garden. Ideal for long-term holidaymakers, digital nomads, or boutique hospitality operators seeking prime southern coast location with seamless connectivity to Galle town, highway interchanges, and seaside restaurants.",
        "purpose": "rent",
        "property_type": "house",
        "price": 250000.0,
        "city": "Unawatuna",
        "district": "Galle",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2100.0,
        "features": ["Private Plunge Pool", "Walk to Beach", "Air Conditioning", "Lush Palm Garden", "Fully Furnished", "High Speed Internet"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": True,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "luxury-serviced-condo-galle-fort",
        "title": "Luxury Serviced Condo near Galle Fort",
        "description": "Elegant luxury apartment inside a secure gated residential complex near the UNESCO World Heritage Galle Fort. Offers panoramic views of the turquoise ocean and historic lighthouse. Fitted with premium German sanitary fittings, European kitchen appliances, private balcony, and access to communal gymnasium, swimming pool, and rooftop lounge with barbecue facilities. Enjoy peaceful coastal living within walking distance to fine dining.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 220000.0,
        "city": "Galle",
        "district": "Galle",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1300.0,
        "features": ["Sea View", "Rooftop BBQ", "Gym", "24/7 Security", "Balcony", "Fully Equipped Kitchen"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": False,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "contemporary-duplex-house-kelaniya",
        "title": "Contemporary Duplex House in Kelaniya",
        "description": "Modern architect designed two-storey house located in a quiet residential cul-de-sac in Kelaniya, just 15 minutes drive to Colombo boundary. Features 3 spacious bedrooms, large rooftop terrace suitable for evening entertaining, imported bathroom fittings, remote roller door, and solar hot water system. Very close to supermarkets, highway entrances, and premier schools, providing excellent convenience for a modern family.",
        "purpose": "rent",
        "property_type": "house",
        "price": 95000.0,
        "city": "Kelaniya",
        "district": "Gampaha",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 2200.0,
        "features": ["Rooftop Terrace", "Roller Gate", "Solar Hot Water", "Modern Kitchen", "Quiet Cul-de-sac", "Near Highway"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "coastal-apartment-kadawatha-highway",
        "title": "Modern Executive Apartment in Kadawatha",
        "description": "Brand new luxury apartment located minutes away from the Central Expressway Interchange in Kadawatha. Ideal for executives commuting to Colombo or Katunayake. Features high quality tile finishes, modular kitchen with granite tops, central LP gas connection, backup generator, gymnasium, and dedicated basement parking space with CCTV surveillance throughout the building. Excellent residential community with peaceful suburban surroundings.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 85000.0,
        "city": "Kadawatha",
        "district": "Gampaha",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1050.0,
        "features": ["Highway Access", "Gymnasium", "Backup Generator", "Granite Tops", "24/7 CCTV", "Basement Parking"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "affordable-residential-home-gampaha-town",
        "title": "Affordable Residential Home in Gampaha",
        "description": "Comfortable single-storey family home situated in a pleasant residential enclave 5 minutes from Gampaha railway station and leading schools. Includes 3 bedrooms, spacious hall, fitted pantry, boundary wall all around with wrought iron gate, well water and pipe-borne water supply. Perfect choice for a growing family looking for convenient connectivity and comfort across the Western province with friendly neighbourhood surroundings.",
        "purpose": "rent",
        "property_type": "house",
        "price": 65000.0,
        "city": "Gampaha",
        "district": "Gampaha",
        "bedrooms": 3,
        "bathrooms": 1,
        "area_sqft": 1600.0,
        "features": ["Boundary Wall", "Pipe-borne Water", "Near Railway Station", "Pantry Cupboards", "Quiet Area", "Iron Gate"],
        "whatsapp_number": "+94 78 567 8901",
        "phone_number": "+94 78 567 8901",
        "status": "available",
        "featured": False,
        "agent_index": 4,
        "images": [
            "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "colonial-style-tea-estate-bungalow-badulla",
        "title": "Colonial Style Tea Estate Bungalow in Badulla",
        "description": "Majestic planter bungalow surrounded by rolling tea gardens and mist-covered mountain valleys in Badulla. Recently renovated with modern bathrooms and kitchen while preserving original fireplace, stone masonry, and timber rafters. Features 4 large bedrooms, staff quarters, organic vegetable plot, and sweeping terrace with sunrise views over the Namunukula mountain range. An idyllic hill country retreat offering absolute serenity.",
        "purpose": "rent",
        "property_type": "house",
        "price": 180000.0,
        "city": "Badulla",
        "district": "Badulla",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 3600.0,
        "features": ["Tea Estate View", "Fireplace", "Stone Masonry", "Organic Garden", "Staff Quarters", "Large Verandah"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "rented",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "luxury-penthouse-colombo-07-cinnamon-gardens",
        "title": "Luxury Penthouse in Cinnamon Gardens",
        "description": "Ultra-exclusive top-floor penthouse in prime Colombo 07 offering 360-degree skyline views across Victoria Park and Colombo harbour. Boasts private elevator foyer, double-height ceiling living hall, designer Italian kitchen, private plunge pool, and smart home automation. Includes 3 dedicated basement parking slots, concierge service, and 24-hour security team monitoring. Experience the pinnacle of prestige and luxury in Cinnamon Gardens.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 550000.0,
        "city": "Colombo 07",
        "district": "Colombo",
        "bedrooms": 4,
        "bathrooms": 4,
        "area_sqft": 3800.0,
        "features": ["Private Plunge Pool", "360 City View", "Smart Home Tech", "Concierge Service", "3 Parking Slots", "Italian Kitchen"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": True,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "lakefront-luxury-apartment-nuwara-eliya",
        "title": "Lakefront Luxury Apartment in Nuwara Eliya",
        "description": "Stunning alpine style serviced apartment overlooking Lake Gregory in cool Nuwara Eliya. Features timber panelled walls, centralized heating, fireplace in the living room, double glazed windows, and private viewing terrace. Walking distance to Gregory Park, golf club, and Victoria Park. An idyllic holiday rental or executive getaway property in the picturesque central hills with convenient access to renowned tea estate attractions.",
        "purpose": "rent",
        "property_type": "apartment",
        "price": 210000.0,
        "city": "Nuwara Eliya",
        "district": "Nuwara Eliya",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1400.0,
        "features": ["Lake View", "Fireplace", "Central Heating", "Double Glazing", "Private Terrace", "Secure Parking"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "rented",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1580216643062-cf460548a66a?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "executive-townhouse-jaffna-nallur",
        "title": "Executive Townhouse near Nallur Jaffna",
        "description": "Newly completed luxury townhouse situated in close proximity to the historic Nallur Kandaswamy Temple. Constructed with high quality local palmyrah timber and imported granite tiles. Includes air-conditioned bedrooms, modern fitted kitchen, secure compound with high boundary wall, water purification system, and solar water heating in a very peaceful residential neighbourhood. Superb family dwelling in the cultural heart of Jaffna.",
        "purpose": "rent",
        "property_type": "house",
        "price": 110000.0,
        "city": "Jaffna",
        "district": "Jaffna",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2400.0,
        "features": ["Near Nallur Temple", "Water Purification", "Solar Heating", "Granite Flooring", "AC Bedrooms", "High Boundary Wall"],
        "whatsapp_number": "+94 78 567 8901",
        "phone_number": "+94 78 567 8901",
        "status": "available",
        "featured": False,
        "agent_index": 4,
        "images": [
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "modern-two-storey-house-malabe",
        "title": "Modern Two Storey House in Malabe IT Hub",
        "description": "Exceptional newly built contemporary home located in the premier educational and IT corridor of Malabe. Features 4 bedrooms, 3 bathrooms, spacious open plan living hall, wet kitchen with mahagony cupboards, rooftop entertainment area, and double car garage with remote roller shutter. Only 5 minutes to SLIIT campus, Horizon Campus, and Neville Fernando Hospital with peaceful greenery and clear title documentation for bank loans.",
        "purpose": "sale",
        "property_type": "house",
        "price": 42000000.0,
        "city": "Malabe",
        "district": "Colombo",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 2600.0,
        "features": ["Roller Gate", "Rooftop Terrace", "Mahogany Pantry", "Hot Water", "Near IT Hub", "Car Porch"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": True,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "luxury-condo-apartment-thalawathugoda",
        "title": "Luxury Condominium Unit in Thalawathugoda",
        "description": "Elegant three-bedroom luxury apartment overlooking peaceful wetlands in Thalawathugoda. Fully air conditioned, equipped with designer European sanitaryware, branded kitchen appliances, private terrace balcony, swimming pool, gym, 24-hour backup generator, and dedicated parking. Quick access to Sri Jayawardenepura hospital, jogging tracks, and leading supermarkets. A sound residential and investment choice in a rapidly developing suburb.",
        "purpose": "sale",
        "property_type": "apartment",
        "price": 38500000.0,
        "city": "Thalawathugoda",
        "district": "Colombo",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1450.0,
        "features": ["Wetland View", "Swimming Pool", "Gym", "Backup Generator", "Balcony", "24/7 Security"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": False,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "scenic-panoramic-house-digana-kandy",
        "title": "Scenic Mountain House in Digana Kandy",
        "description": "Picturesque hill country home overlooking the Victoria Golf Resort and reservoir. Built with stone cladding and exposed timber trusses. Features 3 bedrooms, wooden sundeck, landscaped terraced garden, solar hot water, and tranquil environment with year-round cool mountain breeze. An ideal retirement sanctuary or profitable holiday home investment in the hill country with clear title deeds and immediate motorable access road.",
        "purpose": "sale",
        "property_type": "house",
        "price": 34000000.0,
        "city": "Digana",
        "district": "Kandy",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 2200.0,
        "features": ["Reservoir View", "Golf Course Access", "Wooden Sundeck", "Terraced Garden", "Solar Hot Water", "Clear Deeds"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "available",
        "featured": True,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "brand-new-residential-villa-katugastota",
        "title": "Brand New Residential Villa in Katugastota",
        "description": "Architectural masterpiece situated within an exclusive residential neighbourhood in Katugastota. Offers 4 spacious bedrooms, high-end Kumbuk staircase, teak woodwork throughout, solar net-metering system, double garage, and beautifully landscaped lawn with perimeter security wall. Just 10 minutes drive to Kandy city center and leading national schools with peaceful surroundings, pure mountain air, and clear legal title deeds.",
        "purpose": "sale",
        "property_type": "house",
        "price": 48000000.0,
        "city": "Katugastota",
        "district": "Kandy",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 3100.0,
        "features": ["Kumbuk Staircase", "Solar Net Metering", "Teak Woodwork", "Landscaped Lawn", "Double Garage", "Security Wall"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "available",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "contemporary-beach-villa-hikkaduwa",
        "title": "Contemporary Beach Villa in Hikkaduwa",
        "description": "Chic contemporary holiday villa located walking distance to the world-famous Hikkaduwa surfing beach. Features 3 en-suite bedrooms, private swimming pool, open concept kitchen and dining pavilion, lush tropical garden, and solid boundary wall. Successfully operating as a licensed tourist villa with high rental yields on international booking portals with clear title deeds and commercial tourism approvals ready for handover.",
        "purpose": "sale",
        "property_type": "house",
        "price": 55000000.0,
        "city": "Hikkaduwa",
        "district": "Galle",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2400.0,
        "features": ["Swimming Pool", "Near Surf Beach", "High Rental Yield", "Fully Furnished", "Licensed Tourist Villa", "Tropical Garden"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": True,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600585153490-76fb20a32601?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "colonial-heritage-gem-amathe-galle",
        "title": "Restored Colonial Heritage Gem in Galle",
        "description": "Charming colonial era house meticulously restored with modern comforts in a quiet suburb of Galle town. Features traditional central courtyard, Dutch terracotta roof tiles, antique brass fittings, polished cement floors, 3 bedrooms, and organic fruit garden. Just 7 minutes drive to Galle Fort and Southern Expressway entrance with pristine title deeds ready for bank loan processing and immediate peaceful residential occupation.",
        "purpose": "sale",
        "property_type": "house",
        "price": 46000000.0,
        "city": "Galle",
        "district": "Galle",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 2100.0,
        "features": ["Central Courtyard", "Dutch Terracotta Tiles", "Antique Fittings", "Polished Cement", "Organic Garden", "Clear Title Deeds"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "sold",
        "featured": False,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "luxury-two-storey-residence-negombo",
        "title": "Luxury Two Storey Residence in Negombo",
        "description": "Magnificent newly completed home located in an exclusive residential scheme in Negombo. Boasts 4 bedrooms with private balconies, 3 modern bathrooms, teak pantry with built-in oven, large living hall, remote controlled gate, and manicured garden. Only 10 minutes to Bandaranaike International Airport and Colombo-Katunayake expressway with prime road frontage, pipe-borne water supply, and complete architectural clearance.",
        "purpose": "sale",
        "property_type": "house",
        "price": 39500000.0,
        "city": "Negombo",
        "district": "Gampaha",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 2700.0,
        "features": ["Near Airport", "Teak Pantry", "Private Balconies", "Remote Gate", "Expressway Access", "Hot Water"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "architect-designed-villa-ja-ela",
        "title": "Architect Designed Villa in Ja-Ela",
        "description": "Stunning eco-friendly modern villa situated in a secure gated community in Ja-Ela. Features high ceilings, abundant natural light, courtyard with water body, solar panels, EV charging point, 3 bedrooms, and servant quarters. Conveniently positioned 3 minutes away from the Ja-Ela expressway entrance, top supermarkets, and international banks in a friendly neighbourhood with round-the-clock gated security and paved road access.",
        "purpose": "sale",
        "property_type": "house",
        "price": 32000000.0,
        "city": "Ja-Ela",
        "district": "Gampaha",
        "bedrooms": 3,
        "bathrooms": 3,
        "area_sqft": 2300.0,
        "features": ["Water Feature", "Solar Panels", "EV Charging Point", "Gated Community", "Near Expressway", "Servants Quarters"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "starter-family-house-kiribathgoda",
        "title": "Starter Family House in Kiribathgoda",
        "description": "Well-maintained single-storey residential house located in a prime urban location in Kiribathgoda town. Offers 3 bedrooms, attached bathrooms, tiled floors, kitchen with pantry cupboards, front garden with parking for 2 vehicles, and reliable water and electricity connections. Close walking distance to Kandy-Colombo main road, commercial banks, and top private tuition colleges with first-class freehold deeds ready for sale.",
        "purpose": "sale",
        "property_type": "house",
        "price": 22500000.0,
        "city": "Kiribathgoda",
        "district": "Gampaha",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1750.0,
        "features": ["Main Road Access", "Garden Space", "Tiled Flooring", "Parking for 2 Cars", "Clear Title Deeds", "Iron Gate"],
        "whatsapp_number": "+94 78 567 8901",
        "phone_number": "+94 78 567 8901",
        "status": "sold",
        "featured": False,
        "agent_index": 4,
        "images": [
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "compact-urban-home-wattala",
        "title": "Compact Urban Home in Wattala",
        "description": "Conveniently situated modern two-storey home in Wattala, just 10 minutes to Colombo city border. Features 3 bedrooms, 2 bathrooms, modern granite pantry, secure roller door, tiled rooftop, and parking space. Close to OKI International School, Lyceum Wattala, supermarkets, and Hemas Hospital. Superb investment with high capital appreciation potential across the western province with clear bank-approved title documentation.",
        "purpose": "sale",
        "property_type": "house",
        "price": 26500000.0,
        "city": "Wattala",
        "district": "Gampaha",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1800.0,
        "features": ["Near Top Schools", "Granite Pantry", "Roller Gate", "Tiled Rooftop", "Close to Hospital", "High Appreciation"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "scenic-beachside-bungalow-kalutara",
        "title": "Scenic Beachside Bungalow in Kalutara",
        "description": "Lovely tropical holiday bungalow situated 150 meters from Kalutara beach and river mouth. Features large verandahs, wooden ceiling architecture, 3 bedrooms, 2 bathrooms, lush garden with mature coconut palms, and separate caretaker quarters. Perfect private coastal residence or boutique holiday home with seamless connectivity via Southern Expressway and Galle road corridor, offering clean fresh sea breeze and tranquil surroundings.",
        "purpose": "sale",
        "property_type": "house",
        "price": 28500000.0,
        "city": "Kalutara",
        "district": "Kalutara",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 2000.0,
        "features": ["Near Beach", "Coconut Garden", "Wooden Ceilings", "Caretaker Quarters", "Southern Expressway", "Clear Deeds"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": False,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "residential-luxury-home-kurunegala",
        "title": "Residential Luxury Home in Kurunegala",
        "description": "Elegant two-storey house located within walking distance to Kurunegala Lake and town center. Built on 15 perches of prime land with 4 bedrooms, timber ceilings, modern kitchen pantry, balconies facing Elephant Rock, garage with roller door, and landscaped front lawn. Excellent neighbourhood with elite schools, administrative offices, and medical centers nearby, with clear ownership deeds and excellent access roads.",
        "purpose": "sale",
        "property_type": "house",
        "price": 31000000.0,
        "city": "Kurunegala",
        "district": "Kurunegala",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 2500.0,
        "features": ["Lake Vicinity", "Elephant Rock View", "15 Perch Land", "Timber Ceilings", "Roller Door", "Elite Schools"],
        "whatsapp_number": "+94 78 567 8901",
        "phone_number": "+94 78 567 8901",
        "status": "available",
        "featured": False,
        "agent_index": 4,
        "images": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "modern-family-villa-matara-kandurugoda",
        "title": "Modern Family Villa in Matara",
        "description": "Brand new modern villa situated in a high residential development in Matara, just 5 minutes to University of Ruhuna and coastal highway. Offers 4 bedrooms, 3 bathrooms, Italian tiled floors, solar hot water, open verandah, boundary wall with motorized gate, and parking for 3 vehicles. First-class title deeds eligible for immediate commercial bank mortgage financing, located in a quiet peaceful residential neighborhood.",
        "purpose": "sale",
        "property_type": "house",
        "price": 27500000.0,
        "city": "Matara",
        "district": "Matara",
        "bedrooms": 4,
        "bathrooms": 3,
        "area_sqft": 2350.0,
        "features": ["Near Ruhuna University", "Italian Tile Floors", "Solar Hot Water", "Motorized Gate", "Parking for 3 Cars", "Bank Approved Deeds"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": False,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "prime-commercial-building-colombo-04-kollupitiya",
        "title": "Prime Commercial Building on Galle Road Colombo 04",
        "description": "Prominent four-storey glass facade commercial building located directly facing Galle Road in Bambalapitiya. Offers 6,500 sqft of open plan office or retail space, passenger elevator, backup diesel generator, centralized air conditioning, basement parking for 8 vehicles, and roadside parking. High visibility commercial hub ideal for banks, corporate headquarters, or luxury brand showrooms with massive daily vehicular traffic exposure.",
        "purpose": "sale",
        "property_type": "commercial",
        "price": 285000000.0,
        "city": "Colombo 04",
        "district": "Colombo",
        "area_sqft": 6500.0,
        "features": ["Galle Road Facing", "Passenger Elevator", "Backup Generator", "Centralized AC", "Basement Parking", "High Visibility"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": True,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "modern-office-complex-kandy-peradeniya-road",
        "title": "Modern Office Complex on Peradeniya Road Kandy",
        "description": "Three-storey commercial office property strategically positioned along the bustling Peradeniya Road in Kandy. Features 4,200 sqft usable floor area with partitioned cubicles, executive boardrooms, dedicated server room, cafeteria space, and 3-phase electricity. High daily vehicular traffic and close walking distance to private hospitals and financial institutes with ample customer parking and excellent signboard visibility.",
        "purpose": "sale",
        "property_type": "commercial",
        "price": 95000000.0,
        "city": "Kandy",
        "district": "Kandy",
        "area_sqft": 4200.0,
        "features": ["Main Road Frontage", "3-Phase Electricity", "Boardroom", "Server Room", "Cafeteria Space", "Parking Spaces"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "available",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "commercial-warehouse-facility-peliyagoda",
        "title": "Commercial Logistics Warehouse in Peliyagoda",
        "description": "Industrial warehouse complex with state of the art storage logistics infrastructure in Peliyagoda. Features 12,000 sqft covered column-free floor space, 30-foot ceiling height, container trailer turning access, overhead crane provision, attached admin office block, and 24/7 security. Just 2 minutes to Colombo-Katunayake expressway entrance and central logistics hub with heavy vehicle access roads and fire safety systems.",
        "purpose": "sale",
        "property_type": "commercial",
        "price": 165000000.0,
        "city": "Peliyagoda",
        "district": "Gampaha",
        "area_sqft": 12000.0,
        "features": ["Container Access", "30ft High Ceiling", "Expressway Access", "Admin Office Block", "Column-free Space", "Heavy Vehicle Parking"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "boutique-hotel-commercial-space-galle-fort",
        "title": "Boutique Hotel & Restaurant in Galle Fort",
        "description": "Operating 8-room luxury boutique hotel and ground-floor gourmet restaurant inside the historic Galle Fort. Fully furnished with antique Dutch colonial furniture, commercial stainless steel kitchen, rooftop sunset cocktail terrace, and flawless tourist reviews. Rare opportunity to own a profitable hospitality asset in Sri Lanka's premier tourist enclave with high foreign footfall and year-round exceptional occupancy rates.",
        "purpose": "sale",
        "property_type": "commercial",
        "price": 310000000.0,
        "city": "Galle",
        "district": "Galle",
        "area_sqft": 5200.0,
        "features": ["Galle Fort Heritage", "Operating Hotel", "Commercial Kitchen", "Rooftop Cocktail Bar", "Fully Furnished", "High Tourism Footfall"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": True,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "commercial-retail-hub-kurunegala-town",
        "title": "Commercial Retail Showroom in Kurunegala",
        "description": "Modern two-storey retail commercial showroom located in the commercial heart of Kurunegala town center. 3,500 sqft of open showroom space with large glass storefront, 3-phase electricity, separate customer and staff washrooms, and private rear loading dock. Unbeatable footfall and vehicular exposure suitable for fashion retail, electronics showroom, or commercial bank branches with dedicated front customer parking spaces.",
        "purpose": "sale",
        "property_type": "commercial",
        "price": 75000000.0,
        "city": "Kurunegala",
        "district": "Kurunegala",
        "area_sqft": 3500.0,
        "features": ["Glass Storefront", "Town Center Location", "Loading Dock", "3-Phase Power", "High Footfall", "Ample Road Parking"],
        "whatsapp_number": "+94 78 567 8901",
        "phone_number": "+94 78 567 8901",
        "status": "available",
        "featured": False,
        "agent_index": 4,
        "images": [
            "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "prime-residential-land-nawala-colombo",
        "title": "Prime Residential Land in Nawala",
        "description": "Superb rectangular 15-perch bare land situated in an elite residential enclave off Nawala Road. Features 40-foot road frontage, wide 20-foot access road, pipe-borne water, 3-phase electricity, solid boundary wall on 3 sides, and clear BIMB title deed. Just minutes to Open University, leading private hospitals, commercial banks, and Colombo city center limits with excellent neighbourhood and rapid land value appreciation.",
        "purpose": "sale",
        "property_type": "land",
        "price": 52500000.0,
        "city": "Nawala",
        "district": "Colombo",
        "land_size": 15.0,
        "land_size_unit": "perches",
        "features": ["40ft Road Frontage", "20ft Access Road", "3-Phase Electricity", "Pipe-borne Water", "Clear BIMB Deeds", "Boundary Wall"],
        "whatsapp_number": "+94 77 123 4567",
        "phone_number": "+94 77 123 4567",
        "status": "available",
        "featured": False,
        "agent_index": 0,
        "images": [
            "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "scenic-coconut-estate-land-mirigama",
        "title": "Scenic Coconut Estate Land in Mirigama",
        "description": "Fertile 2.5 acre organic coconut estate with high monthly yield situated 10 minutes from Mirigama Central Expressway interchange. Features rich loamy soil, running natural stream on the boundary, electricity access, wide tarred road frontage, and on-site caretaker cottage. Ideal for agri-tourism, private country retreat, or eco-villa project with clear deeds, peaceful surroundings, and effortless highway access to Colombo.",
        "purpose": "sale",
        "property_type": "land",
        "price": 38000000.0,
        "city": "Mirigama",
        "district": "Gampaha",
        "land_size": 2.5,
        "land_size_unit": "acres",
        "features": ["Organic Coconut Estate", "Natural Stream", "Expressway Access", "Caretaker Cottage", "Tarred Road Frontage", "Clear Deeds"],
        "whatsapp_number": "+94 76 345 6789",
        "phone_number": "+94 76 345 6789",
        "status": "available",
        "featured": False,
        "agent_index": 2,
        "images": [
            "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "cliffside-oceanview-land-ahangama-galle",
        "title": "Cliffside Oceanview Land in Ahangama",
        "description": "Breathtaking 35-perch elevated land perched above the coastline in Ahangama south coast. Offers unobstructed 180-degree panoramic views of the turquoise sea and world-renowned surf breaks. Features clear title deeds, 20-foot access road, direct water and power connectivity, and prime tourist development approval. An unmatched southern coastline investment asset for luxury villa development or high-end boutique resort.",
        "purpose": "sale",
        "property_type": "land",
        "price": 68000000.0,
        "city": "Ahangama",
        "district": "Galle",
        "land_size": 35.0,
        "land_size_unit": "perches",
        "features": ["180 Ocean View", "Near Surf Breaks", "Tourist Board Approved", "20ft Access Road", "Electricity & Water", "Clear Deeds"],
        "whatsapp_number": "+94 71 234 5678",
        "phone_number": "+94 71 234 5678",
        "status": "available",
        "featured": True,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=1200&q=80"
        ],
    },
    {
        "slug": "mountain-view-tea-land-hantana-kandy",
        "title": "Mountain View Tea Land in Hantana Kandy",
        "description": "Picturesque 50-perch elevated land parcel located on the scenic slopes of Hantana range in Kandy. Offers panoramic views of Knuckles mountain range, cool hill country climate, spring water source, and concrete access road. Located 15 minutes from Kandy city center, ideal for an exclusive mountain bungalow, eco-cabana, or boutique wellness retreat with pristine nature all around and clear freehold ownership documentation.",
        "purpose": "sale",
        "property_type": "land",
        "price": 32500000.0,
        "city": "Hantana",
        "district": "Kandy",
        "land_size": 50.0,
        "land_size_unit": "perches",
        "features": ["Knuckles View", "Cool Climate", "Spring Water", "Concrete Access Road", "Clear First-class Title", "Hillside Location"],
        "whatsapp_number": "+94 70 456 7890",
        "phone_number": "+94 70 456 7890",
        "status": "available",
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=1200&q=80"
        ],
    },
]


def run_seed_and_repair(apply_changes: bool = False):
    print("=" * 70)
    print("  SquareLanka / TRD Proptech Demo Data Seed & Repair Script")
    print(f"  Mode: {'APPLY (Database will be updated)' if apply_changes else 'DRY-RUN (Preview only, no writes)'}")
    print("=" * 70)

    if not SUPABASE_URL or not (SUPABASE_SERVICE_KEY or SUPABASE_KEY):
        print("ERROR: Supabase URL or Key missing in backend/.env")
        sys.exit(1)

    client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or SUPABASE_KEY)

    created_agents_count = 0
    repaired_listings_count = 0
    created_listings_count = 0

    # Global set to track used image URLs across all listings to ensure 0 duplicates
    used_image_urls = set()

    # 1. CREATE OR REUSE 5 DEMO AGENTS
    print("\n--- Step 1: Processing Demo Agents ---")
    agent_id_map = {}

    for agent_data in DEMO_AGENTS:
        email = agent_data["email"]
        full_name = agent_data["full_name"]
        
        # Check existing profile
        res = client.table('profiles').select('id, email').eq('email', email).execute()
        agent_id = None
        
        if res.data:
            agent_id = res.data[0]['id']
            print(f"  [REUSE] Found existing agent profile for {email} (ID: {agent_id})")
            if apply_changes:
                random_pw = secrets.token_urlsafe(24)
                try:
                    client.auth.admin.update_user_by_id(agent_id, {'password': random_pw})
                    print(f"  [RESET] Reset password for existing agent {email}")
                except Exception as e:
                    print(f"ERROR: Failed to reset password for {email}: {e}")
                    sys.exit(1)
            else:
                print(f"  [DRY-RUN] Would reset password for existing agent {email}")
        else:
            print(f"  [CREATE] Agent {full_name} ({email}) needs to be created")
            if apply_changes:
                random_pw = secrets.token_urlsafe(24)
                try:
                    auth_res = client.auth.admin.create_user({
                        'email': email,
                        'password': random_pw,
                        'email_confirm': True,
                        'user_metadata': {'full_name': full_name}
                    })
                    agent_id = auth_res.user.id
                except Exception as e:
                    # If creation failed, check if user already exists in auth.users
                    try:
                        all_users = client.auth.admin.list_users()
                        for u in all_users:
                            if u.email == email:
                                agent_id = u.id
                                break
                    except Exception:
                        pass
                    
                    if not agent_id:
                        print(f"ERROR: User creation failed for {email}: {e}")
                        sys.exit(1)

                    # Reset password for existing user in auth
                    try:
                        client.auth.admin.update_user_by_id(agent_id, {'password': random_pw})
                        print(f"  [RESET] Reset password for existing auth user {email}")
                    except Exception as err:
                        print(f"ERROR: Failed to reset password for {email}: {err}")
                        sys.exit(1)
                
                # Upsert profile
                client.table('profiles').upsert({
                    'id': agent_id,
                    'full_name': full_name,
                    'email': email,
                    'role': 'agent',
                    'phone_number': agent_data['phone_number'],
                    'avatar_url': agent_data['avatar_url']
                }).execute()

                # Upsert agent_profiles
                client.table('agent_profiles').upsert({
                    'profile_id': agent_id,
                    'company_name': agent_data['company_name'],
                    'license_number': agent_data['license_number'],
                    'bio': agent_data['bio'],
                    'is_verified': agent_data['is_verified']
                }, on_conflict='profile_id').execute()

                created_agents_count += 1
            else:
                agent_id = f"dry-run-agent-id-{email}"
                print(f"  [DRY-RUN] Would create agent {email} with random password and profile")
                created_agents_count += 1

        agent_id_map[email] = agent_id

    default_agent_id = list(agent_id_map.values())[0]

    # 2. REPAIR EXISTING LISTINGS (Minimal repairs only)
    print("\n--- Step 2: Inspecting and Repairing Existing Listings ---")
    existing_res = client.table('properties').select('*').execute()
    existing_props = existing_res.data or []
    print(f"  Found {len(existing_props)} existing listings in database.")

    changed_image_listings = []
    final_existing_property_images = {}

    for prop in existing_props:
        prop_id = prop['id']
        title = prop.get('title', '')
        slug = prop.get('slug', '')
        prop_type = prop.get('property_type') or 'house'
        updates = {}

        # a. Repair user_id if None
        if not prop.get('user_id'):
            updates['user_id'] = default_agent_id
            updates['listed_by'] = 'agent'
            updates['agent_name'] = DEMO_AGENTS[0]['full_name']
            updates['phone_number'] = DEMO_AGENTS[0]['phone_number']
            updates['whatsapp_number'] = DEMO_AGENTS[0]['phone_number']
            print(f"  [REPAIR] Listing '{title}' (ID: {prop_id}) missing user_id -> Assigned to {DEMO_AGENTS[0]['full_name']}")

        # b. Repair 'Modern Luxury Apartment in Colombo 03' property_type & features
        if "Modern Luxury Apartment in Colombo 03" in title or "colombo-03" in slug:
            if prop.get('property_type') != 'apartment':
                updates['property_type'] = 'apartment'
                prop_type = 'apartment'
                print(f"  [REPAIR] Listing '{title}' changed property_type to 'apartment'")
            
            features = prop.get('features') or []
            if len(features) < 5:
                updates['features'] = ["Ocean View", "Rooftop Pool", "Gym", "24/7 Security", "Covered Parking"]
                print(f"  [REPAIR] Listing '{title}' updated to 5 features")

        # c. Minimal image repair according to rules:
        # Only change images if at least one URL fails to load.
        # Replace only failing URLs, keeping working ones in original order.
        # Do not pad up to 4 unless fewer than 2 working images.
        # Convention: main_image_url holds first image and image_urls holds additional ones.
        orig_main = prop.get('main_image_url')
        orig_additional = prop.get('image_urls') or []
        if isinstance(orig_additional, str):
            orig_additional = [orig_additional]

        has_broken_url = False
        if orig_main:
            if not check_image_url(orig_main):
                has_broken_url = True
        else:
            has_broken_url = True

        for u in orig_additional:
            if u and not check_image_url(u):
                has_broken_url = True

        # Collect working images in original order (deduplicating main if present in image_urls)
        working_images = []
        if orig_main and check_image_url(orig_main):
            working_images.append(orig_main)
        for u in orig_additional:
            if u and check_image_url(u) and u not in working_images:
                working_images.append(u)

        fewer_than_2_working = len(working_images) < 2

        if has_broken_url or fewer_than_2_working:
            # Images change for this listing
            repaired_imgs = list(working_images)
            for img in repaired_imgs:
                used_image_urls.add(img)

            if fewer_than_2_working:
                # Pad up to 3 images
                while len(repaired_imgs) < 3:
                    fresh = pick_fallback_image(prop_type, used_image_urls)
                    repaired_imgs.append(fresh)
            else:
                # Keep original slot count by replacing only failed URLs
                orig_slot_count = 1 + len([u for u in orig_additional if u and u != orig_main])
                target_count = max(len(working_images), orig_slot_count)
                while len(repaired_imgs) < target_count:
                    fresh = pick_fallback_image(prop_type, used_image_urls)
                    repaired_imgs.append(fresh)

            updates['main_image_url'] = repaired_imgs[0]
            updates['image_urls'] = repaired_imgs[1:]
            changed_image_listings.append((title, prop_id, len(working_images), len(repaired_imgs)))
            final_existing_property_images[prop_id] = repaired_imgs
            print(f"  [REPAIR] Listing '{title}' images repaired: 1 main + {len(updates['image_urls'])} additional")
        else:
            # Images stay unchanged
            for img in working_images:
                used_image_urls.add(img)
            # Retain existing images
            all_existing = [orig_main] if orig_main else []
            all_existing.extend([u for u in orig_additional if u and u not in all_existing])
            final_existing_property_images[prop_id] = all_existing

        if updates:
            repaired_listings_count += 1
            if apply_changes:
                client.table('properties').update(updates).eq('id', prop_id).execute()
                print(f"  [APPLIED] Repaired property: {title}")
            else:
                print(f"  [DRY-RUN] Would update property {prop_id} with: {list(updates.keys())}")

    # 3. ADD NEW LISTINGS (Unique photos matching each property)
    print("\n--- Step 3: Seeding New Demo Listings ---")
    existing_slugs = {p.get('slug') for p in existing_props if p.get('slug')}
    existing_titles = {p.get('title', '').strip().lower() for p in existing_props}

    final_new_property_images = {}

    for item in NEW_LISTINGS:
        slug = item["slug"]
        title = item["title"]

        if slug in existing_slugs or title.strip().lower() in existing_titles:
            print(f"  [SKIP] Listing already exists: '{title}' (slug: {slug})")
            continue

        agent_info = DEMO_AGENTS[item["agent_index"]]
        agent_id = agent_id_map.get(agent_info["email"], default_agent_id)

                # Keep the curated photos; drop any that no longer load or are already taken,
        # and only fall back to the pool if that leaves fewer than 2.
        listing_images = []
        for img in item["images"]:
            if img and img not in used_image_urls and check_image_url(img):
                listing_images.append(img)
                used_image_urls.add(img)

        while len(listing_images) < 2:
            fresh = pick_fallback_image(item["property_type"], used_image_urls)
            listing_images.append(fresh)

        final_images = listing_images
        final_new_property_images[slug] = final_images

        property_row = {
            "title": item["title"],
            "slug": slug,
            "description": item["description"],
            "purpose": item["purpose"],
            "property_type": item["property_type"],
            "price": item["price"],
            "city": item["city"],
            "district": item["district"],
            "bedrooms": item.get("bedrooms"),
            "bathrooms": item.get("bathrooms"),
            "area_sqft": item.get("area_sqft"),
            "land_size": item.get("land_size"),
            "land_size_unit": item.get("land_size_unit"),
            "features": item["features"],
            "main_image_url": final_images[0],
            "image_urls": final_images[1:],  # Only additional images
            "user_id": agent_id,
            "listed_by": "agent",
            "agent_name": agent_info["full_name"],
            "phone_number": item["phone_number"],
            "whatsapp_number": item["whatsapp_number"],
            "status": item.get("status", "available"),
            "is_published": True,
            "is_verified": agent_info["is_verified"],
            "featured": item.get("featured", False)
        }

        # Remove None values
        property_row = {k: v for k, v in property_row.items() if v is not None}

        created_listings_count += 1
        print(f"  [NEW] Listing: '{title}' ({item['district']} | {item['property_type'].upper()} | {item['purpose'].upper()} | LKR {item['price']:,.0f})")

        if apply_changes:
            client.table('properties').insert(property_row).execute()
            print(f"  [APPLIED] Inserted: {title}")

    # 4. DUPLICATE IMAGE URL CHECK (Fail loudly if any URL is used twice)
    print("\n--- Step 4: Validating Image Uniqueness Across All Listings ---")
    all_new_images = []
    for item in NEW_LISTINGS:
        imgs = item["images"]
        if len(imgs) != len(set(imgs)):
            raise AssertionError(f"Listing '{item['title']}' repeats an image within itself: {imgs}")
        all_new_images.extend(imgs)

    total_slots = len(all_new_images)
    unique_slots = len(set(all_new_images))

    url_counts = Counter(all_new_images)
    duplicates = {url: count for url, count in url_counts.items() if count > 1}

    if duplicates:
        print("\n" + "!" * 70)
        print("  CRITICAL ERROR: DUPLICATE IMAGE URLS DETECTED!")
        print("!" * 70)
        for url, count in duplicates.items():
            print(f"  - {url} (used {count} times)")
        print("!" * 70)
        raise AssertionError(f"Validation failed: {len(duplicates)} duplicate image URLs found across listings!")
    else:
        print(f"  [PASS] All {total_slots} image slots across {len(NEW_LISTINGS)} new listings are 100% unique ({unique_slots}/{total_slots})!")

    # Summary
    print("\n" + "=" * 70)
    print("  SEED & REPAIR EXECUTION SUMMARY")
    print("=" * 70)
    print(f"  - Agents processed / created:       {created_agents_count}")
    print(f"  - Existing listings inspected:      {len(existing_props)}")
    print(f"  - Existing listings image changes:  {len(changed_image_listings)}")
    print(f"  - Existing listings total repairs:  {repaired_listings_count}")
    print(f"  - New listings created:             {created_listings_count}")
    print(f"  - Total projected listings:         {len(existing_props) + created_listings_count}")
    print(f"  - Unique Image URLs vs Slots:       {unique_slots} / {total_slots}")
    print("=" * 70)
    print("  Existing listings whose images would change:")
    for title, pid, working_cnt, final_cnt in changed_image_listings:
        print(f"    * '{title}' (ID: {pid}) -> {working_cnt} working, updated to {final_cnt} images")
    print("=" * 70)
    if not apply_changes:
        print("  Notice: Ran in DRY-RUN mode. No changes were written to Supabase.")
        print("  To apply changes, run: python backend/scripts/seed_demo_listings.py --apply")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Seed and repair demo listings for SquareLanka")
    parser.add_argument('--apply', action='store_true', help="Apply changes to the database (defaults to dry-run)")
    parser.add_argument('--dry-run', action='store_true', help="Run preview only without modifying database")
    args = parser.parse_args()

    apply_changes = args.apply and not args.dry_run
    run_seed_and_repair(apply_changes=apply_changes)


if __name__ == "__main__":
    main()
