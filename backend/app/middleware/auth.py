from functools import wraps
from flask import request, jsonify, g
from app.database import supabase, supabase_admin

def get_authenticated_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, (jsonify({'success': False, 'error': {'message': 'Missing authorization header'}}), 401)

    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None, (jsonify({'success': False, 'error': {'message': 'Missing bearer token'}}), 401)

    try:
        user_response = supabase.auth.get_user(token)
        user = getattr(user_response, 'user', None)
        if not user:
            raise ValueError('Invalid or expired token')
            
        # 2. Fetch user profile from public.profiles using admin client to bypass RLS
        profile_res = supabase_admin.table('profiles').select('role, full_name, email').eq('id', user.id).execute()
        
        # Handle missing profile safely
        if not profile_res.data:
            return None, (jsonify({'success': False, 'error': {'message': 'User profile not found. Please contact support.'}}), 403)
            
        profile = profile_res.data[0]
            
    except Exception as e:
        return None, (jsonify({'success': False, 'error': {'message': 'Invalid or expired token', 'details': str(e)}}), 401)

    # 3. Attach to Flask global
    return {
        'id': user.id, 
        'token': token, 
        'email': profile.get('email') or getattr(user, 'email', None),
        'role': profile.get('role', 'user'),
        'full_name': profile.get('full_name')
    }, None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user, error_response = get_authenticated_user()
        if error_response:
            return error_response

        g.current_user = user
        return f(*args, **kwargs)

    return decorated_function

def role_required(*allowed_roles):
    """Decorator to enforce multiple roles (e.g. @role_required('agent', 'admin'))"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user, error_response = get_authenticated_user()
            if error_response:
                return error_response

            if user.get('role') not in allowed_roles:
                return jsonify({'success': False, 'error': {'message': 'Insufficient permissions'}}), 403

            g.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user, error_response = get_authenticated_user()
        if error_response:
            return error_response

        if user.get('role') != 'admin':
            return jsonify({'success': False, 'error': {'message': 'Admin privileges required'}}), 403

        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function
