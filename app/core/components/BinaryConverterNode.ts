import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface BinaryConverterNodeProperties extends NodeProperties {
  inputValue?: string;
  outputValue?: string;
  lastDetectedType?: string; // Just for internal use to know what was detected
  nodeContent?: string;
  language?: string;
}

export class BinaryConverterNode extends Node {
  static metadata = {
    name: 'Binary Converter',
    category: ComponentCategory.DATA,
    description: 'Converts text to binary or binary to text automatically',
    flowType: 'data',
    icon: '⚙️',
  };

  static override shownProperties = ['inputValue'];

  constructor(
    id: string,
    properties: BinaryConverterNodeProperties = {},
    position: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    super(id, 'binaryconverter', properties, position);
    properties.language = properties.language || 'JavaScript';
    properties.inputValue =
      properties.inputValue !== null && properties.inputValue !== undefined
        ? properties.inputValue
        : '';
    properties.outputValue =
      properties.outputValue !== null && properties.outputValue !== undefined
        ? properties.outputValue
        : '';
    properties.lastDetectedType = '';
    properties.nodeContent = `<div class="binary-converter-content">
            <div class="conversion-type" style="justify-self: center;">Text <span class="conversion-icon">⟳</span> Binary</div>
            <div class="input-preview">${this.truncateText(properties.inputValue || '', 20)}</div>
        </div>`;

    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('input', 'Input', 'string'));
    this.addOutput(new Port('output', 'Output', 'string'));
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  updateNodeContent(): string {
    const props = this.properties as BinaryConverterNodeProperties;
    let highlightClass = '';

    const lastType = props.lastDetectedType;
    if (lastType !== undefined && lastType !== null && lastType !== '') {
      highlightClass = ` highlight-${lastType}`;
    }

    props.nodeContent = `<div class="binary-converter-content">
            <div class="conversion-type${highlightClass}" style="align">Text <span class="conversion-icon">⟳</span> Binary</div>
            <div class="input-preview">${this.truncateText(props.inputValue !== null && props.inputValue !== undefined ? props.inputValue : '', 20)}</div>
        </div>`;
    return props.nodeContent;
  }

  generatePropertiesPanel(): string {
    const props = this.properties as BinaryConverterNodeProperties;
    return `
            <div class="property-group-title">Binary Converter</div>
            <div class="property-row info-row">
                <div class="info-message">This node automatically detects and converts between text and binary.</div>
            </div>
            <div class="property-row">
                <label for="inputValue">Test Input:</label>
                <textarea id="inputValue">${props.inputValue !== null && props.inputValue !== undefined ? props.inputValue : ''}</textarea>
            </div>
            <div class="property-row">
                <label>Test Output:</label>
                <div class="output-preview">${props.outputValue !== null && props.outputValue !== undefined ? props.outputValue : ''}</div>
            </div>
            <button id="testConvert" class="btn btn-primary">Test Conversion</button>
        `;
  }

  setupPropertyEventListeners(panel: HTMLElement): void {
    const inputValueField = panel.querySelector('#inputValue') as HTMLTextAreaElement;
    const testButton = panel.querySelector('#testConvert') as HTMLButtonElement;

    if (inputValueField !== null && inputValueField !== undefined) {
      inputValueField.addEventListener('input', () => {
        (this.properties as BinaryConverterNodeProperties).inputValue = inputValueField.value;
      });
    }

    if (testButton !== null && testButton !== undefined) {
      testButton.addEventListener('click', () => {
        this.testConversion();
      });
    }
  }

  private testConversion(): void {
    const props = this.properties as BinaryConverterNodeProperties;
    const inputValue =
      props.inputValue !== null && props.inputValue !== undefined ? props.inputValue : '';
    let output = '';
    let detectedType = '';

    // Always auto-detect
    if (inputValue.trim() !== '') {
      // Check if input looks like binary (only contains 0s, 1s, and spaces)
      if (/^[01\s]+$/.test(inputValue)) {
        detectedType = 'fromBinary';
      } else {
        detectedType = 'toBinary';
      }
    }

    // Store the detected type
    props.lastDetectedType = detectedType;

    if (detectedType === 'toBinary') {
      output = this.textToBinary(inputValue);
    } else if (detectedType === 'fromBinary') {
      output = this.binaryToText(inputValue);
    }

    props.outputValue = output;
    this.updateNodeContent(); // Update to s
    // how the conversion direction

    // Update the output preview in the properties panel
    const outputPreview = document.querySelector('.output-preview');
    if (outputPreview !== null) {
      outputPreview.textContent = output;
    }
  }

  private textToBinary(text: string): string {
    return text
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  }

  private binaryToText(binary: string): string {
    try {
      if (!binary || binary.trim() === '') return '';

      // Handle input with or without spaces
      const binaryGroups = binary.includes(' ') ? binary.split(' ') : binary.match(/.{1,8}/g) || [];

      return binaryGroups
        .filter(bin => bin.trim() !== '') // Filter out empty strings
        .map(bin => {
          const charCode = parseInt(bin, 2);
          if (isNaN(charCode) || charCode <= 0 || charCode > 127) {
            throw new Error(`Invalid binary value: ${bin}`);
          }
          return String.fromCharCode(charCode);
        })
        .join('');
    } catch {
      return 'Invalid binary format';
    }
  }
}
