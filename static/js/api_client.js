/**
 * VisionShield API Client
 * A JavaScript module to communicate with the VisionShield backend API
 */

class VisionShieldAPI {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('visionshield_token') || null;
  }

  /**
   * Check API health status
   * @returns {Promise} Health check response
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('API Health Check Error:', error);
      throw error;
    }
  }

  /**
   * Upload and analyze video
   * @param {File} videoFile - The video file to analyze
   * @param {Function} progressCallback - Callback for upload progress
   * @returns {Promise} Analysis results
   */
  async analyzeVideo(videoFile, progressCallback = null) {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      // Create request with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Create a promise to handle the XHR request
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open('POST', `${this.baseUrl}/analyze`);
        
        // Set auth token if available
        if (this.token) {
          xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
        }
        
        // Track upload progress
        if (progressCallback) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              progressCallback(progress, 'uploading');
            }
          });
        }
        
        // Handle response
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject({
              status: xhr.status,
              message: xhr.statusText
            });
          }
        };
        
        // Handle network errors
        xhr.onerror = function() {
          reject({
            status: 0,
            message: 'Network error occurred'
          });
        };
        
        // Send the request
        xhr.send(formData);
      });

      // Simulate processing state for UX after upload completes
      const result = await uploadPromise;
      
      if (progressCallback) {
        // Simulate processing state (50% - 100%)
        let processingProgress = 50;
        const processingInterval = setInterval(() => {
          processingProgress += Math.random() * 5;
          if (processingProgress >= 100) {
            processingProgress = 100;
            clearInterval(processingInterval);
          }
          progressCallback(processingProgress, 'processing');
        }, 300);
        
        // Clear interval after 3 seconds (if not already cleared)
        setTimeout(() => {
          clearInterval(processingInterval);
          progressCallback(100, 'complete');
        }, 3000);
      }
      
      return result;
    } catch (error) {
      console.error('Video Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Get analysis results
   * @param {string} videoId - The ID of the analyzed video
   * @returns {Promise} Analysis results
   */
  async getAnalysisResults(videoId) {
    console.log("API Client - Getting results for video ID:", videoId);
    console.log("API Client - Full URL:", `${this.baseUrl}/results/${videoId}`);
    
    try {
        const response = await fetch(`${this.baseUrl}/results/${videoId}`, {
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
        });
        
        console.log("API Client - Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Results Fetch Error:', error);
        throw error;
    }
  }

  /**
   * Get frame-by-frame analysis for a video
   * @param {string} videoId - The ID of the analyzed video
   * @returns {Promise} Frame analysis data
   */
  async getFrameAnalysis(videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/frame-analysis/${videoId}`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      return await response.json();
    } catch (error) {
      console.error('Frame Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Generate manipulation heatmap for a video
   * @param {string} videoId - The ID of the analyzed video
   * @returns {Promise} Heatmap data
   */
  async getManipulationHeatmap(videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/heatmap/${videoId}`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      return await response.json();
    } catch (error) {
      console.error('Heatmap Generation Error:', error);
      throw error;
    }
  }
}