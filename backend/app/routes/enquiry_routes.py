import uuid
import logging
from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, request, jsonify, g
from app.database import supabase, supabase_admin
from app.limiter import limiter
from app.middleware.auth import role_required

logger = logging.getLogger(__name__)

enquiry_bp = Blueprint('enquiry_routes', __name__)

@enquiry_bp.route('/', methods=['POST'])
@limiter.limit('5 per hour')
def submit_enquiry():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'success': False, 'error': {'message': 'No JSON payload provided'}}), 400
        
    required_fields = ['property_id', 'name', 'email', 'phone']
    for field in required_fields:
        if not isinstance(data.get(field), str) or not data[field].strip():
            return jsonify({'success': False, 'error': {'message': f'Missing required field: {field}'}}), 400

    field_limits = {'name': 100, 'email': 254, 'phone': 32}
    for field, max_length in field_limits.items():
        if len(data[field].strip()) > max_length:
            return jsonify({'success': False, 'error': {'message': f'{field} exceeds the maximum length of {max_length}'}}), 400

    message = data.get('message', '')
    if message is None:
        message = ''
    if not isinstance(message, str):
        return jsonify({'success': False, 'error': {'message': 'message must be a string'}}), 400
    if len(message.strip()) > 2000:
        return jsonify({'success': False, 'error': {'message': 'message exceeds the maximum length of 2000'}}), 400

    try:
        email = validate_email(data['email'].strip(), check_deliverability=False).normalized
    except EmailNotValidError:
        return jsonify({'success': False, 'error': {'message': 'email must be a valid email address'}}), 400

    # Validate property_id is exactly a UUID, not a slug
    try:
        valid_uuid = uuid.UUID(data['property_id'])
    except (ValueError, AttributeError):
        return jsonify({'success': False, 'error': {'message': 'property_id must be a valid UUID, not a slug.'}}), 400
            
    payload = {
        'property_id': str(valid_uuid),
        'name': data['name'].strip(),
        'email': email,
        'phone': data['phone'].strip(),
        'message': message.strip()
    }

    try:
        response = supabase.table('enquiries').insert(payload).execute()
        enquiry = response.data[0] if getattr(response, 'data', None) else None
        return jsonify({'success': True, 'data': enquiry}), 201
    except Exception:
        logger.exception("Enquiry submission failed")
        return jsonify({'success': False, 'error': {'message': 'Failed to submit enquiry'}}), 500

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
    except Exception:
        logger.exception(f"Failed to fetch enquiries for user={g.current_user['id']}")
        return jsonify({'success': False, 'error': {'message': 'Failed to retrieve enquiries'}}), 500

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
    except Exception:
        logger.exception("Failed to update enquiry status")
        return jsonify({'success': False, 'error': {'message': 'Failed to update enquiry status'}}), 500
