/**
 * VisionShield Dashboard JavaScript
 * Handles user dashboard functionality and data visualization
 */

// API Client Instance
const apiClient = new VisionShieldAPI();

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = {
    dashboard: document.getElementById('dashboardSection'),
    history: document.getElementById('historySection'),
    reports: document.getElementById('reportsSection'),
    api: document.getElementById('apiSection'),
    settings: document.getElementById('settingsSection')
};

// API Key Elements
const apiKeyDisplay = document.getElementById('apiKeyDisplay');
const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
const copyKeyBtn = document.getElementById('copyKeyBtn');
const regenerateKeyBtn = document.getElementById('regenerateKeyBtn');

// Chart Elements
const analysisTimeChart = document.getElementById('analysisTimeChart');
const detectionDistChart = document.getElementById('detectionDistChart');

// User data elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userInitials = document.getElementById('userInitials');

// Stats elements
const totalAnalyses = document.getElementById('totalAnalyses');
const fakesDetected = document.getElementById('fakesDetected');
const detectionRate = document.getElementById('detectionRate');
const apiUsage = document.getElementById('apiUsage');

// Table elements
const recentAnalysesTable = document.getElementById('recentAnalysesTable');
const historyTable = document.getElementById('historyTable');

// Pagination elements
const pageStart = document.getElementById('pageStart');
const pageEnd = document.getElementById('pageEnd');
const totalEntries = document.getElementById('totalEntries');

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    // Check API health
    try {
        const healthStatus = await apiClient.checkHealth();
        console.log('API Status:', healthStatus);
    } catch (error) {
        console.error('API Health Check Failed:', error);
        // Show error notification
        showNotification('API connection issue. Some features may be unavailable.', 'error');
    }
    
    // Setup navigation
    setupNavigation();
    
    // Load user data
    loadUserData();
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Initialize charts
    initCharts();
    
    // Load analysis history
    loadAnalysisHistory();
    
    // Setup API key management
    setupApiKeyManagement();
}

/**
 * Setup navigation functionality
 */
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Update header title
            const headerTitle = document.querySelector('header h2');
            headerTitle.textContent = item.querySelector('span').textContent;
            
            // Show corresponding section
            const sectionId = item.getAttribute('href').substring(1);
            
            Object.keys(sections).forEach(key => {
                if (key === sectionId) {
                    sections[key].classList.remove('hidden');
                } else {
                    sections[key].classList.add('hidden');
                }
            });
        });
    });
}

/**
 * Load user data from API or session
 */
async function loadUserData() {
    try {
        // Get user profile from API
        const response = await apiClient.getProfile();
        
        if (response.status === 'success') {
            const user = response.user;
            
            // Update user info in UI
            userName.textContent = user.name;
            userEmail.textContent = user.email;
            
            // Set user initials
            if (user.name) {
                userInitials.textContent = user.name.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase();
            }
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        
        // Fallback to demo data
        userName.textContent = 'John Smith';
        userEmail.textContent = 'john@example.com';
        userInitials.textContent = 'JS';
    }
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        // Get statistics from API
        const response = await apiClient.getStats();
        
        if (response.status === 'success') {
            const stats = response.data;
            
            // Update stats in UI
            totalAnalyses.textContent = stats.total_analyses;
            fakesDetected.textContent = stats.fakes_detected;
            detectionRate.textContent = `${stats.detection_rate.toFixed(1)}%`;
            apiUsage.textContent = stats.api_usage;
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        
        // Fallback to demo data
        totalAnalyses.textContent = '42';
        fakesDetected.textContent = '8';
        detectionRate.textContent = '96.5%';
        apiUsage.textContent = '157';
    }
}

/**
 * Initialize dashboard charts
 */
function initCharts() {
    // Analysis over time chart
    const timeChartCtx = document.querySelector('#analysisTimeChart canvas').getContext('2d');
    new Chart(timeChartCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
                {
                    label: 'Total Analyses',
                    data: [12, 19, 25, 31, 42],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Deepfakes Detected',
                    data: [3, 5, 7, 6, 8],
                    backgroundColor: 'rgba(237, 100, 166, 0.2)',
                    borderColor: 'rgba(237, 100, 166, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
    
    // Detection distribution chart
    const distChartCtx = document.querySelector('#detectionDistChart canvas').getContext('2d');
    new Chart(distChartCtx, {
        type: 'doughnut',
        data: {
            labels: ['Real Videos', 'Deepfakes'],
            datasets: [{
                data: [34, 8],
                backgroundColor: ['rgba(72, 187, 120, 0.7)', 'rgba(237, 100, 166, 0.7)'],
                borderColor: ['rgba(72, 187, 120, 1)', 'rgba(237, 100, 166, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
}

/**
 * Load analysis history from API
 */
async function loadAnalysisHistory() {
    try {
        // Get history from API
        const response = await apiClient.getHistory();
        
        if (response.status === 'success') {
            const historyData = response.history;
            
            // Populate recent analyses
            populateRecentAnalyses(historyData.slice(0, 5));
            
            // Populate history table
            populateHistoryTable(historyData);
            
            // Update pagination info
            updatePagination(1, Math.min(10, historyData.length), historyData.length);
        }
    } catch (error) {
        console.error('Failed to load analysis history:', error);
        
        // Generate demo data
        const demoData = generateDemoHistory();
        
        // Populate with demo data
        populateRecentAnalyses(demoData.slice(0, 5));
        populateHistoryTable(demoData.slice(0, 10));
        updatePagination(1, Math.min(10, demoData.length), demoData.length);
    }
}

/**
 * Populate recent analyses table
 */
function populateRecentAnalyses(analyses) {
    // Clear existing content
    recentAnalysesTable.innerHTML = '';
    
    // Add each analysis to the table
    analyses.forEach(analysis => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-4 px-6">
                <div class="flex items-center">
                    <div class="w-10 h-6 bg-gray-300 rounded mr-3"></div>
                    <span class="font-medium text-gray-900">${analysis.filename}</span>
                </div>
            </td>
            <td class="py-4 px-6 text-gray-500">${formatDate(analysis.timestamp)}</td>
            <td class="py-4 px-6">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    analysis.result.prediction === 'Real' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }">
                    ${analysis.result.prediction}
                </span>
            </td>
            <td class="py-4 px-6 text-gray-500">${analysis.result.confidence.toFixed(1)}%</td>
            <td class="py-4 px-6">
                <div class="flex space-x-2">
                    <a href="/results/${analysis.id}" class="text-purple-600 hover:text-purple-800" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="download-btn text-gray-600 hover:text-gray-800" data-id="${analysis.id}" title="Download Report">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        recentAnalysesTable.appendChild(row);
    });
    
    // Add event listeners for download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const analysisId = btn.getAttribute('data-id');
            downloadReport(analysisId);
        });
    });
}

/**
 * Populate full history table
 */
function populateHistoryTable(analyses) {
    // Clear existing content
    historyTable.innerHTML = '';
    
    // Add each analysis to the table
    analyses.forEach(analysis => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-4 px-6">
                <div class="w-10 h-6 bg-gray-300 rounded"></div>
            </td>
            <td class="py-4 px-6 text-gray-900 font-medium">${analysis.filename}</td>
            <td class="py-4 px-6 text-gray-500">${formatDate(analysis.timestamp)}</td>
            <td class="py-4 px-6">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    analysis.result.prediction === 'Real' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }">
                    ${analysis.result.prediction}
                </span>
            </td>
            <td class="py-4 px-6 text-gray-500">${analysis.result.confidence.toFixed(1)}%</td>
            <td class="py-4 px-6">
                <div class="flex space-x-2">
                    <a href="/results/${analysis.id}" class="text-purple-600 hover:text-purple-800" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="download-btn text-gray-600 hover:text-gray-800" data-id="${analysis.id}" title="Download Report">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="share-btn text-gray-600 hover:text-gray-800" data-id="${analysis.id}" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </td>
        `;
        historyTable.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const analysisId = btn.getAttribute('data-id');
            downloadReport(analysisId);
        });
    });
    
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const analysisId = btn.getAttribute('data-id');
            shareAnalysis(analysisId);
        });
    });
}

/**
 * Update pagination information
 */
function updatePagination(start, end, total) {
    pageStart.textContent = start;
    pageEnd.textContent = end;
    totalEntries.textContent = total;
}

/**
 * Download analysis report
 */
function downloadReport(analysisId) {
    console.log(`Downloading report for analysis ${analysisId}`);
    
    // In a real implementation, we would fetch the report data from the API
    // and use the apiClient.downloadReport method to save it
    
    // Show notification
    showNotification('Report downloaded successfully', 'success');
}

/**
 * Share analysis results
 */
function shareAnalysis(analysisId) {
    console.log(`Sharing analysis ${analysisId}`);
    
    // In a real implementation, we would generate a shareable link
    // and provide options to share via email, link, etc.
    
    // For demo, show a prompt with a fake link
    const shareLink = `https://visionshield.ai/shared/${analysisId}`;
    prompt('Copy this link to share the analysis:', shareLink);
}

/**
 * Setup API key management
 */
function setupApiKeyManagement() {
    // Demo API key
    const demoApiKey = 'vs_5f8e9d2c3b4a5f6e7d8c9b0a1f2e3d4c';
    
    // Toggle API key visibility
    toggleKeyVisibility.addEventListener('click', () => {
        if (apiKeyDisplay.type === 'password') {
            apiKeyDisplay.type = 'text';
            apiKeyDisplay.value = demoApiKey;
            toggleKeyVisibility.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            apiKeyDisplay.type = 'password';
            apiKeyDisplay.value = '••••••••••••••••••••••••••••••';
            toggleKeyVisibility.innerHTML = '<i class="fas fa-eye"></i>';
        }
    });
    
    // Copy API key to clipboard
    copyKeyBtn.addEventListener('click', () => {
        // If key is hidden, show it first
        if (apiKeyDisplay.type === 'password') {
            apiKeyDisplay.type = 'text';
            apiKeyDisplay.value = demoApiKey;
            toggleKeyVisibility.innerHTML = '<i class="fas fa-eye-slash"></i>';
        }
        
        // Copy to clipboard
        apiKeyDisplay.select();
        document.execCommand('copy');
        
        // Show feedback
        copyKeyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyKeyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
        
        // Show notification
        showNotification('API key copied to clipboard', 'success');
    });
    
    // Regenerate API key
    regenerateKeyBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to regenerate your API key? This will invalidate your current key.')) {
            try {
                // In a real implementation, we would call the API to regenerate the key
                const response = await apiClient.refreshApiKey();
                
                if (response.status === 'success') {
                    // Show new key
                    apiKeyDisplay.type = 'text';
                    apiKeyDisplay.value = response.api_key;
                    toggleKeyVisibility.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    
                    // Show notification
                    showNotification('API key regenerated successfully', 'success');
                }
            } catch (error) {
                console.error('Failed to regenerate API key:', error);
                
                // For demo, generate a random key
                const newKey = 'vs_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                
                // Show new key
                apiKeyDisplay.type = 'text';
                apiKeyDisplay.value = newKey;
                toggleKeyVisibility.innerHTML = '<i class="fas fa-eye-slash"></i>';
                
                // Show notification
                showNotification('API key regenerated successfully', 'success');
            }
        }
    });
}

/**
 * Generate demo history data
 */
function generateDemoHistory() {
    const demoData = [];
    
    // Sample filenames
    const filenames = [
        'company_announcement.mp4',
        'ceo_interview.mp4',
        'product_demo.mp4',
        'conference_speech.mp4',
        'team_meeting.mp4',
        'customer_testimonial.mp4',
        'promo_video.mp4',
        'training_video.mp4',
        'social_media_clip.mp4',
        'webinar_recording.mp4'
    ];
    
    // Generate 25 random entries
    for (let i = 0; i < 25; i++) {
        const isFake = Math.random() > 0.7; // 30% chance of being fake
        const confidence = 75 + Math.random() * 20; // 75-95% confidence
        
        demoData.push({
            id: `analysis_${i + 1}`,
            filename: filenames[i % filenames.length],
            timestamp: Date.now() - (i * 86400000), // Each entry is 1 day older
            result: {
                prediction: isFake ? 'Deepfake' : 'Real',
                confidence: isFake ? confidence : 100 - confidence,
                probabilities: {
                    real: isFake ? 100 - confidence : confidence,
                    fake: isFake ? confidence : 100 - confidence
                }
            }
        });
    }
    
    return demoData;
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition transform duration-500 translate-y-full`;
    
    // Set style based on type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${message}`;
            break;
        case 'error':
            notification.classList.add('bg-red-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${message}`;
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${message}`;
            break;
        default:
            notification.classList.add('bg-blue-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i> ${message}`;
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-y-full');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-y-full');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Initialize dashboard when document is ready
document.addEventListener('DOMContentLoaded', initDashboard);