const { Node, Port } = require('../base');

class InputNode extends Node {
  constructor(id, properties = {}) {
    properties.title = properties.title || 'User Input';
    properties.placeholder = properties.placeholder || 'Type your response...';
    properties.variableName = properties.variableName || 'userInput';
    properties.inputType = properties.inputType || 'text';
    properties.validation = properties.validation || null;
    
    super(id, 'input', properties);
    
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('inputValue', 'Input Value', 'string'));
    this.addOutput(new Port('isValid', 'Is Valid', 'boolean'));
  }
  
  process(inputValues, userInput = '') {
    console.log(`Processing input node ${this.id}`);
    
    let isValid = true;
    if (this.properties.validation && userInput) {
      try {
        const regex = new RegExp(this.properties.validation);
        isValid = regex.test(userInput);
      } catch (error) {
        console.error(`Invalid regex pattern in node ${this.id}:`, error);
      }
    }
    
    let processedInput = userInput;
    if (this.properties.inputType === 'number') {
      processedInput = userInput ? parseFloat(userInput) : 0;
    }
    
    return {
      inputValue: processedInput,
      isValid: isValid
    };
  }
}

module.exports = InputNode;