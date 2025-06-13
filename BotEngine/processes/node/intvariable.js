import { BaseProcessor } from './BaseProcessor.js';

class IntVariableProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the node properties
      const nodeProperties = properties.properties || {};
      const value = typeof nodeProperties.value === 'number' ? nodeProperties.value : 0;

      return {
        output: `Integer value: ${value}`,
        value: value,
        exitCode: 0,
        status: true,
        // Include all node properties so they can be accessed by propertyKey
        ...nodeProperties
      };
    } catch (error) {
      console.error('[IntVariableProcessor] Error during processing:', error.message);

      return {
        output: `Error processing integer variable: ${error.message}`,
        value: 0,
        exitCode: 1,
        status: false,
      };
    }
  }
}

new IntVariableProcessor();
