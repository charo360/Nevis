#!/usr/bin/env python3
"""
Text Overlay Service using PIL/Pillow
Provides clean, professional text overlay on background images
"""

import os
import io
import base64
import json
from typing import Dict, Any, Tuple, Optional
from PIL import Image, ImageDraw, ImageFont
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

class TextOverlayService:
    def __init__(self):
        self.default_font_size = 48
        self.default_font_color = "#FFFFFF"
        self.default_bg_color = "#000000"
        self.default_bg_opacity = 0.7
        
    def download_image(self, image_url: str) -> Image.Image:
        """Download image from URL and return PIL Image"""
        try:
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content)).convert('RGBA')
        except Exception as e:
            raise Exception(f"Failed to download image: {str(e)}")
    
    def get_optimal_font_size(self, text: str, image_width: int, image_height: int, 
                            max_width_ratio: float = 0.8, max_height_ratio: float = 0.3) -> int:
        """Calculate optimal font size based on image dimensions and text length"""
        # Base font size calculation
        base_size = min(image_width, image_height) // 15
        
        # Adjust for text length
        text_length = len(text)
        if text_length > 50:
            base_size = int(base_size * 0.7)
        elif text_length > 30:
            base_size = int(base_size * 0.8)
        elif text_length < 15:
            base_size = int(base_size * 1.2)
            
        # Ensure minimum and maximum bounds
        min_size = max(16, image_width // 50)
        max_size = min(image_width // 8, image_height // 8)
        
        return max(min_size, min(base_size, max_size))
    
    def get_text_position(self, text: str, font: ImageFont.ImageFont, 
                         image_width: int, image_height: int, 
                         position: str = "center") -> Tuple[int, int]:
        """Calculate text position based on alignment preference"""
        # Get text bounding box
        bbox = font.getbbox(text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        if position == "center":
            x = (image_width - text_width) // 2
            y = (image_height - text_height) // 2
        elif position == "top":
            x = (image_width - text_width) // 2
            y = image_height // 6
        elif position == "bottom":
            x = (image_width - text_width) // 2
            y = image_height - image_height // 6 - text_height
        elif position == "left":
            x = image_width // 10
            y = (image_height - text_height) // 2
        elif position == "right":
            x = image_width - image_width // 10 - text_width
            y = (image_height - text_height) // 2
        else:  # default to center
            x = (image_width - text_width) // 2
            y = (image_height - text_height) // 2
            
        return (x, y)
    
    def create_text_background(self, draw: ImageDraw.ImageDraw, text: str, 
                             font: ImageFont.ImageFont, position: Tuple[int, int],
                             bg_color: str, opacity: float, padding: int = 20) -> None:
        """Create semi-transparent background for text"""
        bbox = font.getbbox(text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Calculate background rectangle
        x, y = position
        bg_x1 = x - padding
        bg_y1 = y - padding
        bg_x2 = x + text_width + padding
        bg_y2 = y + text_height + padding
        
        # Create background with opacity
        bg_rgba = self.hex_to_rgba(bg_color, opacity)
        draw.rectangle([bg_x1, bg_y1, bg_x2, bg_y2], fill=bg_rgba)
    
    def hex_to_rgba(self, hex_color: str, opacity: float) -> Tuple[int, int, int, int]:
        """Convert hex color to RGBA tuple with opacity"""
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return rgb + (int(255 * opacity),)
    
    def load_font(self, font_size: int, font_family: str = "arial") -> ImageFont.ImageFont:
        """Load font with fallback options"""
        font_paths = [
            f"/System/Library/Fonts/{font_family}.ttf",  # macOS
            f"/Windows/Fonts/{font_family}.ttf",         # Windows
            f"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
            f"/usr/share/fonts/TTF/{font_family}.ttf",   # Linux alternative
        ]
        
        for font_path in font_paths:
            try:
                if os.path.exists(font_path):
                    return ImageFont.truetype(font_path, font_size)
            except:
                continue
        
        # Fallback to default font
        try:
            return ImageFont.load_default()
        except:
            return ImageFont.load_default()
    
    def overlay_text(self, image_url: str, text: str, options: Dict[str, Any] = None) -> str:
        """
        Main function to overlay text on image
        Returns base64 encoded image
        """
        if not options:
            options = {}
            
        # Download and prepare image
        image = self.download_image(image_url)
        
        # Get options with defaults
        font_size = options.get('font_size', self.get_optimal_font_size(text, image.width, image.height))
        font_color = options.get('font_color', self.default_font_color)
        bg_color = options.get('bg_color', self.default_bg_color)
        bg_opacity = options.get('bg_opacity', self.default_bg_opacity)
        position = options.get('position', 'center')
        font_family = options.get('font_family', 'arial')
        add_background = options.get('add_background', True)
        
        # Load font
        font = self.load_font(font_size, font_family)
        
        # Create drawing context
        draw = ImageDraw.Draw(image)
        
        # Calculate text position
        text_pos = self.get_text_position(text, font, image.width, image.height, position)
        
        # Add semi-transparent background if requested
        if add_background:
            self.create_text_background(draw, text, font, text_pos, bg_color, bg_opacity)
        
        # Draw text
        draw.text(text_pos, text, font=font, fill=font_color)
        
        # Convert to base64
        buffer = io.BytesIO()
        image.convert('RGB').save(buffer, format='JPEG', quality=95)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/jpeg;base64,{img_base64}"

# Initialize service
text_overlay_service = TextOverlayService()

@app.route('/overlay-text', methods=['POST'])
def overlay_text_endpoint():
    """API endpoint for text overlay"""
    try:
        data = request.get_json()
        
        if not data or 'image_url' not in data or 'text' not in data:
            return jsonify({'error': 'Missing required fields: image_url and text'}), 400
        
        image_url = data['image_url']
        text = data['text']
        options = data.get('options', {})
        
        # Process text overlay
        result_image = text_overlay_service.overlay_text(image_url, text, options)
        
        return jsonify({
            'success': True,
            'image_url': result_image,
            'message': 'Text overlay completed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'text-overlay-service'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
