import { BaseProcessor } from './BaseProcessor.js';

class MathProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};

      // Get the expression, checking runtimeInputs first, then properties
      const expression =
        runtimeInputs.expression || this.getProperty(properties, 'expression', 'a + b');

      // Build scope with variables from properties and runtimeInputs
      const scope = { ...properties };

      // Add runtime inputs as variables (these take precedence)
      Object.keys(runtimeInputs).forEach(key => {
        if (key !== 'expression') {
          const value = Number(runtimeInputs[key] || 0);
          scope[key] = isNaN(value) ? 0 : value;
        }
      });

      let result = 0;
      let error = null;

      try {
        // Simple math expression evaluator (since we don't have mathjs in Node.js by default)
        result = this.evaluateMathExpression(expression, scope);
      } catch (evalError) {
        error = evalError.message;
        result = 0;
      }

      const responseData = {
        output: error ? `Math error: ${error}` : `Math result: ${result}`,
        result: result,
        error: error,
        exitCode: error ? 1 : 0,
        status: !error,
      };

      console.error('[MathProcessor] Returning result:', JSON.stringify(responseData));

      return responseData;
    } catch (error) {
      console.error('[MathProcessor] Error during processing:', error.message);

      return {
        output: `Error processing math operation: ${error.message}`,
        result: 0,
        error: error.message,
        exitCode: 1,
        status: false,
      };
    }
  }

  evaluateMathExpression(expression, scope) {
    // Simple expression evaluator for basic math operations
    // Replace variables in the expression with their values
    let processedExpression = expression;

    // Replace variables with their values
    Object.keys(scope).forEach(variable => {
      const regex = new RegExp(`\\b${variable}\\b`, 'g');
      processedExpression = processedExpression.replace(regex, scope[variable]);
    });

    // Basic safety check - only allow numbers, operators, and parentheses
    if (!/^[0-9+\-*/().\s]+$/.test(processedExpression)) {
      throw new Error('Invalid mathematical expression');
    }

    try {
      // Use Function constructor to safely evaluate the expression
      return Function(`"use strict"; return (${processedExpression})`)();
    } catch (error) {
      throw new Error(`Math evaluation error: ${error.message}`);
    }
  }
}

new MathProcessor();
