const path = require('path');

module.exports = {
  entry: {
    FrameAnalysis: './src/FrameAnalysis.jsx',
    ManipulationHeatmap: './src/ManipulationHeatmap.jsx',
    AnalysisResults: './src/AnalysisResults.jsx'
  },
  output: {
    path: path.resolve(__dirname, '../static/react'),
    filename: '[name].js',
    libraryTarget: 'var',
    library: '[name]'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  // Externals makes React and ReactDOM available globally so we don't include them in each bundle
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
};