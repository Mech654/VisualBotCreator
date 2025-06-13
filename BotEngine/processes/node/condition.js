import { BaseProcessor } from './BaseProcessor.js';

class ConditionProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the condition and value to check
      const nodeProperties = properties.properties || {};
      const conditionString = nodeProperties.condition || 'value == true';
      const valueToCheck = runtimeInputs.value;

      let result = false;
      let resultPath = 'false';

      try {
        if (conditionString === 'value == true') {
          result = valueToCheck === true;
        } else if (conditionString === 'value == false') {
          result = valueToCheck === false;
        } else if (conditionString.includes('==')) {
          const parts = conditionString.split('==').map(part => part.trim());
          if (parts[0] === 'value') {
            // Try to parse the expected value as number, boolean, or string
            let expectedValue = parts[1];
            if (expectedValue === 'true') expectedValue = true;
            else if (expectedValue === 'false') expectedValue = false;
            else if (!isNaN(expectedValue)) expectedValue = parseFloat(expectedValue);
            else if (expectedValue.startsWith('"') && expectedValue.endsWith('"')) {
              expectedValue = expectedValue.slice(1, -1);
            }
            result = valueToCheck == expectedValue;
          }
        } else if (conditionString.includes('>=')) {
          const threshold = parseFloat(conditionString.split('>=')[1].trim());
          result = parseFloat(String(valueToCheck)) >= threshold;
        } else if (conditionString.includes('<=')) {
          const threshold = parseFloat(conditionString.split('<=')[1].trim());
          result = parseFloat(String(valueToCheck)) <= threshold;
        } else if (conditionString.includes('>')) {
          const threshold = parseFloat(conditionString.split('>')[1].trim());
          result = parseFloat(String(valueToCheck)) > threshold;
        } else if (conditionString.includes('<')) {
          const threshold = parseFloat(conditionString.split('<')[1].trim());
          result = parseFloat(String(valueToCheck)) < threshold;
        } else if (conditionString.includes('!=')) {
          const parts = conditionString.split('!=').map(part => part.trim());
          if (parts[0] === 'value') {
            // Try to parse the expected value
            let expectedValue = parts[1];
            if (expectedValue === 'true') expectedValue = true;
            else if (expectedValue === 'false') expectedValue = false;
            else if (!isNaN(expectedValue)) expectedValue = parseFloat(expectedValue);
            else if (expectedValue.startsWith('"') && expectedValue.endsWith('"')) {
              expectedValue = expectedValue.slice(1, -1);
            }
            result = valueToCheck != expectedValue;
          }
        } else {
          // Default to truthiness check
          result = Boolean(valueToCheck);
        }

        resultPath = result ? 'true' : 'false';
      } catch (error) {
        console.error('[ConditionProcessor] Error evaluating condition:', error.message);
        result = false;
        resultPath = 'false';
      }

      return {
        output: `Condition "${conditionString}" evaluated to: ${result}`,
        result: result,
        resultPath: resultPath,
        exitCode: 0,
        status: true,
      };
    } catch (error) {
      console.error('[ConditionProcessor] Error during processing:', error.message);

      return {
        output: `Error processing condition: ${error.message}`,
        result: false,
        resultPath: 'false',
        exitCode: 1,
        status: false,
      };
    }
  }
}

new ConditionProcessor();
