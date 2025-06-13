import { BaseProcessor } from './BaseProcessor.js';
import vm from 'vm';

class SandBoxProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Check runtimeInputs first (from connected nodes), then fall back to properties
      const jsCode = runtimeInputs.jsCode || this.getProperty(properties, 'jsCode', 'return input1 + input2;');
      const input1 = runtimeInputs.input1;
      const input2 = runtimeInputs.input2;
      const input3 = runtimeInputs.input3;
      const input4 = runtimeInputs.input4;
      const input5 = runtimeInputs.input5;

      if (!jsCode) {
        return {
          output: 'Error: No JavaScript code provided',
          result: null,
          status: false,
          exitCode: 1,
        };
      }

      let result = null;
      let status = true;
      let output = '';

      try {
        // Create a safe execution context using vm
        const sandbox = {
          input1,
          input2,
          input3,
          input4,
          input5,
          Math,
          String,
          Number,
          Boolean,
          Array,
          Object,
          JSON,
          Date,
          RegExp,
          console: {
            log: (...args) => {
              console.log('[SandBox]', ...args);
            },
          },
          result: undefined,
        };

        // Wrap the user code in a function
        const wrappedCode = `
          (function() {
            try {
              ${jsCode}
            } catch (error) {
              throw error;
            }
          })()
        `;

        // Create VM context
        const context = vm.createContext(sandbox);
        
        // Execute the code with timeout
        result = vm.runInContext(wrappedCode, context, {
          timeout: 5000, // 5 second timeout
          displayErrors: true
        });

        status = true;
        output = `JavaScript executed successfully. Result: ${JSON.stringify(result)}`;

      } catch (error) {
        result = null;
        status = false;
        output = `JavaScript execution error: ${error.message}`;
        console.error('[SandBoxProcessor] Execution error:', error.message);
      }

      return {
        output: output,
        result: result,
        status: status,
        exitCode: status ? 0 : 1,
      };
    } catch (error) {
      console.error('[SandBoxProcessor] Error during processing:', error.message);

      return {
        output: `Error processing sandbox: ${error.message}`,
        result: null,
        status: false,
        exitCode: 1,
      };
    }
  }
}

new SandBoxProcessor();