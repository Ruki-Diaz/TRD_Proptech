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
import urllib.request
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

# High-quality fallback images per property type verified on Unsplash
FALLBACK_IMAGES = {
    'apartment': [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
    ],
    'house': [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
    ],
    'commercial': [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
    ],
    'land': [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
    ]
}


def check_image_url(url: str, timeout=4) -> bool:
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
            ok = response.status == 200
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
                ok = response.status == 200
                IMAGE_CACHE[url] = ok
                return ok
        except Exception:
            IMAGE_CACHE[url] = False
            return False


def validate_and_repair_images(image_list, prop_type='house'):
    """Ensure all images in list return 200, replacing broken ones from verified fallback pool."""
    repaired = []
    fallbacks = FALLBACK_IMAGES.get(prop_type, FALLBACK_IMAGES['house'])
    fb_idx = 0
    for img in image_list:
        if check_image_url(img):
            repaired.append(img)
        else:
            repaired.append(fallbacks[fb_idx % len(fallbacks)])
            fb_idx += 1

    while len(repaired) < 4:
        repaired.append(fallbacks[fb_idx % len(fallbacks)])
        fb_idx += 1

    return repaired[:4]


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
NEW_LISTINGS = [
    # ------------------ 14 RENTALS (Priced LKR 60,000 to 600,000 / mo) ------------------
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
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
        "status": "rented",  # Target 1 of 4 sold/rented
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ]
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
        "status": "rented",  # Target 2 of 4 sold/rented
        "featured": False,
        "agent_index": 3,
        "images": [
            "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
    },

    # ------------------ 13 SALES (Priced LKR 15M to 60M) ------------------
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
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
        ]
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
        "status": "sold",  # Target 3 of 4 sold/rented
        "featured": False,
        "agent_index": 1,
        "images": [
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
        "status": "sold",  # Target 4 of 4 sold/rented
        "featured": False,
        "agent_index": 4,
        "images": [
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        ]
    },

    # ------------------ 5 COMMERCIAL PROPERTIES ------------------
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
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
        ]
    },

    # ------------------ 4 LAND PROPERTIES ------------------
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
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
        ]
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
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80"
        ]
    }
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
        else:
            print(f"  [CREATE] Agent {full_name} ({email}) needs to be created")
            if apply_changes:
                try:
                    auth_res = client.auth.admin.create_user({
                        'email': email,
                        'password': 'Password123!',
                        'email_confirm': True,
                        'user_metadata': {'full_name': full_name}
                    })
                    agent_id = auth_res.user.id
                except Exception as e:
                    try:
                        all_users = client.auth.admin.list_users()
                        for u in all_users:
                            if u.email == email:
                                agent_id = u.id
                                break
                    except Exception:
                        pass
                if not agent_id:
                    import uuid
                    agent_id = str(uuid.uuid4())
                
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
                created_agents_count += 1

        agent_id_map[email] = agent_id

    default_agent_id = list(agent_id_map.values())[0]

    # 2. REPAIR EXISTING LISTINGS
    print("\n--- Step 2: Inspecting and Repairing Existing Listings ---")
    existing_res = client.table('properties').select('*').execute()
    existing_props = existing_res.data or []
    print(f"  Found {len(existing_props)} existing listings in database.")

    for prop in existing_props:
        prop_id = prop['id']
        title = prop.get('title', '')
        slug = prop.get('slug', '')
        updates = {}

        # a. Repair user_id if None
        if not prop.get('user_id'):
            updates['user_id'] = default_agent_id
            updates['listed_by'] = 'agent'
            updates['agent_name'] = DEMO_AGENTS[0]['full_name']
            updates['phone_number'] = DEMO_AGENTS[0]['phone_number']
            updates['whatsapp_number'] = DEMO_AGENTS[0]['phone_number']
            print(f"  [REPAIR] Listing '{title}' (ID: {prop_id}) missing user_id -> Assigned to {DEMO_AGENTS[0]['full_name']}")

        # b. Repair 'Modern Luxury Apartment in Colombo 03'
        if "Modern Luxury Apartment in Colombo 03" in title or "colombo-03" in slug:
            if prop.get('property_type') != 'apartment':
                updates['property_type'] = 'apartment'
                print(f"  [REPAIR] Listing '{title}' changed property_type to 'apartment'")
            
            # Ensure 4 images & 5 features
            features = prop.get('features') or []
            if len(features) < 5:
                updates['features'] = ["Ocean View", "Rooftop Pool", "Gym", "24/7 Security", "Covered Parking"]
                print(f"  [REPAIR] Listing '{title}' updated to 5 features")

            images = validate_and_repair_images(
                prop.get('image_urls') or [prop.get('main_image_url')],
                'apartment'
            )
            updates['main_image_url'] = images[0]
            updates['image_urls'] = images

        # c. Verify & repair images for any listing with broken URLs
        main_img = prop.get('main_image_url')
        img_urls = prop.get('image_urls') or []
        if isinstance(img_urls, str):
            img_urls = [img_urls]
        
        all_imgs = [main_img] if main_img else []
        all_imgs.extend([u for u in img_urls if u and u not in all_imgs])
        
        validated_imgs = validate_and_repair_images(all_imgs, prop.get('property_type', 'house'))
        if validated_imgs != all_imgs or not check_image_url(main_img):
            updates['main_image_url'] = validated_imgs[0]
            updates['image_urls'] = validated_imgs
            print(f"  [REPAIR] Listing '{title}' image URLs verified and repaired")

        if updates:
            repaired_listings_count += 1
            if apply_changes:
                client.table('properties').update(updates).eq('id', prop_id).execute()
                print(f"  [APPLIED] Repaired property: {title}")
            else:
                print(f"  [DRY-RUN] Would update property {prop_id} with: {list(updates.keys())}")

    # 3. ADD NEW LISTINGS TO BRING TOTAL TO ABOUT 48
    print("\n--- Step 3: Seeding New Demo Listings ---")
    existing_slugs = {p.get('slug') for p in existing_props if p.get('slug')}
    existing_titles = {p.get('title', '').strip().lower() for p in existing_props}

    for item in NEW_LISTINGS:
        slug = item["slug"]
        title = item["title"]

        if slug in existing_slugs or title.strip().lower() in existing_titles:
            print(f"  [SKIP] Listing already exists: '{title}' (slug: {slug})")
            continue

        agent_info = DEMO_AGENTS[item["agent_index"]]
        agent_id = agent_id_map.get(agent_info["email"], default_agent_id)

        # Validate images before insertion
        validated_images = validate_and_repair_images(item["images"], item["property_type"])

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
            "main_image_url": validated_images[0],
            "image_urls": validated_images,
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

    # Summary
    print("\n" + "=" * 70)
    print("  SEED & REPAIR EXECUTION SUMMARY")
    print("=" * 70)
    print(f"  - Agents processed / created:  {created_agents_count}")
    print(f"  - Existing listings repaired:  {repaired_listings_count}")
    print(f"  - New listings created:        {created_listings_count}")
    print(f"  - Total projected listings:    {len(existing_props) + created_listings_count}")
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
