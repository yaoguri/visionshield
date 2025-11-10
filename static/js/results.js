/**
 * VisionShield Results Page JavaScript - UPDATED VERSION
 * Includes: Video preview fix, feedback system, new analysis button, removed dashboard references
 */

// DOM Elements
const videoPreview = document.getElementById('videoPreview');
const videoTitle = document.getElementById('videoTitle');
const videoFilename = document.getElementById('videoFilename');
const videoDuration = document.getElementById('videoDuration');
const videoResolution = document.getElementById('videoResolution');
const analysisDate = document.getElementById('analysisDate');
const videoId = document.getElementById('videoId');

// Result Elements
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultText = document.getElementById('resultText');
const confidenceText = document.getElementById('confidenceText');
const analysisInfo = document.getElementById('analysisInfo');

// Probability Elements
const realBar = document.getElementById('realBar');
const fakeBar = document.getElementById('fakeBar');
const realProb = document.getElementById('realProb');
const fakeProb = document.getElementById('fakeProb');

// Metrics Elements
const peakProb = document.getElementById('peakProb');
const avgProb = document.getElementById('avgProb');
const suspiciousFrames = document.getElementById('suspiciousFrames');
const processingTime = document.getElementById('processingTime');

// Processing Elements
const framesAnalyzed = document.getElementById('framesAnalyzed');
const frameRate = document.getElementById('frameRate');
const modelInfo = document.getElementById('modelInfo');

// Tab Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Frame Analysis Container
const frameAnalysisContainer = document.getElementById('frame-analysis-container');

// Heatmap Container
const heatmapContainer = document.getElementById('heatmap-container');

// Technical Info
const technicalInfo = document.getElementById('technicalInfo');

// Action Buttons
const downloadReportBtn = document.getElementById('downloadReportBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const shareBtn = document.getElementById('shareBtn');
const helpBtn = document.getElementById('helpBtn');

// Modals
const helpModal = document.getElementById('helpModal');
const closeModalBtns = document.querySelectorAll('.closeModal');

// Global state
let currentVideoId = null;
let isDownloadingPDF = false;

/**
 * Initialize results page with video ID
 */
async function initializeResults(videoId) {
    console.log("Initializing results page for video:", videoId);
    currentVideoId = videoId;
    
    // Setup tab navigation
    setupTabs();
    
    // Setup modals
    setupModals();
    
    // Setup action buttons
    setupActionButtons();
    
    // Setup feedback handlers
    initializeFeedbackHandlers();
    
    // Load analysis results
    await loadAnalysisResults(videoId);
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Show corresponding content
            const tabName = tab.getAttribute('data-tab');
            const content = document.getElementById(`${tabName}-tab`);
            if (content) {
                content.classList.remove('hidden');
            }
        });
    });
}

/**
 * Setup modals
 */
function setupModals() {
    // Close modal buttons
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
    });
    
    // Close modal on outside click
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });
    
    // Help button
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            helpModal.classList.remove('hidden');
        });
    }
}

/**
 * Setup action buttons
 */
function setupActionButtons() {
    // Download PDF Report
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', downloadPDFReport);
    }
    
    // New Analysis Button - FIXED
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', resetAnalysis);
    }
    
    // Share Button
    if (shareBtn) {
        shareBtn.addEventListener('click', shareResults);
    }
}

/**
 * Set loading state
 */
function setLoadingState() {
    if (resultText) resultText.textContent = 'Analyzing...';
    if (confidenceText) confidenceText.textContent = 'Please wait';
    if (analysisInfo) analysisInfo.textContent = "Processing video using VisionShield's CNN-RNN detection model.";
}

/**
 * Load and display video preview - NEW FUNCTION
 */
function loadVideoPreview(videoId) {
    const videoElement = document.getElementById('videoPreview');
    const videoUrl = `/api/video/${videoId}`;
    
    if (videoElement) {
        videoElement.src = videoUrl;
        videoElement.load();
        
        // Handle video load errors
        videoElement.onerror = function() {
            console.error('Failed to load video');
            videoElement.parentElement.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-800 text-white"><i class="fas fa-exclamation-circle mr-2"></i>Video preview unavailable</div>';
        };
    }
}

/**
 * Load analysis results - FIXED with better error handling
 */
async function loadAnalysisResults(videoId) {
    try {
        setLoadingState();
        
        console.log("Fetching results for video ID:", videoId);
        
        // Check if API client exists
        if (!window.apiClient) {
            throw new Error('API client not initialized');
        }
        
        // Fetch results from API with timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000)
        );
        
        const responsePromise = window.apiClient.getAnalysisResults(videoId);
        const response = await Promise.race([responsePromise, timeoutPromise]);
        
        console.log("Got API response:", response);
        
        if (response && response.status === 'success' && response.result) {
            // Update UI with real results
            updateResultsUI(response.result);
            
            // Load frame analysis
            await loadFrameAnalysis(videoId);
            
            // Load heatmap
            await loadHeatmap(videoId);
            
            // Update technical info
            updateTechnicalInfo(response.result);
            
            // Load video preview - NEW
            loadVideoPreview(videoId);
        } else {
            const errorMsg = response?.message || 'Failed to load analysis results';
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error loading analysis results:', error);
        
        // Show user-friendly error
        showError(error.message || 'An error occurred while loading the analysis results.');
    }
}

/**
 * Update results UI
 */
function updateResultsUI(result) {
    console.log("Updating UI with result:", result);
    
    // Update video info
    if (videoFilename) videoFilename.textContent = result.filename || 'Unknown';
    if (videoDuration) videoDuration.textContent = result.duration || 'N/A';
    if (videoResolution) videoResolution.textContent = result.resolution || 'N/A';
    if (analysisDate) {
        const date = new Date(result.timestamp);
        analysisDate.textContent = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    if (videoId) videoId.textContent = result.video_id || 'N/A';
    
    // Update result card
    const prediction = result.prediction;
    const confidence = (result.confidence * 100).toFixed(1);
    
    if (resultCard) {
        if (prediction === 'Real') {
            resultCard.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (prediction === 'Fake') {
            resultCard.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        } else {
            resultCard.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
            if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
        }
    }
    
    if (resultText) resultText.textContent = prediction || 'Unknown';
    if (confidenceText) confidenceText.textContent = `${confidence}% Confidence`;
    
    // Update analysis info
    if (analysisInfo) {
        if (prediction === 'Real') {
            analysisInfo.textContent = 'Our model has determined this video appears to be authentic.';
        } else if (prediction === 'Fake') {
            analysisInfo.textContent = 'Our model has detected signs of AI manipulation in this video.';
        } else {
            analysisInfo.textContent = 'Analysis complete. Review the details below.';
        }
    }
    
    // Update probabilities
    const probabilities = result.probabilities || { real: 0, fake: 0 };
    const realProbValue = (probabilities.real * 100).toFixed(1);
    const fakeProbValue = (probabilities.fake * 100).toFixed(1);
    
    if (realBar) realBar.style.width = `${realProbValue}%`;
    if (fakeBar) fakeBar.style.width = `${fakeProbValue}%`;
    if (realProb) realProb.textContent = `${realProbValue}%`;
    if (fakeProb) fakeProb.textContent = `${fakeProbValue}%`;
    
    // Update metrics
    if (peakProb) peakProb.textContent = `${(result.max_fake_probability * 100).toFixed(1)}%`;
    if (avgProb) avgProb.textContent = `${(result.avg_fake_probability * 100).toFixed(1)}%`;
    
    // Count suspicious frames (probability > 0.5)
    const frames = result.frame_analysis || [];
    const suspicious = frames.filter(f => f.probability_fake > 0.5).length;
    if (suspiciousFrames) suspiciousFrames.textContent = `${suspicious}/${frames.length}`;
    
    // Processing time (mock - would come from backend)
    if (processingTime) processingTime.textContent = '2.3s';
    
    // Update processing details
    if (framesAnalyzed) framesAnalyzed.textContent = result.frames_analyzed || 0;
    if (frameRate) frameRate.textContent = result.frame_rate || 'N/A';
}

/**
 * Load frame analysis
 */
async function loadFrameAnalysis(videoId) {
    try {
        console.log("Loading frame analysis for video:", videoId);
        const response = await window.apiClient.getFrameAnalysis(videoId);
        
        if (response && response.status === 'success') {
            displayFrameAnalysis(response.frames);
        } else {
            throw new Error(response?.message || 'Failed to load frame analysis');
        }
    } catch (error) {
        console.error('Error loading frame analysis:', error);
        if (frameAnalysisContainer) {
            frameAnalysisContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>Frame analysis unavailable</p>
                </div>
            `;
        }
    }
}

/**
 * Display frame analysis
 */
function displayFrameAnalysis(frames) {
    if (!frameAnalysisContainer || !frames || frames.length === 0) return;
    
    // Create chart data
    const labels = frames.map((f, i) => `Frame ${i + 1}`);
    const data = frames.map(f => (f.probability_fake * 100).toFixed(2));
    
    // Clear container
    frameAnalysisContainer.innerHTML = `
        <div class="mb-6">
            <canvas id="frameChart"></canvas>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" id="frameGrid">
        </div>
    `;
    
    // Create chart
    const ctx = document.getElementById('frameChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Manipulation Probability (%)',
                    data: data,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Manipulation Probability (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Probability: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Add frame grid
    const frameGrid = document.getElementById('frameGrid');
    if (frameGrid) {
        frames.forEach((frame, index) => {
            const probFake = frame.probability_fake;
            let colorClass = 'bg-green-100 border-green-400 text-green-700';
            
            if (probFake > 0.7) {
                colorClass = 'bg-red-100 border-red-400 text-red-700';
            } else if (probFake > 0.4) {
                colorClass = 'bg-yellow-100 border-yellow-400 text-yellow-700';
            }
            
            const frameDiv = document.createElement('div');
            frameDiv.className = `p-3 rounded border-2 ${colorClass} text-center cursor-pointer hover:shadow-lg transition`;
            frameDiv.innerHTML = `
                <div class="text-sm font-bold mb-1">Frame ${index + 1}</div>
                <div class="text-xs">${(probFake * 100).toFixed(1)}%</div>
            `;
            
            frameGrid.appendChild(frameDiv);
        });
    }
}

/**
 * Load heatmap
 */
async function loadHeatmap(videoId) {
    try {
        console.log("Loading heatmap for video:", videoId);
        const response = await window.apiClient.getManipulationHeatmap(videoId);
        
        if (response && response.status === 'success') {
            displayHeatmap(response.heatmap_images);
        } else {
            throw new Error(response?.message || 'Failed to load heatmap');
        }
    } catch (error) {
        console.error('Error loading heatmap:', error);
        if (heatmapContainer) {
            heatmapContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>Heatmap unavailable</p>
                </div>
            `;
        }
    }
}

/**
 * Display heatmap
 */
function displayHeatmap(heatmapImages) {
    if (!heatmapContainer || !heatmapImages || heatmapImages.length === 0) {
        heatmapContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No heatmap images available</p>
            </div>
        `;
        return;
    }
    
    heatmapContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${heatmapImages.map((img, index) => `
                <div class="bg-gray-50 rounded-lg p-4">
                    <img src="${img.image_data}" alt="Heatmap ${index + 1}" class="w-full rounded-lg mb-2">
                    <div class="text-sm text-gray-600">
                        <p><strong>Frame:</strong> ${img.frame_index}</p>
                        <p><strong>Probability:</strong> ${(img.probability_fake * 100).toFixed(1)}%</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Update technical info
 */
function updateTechnicalInfo(result) {
    if (technicalInfo) {
        technicalInfo.textContent = JSON.stringify(result, null, 2);
    }
}

/**
 * Show error message
 */
function showError(message) {
    if (resultCard) {
        resultCard.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
    
    if (resultText) resultText.textContent = 'Error';
    if (confidenceText) confidenceText.textContent = message;
    if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
    if (analysisInfo) analysisInfo.textContent = 'Please try again or contact support if the issue persists.';
}

/**
 * Download PDF Report - FIXED to prevent double downloads
 */
async function downloadPDFReport() {
    // Prevent multiple simultaneous downloads
    if (isDownloadingPDF) {
        console.log('PDF download already in progress');
        return;
    }
    
    const videoId = currentVideoId || new URLSearchParams(window.location.search).get('id');
    
    if (!videoId) {
        alert('Video ID not found. Cannot generate report.');
        return;
    }
    
    try {
        isDownloadingPDF = true;
        
        // Disable button and show loading state
        downloadReportBtn.disabled = true;
        const originalText = downloadReportBtn.innerHTML;
        downloadReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating PDF...';
        
        console.log('Downloading PDF report for video:', videoId);
        
        // Create download link
        const downloadUrl = `/api/download-report/${videoId}`;
        
        // Use fetch to check if the file exists first
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error('Failed to generate PDF report');
        }
        
        // Create a blob from the response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `VisionShield_Report_${videoId}.pdf`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
        
        console.log('PDF download initiated successfully');
        
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF report. Please try again.');
    } finally {
        // Re-enable button
        isDownloadingPDF = false;
        downloadReportBtn.disabled = false;
        downloadReportBtn.innerHTML = '<i class="fas fa-download mr-2"></i> Download Report';
    }
}

/**
 * Reset and start new analysis - FIXED
 */
function resetAnalysis() {
    // Clear any stored data
    if (window.localStorage) {
        localStorage.removeItem('current_video_id');
        localStorage.removeItem('last_analysis');
    }
    
    // Redirect to home page
    window.location.href = '/';
}

/**
 * Share results
 */
function shareResults() {
    const videoId = currentVideoId || new URLSearchParams(window.location.search).get('id');
    const shareUrl = `${window.location.origin}/results/${videoId}`;
    
    // Try to use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'VisionShield Analysis Results',
            text: 'Check out this deepfake detection analysis',
            url: shareUrl
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Results link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert(`Share this link: ${shareUrl}`);
        });
    }
}

/**
 * Submit user feedback - NEW FUNCTION
 */
async function submitFeedback(feedbackType, notes = '') {
    const videoId = currentVideoId || new URLSearchParams(window.location.search).get('id');
    
    if (!videoId) {
        showFeedbackError('Video ID not found');
        return;
    }
    
    try {
        const response = await fetch('/api/feedback/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_id: videoId,
                feedback_type: feedbackType,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showFeedbackSuccess();
            disableFeedbackButtons();
        } else {
            showFeedbackError(data.message || 'Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showFeedbackError('Network error. Please try again.');
    }
}

/**
 * Show feedback success message - NEW FUNCTION
 */
function showFeedbackSuccess() {
    const successDiv = document.getElementById('feedbackSuccess');
    const errorDiv = document.getElementById('feedbackError');
    
    if (successDiv) {
        successDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
    }
}

/**
 * Show feedback error message - NEW FUNCTION
 */
function showFeedbackError(message) {
    const errorDiv = document.getElementById('feedbackError');
    const errorMessage = document.getElementById('feedbackErrorMessage');
    const successDiv = document.getElementById('feedbackSuccess');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
        successDiv.classList.add('hidden');
    }
}

/**
 * Disable feedback buttons after submission - NEW FUNCTION
 */
function disableFeedbackButtons() {
    const buttons = ['feedbackCorrect', 'feedbackIncorrect', 'feedbackReport'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    });
}

/**
 * Initialize feedback button handlers - NEW FUNCTION
 */
function initializeFeedbackHandlers() {
    const correctBtn = document.getElementById('feedbackCorrect');
    const incorrectBtn = document.getElementById('feedbackIncorrect');
    const reportBtn = document.getElementById('feedbackReport');
    
    if (correctBtn) {
        correctBtn.addEventListener('click', () => {
            submitFeedback('correct');
        });
    }
    
    if (incorrectBtn) {
        incorrectBtn.addEventListener('click', () => {
            submitFeedback('incorrect');
        });
    }
    
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            const notes = prompt('Please describe the issue you encountered (optional):');
            submitFeedback('report', notes || '');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Results page loaded");
    
    // Get video ID from URL path
    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];
    
    console.log("Video ID from URL:", videoId);
    
    if (videoId && videoId !== 'results') {
        initializeResults(videoId);
    } else {
        // Try to get from query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const queryVideoId = urlParams.get('id');
        
        if (queryVideoId) {
            initializeResults(queryVideoId);
        } else {
            showError('No video ID provided');
        }
    }
});
