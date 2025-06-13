#!/usr/bin/env python3
"""
Test script for PDF Editor Processor
Creates a sample PDF and tests the editing functionality
"""

import json
import subprocess
import tempfile
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_sample_pdf():
    """Create a sample PDF for testing"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_path = temp_file.name
    temp_file.close()
    
    # Create a simple PDF
    c = canvas.Canvas(temp_path, pagesize=letter)
    c.drawString(100, 750, "Sample PDF Document")
    c.drawString(100, 700, "This is some sample text that can be replaced.")
    c.drawString(100, 650, "Another line of text.")
    c.drawString(100, 600, "Page 1 content")
    c.save()
    
    return temp_path

def test_pdf_editor():
    """Test the PDF editor with sample data"""
    print("Creating sample PDF...")
    pdf_path = create_sample_pdf()
    print(f"Sample PDF created at: {pdf_path}")
    
    # Test data
    test_data = {
        "properties": {
            "properties": {
                "pdfPath": pdf_path,
                "newText": "REPLACED TEXT!",
                "locator": "find:sample text"
            }
        },
        "runtimeInputs": {}
    }
    
    print("Testing PDF editor...")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Run the PDF editor processor
        result = subprocess.run(
            ["python3", "pdfeditor.py"],
            input=json.dumps(test_data),
            text=True,
            capture_output=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        print(f"Return code: {result.returncode}")
        print(f"stdout: {result.stdout}")
        if result.stderr:
            print(f"stderr: {result.stderr}")
            
        # Parse the result
        if result.stdout:
            response = json.loads(result.stdout)
            print(f"PDF Editor Response: {json.dumps(response, indent=2)}")
            
            if response.get("status"):
                print("✅ PDF editing test passed!")
            else:
                print("❌ PDF editing test failed!")
        
    except Exception as e:
        print(f"Error running test: {e}")
    
    finally:
        # Clean up
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
            print(f"Cleaned up sample PDF: {pdf_path}")

if __name__ == "__main__":
    test_pdf_editor()
