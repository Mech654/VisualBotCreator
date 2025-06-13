#!/bin/bash
# Setup script for Python PDF processing dependencies

echo "Setting up Python environment for PDF Editor..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed. Please install pip first."
    exit 1
fi

# Install the required packages
echo "Installing PDF processing libraries..."
pip3 install -r requirements.txt

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ PDF Editor Python dependencies installed successfully!"
    echo ""
    echo "Available PDF Editor features:"
    echo "- Text replacement by search"
    echo "- Page-specific text insertion"
    echo "- Coordinate-based text placement"
    echo "- Full page text replacement"
    echo ""
    echo "Locator examples:"
    echo "  'find:old_text' - Replace 'old_text' with new text"
    echo "  'page:1' - Replace all text on page 1"
    echo "  'coord:100,200,1' - Add text at coordinates (100,200) on page 1"
    echo "  'all' - Add text to all pages"
else
    echo "❌ Failed to install PDF processing dependencies."
    echo "Please check your Python and pip installation."
    exit 1
fi
