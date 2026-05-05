import os
from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    frontend_url = os.environ.get('FRONTEND_URL')
    
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
    if frontend_url:
        allowed_origins.append(frontend_url)
        
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    
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
