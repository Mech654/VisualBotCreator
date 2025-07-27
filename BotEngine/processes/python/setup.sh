#!/bin/bash
# Setup script for Python PDF processing dependencies with venv

set -e # stop on any error

echo "🚀 Setting up Python environment for PDF Editor..."

# Check for python3
if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 is not installed. Please install it first."
  exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "🛠 Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate virtual environment
# shellcheck disable=SC1091
source .venv/bin/activate

# Upgrade pip inside venv (optional but recommended)
echo "⬆️ Upgrading pip inside virtual environment..."
pip install --upgrade pip

# Install dependencies
if [ ! -f "requirements.txt" ]; then
  echo "❌ requirements.txt not found! Please add your dependencies there."
  deactivate
  exit 1
fi

echo "📦 Installing PDF processing libraries..."
pip install -r requirements.txt

echo "✅ PDF Editor Python dependencies installed successfully!"

cat <<EOF

Available PDF Editor features:
- Text replacement by search
- Page-specific text insertion
- Coordinate-based text placement
- Full page text replacement

Locator examples:
  'find:old_text' - Replace 'old_text' with new text
  'page:1' - Replace all text on page 1
  'coord:100,200,1' - Add text at coordinates (100,200) on page 1
  'all' - Add text to all pages

EOF

# deactivate venv before exiting script (optional)
deactivate
