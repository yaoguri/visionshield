# api/feedback.py
# User feedback collection system for VisionShield

import os
import json
import time
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

def get_feedback_file():
    """Get the path to the feedback file"""
    config = current_app.config['VISIONSHIELD_CONFIG']
    return os.path.join(config.UPLOAD_FOLDER, 'feedback_log.json')

def load_feedback():
    """Load existing feedback from file"""
    feedback_file = get_feedback_file()
    if os.path.exists(feedback_file):
        try:
            with open(feedback_file, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_feedback(feedback_data):
    """Save feedback to file"""
    feedback_file = get_feedback_file()
    try:
        with open(feedback_file, 'w') as f:
            json.dump(feedback_data, f, indent=2)
        return True
    except Exception as e:
        current_app.logger.error(f"Error saving feedback: {e}")
        return False

@feedback_bp.route('/submit', methods=['POST'])
def submit_feedback():
    """
    Submit user feedback for a video analysis
    
    Expected JSON body:
    {
        "video_id": "uuid-string",
        "feedback_type": "correct" | "incorrect" | "report",
        "notes": "optional user notes"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400
        
        video_id = data.get('video_id')
        feedback_type = data.get('feedback_type')
        notes = data.get('notes', '')
        
        if not video_id or not feedback_type:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        if feedback_type not in ['correct', 'incorrect', 'report']:
            return jsonify({'status': 'error', 'message': 'Invalid feedback type'}), 400
        
        # Load existing feedback
        all_feedback = load_feedback()
        
        # Get the analysis results for this video
        config = current_app.config['VISIONSHIELD_CONFIG']
        results_file = os.path.join(config.UPLOAD_FOLDER, f"{video_id}_results.json")
        
        result_data = {}
        if os.path.exists(results_file):
            with open(results_file, 'r') as f:
                result_data = json.load(f)
        
        # Create feedback entry
        feedback_entry = {
            'feedback_id': f"fb_{int(time.time() * 1000)}_{len(all_feedback)}",
            'video_id': video_id,
            'filename': result_data.get('filename', 'unknown'),
            'prediction': result_data.get('prediction', 'unknown'),
            'confidence': result_data.get('confidence', 0),
            'probabilities': result_data.get('probabilities', {}),
            'feedback_type': feedback_type,
            'user_notes': notes,
            'timestamp': datetime.now().isoformat(),
            'timestamp_unix': int(time.time())
        }
        
        # Add to feedback list
        all_feedback.append(feedback_entry)
        
        # Save feedback
        if save_feedback(all_feedback):
            current_app.logger.info(f"Feedback submitted for video {video_id}: {feedback_type}")
            return jsonify({
                'status': 'success',
                'message': 'Thank you for your feedback!',
                'feedback_id': feedback_entry['feedback_id']
            }), 200
        else:
            return jsonify({'status': 'error', 'message': 'Failed to save feedback'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error submitting feedback: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@feedback_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get feedback statistics (for admin/monitoring)"""
    try:
        all_feedback = load_feedback()
        
        stats = {
            'total_feedback': len(all_feedback),
            'correct_count': sum(1 for f in all_feedback if f['feedback_type'] == 'correct'),
            'incorrect_count': sum(1 for f in all_feedback if f['feedback_type'] == 'incorrect'),
            'report_count': sum(1 for f in all_feedback if f['feedback_type'] == 'report'),
        }
        
        return jsonify({'status': 'success', 'stats': stats}), 200
    except Exception as e:
        current_app.logger.error(f"Error getting feedback stats: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

def register_feedback_routes(app):
    """Register feedback routes with the Flask app"""
    app.register_blueprint(feedback_bp)