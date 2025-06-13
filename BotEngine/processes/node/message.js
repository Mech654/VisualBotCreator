import { BaseProcessor } from './BaseProcessor.js';

class MessageProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the node properties
      const nodeProperties = properties.properties || {};
      const message = nodeProperties.message || 'Enter your message here...';
      const delay = nodeProperties.delay || 500;
      const variableName = nodeProperties.variableName || 'message';

      // Process the message (could include variable substitution)
      let processedMessage = message;
      
      // Simple variable substitution
      Object.keys(runtimeInputs).forEach(key => {
        if (key !== 'previous') {
          const value = runtimeInputs[key];
          processedMessage = processedMessage.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        }
      });

      // Simulate delay if needed (in a real implementation)
      if (delay > 0) {
        // In a real bot, this would cause a delay before sending the message
        console.log(`[MessageProcessor] Simulating ${delay}ms delay`);
      }

      return {
        output: `Message: ${processedMessage}`,
        messageText: processedMessage,
        [variableName]: processedMessage,
        exitCode: 0,
        status: true,
      };
    } catch (error) {
      console.error('[MessageProcessor] Error during processing:', error.message);

      return {
        output: `Error processing message: ${error.message}`,
        messageText: '',
        exitCode: 1,
        status: false,
      };
    }
  }
}

new MessageProcessor();
