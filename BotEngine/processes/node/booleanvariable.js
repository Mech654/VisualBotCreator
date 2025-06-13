import { BaseProcessor } from './BaseProcessor.js';

class BooleanVariableProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the node properties
      const nodeProperties = properties.properties || {};
      const value = typeof nodeProperties.value === 'boolean' ? nodeProperties.value : false;

      return {
        output: `Boolean value: ${value ? 'true' : 'false'}`,
        value: value,
        exitCode: 0,
        status: true,
        // Include all node properties so they can be accessed by propertyKey
        ...nodeProperties
      };
    } catch (error) {
      console.error('[BooleanVariableProcessor] Error during processing:', error.message);

      return {
        output: `Error processing boolean variable: ${error.message}`,
        value: false,
        exitCode: 1,
        status: false,
      };
    }
  }
}

new BooleanVariableProcessor();
