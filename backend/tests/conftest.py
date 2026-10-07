import pytest
from unittest.mock import MagicMock

import supabase as supabase_library

supabase_library.create_client = MagicMock()

from app import create_app
from app.limiter import limiter


@pytest.fixture(scope='session')
def app():
    application = create_app()
    application.config.update(TESTING=True, RATELIMIT_ENABLED=True)
    return application


@pytest.fixture
def client(app):
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def reset_rate_limits(app):
    with app.app_context():
        limiter.reset()


@pytest.fixture
def authenticated_user(monkeypatch):
    def authenticate(role='agent', user_id='00000000-0000-0000-0000-000000000002'):
        import app.middleware.auth as auth_middleware

        user = {
            'id': user_id,
            'role': role,
            'token': 'test-token',
            'email': 'test@example.com',
        }
        monkeypatch.setattr(auth_middleware, 'get_authenticated_user', lambda: (user, None))
        return user

    return authenticate
