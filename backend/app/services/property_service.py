import re
import uuid
from app.database import supabase, supabase_admin
from supabase import create_client, ClientOptions
from app.database import supabase_url, supabase_key

def generate_slug(title: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    return f"{base}-{str(uuid.uuid4())[:6]}"

def get_authenticated_client(token: str):
    return create_client(
        supabase_url,
        supabase_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
    )

def get_properties(filters=None, sort='newest', page=1, limit=12):
    query = supabase.table('properties').select('*', count='exact').eq('is_published', True)
    
    if filters:
        if filters.get('district'):
            query = query.eq('district', filters['district'])
        if filters.get('purpose'):
            query = query.eq('purpose', filters['purpose'])
        if filters.get('property_type'):
            query = query.eq('property_type', filters['property_type'])
        if filters.get('bedrooms'):
            query = query.gte('bedrooms', int(filters['bedrooms']))
        if filters.get('min_price'):
            query = query.gte('price', float(filters['min_price']))
        if filters.get('max_price'):
            query = query.lte('price', float(filters['max_price']))
        if filters.get('user_id'):
            query = query.eq('user_id', filters['user_id'])
            
    # Sorting
    if sort == 'price_asc':
        query = query.order('price', desc=False)
    elif sort == 'price_desc':
        query = query.order('price', desc=True)
    else:
        query = query.order('created_at', desc=True)
        
    start = (page - 1) * limit
    end = start + limit - 1
    query = query.range(start, end)
            
    response = query.execute()
    return {
        'data': response.data,
        'count': response.count
    }

def get_property_by_slug(slug: str):
    response = supabase.table('properties').select('*').eq('slug', slug).eq('is_published', True).execute()
    if not response.data:
        return None
    prop = response.data[0]
    if prop.get('user_id'):
        profile_res = supabase_admin.table('profiles').select('full_name, email, phone_number, avatar_url, agent_profiles(company_name, license_number, bio, is_verified)').eq('id', prop['user_id']).execute()
        if profile_res.data:
            prop['agent'] = profile_res.data[0]
    return prop

def get_property_by_id(property_id: str):
    response = supabase.table('properties').select('*').eq('id', property_id).limit(1).execute()
    if not response.data:
        return None
    prop = response.data[0]
    if prop.get('user_id'):
        profile_res = supabase_admin.table('profiles').select('full_name, email, phone_number, avatar_url, agent_profiles(company_name, license_number, bio, is_verified)').eq('id', prop['user_id']).execute()
        if profile_res.data:
            prop['agent'] = profile_res.data[0]
    return prop

def get_similar_properties(slug: str, limit=4):
    # Retrieve origin property
    origin_response = supabase.table('properties').select('*').eq('slug', slug).eq('is_published', True).execute()
    if not origin_response.data:
        return []
        
    origin = origin_response.data[0]
    origin_price = float(origin.get('price', 0))
    min_bound = origin_price * 0.8
    max_bound = origin_price * 1.2
    
    # Query properties targeting exact city and property_type within a ±20% price box
    query = supabase.table('properties').select('*') \
        .eq('is_published', True) \
        .eq('city', origin.get('city', '')) \
        .eq('property_type', origin.get('property_type', '')) \
        .neq('id', origin.get('id', '')) \
        .gte('price', min_bound) \
        .lte('price', max_bound) \
        .order('price', desc=False) \
        .limit(limit)
        
    response = query.execute()
    return response.data

def get_properties_by_user(user_id: str, token: str = None):
    client = get_authenticated_client(token) if token else supabase
    response = client.table('properties').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    return response.data

def get_owner_property(property_id: str, current_user: dict):
    if current_user.get('role') == 'admin':
        response = supabase_admin.table('properties').select('*').eq('id', property_id).limit(1).execute()
    else:
        client = get_authenticated_client(current_user.get('token')) if current_user.get('token') else supabase
        response = client.table('properties').select('*').eq('id', property_id).eq('user_id', current_user['id']).limit(1).execute()
    return response.data[0] if response.data else None

def update_property_status(property_id: str, user_id: str, status: str, token: str = None):
    client = get_authenticated_client(token) if token else supabase
    response = client.table('properties').update({'status': status}).eq('id', property_id).eq('user_id', user_id).execute()
    return response.data[0] if response.data else None

def create_property(data: dict, token: str = None):
    if 'title' in data and 'slug' not in data:
        data['slug'] = generate_slug(data['title'])

    data.setdefault('status', 'available')
    data.setdefault('listed_by', 'agent')
    data.setdefault('is_verified', False)
        
    if token:
        client = get_authenticated_client(token)
    else:
        client = supabase
        
    response = client.table('properties').insert(data).execute()
    return response.data[0] if response.data else None

def update_property(property_id: str, data: dict):
    if 'title' in data and 'slug' not in data:
        data['slug'] = generate_slug(data['title'])
        
    response = supabase.table('properties').update(data).eq('id', property_id).execute()
    return response.data[0] if response.data else None

def delete_property(property_id: str):
    response = supabase.table('properties').delete().eq('id', property_id).execute()
    return response.data

def update_owner_property(property_id: str, current_user: dict, data: dict):
    payload = dict(data)
    if 'title' in payload and payload.get('title'):
        existing = get_owner_property(property_id, current_user)
        if existing and payload['title'] != existing.get('title'):
            payload['slug'] = generate_slug(payload['title'])

    if current_user.get('role') == 'admin':
        response = supabase_admin.table('properties').update(payload).eq('id', property_id).execute()
    else:
        client = get_authenticated_client(current_user.get('token')) if current_user.get('token') else supabase
        response = client.table('properties').update(payload).eq('id', property_id).eq('user_id', current_user['id']).execute()
    return response.data[0] if response.data else None

def delete_owner_property(property_id: str, current_user: dict):
    import logging
    # 1. Fetch property to get images
    existing = get_owner_property(property_id, current_user)
    if not existing:
        return None
        
    # 2. Extract paths
    urls = []
    if existing.get('main_image_url'):
        urls.append(existing['main_image_url'])
    if existing.get('image_urls'):
        urls.extend(existing['image_urls'])
        
    if urls:
        paths_to_delete = []
        for url in urls:
            if '/property-images/' in url:
                path = url.split('/property-images/')[1]
                paths_to_delete.append(path)
        
        if paths_to_delete:
            try:
                supabase_admin.storage.from_("property-images").remove(paths_to_delete)
            except Exception as e:
                logging.error(f"Failed to delete storage images: {e}")

    # 3. Delete from DB
    if current_user.get('role') == 'admin':
        response = supabase_admin.table('properties').delete().eq('id', property_id).execute()
    else:
        client = get_authenticated_client(current_user.get('token')) if current_user.get('token') else supabase
        response = client.table('properties').delete().eq('id', property_id).eq('user_id', current_user['id']).execute()
    return response.data[0] if response.data else None
