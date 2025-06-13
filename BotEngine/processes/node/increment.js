import { BaseProcessor } from './BaseProcessor.js';

class IncrementProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the increment value and input number
      const nodeProperties = properties.properties || {};
      const incrementBy = nodeProperties.incrementBy || 1;
      const inputNumber = runtimeInputs.number || 0;

      // Ensure both values are numbers
      const numToIncrement = typeof inputNumber === 'number' ? inputNumber : parseFloat(String(inputNumber)) || 0;
      const incrementValue = typeof incrementBy === 'number' ? incrementBy : parseFloat(String(incrementBy)) || 1;
      
      const result = numToIncrement + incrementValue;

      return {
        output: `Incremented ${numToIncrement} by ${incrementValue} = ${result}`,
        result: result,
        exitCode: 0,
        status: true,
      };
    } catch (error) {
      console.error('[IncrementProcessor] Error during processing:', error.message);

      return {
        output: `Error processing increment: ${error.message}`,
        result: 0,
        exitCode: 1,
        status: false,
      };
    }
  }
}

new IncrementProcessor();
