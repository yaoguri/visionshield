# web/__init__.py 
# Web interface module for VisionShield

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
import uuid

def create_web_blueprint():
    """Create Blueprint for web routes"""
    web_bp = Blueprint('web', __name__,
                      template_folder='templates',
                      static_folder='static',
                      static_url_path='/static')
    
    @web_bp.route('/')
    def index():
        """Render main upload page"""
        return render_template('index.html')
    
    @web_bp.route('/dashboard')
    def dashboard():
        """Render user dashboard page"""
        if 'user_id' not in session:
            flash('Please log in to access your dashboard', 'warning')
            return redirect(url_for('web.login'))
        return render_template('dashboard.html')
    
    @web_bp.route('/results/<video_id>')
    def results(video_id):
        """Render results page for a specific video"""
        return render_template('results.html', video_id=video_id)
    
    @web_bp.route('/login', methods=['GET', 'POST'])
    def login():
        """Handle user login"""
        if request.method == 'POST':
            # Simple demo login (replace with real authentication)
            email = request.form.get('email', '')
            password = request.form.get('password', '')
            
            if email and password:  # Demo accepts any non-empty credentials
                session['user_id'] = str(uuid.uuid4())
                session['user_email'] = email
                return redirect(url_for('web.dashboard'))
            else:
                flash('Invalid credentials', 'error')
                
        return render_template('login.html', register=False)
    
    @web_bp.route('/register', methods=['GET', 'POST'])
    def register():
        """Handle user registration"""
        if request.method == 'POST':
            # Simple demo registration (replace with real user creation)
            email = request.form.get('email', '')
            password = request.form.get('password', '')
            
            if email and password:
                session['user_id'] = str(uuid.uuid4())
                session['user_email'] = email
                return redirect(url_for('web.dashboard'))
            else:
                flash('Invalid registration data', 'error')
                
        return render_template('login.html', register=True)
    
    @web_bp.route('/logout')
    def logout():
        """Log out user"""
        session.clear()
        flash('You have been logged out', 'info')
        return redirect(url_for('web.index'))
    
    return web_bp

def init_web_routes(app):
    """Initialize web routes for the Flask app"""
    web_bp = create_web_blueprint()
    app.register_blueprint(web_bp)
    return app