import { BaseProcessor } from './BaseProcessor.js';

class StringVariableProcessor extends BaseProcessor {
  process(properties) {
    try {
      console.error('[StringVariableProcessor] Received properties:', JSON.stringify(properties, null, 2));
      
      // Get the node properties from the execution data
      const nodeProperties = properties.properties || {};
      
      // Return all properties so they can be accessed dynamically by their propertyKey
      const result = {
        output: nodeProperties.value || '', // For display/logging
        exitCode: 0,
        status: true,
        // Include all node properties so they can be accessed by propertyKey
        ...nodeProperties
      };
      
      console.error('[StringVariableProcessor] Returning result:', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('[StringVariableProcessor] Error during processing:', error.message);

      return {
        output: `Error processing string variable: ${error.message}`,
        exitCode: 1,
        status: false,
      };
    }
  }
}

new StringVariableProcessor();