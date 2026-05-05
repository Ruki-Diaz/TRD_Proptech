import logging
from flask import Blueprint, request, jsonify, g
from app.services import property_service
from app.middleware.auth import login_required, role_required
from app.validation.schemas import PropertyCreate, PropertyUpdate, ListingStatusEnum
from pydantic import ValidationError

property_bp = Blueprint('property_routes', __name__)
logger = logging.getLogger(__name__)

@property_bp.route('/', methods=['GET'])
def list_properties():
    filters = {
        'district': request.args.get('district'),
        'purpose': request.args.get('purpose'),
        'property_type': request.args.get('type'),
        'bedrooms': request.args.get('bedrooms'),
        'min_price': request.args.get('min_price'),
        'max_price': request.args.get('max_price'),
        'user_id': request.args.get('user_id')
    }
    filters = {k: v for k, v in filters.items() if v}
    sort = request.args.get('sort', 'newest')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 12))
    
    try:
        result = property_service.get_properties(filters, sort, page, limit)
        return jsonify({
            'success': True,
            'data': result['data'],
            'total': result['count'],
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/<slug>', methods=['GET'])
def get_property(slug):
    try:
        prop = property_service.get_property_by_slug(slug)
        if not prop:
            return jsonify({'success': False, 'error': {'message': 'Property not found'}}), 404
        return jsonify({'success': True, 'data': prop})
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/similar/<slug>', methods=['GET'])
def get_similar(slug):
    try:
        props = property_service.get_similar_properties(slug)
        return jsonify({'success': True, 'data': props})
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/create', methods=['POST'])
@role_required('agent', 'admin')
def create():
    try:
        data = request.json or {}
        current_user = g.current_user
        data['user_id'] = current_user['id']
        validated_data = PropertyCreate(**data).model_dump(exclude_unset=True, mode='json')

        new_prop = property_service.create_property(validated_data, current_user['token'])
        return jsonify({'success': True, 'data': new_prop}), 201
    except ValidationError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'details': e.errors()}}), 400
    except Exception as e:
        logger.exception("Property create failed for user=%s", getattr(g, 'current_user', {}).get('id'))
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/mine', methods=['GET'])
@role_required('agent', 'admin')
def get_my_properties():
    try:
        props = property_service.get_properties_by_user(g.current_user['id'], g.current_user['token'])
        return jsonify({'success': True, 'data': props})
    except Exception as e:
        logger.exception("Fetch own properties failed for user=%s", g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/manage/<property_id>', methods=['GET'])
@role_required('agent', 'admin')
def get_manage_property(property_id):
    try:
        prop = property_service.get_owner_property(property_id, g.current_user)
        if not prop:
            return jsonify({'success': False, 'error': {'message': 'Property not found'}}), 404
        return jsonify({'success': True, 'data': prop})
    except Exception as e:
        logger.exception("Fetch manage property failed for property=%s user=%s", property_id, g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/<property_id>/status', methods=['PUT'])
@role_required('agent', 'admin')
def update_status(property_id):
    try:
        data = request.json or {}
        status = data.get('status')
        
        if not status:
            return jsonify({'success': False, 'error': {'message': 'Missing status'}}), 400

        status = ListingStatusEnum(status).value
            
        updated = property_service.update_property_status(property_id, g.current_user['id'], status, g.current_user['token'])
        if not updated:
            return jsonify({'success': False, 'error': {'message': 'Unauthorized or Property not found'}}), 403
            
        return jsonify({'success': True, 'data': updated})
    except ValueError:
        return jsonify({'success': False, 'error': {'message': 'Invalid status value'}}), 400
    except Exception as e:
        logger.exception("Property status update failed for property=%s user=%s", property_id, g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/manage/<property_id>', methods=['PUT', 'PATCH'])
@role_required('agent', 'admin')
def update_manage_property(property_id):
    try:
        data = request.json or {}
        if not data:
            return jsonify({'success': False, 'error': {'message': 'No update payload provided'}}), 400

        blocked_fields = {'id', 'user_id', 'created_at', 'updated_at'}
        sanitized = {k: v for k, v in data.items() if k not in blocked_fields}
        validated = PropertyUpdate(**sanitized).model_dump(exclude_unset=True, mode='json')
        if not validated:
            return jsonify({'success': False, 'error': {'message': 'No valid fields supplied for update'}}), 400

        updated = property_service.update_owner_property(
            property_id,
            g.current_user,
            validated
        )
        if not updated:
            return jsonify({'success': False, 'error': {'message': 'Property not found or not owned by current user'}}), 404

        return jsonify({'success': True, 'data': updated})
    except ValidationError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'details': e.errors()}}), 400
    except Exception as e:
        logger.exception("Property update failed for property=%s user=%s", property_id, g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500

@property_bp.route('/manage/<property_id>', methods=['DELETE'])
@role_required('agent', 'admin')
def delete_manage_property(property_id):
    try:
        deleted = property_service.delete_owner_property(property_id, g.current_user)
        if not deleted:
            return jsonify({'success': False, 'error': {'message': 'Property not found or not owned by current user'}}), 404
        return jsonify({'success': True, 'message': 'Property deleted successfully', 'data': deleted})
    except Exception as e:
        logger.exception("Property delete failed for property=%s user=%s", property_id, g.current_user['id'])
        return jsonify({'success': False, 'error': {'message': str(e)}}), 500
