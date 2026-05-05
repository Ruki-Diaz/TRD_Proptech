from flask import Blueprint, request, jsonify
from app.services import property_service
from app.middleware.auth import admin_required
from app.database import supabase, supabase_admin

admin_bp = Blueprint('admin_routes', __name__)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        offset = (page - 1) * limit
        
        response = supabase_admin.table('profiles').select('id, email, role, full_name, created_at, agent_profiles(profile_id, company_name, is_verified)').range(offset, offset + limit - 1).execute()
        return jsonify({'success': True, 'data': response.data})
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    try:
        data = request.json or {}
        new_role = data.get('role')
        if new_role not in ['user', 'agent', 'admin']:
            return jsonify({'success': False, 'error': {'message': 'Invalid role'}}), 400
            
        res = supabase_admin.table('profiles').update({'role': new_role}).eq('id', user_id).execute()
        if not res.data:
            return jsonify({'success': False, 'error': {'message': 'User not found'}}), 404
            
        profile = res.data[0]
        
        # Safely create agent_profiles row if role is agent
        if new_role == 'agent':
            try:
                # Upsert to avoid conflicts if it already exists
                supabase_admin.table('agent_profiles').upsert({
                    'profile_id': user_id,
                    'company_name': 'Independent Agent'
                }, on_conflict='profile_id').execute()
            except Exception as e:
                print("Agent profile creation warning:", e)
                
        return jsonify({'success': True, 'data': profile})
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@admin_bp.route('/agents/<profile_id>/verification', methods=['PATCH'])
@admin_required
def verify_agent(profile_id):
    try:
        data = request.json or {}
        is_verified = data.get('is_verified')
        
        if is_verified is None or not isinstance(is_verified, bool):
            return jsonify({'success': False, 'error': {'message': 'is_verified boolean is required'}}), 400
            
        res = supabase_admin.table('agent_profiles').update({'is_verified': is_verified}).eq('profile_id', profile_id).execute()
        if not res.data:
            return jsonify({'success': False, 'error': {'message': 'Agent profile not found'}}), 404
            
        return jsonify({'success': True, 'data': res.data[0]})
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500
