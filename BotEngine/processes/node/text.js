import { BaseProcessor } from './BaseProcessor.js';

class TextProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get text properties, checking runtimeInputs first, then properties
      const text = runtimeInputs.textInput || this.getProperty(properties, 'text', 'Sample text');
      const fontSize = this.getProperty(properties, 'fontSize', 16);
      const bold = this.getProperty(properties, 'bold', false);
      const color = this.getProperty(properties, 'color', '#000000');

      let processedText = text;
      
      // Apply formatting if needed
      if (bold) {
        processedText = `<strong>${processedText}</strong>`;
      }

      // In a real application, you might apply font size and color styling
      const textLength = text.length;

      const responseData = {
        output: `Text processed: "${text}" (length: ${textLength})`,
        textOutput: processedText,
        length: textLength,
        text: text,
        fontSize: fontSize,
        bold: bold,
        color: color,
        exitCode: 0,
        status: true,
      };
      
      console.error('[TextProcessor] Returning result:', JSON.stringify(responseData));
      
      return responseData;
    } catch (error) {
      console.error('[TextProcessor] Error during processing:', error.message);

      return {
        output: `Error processing text: ${error.message}`,
        textOutput: '',
        length: 0,
        text: '',
        fontSize: 16,
        bold: false,
        color: '#000000',
        exitCode: 1,
        status: false,
      };
    }
  }
}

new TextProcessor();
