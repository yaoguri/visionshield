/**
 * PDF Export Module for VisionShield
 * Handles PDF report generation and download
 */

class PDFExporter {
  constructor(apiClient) {
    this.apiClient = apiClient || new VisionShieldAPI();
    this.baseUrl = '/api/pdf';
  }

  /**
   * Download PDF report for a video analysis
   * @param {string} videoId - The ID of the analyzed video
   * @returns {Promise} Download initiation
   */
  async downloadReport(videoId) {
    try {
      // Create a temporary link and trigger download
      const downloadUrl = `${this.baseUrl}/download/${videoId}`;
      
      // Open in new window/tab to trigger download
      window.location.href = downloadUrl;
      
      return { status: 'success', message: 'Download initiated' };
    } catch (error) {
      console.error('PDF Download Error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF report (without immediate download)
   * @param {string} videoId - The ID of the analyzed video
   * @returns {Promise} Generation result with PDF URL
   */
  async generateReport(videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/generate/${videoId}`);
      return await response.json();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }

  /**
   * Show loading indicator while generating PDF
   * @param {HTMLElement} button - The button element that triggered the action
   */
  showLoading(button) {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating PDF...';
  }

  /**
   * Hide loading indicator
   * @param {HTMLElement} button - The button element
   */
  hideLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message to display
   */
  showSuccess(message) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
    toast.innerHTML = `
      <i class="fas fa-check-circle mr-2"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  /**
   * Handle download button click
   * @param {string} videoId - The video ID
   * @param {HTMLElement} button - The button element (optional)
   */
  async handleDownloadClick(videoId, button = null) {
    try {
      if (button) {
        this.showLoading(button);
      }

      // Generate and download
      await this.downloadReport(videoId);
      
      // Show success message
      this.showSuccess('PDF report downloaded successfully!');
      
      if (button) {
        this.hideLoading(button);
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.showError('Failed to download PDF report. Please try again.');
      
      if (button) {
        this.hideLoading(button);
      }
    }
  }
}

// Make it available globally if needed
if (typeof window !== 'undefined') {
  window.PDFExporter = PDFExporter;
}
