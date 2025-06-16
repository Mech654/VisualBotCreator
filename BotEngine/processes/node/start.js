import { BaseProcessor } from './BaseProcessor.js';

class StartProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Find the next node connected to the 'next' output
      let nextNodeId = null;
      if (executionData.outputs) {
        const nextOutput = executionData.outputs.find(output => output.id === 'next');
        if (nextOutput && nextOutput.connectedTo && nextOutput.connectedTo.length > 0) {
          nextNodeId = nextOutput.connectedTo[0].toNodeId;
        }
      }

      const responseData = {
        output: 'Bot conversation started',
        exitCode: 0,
        status: true,
      };

      // Add NextNodeId only if this is a flow node and we found a connection
      if (nextNodeId) {
        responseData.NextNodeId = nextNodeId;
      }

      return responseData;
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
