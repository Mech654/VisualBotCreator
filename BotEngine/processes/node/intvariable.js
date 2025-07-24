import { BaseProcessor } from './BaseProcessor.js';

class IntVariableProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};

      // Get the value, checking runtimeInputs first, then properties
      const value =
        runtimeInputs.value !== undefined
          ? runtimeInputs.value
          : this.getProperty(properties, 'value', 0);
      const intValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;

      return {
        output: `Integer value: ${intValue}`,
        value: intValue,
        exitCode: 0,
        status: true,
        // Include all properties so they can be accessed by propertyKey
        ...properties,
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
