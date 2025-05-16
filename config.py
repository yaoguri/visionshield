# config.py
# Configuration settings for VisionShield

import os

class Config:
    """Configuration class for VisionShield application"""
    
    def __init__(self):
        # Device configuration
        self.DEVICE = 'cuda:0' if os.environ.get('USE_CUDA', '1') == '1' else 'cpu'
        
        # Model configuration
        self.BATCH_SIZE = 1  # For web inference, batch size is always 1
        self.SEQ_LENGTH = 20
        self.FRAME_SKIP = 30
        self.HIDDEN_SIZE = 128
        self.NUM_LSTM_LAYERS = 1
        self.DROPOUT = 0.5
        
        # Paths
        self.BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        self.UPLOAD_FOLDER = os.path.join(self.BASE_DIR, 'static', 'uploads')
        self.HEATMAP_FOLDER = os.path.join(self.BASE_DIR, 'static', 'heatmaps')
        self.MODEL_SAVE_PATH = os.environ.get(
            'MODEL_PATH', 
            os.path.join(self.BASE_DIR, 'models', 'weights', 'visionshield_model.pth')
        )
        
        # Ensure directories exist
        for directory in [self.UPLOAD_FOLDER, self.HEATMAP_FOLDER, os.path.dirname(self.MODEL_SAVE_PATH)]:
            os.makedirs(directory, exist_ok=True)
        
        # API configuration
        self.MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB
        self.ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}
        
        # Web configuration
        self.SECRET_KEY = os.environ.get('SECRET_KEY', 'visionshield_development_key')
        self.DEBUG = os.environ.get('DEBUG', '1') == '1'
        
        # Check model file existence
        if not os.path.exists(self.MODEL_SAVE_PATH):
            print(f"⚠️ Warning: Model file not found at {self.MODEL_SAVE_PATH}")
            print("Download or train a model and place it at this location.")
    
    def allowed_file(self, filename):
        """Check if a file has an allowed extension"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS