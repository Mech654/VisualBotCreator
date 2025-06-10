import { BaseProcessor } from './BaseProcessor.js';

class StartProcessor extends BaseProcessor {
  process(properties) {
    try {
      return {
        output: 'Bot conversation started',
        exitCode: 0,
        status: true,
      };
    } catch (error) {
      console.error('[StartProcessor] Error during start:', error.message);

      return {
        output: `Error starting bot: ${error.message}`,
        exitCode: 1,
        status: false,
      };
    }
  }
}

new StartProcessor();
