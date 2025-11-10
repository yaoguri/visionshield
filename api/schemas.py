# api/schemas.py
# Request and response schemas for the VisionShield API

from flask import Request, jsonify, current_app

def validate_analyze_request(request: Request):
    """
    Validate the request for the analyze endpoint
    
    Args:
        request: Flask request object
        
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check if the post request has the file part
    if 'video' not in request.files:
        return False, 'No video file provided'
        
    file = request.files['video']
    
    # If user does not select file, browser also submits an empty part without filename
    if file.filename == '':
        return False, 'No selected file'
    
    # Check if the file is allowed
    config = current_app.config['VISIONSHIELD_CONFIG']
    if not config.allowed_file(file.filename):
        return False, f'Invalid file type. Allowed types: {", ".join(config.ALLOWED_EXTENSIONS)}'
    
    # Check file size
    if request.content_length > config.MAX_UPLOAD_SIZE:
        return False, f'File too large. Maximum size: {config.MAX_UPLOAD_SIZE / (1024 * 1024)} MB'
    
    return True, None

def format_analysis_response(video_id: str, result: dict):
    """
    Format the response for the analyze endpoint
    
    Args:
        video_id: ID of the analyzed video
        result: Analysis result dict
        
    Returns:
        Flask response
    """
    # Format the response
    response = {
        'status': 'success',
        'video_id': video_id,
        'result': {
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'probabilities': result['probabilities'],
            'max_fake_probability': result['max_fake_probability'],
            'avg_fake_probability': result['avg_fake_probability'],
            'frames_analyzed': result['frames_analyzed'],
            'frame_rate': result['frame_rate'],
            'filename': result['filename'],
            'timestamp': result['timestamp']
        }
    }
    
    return jsonify(response)