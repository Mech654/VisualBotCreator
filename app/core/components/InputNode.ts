import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface InputNodeProperties extends NodeProperties {
  title?: string;
  placeholder?: string;
  variableName?: string;
  inputType?: 'text' | 'number' | 'email' | 'password';
  validation?: string | null;
  nodeContent?: string; // Add nodeContent property
}

export class InputNode extends Node {
  // Update to use ComponentCategory enum
  static metadata = {
    name: 'Input',
    category: ComponentCategory.INPUT_OUTPUT,
    description: 'Get input from the user',
    flowType: 'flow',
    icon: '📝',
  };

  static override shownProperties = ['variableName', 'inputType', 'placeholder'];

  constructor(id: string, properties: InputNodeProperties = {}) {
    // Set defaults
    properties.title = properties.title || 'User Input';
    properties.placeholder = properties.placeholder || 'Type your response...';
    properties.variableName = properties.variableName || 'userInput';
    properties.inputType = properties.inputType || 'text';
    properties.validation = properties.validation || null;

    // Generate the node content without using 'this'
    const inputType = properties.inputType || 'text';
    const placeholder = properties.placeholder || 'Type your response...';

    properties.nodeContent = `
      <div class="input-preview">
        <div class="input-field-${inputType}">${placeholder}</div>
        <div class="input-type-badge">${inputType}</div>
      </div>
    `;

    super(id, 'input', properties);

    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('inputValue', 'Input Value', 'string'));
    this.addOutput(new Port('isValid', 'Is Valid', 'boolean'));
  }

  /** Generate preview content for the input node */
  generateInputPreview(props: InputNodeProperties): string {
    const inputType = props.inputType || 'text';
    const placeholder = props.placeholder || 'Type your response...';
    return `
      <div class="input-preview">
        <div class="input-field-${inputType}">${placeholder}</div>
        <div class="input-type-badge">${inputType}</div>
      </div>
    `;
  }

  /** Update the node content when properties change */
  updateNodeContent() {
    this.properties.nodeContent = this.generateInputPreview(this.properties);
    return this.properties.nodeContent;
  }

  /** Generate the HTML for the input node's properties panel */
  generatePropertiesPanel(): string {
    return `
      <div class="property-group-title">Input Settings</div>
      <div class="property-item" data-tooltip="Placeholder text shown in the input field">
        <div class="property-label">Placeholder</div>
        <input type="text" class="property-input input-placeholder" value="${this.properties.placeholder}" aria-label="Input placeholder">
      </div>
      <div class="property-item" data-tooltip="Variable name to store the user's input">
        <div class="property-label">Variable Name</div>
        <input type="text" class="property-input input-variable" value="${this.properties.variableName}" aria-label="Input variable name">
      </div>
      <div class="property-item" data-tooltip="Type of input field to display">
        <div class="property-label">Input Type</div>
        <select class="property-input input-type" aria-label="Input type">
          <option value="text" ${this.properties.inputType === 'text' ? 'selected' : ''}>Text</option>
          <option value="number" ${this.properties.inputType === 'number' ? 'selected' : ''}>Number</option>
          <option value="email" ${this.properties.inputType === 'email' ? 'selected' : ''}>Email</option>
          <option value="password" ${this.properties.inputType === 'password' ? 'selected' : ''}>Password</option>
        </select>
      </div>
      <div class="property-item" data-tooltip="Regular expression pattern for validation (optional)">
        <div class="property-label">Validation Pattern</div>
        <input type="text" class="property-input input-validation" placeholder="e.g. ^[A-Za-z0-9]+$" 
               value="${this.properties.validation || ''}" aria-label="Validation pattern">
      </div>
    `;
  }

  /** Set up event listeners for the input node property panel */
  setupPropertyEventListeners(panel: HTMLElement): void {
    const placeholderInput = panel.querySelector('.input-placeholder') as HTMLInputElement;
    const variableInput = panel.querySelector('.input-variable') as HTMLInputElement;
    const typeSelect = panel.querySelector('.input-type') as HTMLSelectElement;
    const validationInput = panel.querySelector('.input-validation') as HTMLInputElement;

    if (placeholderInput) {
      placeholderInput.addEventListener('change', () => {
        this.properties.placeholder = placeholderInput.value;
        this.updateNodeContent();
      });
    }

    if (variableInput) {
      variableInput.addEventListener('change', () => {
        this.properties.variableName = variableInput.value;
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        this.properties.inputType = typeSelect.value as any;
        this.updateNodeContent();
      });
    }

    if (validationInput) {
      validationInput.addEventListener('change', () => {
        this.properties.validation = validationInput.value || null;
      });
    }
  }

  process(inputValues: Record<string, any>, userInput: string = ''): Record<string, any> {
    let isValid = true;
    if (this.properties.validation && userInput) {
      try {
        const regex = new RegExp(String(this.properties.validation));
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
      isValid: isValid,
    };
  }
}
