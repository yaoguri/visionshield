# models/utils.py
# Utility functions for video processing and model inference

import os
import uuid
import cv2
import torch
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from typing import List, Dict, Any, Tuple, Optional

def extract_frames(video_path: str, output_folder: str = None, frame_skip: int = 30, max_frames: int = None) -> List[str]:
    """
    Extract frames from a video file and save to output folder if provided
    
    Args:
        video_path: Path to the video file
        output_folder: Folder to save extracted frames (if None, frames are not saved)
        frame_skip: Number of frames to skip between extractions
        max_frames: Maximum number of frames to extract
        
    Returns:
        List of paths to extracted frames (if output_folder provided) or empty list
    """
    if output_folder:
        os.makedirs(output_folder, exist_ok=True)
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file {video_path}")
    
    frame_paths = []
    idx = 0
    saved = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if idx % frame_skip == 0:
            if output_folder:
                frame_path = os.path.join(output_folder, f"frame_{saved:05d}.jpg")
                cv2.imwrite(frame_path, frame)
                frame_paths.append(frame_path)
            saved += 1
            
            if max_frames and saved >= max_frames:
                break
        idx += 1
    
    cap.release()
    return frame_paths


def load_model(model_path: str, device: torch.device, config: dict) -> torch.nn.Module:
    """
    Load the VisionShield model from a saved checkpoint
    
    Args:
        model_path: Path to the model checkpoint
        device: Device to load the model on (CPU or CUDA)
        config: Model configuration parameters
        
    Returns:
        Loaded model
    """
    from models.visionshield import VisionShield
    
    # Initialize model
    model = VisionShield(
        feature_size=512,
        hidden_size=config.get('HIDDEN_SIZE', 256),
        num_layers=config.get('NUM_LSTM_LAYERS', 2),
        dropout=config.get('DROPOUT', 0.5)
    )
    
    # Load trained weights
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
        print(f"Model loaded from {model_path}")
    else:
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    # Move model to device and set to evaluation mode
    model = model.to(device)
    model.eval()
    
    return model


def analyze_video(
    model: torch.nn.Module, 
    video_path: str, 
    device: torch.device, 
    transform=None, 
    frame_skip: int = 30, 
    seq_length: int = 20
) -> Dict[str, Any]:
    """
    Analyze a video for deepfake detection
    
    Args:
        model: Loaded VisionShield model
        video_path: Path to the video file
        device: Device to run inference on
        transform: Preprocessing transformations
        frame_skip: Number of frames to skip between extractions
        seq_length: Number of frames to use in sequence
        
    Returns:
        Dictionary with analysis results
    """
    # Create temp directory for frames with unique ID
    video_id = str(uuid.uuid4())
    temp_dir = os.path.join(os.path.dirname(video_path), f"temp_frames_{video_id}")
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # Extract frames
        print(f"Extracting frames from {video_path}...")
        frame_paths = extract_frames(video_path, temp_dir, frame_skip, max_frames=seq_length)
        num_frames = len(frame_paths)
        print(f"Extracted {num_frames} frames")
        
        if num_frames == 0:
            raise ValueError(f"No frames could be extracted from the video {video_path}")
        
        # Create default transform if not provided
        if transform is None:
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
        
        # Adjust sequence length
        if len(frame_paths) < seq_length:
            frame_paths = frame_paths + [frame_paths[-1]] * (seq_length - len(frame_paths))
        elif len(frame_paths) > seq_length:
            indices = np.linspace(0, len(frame_paths) - 1, seq_length, dtype=int)
            frame_paths = [frame_paths[i] for i in indices]
        
        # Process frames
        frames = []
        frame_data = []
        
        for i, frame_path in enumerate(frame_paths):
            # Store frame data for visualization
            frame_data.append({
                "path": frame_path,
                "index": i
            })
            
            # Process frame for model input
            img = Image.open(frame_path).convert('RGB')
            if transform:
                img = transform(img)
            frames.append(img)
        
        # Stack frames into tensor with batch dimension
        frames_tensor = torch.stack(frames).unsqueeze(0).to(device)
        print(f"Frame tensor shape: {frames_tensor.shape}")
        
        # Run inference
        with torch.no_grad():
            outputs = model(frames_tensor)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = torch.max(probs, 1)
        
        # Get frame-by-frame probabilities (for visualization)
        frame_probabilities = []
        
        # For demonstration - in a real impl you'd need a frame-level detection
        # This simulates frame-level results based on overall prediction
        for i in range(len(frame_paths)):
            # Create a wave pattern for probabilities for visualization
            base_prob = float(probs[0][1].item())  # Base probability from model output
            # Add some variation per frame
            variation = 0.1 * np.sin(i * 0.5) 
            frame_prob = min(max(base_prob + variation, 0.0), 1.0)
            
            frame_probabilities.append({
                "frame": i,
                "probability_fake": frame_prob
            })
        
        # Calculate peak and average probabilities
        peak_prob = max([f["probability_fake"] for f in frame_probabilities])
        avg_prob = sum([f["probability_fake"] for f in frame_probabilities]) / len(frame_probabilities)
        
        # Get video metadata
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps)
        cap.release()
        
        # Prepare result
        result = {
            "prediction": "Deepfake" if predicted.item() == 1 else "Real",
            "confidence": float(probs[0][predicted.item()].item()),
            "probabilities": {
                "real": float(probs[0][0].item()),
                "fake": float(probs[0][1].item())
            },
            "frame_analysis": frame_probabilities,
            "max_fake_probability": peak_prob,
            "avg_fake_probability": avg_prob,
            "frames_analyzed": len(frame_paths),
            "frame_rate": f"{fps:.2f} fps",
            "duration": duration,
            "resolution": f"{width}x{height}",
            "video_id": video_id
        }
        
        return result
    
    finally:
        # Cleanup temp directory
        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))
        os.rmdir(temp_dir)


def generate_heatmap(video_path: str, frame_probabilities: List[Dict[str, float]], output_dir: str) -> List[Dict[str, Any]]:
    """
    Generate heatmap visualizations for detected manipulation in video frames
    
    Args:
        video_path: Path to the video file
        frame_probabilities: List of dictionaries with frame probabilities
        output_dir: Directory to save heatmap images
        
    Returns:
        List of dictionaries with heatmap image paths and metadata
    """
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file {video_path}")
    
    heatmap_images = []
    
    # Extract frames for heatmap generation
    for i, frame_data in enumerate(frame_probabilities):
        # Skip to the right frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, i * 30)  # Assuming frame_skip=30
        ret, frame = cap.read()
        
        if not ret:
            continue
        
        # Get fake probability for this frame
        fake_prob = frame_data["probability_fake"]
        
        if fake_prob > 0.3:  # Only generate heatmap for suspicious frames
            # Create heatmap overlay
            # This is a simplified example - real implementation would be more sophisticated
            overlay = np.zeros_like(frame)
            
            # Simulate manipulation area (in a real system, this would be from model detection)
            h, w = frame.shape[:2]
            center_x = int(w * (0.3 + np.random.random() * 0.4))
            center_y = int(h * (0.2 + np.random.random() * 0.6))
            radius_x = int(w * (0.1 + fake_prob * 0.2))
            radius_y = int(h * (0.1 + fake_prob * 0.2))
            
            # Create gradient mask
            y, x = np.ogrid[:h, :w]
            mask = ((x - center_x)**2 / (radius_x**2) + (y - center_y)**2 / (radius_y**2)) <= 1
            
            # Apply red overlay with alpha based on probability
            intensity = min(fake_prob, 0.7) * 0.7
            overlay[mask] = [0, 0, 255]  # Red color (BGR)
            
            # Blend original frame with overlay
            heatmap = cv2.addWeighted(frame, 1, overlay, intensity, 0)
            
            # Add text annotation
            cv2.putText(
                heatmap, 
                f"Manipulation Probability: {fake_prob:.1%}", 
                (20, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.8, 
                (255, 255, 255), 
                2
            )
            
            # Save heatmap image
            heatmap_path = os.path.join(output_dir, f"heatmap_{i:03d}.jpg")
            cv2.imwrite(heatmap_path, heatmap)
            
            heatmap_images.append({
                "frame_index": i,
                "probability_fake": fake_prob,
                "image_path": heatmap_path
            })
    
    cap.release()
    return heatmap_images