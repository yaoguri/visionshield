# app.py
# Main Flask application for VisionShield

import os
import torch
from flask import Flask, render_template, redirect, url_for, flash, session

# Import VisionShield modules
from config import Config
from api import register_api_routes
from web import create_web_blueprint, init_web_routes

# Create Flask app
def create_app(config_class=Config):
    app = Flask(__name__)
    
    # Load configuration
    config = config_class()
    app.secret_key = config.SECRET_KEY
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_UPLOAD_SIZE
    app.config['VISIONSHIELD_CONFIG'] = config
    
    # Ensure upload folder exists
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    
    # Register blueprints
    register_api_routes(app)
    init_web_routes(app)
    
    return app

# Create app instance
app = create_app()


# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    return render_template('500.html'), 500


if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', '1') == '1'
    
    app.run(debug=debug, host='0.0.0.0', port=port)