import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface InputNodeProperties extends NodeProperties {
  title?: string;
  placeholder?: string;
  variableName?: string;
  inputType?: 'text' | 'number' | 'email' | 'password';
  validation?: string | null;
}

export class InputNode extends Node {
  // Update to use ComponentCategory enum
  static metadata = {
    name: 'Input',
    category: ComponentCategory.INPUT_OUTPUT,
    description: 'Get input from the user',
    flowType: 'flow',
    icon: '📝'
  };

  constructor(id: string, properties: InputNodeProperties = {}) {
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

  process(inputValues: Record<string, any>, userInput: string = ''): Record<string, any> {
    let isValid = true;
    if (this.properties.validation && userInput) {
      try {
        const regex = new RegExp(this.properties.validation as string);
        isValid = regex.test(userInput);
      } catch (error) {
        isValid = false;
      }
    }

    let processedInput: string | number = userInput;
    if (this.properties.inputType === 'number') {
      processedInput = userInput ? parseFloat(userInput) : 0;
    }

    return {
      inputValue: processedInput,
      isValid: isValid
    };
  }
}