# VisionShield: Deepfake Detection System

VisionShield is a web application for detecting AI-generated deepfake videos using a hybrid CNN-RNN model. This system analyzes videos frame by frame to determine if they are authentic or manipulated.

## Project Structure

```
visionshield/
├── app.py                  # Main Flask application entry point
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── models/                 # ML model-related code
│   ├── __init__.py         # Package initialization
│   ├── visionshield.py     # Model definition (CNN-RNN architecture)
│   ├── utils.py            # Video processing utilities
│   └── weights/            # Directory for model weight files (.pth)
│       └── visionshield_model.pth  # Trained model weights
├── api/                    # API-related code
│   ├── __init__.py         # Package initialization
│   ├── routes.py           # API endpoints
│   └── schemas.py          # Request/response validation
├── web/                    # Web interface code
│   ├── __init__.py         # Package initialization
│   ├── templates/          # HTML templates directory
│   └── static/             # Static files (CSS, JS, images)
├── static/                 # Global static files
│   ├── js/                 # JavaScript files
│   │   ├── api_client.js   # Client for API calls
│   │   ├── results.js      # Results page functionality
│   │   └── dashboard.js    # Dashboard functionality
│   ├── css/                # CSS files
│   ├── uploads/            # Storage for uploaded videos
│   └── react/              # Compiled React components
├── templates/              # Global HTML templates
│   ├── index.html          # Home page template
│   ├── dashboard.html      # Dashboard template
│   ├── results.html        # Results template
│   ├── login.html          # Login template
│   ├── 404.html            # Error page template
│   └── 500.html            # Error page template
└── react_components/       # React source components
    ├── src/
    │   ├── FrameAnalysis.jsx       # Frame analysis component
    │   ├── ManipulationHeatmap.jsx # Heatmap visualization component
    │   └── AnalysisResults.jsx     # Results visualization component
    ├── package.json               # React dependencies
    └── webpack.config.js          # Webpack configuration
```

## Where to Place React Components

The React components should be placed in the `react_components/src/` directory:

1. `FrameAnalysis.jsx` → `react_components/src/FrameAnalysis.jsx`
2. `ManipulationHeatmap.jsx` → `react_components/src/ManipulationHeatmap.jsx`
3. `AnalysisResults.jsx` → `react_components/src/AnalysisResults.jsx`

After building with webpack, the compiled JavaScript will be placed in `static/react/` and can be included in the HTML templates.

## How to Build and Run

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies**:
   ```bash
   cd react_components
   npm install
   ```

3. **Build React components**:
   ```bash
   npm run build
   ```

4. **Place the model weights file**:
   - Ensure the trained model weights file (`visionshield_model.pth`) is in the `models/weights/` directory
   - This file is essential for the system to work properly!

5. **Run the Flask application**:
   ```bash
   python app.py
   ```

6. **Access the application**:
   - Open your browser and go to `http://localhost:5000`

## API Endpoints

- `GET /api/health` - API health check
- `POST /api/analyze` - Upload and analyze a video
- `GET /api/results/<video_id>` - Get analysis results
- `GET /api/frame-analysis/<video_id>` - Get frame-by-frame analysis
- `GET /api/heatmap/<video_id>` - Get heatmap visualizations
- `GET /api/video/<video_id>` - Serve a processed video
- `GET /api/history` - Get analysis history

## Notes on React Component Integration

The React components are designed to be integrated with the Flask backend through API calls. The components fetch data from the API endpoints and visualize the results.

For simplicity in development, we've provided inline API clients in the React components. In a production environment, you would typically:

1. Use a proper module system with a bundler like Webpack
2. Set up a shared API client module
3. Use a state management solution like Redux for more complex applications

For now, the components will work as provided when built and included in the HTML templates.