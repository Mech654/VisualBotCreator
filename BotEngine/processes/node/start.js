import { BaseProcessor } from './BaseProcessor.js';

class StartProcessor extends BaseProcessor {
  process(properties) {
    // The start node is the entry point of the bot flow
    // It simply indicates that the bot execution has started
    
    try {
      
      // Return success status to indicate the bot has started successfully
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

// Instantiate the processor to handle incoming requests
new StartProcessor();