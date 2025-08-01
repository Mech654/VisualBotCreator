import { BaseProcessor } from './BaseProcessor.js';

class RandomProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};

      // Get the random generation parameters, checking runtimeInputs first, then properties
      const min =
        runtimeInputs.min !== undefined
          ? Number(runtimeInputs.min)
          : Number(this.getProperty(properties, 'min', 1));
      const max =
        runtimeInputs.max !== undefined
          ? Number(runtimeInputs.max)
          : Number(this.getProperty(properties, 'max', 100));
      const type = this.getProperty(properties, 'type', 'integer');
      const length = Number(this.getProperty(properties, 'length', 10));
      const seed = runtimeInputs.seed;

      // If seed is provided, use it (simple seeded random)
      let random = Math.random;
      if (seed !== undefined) {
        const seedNum = Number(seed);
        // Simple seeded random implementation
        random = () => {
          const x = Math.sin(seedNum) * 10000;
          return x - Math.floor(x);
        };
      }

      let value;
      let output = '';

      switch (type) {
        case 'integer':
          value = Math.floor(random() * (max - min + 1)) + min;
          output = `Random integer: ${value} (range: ${min}-${max})`;
          break;

        case 'float':
          value = random() * (max - min) + min;
          value = Math.round(value * 1000000) / 1000000; // Round to 6 decimal places
          output = `Random float: ${value} (range: ${min}-${max})`;
          break;

        case 'boolean':
          value = random() >= 0.5;
          output = `Random boolean: ${value}`;
          break;

        case 'string':
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(random() * chars.length));
          }
          value = result;
          output = `Random string: "${value}" (length: ${length})`;
          break;

        default:
          value = random() * (max - min) + min;
          output = `Random value: ${value} (range: ${min}-${max})`;
      }

      const responseData = {
        output: output,
        value: value,
        exitCode: 0,
        status: true,
      };

      return responseData;
    } catch (error) {
      console.error('[RandomProcessor] Error during processing:', error.message);

      return {
        output: `Error processing random generation: ${error.message}`,
        value: null,
        exitCode: 1,
        status: false,
      };
    }
  }
}

new RandomProcessor();
