import { BaseProcessor } from './BaseProcessor.js';

class Base64Processor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};

      // Check runtimeInputs first (from connected nodes), then fall back to properties
      const value = runtimeInputs.value || this.getProperty(properties, 'value', '');

      let base64 = '';
      try {
        if (typeof value === 'string') {
          // Use Buffer for Node.js environment instead of btoa
          base64 = Buffer.from(value, 'utf8').toString('base64');
        } else {
          base64 = Buffer.from(String(value), 'utf8').toString('base64');
        }
      } catch (error) {
        console.error('[Base64Processor] Error encoding to base64:', error.message);
        base64 = '';
      }

      const result = {
        output: `Encoded to Base64: ${base64}`,
        base64: base64,
        exitCode: 0,
        status: true,
      };

      return result;
    } catch (error) {
      console.error('[Base64Processor] Error during processing:', error.message);

      return {
        output: `Error processing base64 encoding: ${error.message}`,
        base64: '',
        exitCode: 1,
        status: false,
      };
    }
  }
}

new Base64Processor();
