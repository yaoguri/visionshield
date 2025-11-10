import React, { useState, useEffect, useRef } from 'react';

// Create a simple API client for the component
// Instead of importing from an external file
const apiClient = {
  async getFrameAnalysis(videoId) {
    try {
      const response = await fetch(`/api/frame-analysis/${videoId}`);
      return await response.json();
    } catch (error) {
      console.error('Frame Analysis Error:', error);
      throw error;
    }
  }
};

const FrameAnalysis = ({ videoId }) => {
  const [frameData, setFrameData] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Using the inline apiClient instead of instantiating an imported class
  
  // Load frame data when component mounts
  useEffect(() => {
    async function loadFrameData() {
      try {
        setLoading(true);
        const response = await apiClient.getFrameAnalysis(videoId);
        
        if (response.status === 'success') {
          setFrameData(response.frames);
          setLoading(false);
        } else {
          setError('Failed to load frame analysis data');
          setLoading(false);
        }
      } catch (err) {
        setError(`Error loading frame data: ${err.message}`);
        setLoading(false);
      }
    }
    
    if (videoId) {
      loadFrameData();
    }
  }, [videoId]);
  
  // Calculate frame positions when video loads
  useEffect(() => {
    if (!videoRef.current || !videoLoaded || frameData.length === 0) return;
    
    const video = videoRef.current;
    const duration = video.duration;
    
    // Map frames to video timestamps
    frameData.forEach((frame, index) => {
      frame.timestamp = (duration / frameData.length) * index;
    });
  }, [videoLoaded, frameData]);

  // Handle video playback and frame tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded || frameData.length === 0) return;

    const updateFrame = () => {
      const currentTime = video.currentTime;
      // Find the closest frame to current time
      const frameIndex = frameData.findIndex(
        (frame, index) => 
          currentTime >= frame.timestamp && 
          (index === frameData.length - 1 || currentTime < frameData[index + 1].timestamp)
      );
      
      if (frameIndex !== -1) {
        setCurrentFrame(frameIndex);
        drawHeatmap(frameIndex);
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateFrame);
      }
    };

    if (isPlaying) {
      video.play();
      animationRef.current = requestAnimationFrame(updateFrame);
    } else {
      video.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, videoLoaded, frameData]);

  // Draw heatmap on canvas
  const drawHeatmap = (frameIndex) => {
    if (!canvasRef.current || !frameData[frameIndex]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    // Make canvas match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get fake probability for current frame (0-1)
    const fakeProbability = frameData[frameIndex].probability_fake;
    
    // For demo purposes, create a simple heatmap effect
    // In a real implementation, this would use actual manipulation detection data
    if (fakeProbability > 0.4) {
      const intensity = Math.min(fakeProbability, 0.7); // Cap intensity for visibility
      
      // Draw the video frame first
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw colored overlay based on manipulation probability
      ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
      
      // Randomize the "manipulation area" for demo purposes
      // A real implementation would use actual detection data
      const centerX = canvas.width * (0.3 + Math.random() * 0.4);
      const centerY = canvas.height * (0.2 + Math.random() * 0.6);
      const radiusX = canvas.width * (0.1 + fakeProbability * 0.2);
      const radiusY = canvas.height * (0.1 + fakeProbability * 0.2);
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Add text annotation
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Manipulation Probability: ${(fakeProbability * 100).toFixed(1)}%`, 20, 30);
    } else {
      // Just draw the video frame for low probability frames
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };

  // Jump to specific frame
  const jumpToFrame = (index) => {
    if (!videoRef.current || frameData.length === 0) return;
    
    const timestamp = frameData[index].timestamp;
    videoRef.current.currentTime = timestamp;
    setCurrentFrame(index);
    drawHeatmap(index);
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-700">Frame-by-Frame Analysis</h3>
        <p className="text-sm text-gray-500">Explore how each frame of the video is analyzed for manipulation</p>
      </div>
      
      {/* Video player with overlay canvas */}
      <div className="relative bg-black">
        <video 
          ref={videoRef}
          src={`/api/video/${videoId}`}
          className="w-full"
          onLoadedMetadata={() => setVideoLoaded(true)}
          onEnded={() => setIsPlaying(false)}
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {/* Playback controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 flex items-center">
          <button 
            className="mr-3 h-8 w-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
              </svg>
            )}
          </button>
          
          <div className="text-sm font-medium mr-2">
            {videoLoaded && frameData[currentFrame] ? 
              formatTime(videoRef.current?.currentTime || 0) : '0:00'}
          </div>
          
          <div className="flex-1 mx-2">
            <div className="h-2 bg-gray-700 rounded relative">
              {frameData.map((frame, index) => (
                <div 
                  key={index}
                  className={`absolute h-2 w-1 rounded cursor-pointer ${
                    frame.probability_fake > 0.6 ? 'bg-red-500' : 
                    frame.probability_fake > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    left: `${(frame.timestamp / (videoRef.current?.duration || 1)) * 100}%` 
                  }}
                  onClick={() => jumpToFrame(index)}
                ></div>
              ))}
              <div 
                className="absolute h-3 w-3 bg-white rounded-full top-1/2 transform -translate-y-1/2"
                style={{ 
                  left: `${videoLoaded ? 
                    (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-sm font-medium ml-2">
            {videoLoaded ? formatTime(videoRef.current?.duration || 0) : '0:00'}
          </div>
        </div>
      </div>
      
      {/* Frame analysis information */}
      <div className="p-4">
        <div className="flex justify-between mb-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Current Frame:</span>
            <span className="ml-2 text-sm font-bold">{currentFrame + 1}/{frameData.length}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Manipulation Probability:</span>
            <span className={`ml-2 text-sm font-bold ${
              frameData[currentFrame]?.probability_fake > 0.6 ? 'text-red-500' : 
              frameData[currentFrame]?.probability_fake > 0.4 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {frameData[currentFrame] ? 
                `${(frameData[currentFrame].probability_fake * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>
        
        {/* Frame thumbnails */}
        <div className="mt-4 overflow-x-auto whitespace-nowrap pb-2">
          <div className="inline-flex space-x-2">
            {frameData.map((frame, index) => (
              <div 
                key={index} 
                className={`w-16 h-10 relative rounded overflow-hidden cursor-pointer border-2 ${
                  currentFrame === index ? 'border-purple-600' : 'border-transparent'
                }`}
                onClick={() => jumpToFrame(index)}
              >
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity"></div>
                <div 
                  className={`absolute top-0 right-0 w-full h-1 ${
                    frame.probability_fake > 0.6 ? 'bg-red-500' : 
                    frame.probability_fake > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                ></div>
                <div className="text-xs font-bold text-white absolute bottom-0 right-0 bg-black bg-opacity-50 px-1">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameAnalysis;