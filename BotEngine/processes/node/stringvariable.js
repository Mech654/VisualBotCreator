import { BaseProcessor } from './BaseProcessor.js';

class StringVariableProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the value, checking runtimeInputs first, then properties
      const value = runtimeInputs.value || this.getProperty(properties, 'value', '');
      
      return {
        output: value, // For display/logging
        value: value,
        exitCode: 0,
        status: true,
        // Include all properties so they can be accessed by propertyKey
        ...properties
      };
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