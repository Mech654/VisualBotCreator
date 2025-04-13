import { Node, Port, NodeProperties } from '../base.js';

export interface Option {
  text: string;
  value: string;
}

export interface OptionsNodeProperties extends NodeProperties {
  title?: string;
  options?: Option[];
}

export class OptionsNode extends Node {
  constructor(id: string, properties: OptionsNodeProperties = {}) {
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
  
  process(inputValues: Record<string, any>, selectedOptionIndex: number | null = null): Record<string, any> {
    if (selectedOptionIndex !== null && 
        selectedOptionIndex >= 0 && 
        selectedOptionIndex < this.properties.options.length) {
      
      const selectedOption = this.properties.options[selectedOptionIndex];
      
      return {
        selectedOption: selectedOption.value
      };
    }
    
    return {};
  }
  
  getOptionTexts(): string[] {
    return (this.properties.options as Option[]).map(option => option.text);
  }
}