import logging
from flask import Blueprint, request, jsonify, g
from app.database import supabase_admin
from app.middleware.auth import login_required

auth_bp = Blueprint('auth_routes', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/setup', methods=['POST'])
@login_required
def setup_profile():
    try:
        user_id = g.current_user['id']
        email = g.current_user.get('email')
        
        data = request.json or {}
        role = data.get('role', 'user')
        full_name = data.get('full_name', '')
        
        if role not in ['user', 'agent']:
            return jsonify({'success': False, 'error': {'message': 'Invalid role specified'}}), 400
            
        # 1. Upsert Profile
        profile_data = {
            'id': user_id,
            'role': role
        }
        if email:
            profile_data['email'] = email
        if full_name:
            profile_data['full_name'] = full_name
            
        # We upsert to handle if profile was partially created or not yet synced
        prof_res = supabase_admin.table('profiles').upsert(profile_data, on_conflict='id').execute()
        if not prof_res.data:
            return jsonify({'success': False, 'error': {'message': 'Failed to upsert profile'}}), 500
            
        profile = prof_res.data[0]

        # 2. Upsert Agent Profile if role is agent
        if role == 'agent':
            agent_data = {
                'profile_id': user_id,
                'company_name': data.get('company_name', 'Independent Agent'),
                'license_number': data.get('license_number', ''),
                'bio': data.get('bio', ''),
                'is_verified': False  # Default to false
            }
            
            # Upsert into agent_profiles
            agent_res = supabase_admin.table('agent_profiles').upsert(agent_data, on_conflict='profile_id').execute()
            if not agent_res.data:
                logger.error("Failed to upsert agent_profiles")
        
        return jsonify({'success': True, 'data': profile})

    except Exception as e:
        logger.exception("Setup profile failed for user=%s", g.current_user.get('id'))
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500
