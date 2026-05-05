import logging
from flask import Blueprint, request, jsonify, g
from app.database import supabase_admin
from app.middleware.auth import login_required, role_required

profile_bp = Blueprint('profile_routes', __name__)
logger = logging.getLogger(__name__)

@profile_bp.route('/me', methods=['GET'])
@login_required
def get_my_profile():
    try:
        user_id = g.current_user['id']
        role = g.current_user['role']
        
        # Build query depending on role
        if role == 'agent':
            response = supabase_admin.table('profiles').select('*, agent_profiles(*)').eq('id', user_id).single().execute()
        else:
            response = supabase_admin.table('profiles').select('*').eq('id', user_id).single().execute()
            
        return jsonify({'success': True, 'data': response.data})
    except Exception as e:
        logger.exception("Failed to fetch profile for user=%s", g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@profile_bp.route('/update', methods=['PUT'])
@login_required
def update_profile():
    try:
        user_id = g.current_user['id']
        data = request.json or {}
        
        allowed_fields = {'full_name', 'phone_number', 'avatar_url'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'success': False, 'error': {'message': 'No valid fields provided'}}), 400
            
        response = supabase_admin.table('profiles').update(update_data).eq('id', user_id).execute()
        if not response.data:
            return jsonify({'success': False, 'error': {'message': 'Profile not found'}}), 404
            
        return jsonify({'success': True, 'data': response.data[0]})
    except Exception as e:
        logger.exception("Failed to update profile for user=%s", g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@profile_bp.route('/agent-update', methods=['PUT'])
@role_required('agent')
def update_agent_profile():
    try:
        user_id = g.current_user['id']
        data = request.json or {}
        
        allowed_fields = {'company_name', 'license_number', 'bio'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'success': False, 'error': {'message': 'No valid fields provided'}}), 400
            
        response = supabase_admin.table('agent_profiles').update(update_data).eq('profile_id', user_id).execute()
        if not response.data:
            # Create the agent profile if it doesn't exist for some reason
            update_data['profile_id'] = user_id
            response = supabase_admin.table('agent_profiles').insert(update_data).execute()
            
        return jsonify({'success': True, 'data': response.data[0]})
    except Exception as e:
        logger.exception("Failed to update agent profile for user=%s", g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@profile_bp.route('/agents/<agent_id>', methods=['GET'])
def get_public_agent_profile(agent_id):
    try:
        # Fetch profile and agent_profile
        response = supabase_admin.table('profiles') \
            .select('*, agent_profiles(*)') \
            .eq('id', agent_id) \
            .single() \
            .execute()
            
        if not response.data:
            return jsonify({'success': False, 'error': {'message': 'Agent not found'}}), 404
            
        # Verify the user is actually an agent
        if response.data.get('role') != 'agent':
            return jsonify({'success': False, 'error': {'message': 'User is not an agent'}}), 404
            
        # Remove sensitive information
        agent_data = response.data
        agent_data.pop('role', None)
        agent_data.pop('created_at', None)
        agent_data.pop('updated_at', None)
        
        return jsonify({'success': True, 'data': agent_data})
    except Exception as e:
        logger.exception("Failed to fetch public agent profile for %s", agent_id)
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500
