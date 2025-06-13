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

      // Format options for display
      const optionTexts = options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n');

      return {
        output: `Options presented:\n${optionTexts}\nSelected: ${selectedOption ? selectedOption.text : 'None'}`,
        selectedOption: selectedOption ? selectedOption.value : null,
        selectedOptionText: selectedOption ? selectedOption.text : null,
        selectedOptionIndex: selectedOptionIndex,
        resultPath: resultPath,
        options: options,
        exitCode: 0,
        status: true,
      };
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
