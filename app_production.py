# app_production.py
# Production entry point for VisionShield

import os
from flask import Flask, render_template

from config_production import Config
from api.routes import api_bp
from api.routes_pdf import register_pdf_routes
from api.feedback import register_feedback_routes

def create_app(config_class=Config):
    app = Flask(__name__)
    config = config_class()
    app.secret_key = config.SECRET_KEY
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_UPLOAD_SIZE
    app.config['VISIONSHIELD_CONFIG'] = config
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(api_bp)
    register_pdf_routes(app)
    register_feedback_routes(app)
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/results/<video_id>')
    def results(video_id):
        return render_template('results.html')
    
    return app

app = create_app()

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    # For Railway, the PORT is provided as environment variable
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
