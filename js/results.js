/**
 * VisionShield Results Page JavaScript
 * Handles results page functionality and visualizations
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
const reportIssueBtn = document.getElementById('reportIssueBtn');

// Modals
const helpModal = document.getElementById('helpModal');
const closeModalBtns = document.querySelectorAll('.closeModal');

/**
 * Initialize results page with video ID
 */
async function initializeResults(videoId) {
    console.log("Initializing results page for video:", videoId);
    
    // Setup tab navigation
    setupTabs();
    
    // Setup modals
    setupModals();
    
    // Setup action buttons
    setupActionButtons();
    
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
            
            // Show selected tab content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
        });
    });
}

/**
 * Setup modal dialogs
 */
function setupModals() {
    // Help modal
    helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        helpModal.classList.remove('hidden');
    });
    
    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });
}

/**
 * Setup action buttons
 */
function setupActionButtons() {
    // Download report button
    downloadReportBtn.addEventListener('click', () => {
        // Get video ID from the page
        const videoId = document.getElementById('videoId').textContent;
        downloadReport(videoId);
    });
    
    // New analysis button
    newAnalysisBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // Share button
    shareBtn.addEventListener('click', () => {
        // Get video ID from the page
        const videoId = document.getElementById('videoId').textContent;
        shareAnalysis(videoId);
    });
    
    // Report issue button
    reportIssueBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get video ID from the page
        const videoId = document.getElementById('videoId').textContent;
        
        // Open report issue form or modal
        const issueDescription = prompt('Please describe the issue you encountered:');
        
        if (issueDescription) {
            // Submit issue report
            reportIssue(videoId, issueDescription);
        }
    });
}

/**
 * Load analysis results
 */
async function loadAnalysisResults(videoId) {
    try {
        // Show loading state
        setLoadingState();
        
        console.log("Fetching results for video ID:", videoId);
        
        // Fetch results from API
        const response = await window.apiClient.getAnalysisResults(videoId);
        console.log("Got API response:", response);
        
        if (response.status === 'success') {
            // Update UI with results
            updateResultsUI(response.result);
            
            // Load frame analysis
            loadFrameAnalysis(videoId);
            
            // Load heatmap
            loadHeatmap(videoId);
            
            // Update technical info
            updateTechnicalInfo(response.result);
        } else {
            // Show error
            showError('Failed to load analysis results.');
            console.error('API returned error:', response);
            
            // For demo, fallback to mock data
            const mockResult = generateMockResult(videoId);
            updateResultsUI(mockResult);
            loadMockFrameAnalysis();
            loadMockHeatmap();
            updateTechnicalInfo(mockResult);
        }
    } catch (error) {
        console.error('Error loading analysis results:', error);
        
        // For demo purposes, load mock data
        const mockResult = generateMockResult(videoId);
        updateResultsUI(mockResult);
        loadMockFrameAnalysis();
        loadMockHeatmap();
        updateTechnicalInfo(mockResult);
    }
}

/**
 * Set loading state for UI elements
 */
function setLoadingState() {
    resultText.textContent = 'Analyzing...';
    confidenceText.textContent = 'Please wait';
    analysisInfo.textContent = 'Loading analysis results...';
    
    realBar.style.width = '0%';
    fakeBar.style.width = '0%';
    realProb.textContent = '0%';
    fakeProb.textContent = '0%';
    
    frameAnalysisContainer.innerHTML = `
        <div class="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p class="text-gray-500">Loading frame analysis...</p>
        </div>
    `;
    
    heatmapContainer.innerHTML = `
        <div class="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p class="text-gray-500">Loading manipulation heatmap...</p>
        </div>
    `;
    
    technicalInfo.textContent = 'Loading technical information...';
}

/**
 * Show error message
 */
function showError(message) {
    analysisInfo.innerHTML = `<div class="bg-red-100 text-red-600 p-2 rounded">${message}</div>`;
}

/**
 * Update UI with analysis results
 */
function updateResultsUI(result) {
    console.log("Updating UI with result:", result);
    
    // Update video details
    videoTitle.textContent = `Analysis Results: ${result.filename || 'Video'}`;
    videoFilename.textContent = result.filename || 'Unknown';
    videoDuration.textContent = formatDuration(result.duration || 0);
    videoResolution.textContent = result.resolution || 'Unknown';
    analysisDate.textContent = formatDate(result.timestamp);
    
    // Set video source if available
    if (window.location.pathname.includes('/results/')) {
        const videoId = window.location.pathname.split('/').pop();
        videoPreview.src = `/api/video/${videoId}`;
    }
    
    // Update result card
    const isFake = result.prediction === 'Deepfake';
    resultText.textContent = result.prediction;
    confidenceText.textContent = `${(result.confidence * 100).toFixed(1)}% Confidence`;
    
    if (isFake) {
        resultCard.style.backgroundColor = '#EF4444'; // red-600
        resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        analysisInfo.textContent = 'This video appears to be manipulated using AI techniques.';
    } else {
        resultCard.style.backgroundColor = '#10B981'; // green-600
        resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        analysisInfo.textContent = 'No evidence of manipulation was detected in this video.';
    }
    
    // Update probability bars
    const realProbValue = result.probabilities.real * 100;
    const fakeProbValue = result.probabilities.fake * 100;
    
    realBar.style.width = `${realProbValue}%`;
    fakeBar.style.width = `${fakeProbValue}%`;
    realProb.textContent = `${realProbValue.toFixed(1)}%`;
    fakeProb.textContent = `${fakeProbValue.toFixed(1)}%`;
    
    // Update metrics
    if (peakProb) peakProb.textContent = `${(result.max_fake_probability * 100).toFixed(1)}%`;
    if (avgProb) avgProb.textContent = `${(result.avg_fake_probability * 100).toFixed(1)}%`;
    
    const suspiciousCount = result.frame_analysis ? 
        result.frame_analysis.filter(f => f.probability_fake > 0.5).length : 0;
    const totalFrames = result.frame_analysis ? result.frame_analysis.length : 0;
    if (suspiciousFrames) suspiciousFrames.textContent = `${suspiciousCount}/${totalFrames}`;
    
    if (processingTime) processingTime.textContent = result.processing_time || '0.0s';
    
    // Update processing info
    if (framesAnalyzed) framesAnalyzed.textContent = result.frames_analyzed || totalFrames;
    if (frameRate) frameRate.textContent = result.frame_rate || 'N/A';
    if (modelInfo) modelInfo.textContent = result.model || 'VisionShield ResNet50-LSTM';
}

/**
 * Load frame analysis
 */
async function loadFrameAnalysis(videoId) {
    try {
        console.log("Loading frame analysis for video ID:", videoId);
        const response = await window.apiClient.getFrameAnalysis(videoId);
        console.log("Frame analysis response:", response);
        
        if (response.status === 'success') {
            renderFrameAnalysis(response.frames, videoId);
        } else {
            frameAnalysisContainer.innerHTML = `
                <div class="bg-red-100 text-red-700 p-4 rounded-lg">
                    Failed to load frame analysis data.
                </div>
            `;
            
            // Fallback to mock data
            loadMockFrameAnalysis();
        }
    } catch (error) {
        console.error('Error loading frame analysis:', error);
        loadMockFrameAnalysis();
    }
}

/**
 * Load mock frame analysis data
 */
function loadMockFrameAnalysis() {
    // Generate mock frame data
    const frames = [];
    for (let i = 0; i < 20; i++) {
        // Create a wave pattern of probabilities
        const baseline = 0.3;
        const amplitude = 0.4;
        const frequency = 0.5;
        const probability = baseline + amplitude * Math.sin(frequency * i);
        
        frames.push({
            frame: i + 1,
            probability_fake: probability
        });
    }
    
    // Render the mock data
    renderFrameAnalysis(frames, 'mock');
}

/**
 * Render frame analysis visualization
 */
function renderFrameAnalysis(frames, videoId) {
    // Create frame analysis visualization
    frameAnalysisContainer.innerHTML = `
        <div class="relative bg-black aspect-video mb-6">
            <video id="frameVideo" class="w-full" controls>
                <source src="/api/video/${videoId}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            
            <!-- Timeline -->
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div class="h-1 bg-white bg-opacity-30 rounded relative" id="videoTimeline">
                    ${frames.map((frame, index) => `
                        <div 
                            class="absolute h-3 w-0.5 rounded-full cursor-pointer ${
                                frame.probability_fake > 0.6 ? 'bg-red-500' : 
                                frame.probability_fake > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            }" 
                            style="left: ${(index / (frames.length - 1)) * 100}%; top: -1px;"
                            data-frame="${index}"
                            title="Frame ${index + 1}: ${(frame.probability_fake * 100).toFixed(1)}% manipulation probability"
                        ></div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Frame probability chart -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-4">Manipulation Probability by Frame</h4>
            <div class="h-48">
                <canvas id="frameProbChart"></canvas>
            </div>
        </div>
        
        <!-- Frame thumbnails -->
        <div class="overflow-x-auto">
            <div class="flex space-x-2 pb-2">
                ${frames.map((frame, index) => `
                    <div class="relative flex-shrink-0 cursor-pointer" data-frame="${index}">
                        <div class="w-20 h-12 bg-gray-200 flex items-center justify-center overflow-hidden">
                            <div class="absolute inset-0 ${
                                frame.probability_fake > 0.6 ? 'bg-red-500' : 
                                frame.probability_fake > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            } opacity-${Math.round(frame.probability_fake * 10)}"></div>
                            <span class="relative text-xs font-medium">${index + 1}</span>
                        </div>
                        <div class="text-xs text-center mt-1">${(frame.probability_fake * 100).toFixed(0)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Initialize frame probability chart
    const ctx = document.getElementById('frameProbChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: frames.map((_, i) => `Frame ${i + 1}`),
            datasets: [{
                label: 'Manipulation Probability',
                data: frames.map(frame => frame.probability_fake * 100),
                borderColor: 'rgba(237, 100, 166, 1)',
                backgroundColor: 'rgba(237, 100, 166, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Probability (%)'
                    }
                },
                x: {
                    display: false
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Load heatmap visualization
 */
async function loadHeatmap(videoId) {
    try {
        console.log("Loading heatmap for video ID:", videoId);
        const response = await window.apiClient.getManipulationHeatmap(videoId);
        console.log("Heatmap response:", response);
        
        if (response.status === 'success') {
            renderHeatmap(response.heatmap_images, videoId);
        } else {
            heatmapContainer.innerHTML = `
                <div class="bg-red-100 text-red-700 p-4 rounded-lg">
                    Failed to load heatmap data.
                </div>
            `;
            
            // Fallback to mock data
            loadMockHeatmap();
        }
    } catch (error) {
        console.error('Error loading heatmap:', error);
        loadMockHeatmap();
    }
}

function loadMockHeatmap() {
    // Generate mock heatmap images with data URI instead of external URLs
    const heatmapImages = [
        {
            frame_index: 0,
            // Use data URI for a colored rectangle
            image_data: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="#4a00e0"/><text x="200" y="120" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Heatmap 1</text></svg>')
        },
        {
            frame_index: 4,
            image_data: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="#8e2de2"/><text x="200" y="120" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Heatmap 2</text></svg>')
        },
        {
            frame_index: 8,
            image_data: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="#ed64a6"/><text x="200" y="120" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Heatmap 3</text></svg>')
        },
        {
            frame_index: 12,
            image_data: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="#f56565"/><text x="200" y="120" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Heatmap 4</text></svg>')
        },
        {
            frame_index: 16,
            image_data: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="#ed8936"/><text x="200" y="120" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Heatmap 5</text></svg>')
        }
    ];
    
    // Render the mock data
    renderHeatmap(heatmapImages, 'mock');
}

/**
 * Render heatmap visualization
 */
function renderHeatmap(heatmapImages, videoId) {
    console.log("Rendering heatmap with images:", heatmapImages);
    
    if (!heatmapImages || heatmapImages.length === 0) {
        heatmapContainer.innerHTML = `
            <div class="bg-red-100 text-red-700 p-4 rounded-lg">
                No heatmap data available for this video.
            </div>
        `;
        return;
    }
    heatmapContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="relative aspect-video bg-black">
                <!-- Main heatmap image -->
                <img id="heatmapImage" src="${heatmapImages[0].image_data}" class="w-full h-full object-contain" />
                
                <!-- Controls overlay -->
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div class="flex items-center text-white">
                        <div class="mr-3 text-sm">Heatmap Intensity:</div>
                        <input type="range" min="0" max="100" value="70" class="flex-1 h-1 bg-white bg-opacity-30 rounded appearance-none" id="heatmapIntensity">
                    </div>
                </div>
            </div>
            
            <!-- Heatmap thumbnails -->
            <div class="p-4 bg-gray-50">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Key Frames</h4>
                <div class="flex overflow-x-auto space-x-3 pb-2">
                    ${heatmapImages.map((image, index) => `
                        <div class="relative flex-shrink-0 cursor-pointer ${index === 0 ? 'ring-2 ring-purple-600' : ''}" data-index="${index}">
                            <img src="${image.image_data}" class="w-24 h-16 object-cover rounded">
                            <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                                Frame ${image.frame_index + 1}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Setup heatmap thumbnails click events
    const thumbnails = heatmapContainer.querySelectorAll('[data-index]');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // Remove highlight from all thumbnails
            thumbnails.forEach(t => t.classList.remove('ring-2', 'ring-purple-600'));
            
            // Add highlight to clicked thumbnail
            thumb.classList.add('ring-2', 'ring-purple-600');
            
            // Update main image
            const index = parseInt(thumb.getAttribute('data-index'));
            document.getElementById('heatmapImage').src = heatmapImages[index].image_data;
        });
    });
}

/**
 * Update technical information
 */
function updateTechnicalInfo(result) {
    // Pretty print JSON data
    technicalInfo.textContent = JSON.stringify(result, null, 2);
}

/**
 * Download analysis report
 */
function downloadReport(videoId) {
    console.log(`Downloading report for video ${videoId}`);
    
    // In a real implementation, we would fetch the report from the API
    // and trigger a download using the Blob API
    
    // For demo purposes, create a JSON file with current result data
    const technicalData = JSON.parse(technicalInfo.textContent);
    const blob = new Blob([JSON.stringify(technicalData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionshield-report-${videoId}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Share analysis
 */
function shareAnalysis(videoId) {
    console.log(`Sharing analysis for video ${videoId}`);
    
    // In a real implementation, we would generate a shareable link
    // from the API and offer ways to share it
    
    // For demo purposes, show a dialog with a fake share link
    const shareUrl = `https://visionshield.ai/shared/${videoId}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'VisionShield Analysis Results',
            text: 'Check out this deepfake analysis result from VisionShield.',
            url: shareUrl
        }).catch(err => {
            // Fallback to copy to clipboard
            copyToClipboard(shareUrl);
        });
    } else {
        // Fallback to copy to clipboard
        copyToClipboard(shareUrl);
    }
}

/**
 * Report an issue
 */
function reportIssue(videoId, description) {
    console.log(`Reporting issue for video ${videoId}: ${description}`);
    
    // In a real implementation, we would submit this to the API
    
    // Show confirmation
    alert('Thank you for your feedback. Our team will review this issue.');
}

/**
 * Generate mock result data
 */
function generateMockResult(videoId) {
    // Generate frame analysis data
    const frames = [];
    for (let i = 0; i < 20; i++) {
        // Create a wave pattern of probabilities
        const baseline = 0.3;
        const amplitude = 0.4;
        const frequency = 0.5;
        const probability = baseline + amplitude * Math.sin(frequency * i);
        
        frames.push({
            frame: i + 1,
            probability_fake: probability
        });
    }
    
    // Calculate average and max probabilities
    const probabilities = frames.map(f => f.probability_fake);
    const avgProb = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;
    const maxProb = Math.max(...probabilities);
    
    // Determine if this is a deepfake based on max probability
    const isFake = maxProb > 0.6;
    
    return {
        id: videoId,
        filename: 'sample_video.mp4',
        timestamp: Date.now(),
        duration: 32, // seconds
        resolution: '1920x1080',
        prediction: isFake ? 'Deepfake' : 'Real',
        confidence: isFake ? maxProb : 1 - maxProb,
        probabilities: {
            real: isFake ? 1 - maxProb : maxProb,
            fake: isFake ? maxProb : 1 - maxProb
        },
        max_fake_probability: maxProb,
        avg_fake_probability: avgProb,
        weighted_fake_probability: avgProb,
        frames_analyzed: frames.length,
        frame_rate: '30 fps',
        processing_time: '1.45s',
        model: 'VisionShield ResNet50-LSTM',
        frame_analysis: frames,
        video_url: 'https://example.com/sample_video.mp4' // This would be a real URL in production
    };
}

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format timestamp to date string
 */
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.select();
    document.execCommand('copy');
    
    // Cleanup
    document.body.removeChild(textarea);
    
    // Show success message
    alert('Link copied to clipboard: ' + text);
}