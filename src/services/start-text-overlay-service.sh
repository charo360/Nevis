#!/bin/bash

# Text Overlay Service Startup Script
echo "🚀 Starting Text Overlay Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Set environment variables
export FLASK_APP=text-overlay-service.py
export FLASK_ENV=development
export PORT=5000

# Start the service
echo "🎨 Starting Text Overlay Service on port $PORT..."
python3 text-overlay-service.py
