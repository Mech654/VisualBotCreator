import { BaseProcessor } from './BaseProcessor.js';

class BinaryConverterProcessor extends BaseProcessor {
  process(executionData) {
    try {
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      const inputValue = runtimeInputs.input || this.getProperty(properties, 'input', '');
      
      // Validate input
      if (inputValue === '') {
        return {
          output: '',
          exitCode: 0,
          status: true
        };
      }
      
      let outputValue = '';
      let detectedType = '';
      
      // Always auto-detect the input type
      // If input looks like binary (only 0s, 1s, and spaces)
      if (/^[01\s]+$/.test(inputValue)) {
        detectedType = 'fromBinary';
      } else {
        detectedType = 'toBinary';
      }
      
      // Perform conversion based on detected type
      if (detectedType === 'toBinary') {
        outputValue = this.textToBinary(inputValue);
      } else if (detectedType === 'fromBinary') {
        outputValue = this.binaryToText(inputValue);
      } else {
        return {
          output: `Error: Could not determine conversion type`,
          exitCode: 1,
          status: false
        };
      }
      
      // Return the result
      return {
        output: outputValue,
        exitCode: 0,
        status: true
      };
    } catch (error) {
      return {
        output: `Error during binary conversion: ${error.message}`,
        exitCode: 1,
        status: false
      };
    }
  }
  
  textToBinary(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Input must be a non-empty string');
    }
    
    return text.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join(' ');
  }
  
  binaryToText(binary) {
    if (!binary || typeof binary !== 'string') {
      throw new Error('Input must be a non-empty string');
    }
    
    try {
      // Handle input with or without spaces
      const binaryGroups = binary.includes(' ') 
        ? binary.split(' ')
        : binary.match(/.{1,8}/g) || [];
      
      return binaryGroups
        .filter(bin => bin.trim() !== '') // Filter out empty strings
        .map(bin => {
          const charCode = parseInt(bin, 2);
          if (isNaN(charCode) || charCode <= 0 || charCode > 127) {
            throw new Error(`Invalid binary value: ${bin}`);
          }
          return String.fromCharCode(charCode);
        })
        .join('');
    } catch (error) {
      throw new Error(`Failed to convert binary to text: ${error.message}`);
    }
  }
}

// Initialize the processor
new BinaryConverterProcessor();
