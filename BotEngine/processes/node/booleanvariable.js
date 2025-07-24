import { BaseProcessor } from './BaseProcessor.js';

class BooleanVariableProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};

      // Get the value, checking runtimeInputs first, then properties
      const value =
        runtimeInputs.value !== undefined
          ? runtimeInputs.value
          : this.getProperty(properties, 'value', false);
      const boolValue = typeof value === 'boolean' ? value : Boolean(value);

      return {
        output: `Boolean value: ${boolValue}`,
        value: boolValue,
        exitCode: 0,
        status: true,
        // Include all properties so they can be accessed by propertyKey
        ...properties,
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
