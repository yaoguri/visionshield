# api/routes.py
# API routes for VisionShield

import os
import uuid
import json
import torch
import time
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename

from models.visionshield import VisionShield
from models.utils import analyze_video, generate_heatmap
from api.schemas import validate_analyze_request

# Define the blueprint for API routes
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Get the device for model inference
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

# Global variable for model
model = None

def get_model():
    """Get or load the model"""
    global model
    if model is None:
        try:
            config = current_app.config['VISIONSHIELD_CONFIG']
            model = VisionShield(
                hidden_size=config.HIDDEN_SIZE,
                num_layers=config.NUM_LSTM_LAYERS,
                dropout=config.DROPOUT
            )
            model.load_state_dict(torch.load(config.MODEL_SAVE_PATH, map_location=device))
            model = model.to(device)
            model.eval()
            current_app.logger.info(f"Model loaded successfully to {device}")
        except Exception as e:
            current_app.logger.error(f"Error loading model: {e}")
            model = None
    return model

@api_bp.route('/health')
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'VisionShield API is running',
        'model_loaded': get_model() is not None,
        'version': '1.0.0'
    })

@api_bp.route('/analyze', methods=['POST'])
def analyze():
    """Analyze a video for deepfakes"""
    valid, error = validate_analyze_request(request)
    if not valid:
        return jsonify({'status': 'error', 'message': error}), 400
        
    file = request.files['video']
    video_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    base_name, extension = os.path.splitext(filename)
    config = current_app.config['VISIONSHIELD_CONFIG']
    video_path = os.path.join(config.UPLOAD_FOLDER, f"{video_id}{extension}")
    file.save(video_path)
    
    try:
        current_model = get_model()
        if current_model is None:
            error_result = {
                'video_id': video_id,
                'filename': filename,
                'timestamp': int(time.time() * 1000),
                'error': 'Failed to load model',
                'prediction': 'Error',
                'confidence': 0.0,
                'probabilities': {'real': 0.0, 'fake': 0.0},
                'frame_analysis': [],
                'frames_analyzed': 0,
                'duration': 0,
                'resolution': '0x0'
            }
            results_file = os.path.join(config.UPLOAD_FOLDER, f"{video_id}_results.json")
            with open(results_file, 'w') as f:
                json.dump(error_result, f)
            return jsonify({'status': 'error', 'message': 'Failed to load model', 'video_id': video_id}), 500
            
        result = analyze_video(model=current_model, video_path=video_path, device=device, 
                              frame_skip=config.FRAME_SKIP, seq_length=config.SEQ_LENGTH)
        result['filename'] = filename
        result['timestamp'] = int(time.time() * 1000)
        
        heatmap_dir = os.path.join(config.UPLOAD_FOLDER, f"{video_id}_heatmaps")
        try:
            heatmaps = generate_heatmap(video_path=video_path, 
                                       frame_probabilities=result['frame_analysis'],
                                       output_dir=heatmap_dir)
            result['heatmaps'] = [
                {'frame_index': h['frame_index'], 'probability_fake': h['probability_fake'],
                 'path': os.path.basename(h['image_path'])} for h in heatmaps
            ]
        except Exception as e:
            current_app.logger.warning(f"Failed to generate heatmaps: {e}")
            result['heatmaps'] = []
        
        results_file = os.path.join(config.UPLOAD_FOLDER, f"{video_id}_results.json")
        with open(results_file, 'w') as f:
            json.dump(result, f)
        current_app.logger.info(f"Saved results to: {results_file}")
        
        return jsonify({
            'status': 'success',
            'message': 'Video analyzed successfully',
            'video_id': video_id,
            'result': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error analyzing video: {e}")
        import traceback
        traceback.print_exc()
        
        error_result = {
            'video_id': video_id,
            'filename': filename,
            'timestamp': int(time.time() * 1000),
            'error': str(e),
            'prediction': 'Error',
            'confidence': 0.0,
            'probabilities': {'real': 0.0, 'fake': 0.0},
            'frame_analysis': [],
            'frames_analyzed': 0,
            'duration': 0,
            'resolution': '0x0'
        }
        results_file = os.path.join(config.UPLOAD_FOLDER, f"{video_id}_results.json")
        with open(results_file, 'w') as f:
            json.dump(error_result, f)
        return jsonify({'status': 'error', 'message': str(e), 'video_id': video_id}), 500

@api_bp.route('/video/<video_id>')
def serve_video(video_id):
    """Serve a processed video by ID"""
    upload_dir = current_app.config['VISIONSHIELD_CONFIG'].UPLOAD_FOLDER
    for filename in os.listdir(upload_dir):
        if filename.startswith(video_id) and not filename.endswith('.json'):
            return send_from_directory(upload_dir, filename)
    return jsonify({'status': 'error', 'message': 'Video not found'}), 404

@api_bp.route('/results/<video_id>')
def get_results(video_id):
    """Get analysis results for a video"""
    config = current_app.config['VISIONSHIELD_CONFIG']
    upload_dir = config.UPLOAD_FOLDER
    results_file = os.path.join(upload_dir, f"{video_id}_results.json")
    
    if os.path.exists(results_file):
        try:
            with open(results_file, 'r') as f:
                result = json.load(f)
            return jsonify({'status': 'success', 'result': result})
        except Exception as e:
            current_app.logger.error(f"Error reading results file: {e}")
            return jsonify({'status': 'error', 'message': f'Error reading results: {str(e)}'}), 500
    else:
        return jsonify({'status': 'error', 'message': 'Results not found'}), 404

@api_bp.route('/frame-analysis/<video_id>')
def frame_analysis(video_id):
    """Get frame-by-frame analysis for a video"""
    upload_dir = current_app.config['VISIONSHIELD_CONFIG'].UPLOAD_FOLDER
    results_file = os.path.join(upload_dir, f"{video_id}_results.json")
    
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            result = json.load(f)
        
        frames = result.get('frame_analysis', [])
        
        return jsonify({
            'status': 'success',
            'video_id': video_id,
            'frames': frames
        })
    else:
        return jsonify({'status': 'error', 'message': 'Results not found'}), 404

@api_bp.route('/heatmap/<video_id>')
def heatmap(video_id):
    """Get heatmap data for a video"""
    config = current_app.config['VISIONSHIELD_CONFIG']
    upload_dir = config.UPLOAD_FOLDER
    results_file = os.path.join(upload_dir, f"{video_id}_results.json")
    
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            result = json.load(f)
        
        heatmaps = result.get('heatmaps', [])
        
        heatmap_images = []
        for heatmap in heatmaps:
            heatmap_images.append({
                'frame_index': heatmap['frame_index'],
                'probability_fake': heatmap['probability_fake'],
                'image_data': f"/api/heatmap-image/{video_id}/{heatmap['path']}"
            })
        
        return jsonify({
            'status': 'success',
            'video_id': video_id,
            'heatmap_images': heatmap_images
        })
    else:
        return jsonify({'status': 'error', 'message': 'Results not found'}), 404

@api_bp.route('/heatmap-image/<video_id>/<image_name>')
def heatmap_image(video_id, image_name):
    """Serve a heatmap image"""
    config = current_app.config['VISIONSHIELD_CONFIG']
    heatmap_dir = os.path.join(config.UPLOAD_FOLDER, f"{video_id}_heatmaps")
    
    if os.path.exists(os.path.join(heatmap_dir, image_name)):
        return send_from_directory(heatmap_dir, image_name)
    else:
        return jsonify({'status': 'error', 'message': 'Heatmap image not found'}), 404

@api_bp.route('/history')
def history():
    """Get analysis history"""
    config = current_app.config['VISIONSHIELD_CONFIG']
    upload_dir = config.UPLOAD_FOLDER
    
    history = []
    for filename in os.listdir(upload_dir):
        if filename.endswith('_results.json'):
            video_id = filename.split('_')[0]
            
            with open(os.path.join(upload_dir, filename), 'r') as f:
                result = json.load(f)
                
            history.append({
                'id': video_id,
                'filename': result.get('filename', 'Unknown'),
                'timestamp': result.get('timestamp', 0),
                'result': {
                    'prediction': result.get('prediction', 'Unknown'),
                    'confidence': result.get('confidence', 0)
                }
            })
    
    history.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'status': 'success',
        'history': history
    })

def register_api_routes(app):
    """Register API routes with the Flask app"""
    app.register_blueprint(api_bp)