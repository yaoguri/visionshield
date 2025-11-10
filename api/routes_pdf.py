# api/routes_pdf.py
# PDF Report Generation Routes for VisionShield

import os
import json
from flask import send_file, jsonify, current_app
from pdf_generator import generate_analysis_report


def register_pdf_routes(app):
    """Register PDF generation routes with the Flask app"""
    
    @app.route('/api/download-report/<video_id>')
    def download_report(video_id):
        """
        Generate and download PDF report for a video analysis
        
        Args:
            video_id: Unique identifier for the analyzed video
            
        Returns:
            PDF file download or error response
        """
        try:
            config = current_app.config['VISIONSHIELD_CONFIG']
            upload_dir = config.UPLOAD_FOLDER
            
            # Load analysis results
            results_file = os.path.join(upload_dir, f"{video_id}_results.json")
            
            if not os.path.exists(results_file):
                return jsonify({
                    'status': 'error',
                    'message': 'Analysis results not found'
                }), 404
            
            with open(results_file, 'r') as f:
                result_data = json.load(f)
            
            # Generate PDF report
            pdf_filename = f"visionshield_report_{video_id}.pdf"
            pdf_path = os.path.join(upload_dir, pdf_filename)
            
            # Use the PDF generator
            generate_analysis_report(result_data, pdf_path)
            
            # Send the file
            return send_file(
                pdf_path,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f"VisionShield_Report_{video_id}.pdf"
            )
            
        except Exception as e:
            current_app.logger.error(f"Error generating PDF report: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'message': f'Failed to generate PDF report: {str(e)}'
            }), 500