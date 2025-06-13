#!/usr/bin/env python3
"""
PDF Editor Processor - Python implementation
Handles PDF text replacement and editing operations
"""

import sys
import json
import os
import tempfile
import shutil
from pathlib import Path
from BaseProcessor import BaseProcessor

# PDF processing libraries
try:
    import PyPDF2
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.units import inch
    import fitz  # PyMuPDF for advanced PDF operations
    HAS_PDF_LIBS = True
except ImportError as e:
    HAS_PDF_LIBS = False
    MISSING_LIBS = str(e)


class PdfEditorProcessor(BaseProcessor):
    def process(self, execution_data):
        """Process PDF editing operations"""
        try:
            if not HAS_PDF_LIBS:
                return {
                    "output": f"Error: Missing PDF libraries. Please install: pip install PyPDF2 reportlab PyMuPDF",
                    "status": False,
                    "exitCode": 1,
                }            
            # Get PDF processing parameters using the base class helper
            pdf_path = self.get_runtime_input(execution_data, 'pdfPath', default='')
            new_text = self.get_runtime_input(execution_data, 'newText', default='')
            locator = self.get_runtime_input(execution_data, 'locator', default='')
            
            # Validate required inputs
            self.validate_required({
                'pdfPath': pdf_path,
                'newText': new_text,
                'locator': locator
            }, ['pdfPath', 'newText', 'locator'])
            
            if not self.file_exists(pdf_path):
                return {
                    "output": f"Error: PDF file not found: {pdf_path}",
                    "status": False,
                    "exitCode": 1,
                }

            # Process the PDF
            result = self.edit_pdf(pdf_path, new_text, locator)
            
            return {
                "output": result["message"],
                "status": result["success"],
                "exitCode": 0 if result["success"] else 1,
                "modified_pages": result.get("modified_pages", 0),
                "output_path": result.get("output_path", "")
            }

        except Exception as error:
            return {
                "output": f"Error processing PDF: {str(error)}",
                "status": False,
                "exitCode": 1,
            }

    def edit_pdf(self, pdf_path, new_text, locator):
        """Edit PDF by replacing text based on locator"""
        try:
            # Create a backup and work with a copy
            backup_path = pdf_path + ".backup"
            if not os.path.exists(backup_path):
                shutil.copy2(pdf_path, backup_path)
            
            # Open PDF with PyMuPDF for text replacement
            doc = fitz.open(pdf_path)
            modified_pages = 0
            
            # Search and replace text
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                
                # Different locator strategies
                if locator.startswith("page:"):
                    # Page-specific replacement: "page:1" means page 1
                    target_page = int(locator.split(":")[1]) - 1  # Convert to 0-based
                    if page_num == target_page:
                        modified_pages += self.replace_text_on_page(page, new_text)
                
                elif locator.startswith("find:"):
                    # Find and replace specific text: "find:old_text"
                    old_text = locator.split(":", 1)[1]
                    text_instances = page.search_for(old_text)
                    if text_instances:
                        for inst in text_instances:
                            # Remove old text by covering with white rectangle
                            page.add_redact_annot(inst)
                            page.apply_redacts()
                            # Add new text
                            page.insert_text(inst.tl, new_text, fontsize=12, color=(0, 0, 0))
                        modified_pages += 1
                
                elif locator.startswith("coord:"):
                    # Coordinate-based replacement: "coord:x,y,page"
                    coords = locator.split(":")[1].split(",")
                    if len(coords) >= 3:
                        x, y, target_page = float(coords[0]), float(coords[1]), int(coords[2]) - 1
                        if page_num == target_page:
                            page.insert_text((x, y), new_text, fontsize=12, color=(0, 0, 0))
                            modified_pages += 1
                
                elif locator == "all":
                    # Add text to all pages (append at bottom)
                    rect = page.rect
                    page.insert_text((50, rect.height - 50), new_text, fontsize=10, color=(0, 0, 0))
                    modified_pages += 1
                
                else:
                    # Default: search for the locator text and replace it
                    text_instances = page.search_for(locator)
                    if text_instances:
                        for inst in text_instances:
                            # Remove old text
                            page.add_redact_annot(inst)
                            page.apply_redacts()
                            # Add new text
                            page.insert_text(inst.tl, new_text, fontsize=12, color=(0, 0, 0))
                        modified_pages += 1
            
            # Save the modified PDF
            doc.save(pdf_path, garbage=4, deflate=True, clean=True)
            doc.close()
            
            if modified_pages > 0:
                return {
                    "success": True,
                    "message": f"Successfully modified {modified_pages} page(s) in PDF: {pdf_path}",
                    "modified_pages": modified_pages,
                    "output_path": pdf_path
                }
            else:
                return {
                    "success": False,
                    "message": f"No text found matching locator '{locator}' in PDF",
                    "modified_pages": 0,
                    "output_path": pdf_path
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Error editing PDF: {str(e)}",
                "modified_pages": 0
            }

    def replace_text_on_page(self, page, new_text):
        """Replace all text on a page with new text"""
        try:
            # Clear the page content
            page.clean_contents()
            
            # Add new text
            rect = page.rect
            page.insert_text((50, 100), new_text, fontsize=12, color=(0, 0, 0))
            return 1
        except:
            return 0


if __name__ == "__main__":
    processor = PdfEditorProcessor()
