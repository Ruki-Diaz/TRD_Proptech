import os
from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config.setdefault('RATELIMIT_STORAGE_URI', 'memory://')
    # Render sits behind a proxy; without this every visitor shares one rate-limit bucket
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)
    
    frontend_url = os.environ.get('FRONTEND_URL')
    
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "https://squarelanka.vercel.app"]
    if frontend_url:
        allowed_origins.append(frontend_url.strip().rstrip('/'))
        
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

    from app.limiter import limiter
    limiter.init_app(app)

    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        return {'success': False, 'error': {'message': 'Rate limit exceeded'}}, 429

    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running', 'success': True}
        
    from app.routes.property_routes import property_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.enquiry_routes import enquiry_bp
    from app.routes.profile_routes import profile_bp
    from app.routes.auth_routes import auth_bp
    
    app.register_blueprint(property_bp, url_prefix='/api/properties')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(enquiry_bp, url_prefix='/api/enquiries')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app
