import { BaseProcessor } from './BaseProcessor.js';

class TextProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the node properties
      const nodeProperties = properties.properties || {};
      const text = runtimeInputs.textInput || nodeProperties.text || 'Sample text';
      const fontSize = nodeProperties.fontSize || 16;
      const bold = nodeProperties.bold || false;
      const color = nodeProperties.color || '#000000';

      let processedText = text;
      
      // Apply formatting if needed
      if (bold) {
        processedText = `<strong>${processedText}</strong>`;
      }

      // In a real application, you might apply font size and color styling
      const textLength = text.length;

      return {
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
