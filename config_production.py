# config_production.py
# Production configuration for Railway deployment

import os
import urllib.request

class Config:
    """Production configuration class for VisionShield application"""
    
    def __init__(self):
        # Force CPU for Railway deployment
        self.DEVICE = 'cpu'
        
        # Model configuration
        self.BATCH_SIZE = 1
        self.SEQ_LENGTH = 20
        self.FRAME_SKIP = 30
        self.HIDDEN_SIZE = 128
        self.NUM_LSTM_LAYERS = 1
        self.DROPOUT = 0.5
        
        # Paths
        self.BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        self.UPLOAD_FOLDER = os.path.join(self.BASE_DIR, 'static', 'uploads')
        self.HEATMAP_FOLDER = os.path.join(self.BASE_DIR, 'static', 'heatmaps')
        
        # Model path - will download if not exists
        self.MODEL_SAVE_PATH = os.path.join(self.BASE_DIR, 'models', 'weights', 'visionshield_model.pth')
        
        # Model download URL from GitHub Releases
        self.MODEL_URL = os.environ.get(
            'MODEL_URL',
            'YOUR_GITHUB_RELEASE_URL_HERE'  # We'll update this after uploading to GitHub
        )
        
        # Ensure directories exist
        for directory in [self.UPLOAD_FOLDER, self.HEATMAP_FOLDER, os.path.dirname(self.MODEL_SAVE_PATH)]:
            os.makedirs(directory, exist_ok=True)
        
        # Download model if it doesn't exist
        self._ensure_model_downloaded()
        
        # API configuration
        self.MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB for deployment
        self.ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm', 'mkv'}
        
        # Web configuration
        self.SECRET_KEY = os.environ.get('SECRET_KEY', os.urandom(24).hex())
        self.DEBUG = False  # Always False in production
    
    def _ensure_model_downloaded(self):
        """Download model from GitHub releases if not present"""
        if not os.path.exists(self.MODEL_SAVE_PATH):
            print(f"Model not found at {self.MODEL_SAVE_PATH}")
            print(f"Downloading model from {self.MODEL_URL}...")
            try:
                urllib.request.urlretrieve(self.MODEL_URL, self.MODEL_SAVE_PATH)
                print(f"Model downloaded successfully to {self.MODEL_SAVE_PATH}")
            except Exception as e:
                print(f"Error downloading model: {e}")
                raise RuntimeError("Could not download model file")
    
    def allowed_file(self, filename):
        """Check if a file has an allowed extension"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS