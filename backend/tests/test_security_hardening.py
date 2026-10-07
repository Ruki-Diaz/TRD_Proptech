from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.routes import auth_routes, enquiry_routes, property_routes
from app.services import property_service


PROPERTY_PAYLOAD = {
    'title': 'Secure listing',
    'purpose': 'sale',
    'property_type': 'house',
    'price': 250000,
    'district': 'Colombo',
    'city': 'Colombo',
}


def test_setup_rejects_admin_role(client, authenticated_user, monkeypatch):
    authenticated_user(role='user', user_id='ordinary-user')
    admin_client = MagicMock()
    monkeypatch.setattr(auth_routes, 'supabase_admin', admin_client)

    response = client.post('/api/auth/setup', json={'role': 'admin'})

    assert response.status_code == 400
    assert response.json == {
        'success': False,
        'error': {'message': 'Invalid role specified'},
    }
    admin_client.table.assert_not_called()


def test_agent_create_cannot_set_admin_only_property_fields(
    client, authenticated_user, monkeypatch
):
    user = authenticated_user()
    create_property = MagicMock(return_value={'id': 'created-property'})
    monkeypatch.setattr(property_routes.property_service, 'create_property', create_property)

    response = client.post(
        '/api/properties/create',
        json={
            **PROPERTY_PAYLOAD,
            'is_verified': True,
            'featured': True,
            'user_id': '00000000-0000-0000-0000-000000000003',
        },
    )

    assert response.status_code == 201
    created_data = create_property.call_args.args[0]
    assert created_data['user_id'] == user['id']
    assert 'is_verified' not in created_data
    assert 'featured' not in created_data


def test_admin_create_can_set_admin_only_property_fields(
    client, authenticated_user, monkeypatch
):
    authenticated_user(role='admin', user_id='admin-user')
    create_property = MagicMock(return_value={'id': 'created-property'})
    monkeypatch.setattr(property_routes.property_service, 'create_property', create_property)

    client.post(
        '/api/properties/create',
        json={
            **PROPERTY_PAYLOAD,
            'is_verified': True,
            'featured': True,
            'user_id': '00000000-0000-0000-0000-000000000003',
        },
    )

    created_data = create_property.call_args.args[0]
    assert created_data['is_verified'] is True
    assert created_data['featured'] is True
    assert created_data['user_id'] == '00000000-0000-0000-0000-000000000003'


def test_agent_update_cannot_set_admin_only_property_fields(
    client, authenticated_user, monkeypatch
):
    authenticated_user()
    update_property = MagicMock(return_value={'id': 'property-id'})
    monkeypatch.setattr(property_routes.property_service, 'update_owner_property', update_property)

    response = client.put(
        '/api/properties/manage/property-id',
        json={
            'description': 'Safe update',
            'is_verified': True,
            'featured': True,
            'user_id': 'another-user',
        },
    )

    assert response.status_code == 200
    assert update_property.call_args.args[2] == {'description': 'Safe update'}


def test_admin_update_can_set_admin_only_property_fields(
    client, authenticated_user, monkeypatch
):
    authenticated_user(role='admin', user_id='admin-user')
    update_property = MagicMock(return_value={'id': 'property-id'})
    monkeypatch.setattr(property_routes.property_service, 'update_owner_property', update_property)

    client.patch(
        '/api/properties/manage/property-id',
        json={
            'is_verified': True,
            'featured': True,
            'user_id': '00000000-0000-0000-0000-000000000003',
        },
    )

    assert update_property.call_args.args[2] == {
        'is_verified': True,
        'featured': True,
        'user_id': '00000000-0000-0000-0000-000000000003',
    }


@pytest.mark.parametrize('query', ['page=abc', 'page=0', 'limit=-1', 'limit=nope'])
def test_property_pagination_rejects_invalid_values(client, query):
    response = client.get(f'/api/properties/?{query}')

    assert response.status_code == 400
    assert response.json['success'] is False
    assert 'error' in response.json


def test_property_pagination_caps_limit_at_50(client, monkeypatch):
    get_properties = MagicMock(return_value={'data': [], 'count': 0})
    monkeypatch.setattr(property_routes.property_service, 'get_properties', get_properties)

    response = client.get('/api/properties/?limit=100')

    assert response.status_code == 200
    assert response.json['limit'] == 50
    assert get_properties.call_args.args[3] == 50


def test_property_database_exception_returns_generic_message(client, monkeypatch):
    monkeypatch.setattr(
        property_routes.property_service,
        'get_property_by_slug',
        MagicMock(side_effect=RuntimeError('private database details')),
    )

    response = client.get('/api/properties/example-listing')

    assert response.status_code == 500
    assert response.json == {
        'success': False,
        'error': {'message': 'Failed to retrieve property'},
    }
    assert 'private database details' not in response.get_data(as_text=True)


@pytest.mark.parametrize(
    'query',
    [
        'bedrooms=abc',
        'bedrooms=1.5',
        'min_price=nan',
        'max_price=-1',
        'min_price=100&max_price=10',
    ],
)
def test_property_numeric_filters_reject_invalid_values(
    client, monkeypatch, query
):
    database_client = MagicMock()
    monkeypatch.setattr(property_service, 'supabase', database_client)

    response = client.get(f'/api/properties/?{query}')

    assert response.status_code == 400
    database_client.table.assert_not_called()


def test_enquiry_rejects_invalid_email(client):
    response = client.post(
        '/api/enquiries/',
        json={
            'property_id': '00000000-0000-0000-0000-000000000001',
            'name': 'Example Person',
            'email': 'not-an-email',
            'phone': '+94123456789',
        },
    )

    assert response.status_code == 400
    assert response.json['error']['message'] == 'email must be a valid email address'


@pytest.mark.parametrize(
    ('field', 'value'),
    [
        ('name', 'N' * 101),
        ('email', ('a' * 245) + '@example.com'),
        ('phone', '1' * 33),
        ('message', 'm' * 2001),
    ],
)
def test_enquiry_rejects_oversized_fields(client, field, value):
    payload = {
        'property_id': '00000000-0000-0000-0000-000000000001',
        'name': 'Example Person',
        'email': 'person@example.com',
        'phone': '+94123456789',
        'message': 'Interested',
    }
    payload[field] = value

    response = client.post('/api/enquiries/', json=payload)

    assert response.status_code == 400


def test_enquiry_rate_limit_is_five_per_hour_per_ip(client, monkeypatch):
    execute = MagicMock(
        return_value=SimpleNamespace(data=[{'id': 'enquiry-id'}])
    )
    insert = MagicMock(return_value=SimpleNamespace(execute=execute))
    table = MagicMock(return_value=SimpleNamespace(insert=insert))
    monkeypatch.setattr(enquiry_routes, 'supabase_admin', SimpleNamespace(table=table))
    payload = {
        'property_id': '00000000-0000-0000-0000-000000000001',
        'name': 'Example Person',
        'email': 'person@example.com',
        'phone': '+94123456789',
    }

    responses = [client.post('/api/enquiries/', json=payload) for _ in range(6)]

    assert [response.status_code for response in responses] == [201] * 5 + [429]
    assert responses[-1].json == {
        'success': False,
        'error': {'message': 'Rate limit exceeded'},
    }
    assert insert.call_count == 5
