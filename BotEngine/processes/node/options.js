import { BaseProcessor } from './BaseProcessor.js';

class OptionsProcessor extends BaseProcessor {
  process(executionData) {
    try {
      // Extract properties and runtimeInputs from the execution data
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      
      // Get the node properties
      const nodeProperties = properties.properties || {};
      const options = nodeProperties.options || [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' },
        { text: 'Option 3', value: 'option3' },
      ];

      // Get selected option index (this would come from user interaction in a real bot)
      const selectedOptionIndex = runtimeInputs.selectedOptionIndex || 0;
      
      let selectedOption = null;
      let resultPath = 'next';

      if (selectedOptionIndex >= 0 && selectedOptionIndex < options.length) {
        selectedOption = options[selectedOptionIndex];
        resultPath = `option${selectedOptionIndex + 1}`;
      }

      // Find the next node based on the selected option
      let nextNodeId = null;
      if (executionData.outputs) {
        const outputPort = executionData.outputs.find(output => output.id === resultPath);
        if (outputPort && outputPort.connectedTo && outputPort.connectedTo.length > 0) {
          nextNodeId = outputPort.connectedTo[0].toNodeId;
        }
      }

      // Format options for display
      const optionTexts = options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n');

      const responseData = {
        output: `Options presented:\n${optionTexts}\nSelected: ${selectedOption ? selectedOption.text : 'None'}`,
        selectedOption: selectedOption ? selectedOption.value : null,
        selectedOptionText: selectedOption ? selectedOption.text : null,
        selectedOptionIndex: selectedOptionIndex,
        resultPath: resultPath,
        options: options,
        exitCode: 0,
        status: true,
      };

      // Add NextNodeId only if this is a flow node and we found a connection
      if (nextNodeId) {
        responseData.NextNodeId = nextNodeId;
      }

      return responseData;
    } catch (error) {
      console.error('[OptionsProcessor] Error during processing:', error.message);

      return {
        output: `Error processing options: ${error.message}`,
        selectedOption: null,
        selectedOptionText: null,
        selectedOptionIndex: -1,
        resultPath: 'next',
        options: [],
        exitCode: 1,
        status: false,
      };
    }
  }
}

new OptionsProcessor();
