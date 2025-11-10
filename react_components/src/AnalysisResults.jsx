import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Create a simple API client inline instead of importing
const apiClient = {
  async getAnalysisResults(videoId) {
    try {
      const response = await fetch(`/api/results/${videoId}`);
      return await response.json();
    } catch (error) {
      console.error('Results Fetch Error:', error);
      throw error;
    }
  }
};

// Import components - assuming these are provided separately or defined elsewhere
// If these components need to be defined, they should be included directly
const FrameAnalysis = ({ videoId }) => (
  <div className="p-4 bg-gray-100 rounded">
    <p>Frame Analysis Component for video: {videoId}</p>
  </div>
);

const ManipulationHeatmap = ({ videoData, heatmapData }) => (
  <div className="p-4 bg-gray-100 rounded">
    <p>Heatmap Component for video</p>
  </div>
);

const AnalysisResults = ({ videoId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Using the inline apiClient
  
  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        const response = await apiClient.getAnalysisResults(videoId);
        
        if (response.status === 'success') {
          setResults(response.result);
          setLoading(false);
        } else {
          setError('Failed to load analysis results');
          setLoading(false);
        }
      } catch (err) {
        setError(`Error loading results: ${err.message}`);
        setLoading(false);
      }
    }
    
    if (videoId) {
      loadResults();
    }
  }, [videoId]);
  
  // Format data for charts
  const prepareChartData = () => {
    if (!results || !results.frame_analysis) return [];
    
    return results.frame_analysis.map((frame, index) => ({
      name: `Frame ${index + 1}`,
      fake: frame.probability_fake * 100,
      real: (1 - frame.probability_fake) * 100
    }));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
        <p>No analysis results found for video ID: {videoId}</p>
      </div>
    );
  }
  
  const chartData = prepareChartData();
  
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-6 rounded-lg shadow-md ${
          results.prediction === 'Deepfake' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          <h3 className="text-lg font-semibold">Result</h3>
          <p className="text-3xl font-bold mt-2">{results.prediction}</p>
          <p className="mt-1 text-sm opacity-80">
            {results.prediction === 'Deepfake' 
              ? 'AI manipulation detected' 
              : 'No manipulation detected'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Confidence</h3>
          <p className="text-3xl font-bold mt-2">{(results.confidence * 100).toFixed(1)}%</p>
          <p className="mt-1 text-sm text-gray-500">
            {results.confidence > 0.9 
              ? 'Very high confidence' 
              : results.confidence > 0.8 
                ? 'High confidence' 
                : 'Moderate confidence'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Peak Detection</h3>
          <p className="text-3xl font-bold mt-2">{(results.max_fake_probability * 100).toFixed(1)}%</p>
          <p className="mt-1 text-sm text-gray-500">Maximum manipulation score detected</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Suspicious Frames</h3>
          <p className="text-3xl font-bold mt-2">
            {results.frame_analysis?.filter(f => f.probability_fake > 0.5).length || 0}
            <span className="text-lg text-gray-500">/{results.frame_analysis?.length || 0}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">Frames with high manipulation scores</p>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <div className="flex">
            <button 
              className={`px-6 py-4 text-gray-700 font-medium focus:outline-none ${activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-600' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-6 py-4 text-gray-700 font-medium focus:outline-none ${activeTab === 'frameAnalysis' ? 'border-b-2 border-purple-600 text-purple-600' : ''}`}
              onClick={() => setActiveTab('frameAnalysis')}
            >
              Frame Analysis
            </button>
            <button 
              className={`px-6 py-4 text-gray-700 font-medium focus:outline-none ${activeTab === 'heatmap' ? 'border-b-2 border-purple-600 text-purple-600' : ''}`}
              onClick={() => setActiveTab('heatmap')}
            >
              Manipulation Heatmap
            </button>
            <button 
              className={`px-6 py-4 text-gray-700 font-medium focus:outline-none ${activeTab === 'technical' ? 'border-b-2 border-purple-600 text-purple-600' : ''}`}
              onClick={() => setActiveTab('technical')}
            >
              Technical Details
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Video Preview */}
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <h3 className="bg-gray-800 text-white p-3 text-sm font-semibold">Video Preview</h3>
                  <div className="aspect-w-16 aspect-h-9 bg-black">
                    <video className="w-full" controls src={`/api/video/${videoId}`} />
                  </div>
                  <div className="p-3 text-sm text-gray-600">
                    <p><span className="font-medium">Filename:</span> {results.filename}</p>
                    <p><span className="font-medium">Resolution:</span> {results.resolution}</p>
                    <p><span className="font-medium">Duration:</span> {results.duration}s</p>
                  </div>
                </div>
                
                {/* Probability Chart */}
                <div className="bg-white rounded-lg shadow-sm">
                  <h3 className="p-3 text-sm font-semibold text-gray-700 border-b">Manipulation Probability by Frame</h3>
                  <div className="p-3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="fake" 
                          stroke="#EF4444" 
                          activeDot={{ r: 8 }} 
                          name="Fake Probability (%)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="real" 
                          stroke="#10B981" 
                          name="Real Probability (%)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Probability Distribution */}
              <div className="bg-white rounded-lg shadow-sm">
                <h3 className="p-3 text-sm font-semibold text-gray-700 border-b">Probability Distribution</h3>
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Real</span>
                        <span className="text-sm font-medium text-gray-700">
                          {(results.probabilities.real * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${results.probabilities.real * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Deepfake</span>
                        <span className="text-sm font-medium text-gray-700">
                          {(results.probabilities.fake * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${results.probabilities.fake * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Frame Analysis Tab */}
          {activeTab === 'frameAnalysis' && (
            <FrameAnalysis videoId={videoId} />
          )}
          
          {/* Heatmap Tab */}
          {activeTab === 'heatmap' && (
            <ManipulationHeatmap 
              videoData={{ url: `/api/video/${videoId}` }} 
              heatmapData={{ frames: results.frame_analysis }}
            />
          )}
          
          {/* Technical Details Tab */}
          {activeTab === 'technical' && (
            <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;