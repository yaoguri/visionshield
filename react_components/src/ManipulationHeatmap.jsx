import React, { useState, useEffect, useRef } from 'react';

const ManipulationHeatmap = ({ videoData, heatmapData }) => {
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Prepare frame data with timestamps
  const frames = heatmapData?.frames || [];
  
  useEffect(() => {
    // Stop animation when component unmounts
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Effect for handling video playback and heatmap sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video || frames.length === 0) return;
    
    const updateHeatmap = () => {
      // Find current frame based on video time
      const currentTime = video.currentTime;
      const frameDuration = video.duration / frames.length;
      const currentFrameIndex = Math.min(
        Math.floor(currentTime / frameDuration),
        frames.length - 1
      );
      
      setActiveFrameIndex(currentFrameIndex);
      
      // Draw heatmap
      drawHeatmap(currentFrameIndex);
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateHeatmap);
      }
    };
    
    if (isPlaying) {
      video.play();
      animationRef.current = requestAnimationFrame(updateHeatmap);
    } else {
      video.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isPlaying, frames]);
  
  // Draw heatmap overlay on canvas
  const drawHeatmap = (frameIndex) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !frames[frameIndex]) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get manipulation data for this frame
    const frameData = frames[frameIndex];
    const manipulationScore = frameData.probability_fake || 0;
    
    // Only draw heatmap if manipulation score is high enough
    if (manipulationScore > 0.3) {
      // Create gradient for heatmap (red for highest probability areas)
      const intensity = Math.min(manipulationScore, 0.8) * heatmapOpacity;
      
      // Create radial gradient
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, canvas.width / 2
      );
      
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
      gradient.addColorStop(0.7, `rgba(255, 165, 0, ${intensity * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text indicator
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Manipulation Probability: ${(manipulationScore * 100).toFixed(1)}%`, 20, 30);
    }
  };
  
  // Handle frame selection
  const selectFrame = (index) => {
    if (!videoRef.current) return;
    
    setActiveFrameIndex(index);
    
    // Calculate timestamp for this frame
    const video = videoRef.current;
    const frameDuration = video.duration / frames.length;
    const timestamp = frameDuration * index;
    
    // Seek to timestamp
    video.currentTime = timestamp;
    
    // Draw heatmap
    drawHeatmap(index);
  };
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Manipulation Heatmap</h2>
        <p className="text-sm text-gray-600">
          Visualizing areas of potential manipulation in the video.
        </p>
      </div>
      
      {/* Video with heatmap overlay */}
      <div className="relative bg-black aspect-video">
        {videoData?.url ? (
          <>
            <video 
              ref={videoRef}
              className="w-full h-full"
              src={videoData.url}
              onLoadedMetadata={() => drawHeatmap(activeFrameIndex)}
              onEnded={() => setIsPlaying(false)}
            />
            <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            
            {/* Video controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center text-white">
                <button 
                  className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 hover:bg-opacity-30"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <div className="flex-1 mx-2">
                  <div className="h-1 bg-white bg-opacity-30 rounded relative">
                    <div 
                      className="absolute h-1 bg-purple-600 rounded"
                      style={{ width: `${(activeFrameIndex / (frames.length - 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-sm">
                  {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'} / 
                  {videoRef.current ? formatTime(videoRef.current.duration) : '0:00'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>No video available</p>
          </div>
        )}
      </div>
      
      {/* Heatmap controls */}
      <div className="p-4 border-t border-b">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-3">Heatmap Intensity:</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={heatmapOpacity} 
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-600">{Math.round(heatmapOpacity * 100)}%</span>
        </div>
      </div>
      
      {/* Frame thumbnails */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Key Frames</h3>
        <div className="flex overflow-x-auto pb-2 space-x-2">
          {frames.map((frame, index) => (
            <div 
              key={index}
              className={`relative cursor-pointer flex-shrink-0 ${
                activeFrameIndex === index ? 'ring-2 ring-purple-600' : ''
              }`}
              onClick={() => selectFrame(index)}
            >
              <div className="w-20 h-12 bg-gray-200 flex items-center justify-center overflow-hidden">
                {/* Frame thumbnail would ideally be here */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-b ${
                    frame.probability_fake > 0.6 ? 'from-red-500' : 
                    frame.probability_fake > 0.4 ? 'from-yellow-500' : 'from-green-500'
                  } to-transparent opacity-30`}
                ></div>
                <span className="text-xs text-gray-800 z-10">{index + 1}</span>
              </div>
              <div 
                className={`h-1 ${
                  frame.probability_fake > 0.6 ? 'bg-red-500' : 
                  frame.probability_fake > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              ></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Additional insights */}
      <div className="p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Analysis Insights</h3>
        <div className="text-sm text-gray-600">
          <p>
            This heatmap visualizes potential manipulated areas in the video. Red regions indicate 
            higher probability of manipulation based on our AI detection model.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Peak Manipulation</div>
              <div className="font-bold text-lg text-gray-800">
                {Math.max(...frames.map(f => f.probability_fake || 0)) > 0 
                  ? `${(Math.max(...frames.map(f => f.probability_fake || 0)) * 100).toFixed(1)}%` 
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Suspicious Frames</div>
              <div className="font-bold text-lg text-gray-800">
                {frames.filter(f => (f.probability_fake || 0) > 0.5).length} of {frames.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManipulationHeatmap;