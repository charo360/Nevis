#!/usr/bin/env python3
"""
Create a test image with specific colors for testing color extraction
"""

from PIL import Image, ImageDraw
import os

def create_test_image():
    # Create a 400x400 image
    width, height = 400, 400
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # Define test colors
    red = '#FF0000'      # Pure red
    blue = '#0000FF'     # Pure blue  
    green = '#00FF00'    # Pure green
    purple = '#800080'   # Purple
    orange = '#FFA500'   # Orange
    
    # Draw colored rectangles
    # Red rectangle (top-left)
    draw.rectangle([0, 0, 200, 200], fill=red)
    
    # Blue rectangle (top-right)
    draw.rectangle([200, 0, 400, 200], fill=blue)
    
    # Green rectangle (bottom-left)
    draw.rectangle([0, 200, 200, 400], fill=green)
    
    # Purple rectangle (bottom-right)
    draw.rectangle([200, 200, 400, 400], fill=purple)
    
    # Add some orange accents (circles)
    draw.ellipse([150, 150, 250, 250], fill=orange)
    
    # Save the image
    output_path = 'test_design_image.png'
    image.save(output_path)
    print(f"✅ Test image created: {output_path}")
    print(f"📍 Full path: {os.path.abspath(output_path)}")
    
    return os.path.abspath(output_path)

if __name__ == "__main__":
    create_test_image()
