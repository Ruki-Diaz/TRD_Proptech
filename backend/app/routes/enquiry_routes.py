import sys
import uuid
import logging
from flask import Blueprint, request, jsonify, g
from app.database import supabase, supabase_admin
from app.middleware.auth import role_required

# Configure strict backend logging map for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

enquiry_bp = Blueprint('enquiry_routes', __name__)

@enquiry_bp.route('/', methods=['POST'])
def submit_enquiry():
    data = request.json
    logger.info(f"DEBUG [Received Payload]: {data}")
    
    if not data:
        return jsonify({'success': False, 'error': {'message': 'No JSON payload provided'}}), 400
        
    required_fields = ['property_id', 'name', 'email', 'phone']
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return jsonify({'success': False, 'error': {'message': f'Missing required field: {field}'}}), 400
            
    # Validate property_id is exactly a UUID, not a slug
    try:
        valid_uuid = uuid.UUID(data['property_id'])
    except ValueError:
        return jsonify({'success': False, 'error': {'message': 'property_id must be a valid UUID, not a slug.'}}), 400
            
    payload = {
        'property_id': str(valid_uuid),
        'name': data['name'].strip(),
        'email': data['email'].strip(),
        'phone': data['phone'].strip(),
        'message': data.get('message', '').strip()
    }
    
    logger.info(f"DEBUG [Processed Insert Payload]: {payload}")
    
    try:
        response = supabase.table('enquiries').insert(payload).execute()
        logger.info(f"DEBUG [Supabase Success Response]: {getattr(response, 'data', 'No Data returned')}")
        
        enquiry = response.data[0] if getattr(response, 'data', None) else None
        return jsonify({'success': True, 'data': enquiry}), 201
    except Exception as e:
        error_str = str(e)
        logger.error(f"DEBUG [Exact Supabase Exception]: {error_str}")
        
        # Explicitly flag if the schema is entirely missing from the DB
        if "Could not find the table 'public.enquiries'" in error_str:
            return jsonify({'success': False, 'error': {'message': 'FATAL: The "enquiries" table does not exist in your Supabase database. You MUST run the SQL script to create it!'}}), 500
            
        return jsonify({'success': False, 'error': {'message': f'Database insert failed: {error_str}'}}), 500

@enquiry_bp.route('/mine', methods=['GET'])
@role_required('agent', 'admin')
def get_my_enquiries():
    try:
        user_id = g.current_user['id']
        role = g.current_user['role']
        
        query = supabase_admin.table('enquiries') \
            .select('*, properties!inner(title, user_id, slug, main_image_url)')
            
        if role != 'admin':
            query = query.eq('properties.user_id', user_id)
            
        response = query.order('created_at', desc=True).execute()
        
        return jsonify({'success': True, 'data': response.data})
    except Exception as e:
        logger.exception(f"Failed to fetch enquiries for user={g.current_user['id']}")
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@enquiry_bp.route('/<enquiry_id>/status', methods=['PUT'])
@role_required('agent', 'admin')
def update_enquiry_status(enquiry_id):
    try:
        data = request.json or {}
        status = data.get('status')
        
        if not status:
            return jsonify({'success': False, 'error': {'message': 'Status is required'}}), 400
            
        valid_statuses = ['new', 'read', 'replied', 'closed']
        if status not in valid_statuses:
            return jsonify({'success': False, 'error': {'message': 'Invalid status value'}}), 400
            
        user_id = g.current_user['id']
        role = g.current_user['role']
        
        # Verify ownership
        enq = supabase_admin.table('enquiries').select('*, properties!inner(user_id)').eq('id', enquiry_id).single().execute()
        
        if not enq.data:
            return jsonify({'success': False, 'error': {'message': 'Enquiry not found'}}), 404
            
        if role != 'admin' and enq.data['properties']['user_id'] != user_id:
            return jsonify({'success': False, 'error': {'message': 'Unauthorized'}}), 403
            
        # Update status
        response = supabase_admin.table('enquiries').update({'status': status}).eq('id', enquiry_id).execute()
        
        return jsonify({'success': True, 'data': response.data[0]})
    except Exception as e:
        logger.exception("Failed to update enquiry status")
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500
