const { Node, Port } = require('../base');

class OptionsNode extends Node {
  constructor(id, properties = {}) {
    properties.title = properties.title || 'Options';
    
    properties.options = properties.options || [
      { text: 'Option 1', value: 'option1' },
      { text: 'Option 2', value: 'option2' },
      { text: 'Option 3', value: 'option3' }
    ];
    
    super(id, 'options', properties);
    
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    
    properties.options.forEach((option, index) => {
      this.addOutput(new Port(`option${index + 1}`, option.text, 'control'));
    });
    
    this.addOutput(new Port('selectedOption', 'Selected Option', 'string'));
  }
  
  process(inputValues, selectedOptionIndex = null) {
    console.log(`Processing options node ${this.id}`);
    
    if (selectedOptionIndex !== null && 
        selectedOptionIndex >= 0 && 
        selectedOptionIndex < this.properties.options.length) {
      
      const selectedOption = this.properties.options[selectedOptionIndex];
      console.log(`Selected option: ${selectedOption.text}`);
      
      return {
        selectedOption: selectedOption.value
      };
    }
    
    return {};
  }
  
  getOptionTexts() {
    return this.properties.options.map(opt => opt.text);
  }
}

module.exports = OptionsNode;