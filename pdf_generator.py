# pdf_generator.py
# PDF Report Generator for VisionShield Analysis Results

import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image as RLImage, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64


class VisionShieldPDFGenerator:
    """Generate professional PDF reports for VisionShield analysis results"""
    
    def __init__(self, output_path, result_data):
        """
        Initialize PDF generator
        
        Args:
            output_path: Path where PDF should be saved
            result_data: Dictionary containing analysis results
        """
        self.output_path = output_path
        self.result_data = result_data
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for the report"""
        # Title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#4a00e0'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Heading style
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#8e2de2'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        # Subheading style
        self.subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#4a00e0'),
            spaceAfter=6,
            spaceBefore=6,
            fontName='Helvetica-Bold'
        )
        
        # Body text
        self.body_style = ParagraphStyle(
            'CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            spaceAfter=6
        )
        
        # Result style (for verdict)
        self.result_style = ParagraphStyle(
            'ResultStyle',
            parent=self.styles['Normal'],
            fontSize=20,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=10
        )
    
    def _add_header_footer(self, canvas_obj, doc):
        """Add header and footer to each page"""
        canvas_obj.saveState()
        width, height = letter
        
        # Header
        canvas_obj.setFillColor(colors.HexColor('#4a00e0'))
        canvas_obj.rect(0, height - 0.5*inch, width, 0.5*inch, fill=True, stroke=False)
        
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont('Helvetica-Bold', 14)
        canvas_obj.drawString(0.75*inch, height - 0.35*inch, "VisionShield")
        canvas_obj.setFont('Helvetica', 10)
        canvas_obj.drawRightString(width - 0.75*inch, height - 0.35*inch, "Deepfake Detection Report")
        
        # Footer
        canvas_obj.setFillColor(colors.grey)
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.drawString(0.75*inch, 0.5*inch, 
            f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
        canvas_obj.drawRightString(width - 0.75*inch, 0.5*inch, 
            f"Page {doc.page}")
        
        canvas_obj.restoreState()
    
    def _create_probability_chart(self):
        """Create a bar chart showing real vs fake probabilities"""
        fig, ax = plt.subplots(figsize=(6, 4))
        
        categories = ['Real', 'Deepfake']
        probabilities = [
            self.result_data['probabilities']['real'] * 100,
            self.result_data['probabilities']['fake'] * 100
        ]
        colors_list = ['#10b981', '#ef4444']
        
        bars = ax.bar(categories, probabilities, color=colors_list, alpha=0.7, edgecolor='black', linewidth=1.5)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}%',
                   ha='center', va='bottom', fontsize=12, fontweight='bold')
        
        ax.set_ylabel('Probability (%)', fontsize=12, fontweight='bold')
        ax.set_title('Detection Probabilities', fontsize=14, fontweight='bold', pad=20)
        ax.set_ylim(0, 110)
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        
        # Save to bytes
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        plt.close()
        
        return buf
    
    def _create_frame_analysis_chart(self):
        """Create a line chart showing frame-by-frame analysis"""
        if not self.result_data.get('frame_analysis'):
            return None
            
        fig, ax = plt.subplots(figsize=(8, 4))
        
        frames = [f['frame'] for f in self.result_data['frame_analysis']]
        probabilities = [f['probability_fake'] * 100 for f in self.result_data['frame_analysis']]
        
        ax.plot(frames, probabilities, color='#8e2de2', linewidth=2, marker='o', markersize=4)
        ax.fill_between(frames, probabilities, alpha=0.3, color='#8e2de2')
        
        # Add threshold line
        ax.axhline(y=50, color='red', linestyle='--', linewidth=1, label='Threshold (50%)')
        
        ax.set_xlabel('Frame Number', fontsize=12, fontweight='bold')
        ax.set_ylabel('Deepfake Probability (%)', fontsize=12, fontweight='bold')
        ax.set_title('Frame-by-Frame Analysis', fontsize=14, fontweight='bold', pad=20)
        ax.set_ylim(0, 105)
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.legend()
        
        # Save to bytes
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        plt.close()
        
        return buf
    
    def _create_summary_table(self):
        """Create a summary table with key metrics"""
        data = [
            ['Metric', 'Value'],
            ['Video Filename', self.result_data.get('filename', 'N/A')],
            ['Detection Result', self.result_data.get('prediction', 'N/A')],
            ['Confidence', f"{self.result_data.get('confidence', 0) * 100:.2f}%"],
            ['Real Probability', f"{self.result_data['probabilities']['real'] * 100:.2f}%"],
            ['Deepfake Probability', f"{self.result_data['probabilities']['fake'] * 100:.2f}%"],
            ['Frames Analyzed', str(self.result_data.get('frames_analyzed', 0))],
            ['Frame Rate', self.result_data.get('frame_rate', 'N/A')],
            ['Duration', f"{self.result_data.get('duration', 0)} seconds"],
            ['Resolution', self.result_data.get('resolution', 'N/A')],
            ['Max Fake Probability', f"{self.result_data.get('max_fake_probability', 0) * 100:.2f}%"],
            ['Avg Fake Probability', f"{self.result_data.get('avg_fake_probability', 0) * 100:.2f}%"],
        ]
        
        table = Table(data, colWidths=[3*inch, 3*inch])
        table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a00e0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return table
    
    def _create_frame_analysis_table(self):
        """Create a table showing detailed frame analysis"""
        if not self.result_data.get('frame_analysis'):
            return None
        
        # Show first 10 and last 10 frames if more than 20
        frame_data = self.result_data['frame_analysis']
        if len(frame_data) > 20:
            display_frames = frame_data[:10] + frame_data[-10:]
            show_ellipsis = True
        else:
            display_frames = frame_data
            show_ellipsis = False
        
        data = [['Frame #', 'Deepfake Probability', 'Status']]
        
        for i, frame in enumerate(display_frames):
            if show_ellipsis and i == 10:
                data.append(['...', '...', '...'])
            
            frame_num = frame['frame']
            prob = frame['probability_fake'] * 100
            status = 'Suspicious' if prob > 50 else 'Normal'
            
            data.append([
                str(frame_num),
                f"{prob:.2f}%",
                status
            ])
        
        table = Table(data, colWidths=[1.5*inch, 2.5*inch, 2*inch])
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8e2de2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            
            # Data
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return table
    
    def generate(self):
        """Generate the complete PDF report"""
        doc = SimpleDocTemplate(
            self.output_path,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        
        # Title Page
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph("VisionShield", self.title_style))
        story.append(Paragraph("Deepfake Detection Report", self.heading_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Detection Result (Big and Bold)
        prediction = self.result_data.get('prediction', 'Unknown')
        result_color = colors.HexColor('#10b981') if prediction == 'Real' else colors.HexColor('#ef4444')
        
        result_style_colored = ParagraphStyle(
            'ResultStyleColored',
            parent=self.result_style,
            textColor=result_color
        )
        
        story.append(Paragraph(f"<b>Result: {prediction}</b>", result_style_colored))
        story.append(Paragraph(
            f"Confidence: {self.result_data.get('confidence', 0) * 100:.2f}%", 
            self.body_style
        ))
        story.append(Spacer(1, 0.5*inch))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", self.heading_style))
        
        summary_text = f"""
        This report contains the results of a deepfake detection analysis performed on the video file 
        <b>{self.result_data.get('filename', 'N/A')}</b>. Our advanced AI-powered system, utilizing 
        ResNet50 and BiLSTM neural networks, has analyzed <b>{self.result_data.get('frames_analyzed', 0)}</b> 
        frames to determine the authenticity of the video content.
        <br/><br/>
        The analysis indicates that this video is classified as <b>{prediction}</b> with a confidence level 
        of <b>{self.result_data.get('confidence', 0) * 100:.1f}%</b>. The system detected an average 
        deepfake probability of <b>{self.result_data.get('avg_fake_probability', 0) * 100:.2f}%</b> across 
        all analyzed frames.
        """
        
        story.append(Paragraph(summary_text, self.body_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Page Break
        story.append(PageBreak())
        
        # Analysis Summary
        story.append(Paragraph("Analysis Summary", self.heading_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Summary Table
        summary_table = self._create_summary_table()
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Probability Chart
        story.append(Paragraph("Detection Probabilities", self.heading_style))
        prob_chart = self._create_probability_chart()
        if prob_chart:
            img = RLImage(prob_chart, width=5*inch, height=3.3*inch)
            story.append(img)
        story.append(Spacer(1, 0.3*inch))
        
        # Frame Analysis Chart
        frame_chart = self._create_frame_analysis_chart()
        if frame_chart:
            story.append(PageBreak())
            story.append(Paragraph("Frame-by-Frame Analysis", self.heading_style))
            story.append(Spacer(1, 0.2*inch))
            img = RLImage(frame_chart, width=6.5*inch, height=3.25*inch)
            story.append(img)
            story.append(Spacer(1, 0.3*inch))
        
        # Detailed Frame Table
        frame_table = self._create_frame_analysis_table()
        if frame_table:
            story.append(Paragraph("Detailed Frame Analysis", self.subheading_style))
            story.append(Spacer(1, 0.1*inch))
            story.append(frame_table)
        
        # Technical Details
        story.append(PageBreak())
        story.append(Paragraph("Technical Details", self.heading_style))
        story.append(Spacer(1, 0.2*inch))
        
        tech_text = """
        <b>Model Architecture:</b><br/>
        The VisionShield detection system employs a hybrid CNN-RNN architecture combining ResNet50 
        for spatial feature extraction with a Bidirectional LSTM for temporal analysis. This approach 
        enables detection of both spatial artifacts and temporal inconsistencies typical of deepfake videos.
        <br/><br/>
        <b>Analysis Process:</b><br/>
        1. Frame Extraction: Systematic sampling of video frames<br/>
        2. Feature Extraction: ResNet50 CNN processes each frame<br/>
        3. Temporal Analysis: BiLSTM analyzes frame sequences<br/>
        4. Classification: Binary classification (Real/Deepfake)<br/>
        5. Confidence Scoring: Probability distribution across classes
        <br/><br/>
        <b>Model Performance:</b><br/>
        Training Accuracy: 81.74%<br/>
        Architecture: ResNet50 + BiLSTM<br/>
        Input: Video frames (224x224 RGB)<br/>
        Output: Binary classification with confidence scores
        """
        
        story.append(Paragraph(tech_text, self.body_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Disclaimer
        story.append(Paragraph("Important Notice", self.heading_style))
        disclaimer_text = """
        <i>This report is generated by an AI-powered detection system and should be used as one factor 
        in determining video authenticity. While our system achieves high accuracy, no automated system 
        is perfect. We recommend combining this analysis with other verification methods and human expert 
        review when making critical decisions. The confidence scores represent the model's certainty based 
        on learned patterns and should be interpreted accordingly.</i>
        """
        story.append(Paragraph(disclaimer_text, self.body_style))
        
        # Build PDF with custom header/footer
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
        
        return self.output_path


def generate_analysis_report(result_data, output_path):
    """
    Convenience function to generate a PDF report
    
    Args:
        result_data: Dictionary with analysis results
        output_path: Path where PDF should be saved
        
    Returns:
        Path to generated PDF
    """
    generator = VisionShieldPDFGenerator(output_path, result_data)
    return generator.generate()
