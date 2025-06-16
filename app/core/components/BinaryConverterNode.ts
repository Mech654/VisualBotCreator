import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface BinaryConverterNodeProperties extends NodeProperties {
  conversionType?: string; // 'toBinary' or 'fromBinary'
  inputValue?: string;
  outputValue?: string;
  nodeContent?: string;
}

export class BinaryConverterNode extends Node {
  static metadata = {
    name: 'Binary Converter',
    category: ComponentCategory.DATA,
    description: 'Converts text to binary or binary to text',
    flowType: 'data',
    icon: '⚙️',
  };

  static override shownProperties = ['conversionType', 'inputValue'];

  constructor(id: string, properties: BinaryConverterNodeProperties = {}) {
    super(id, 'binaryconverter', properties);
    properties.conversionType =
      properties.conversionType !== null &&
      properties.conversionType !== undefined &&
      properties.conversionType !== ''
        ? properties.conversionType
        : 'toBinary';
    properties.inputValue =
      properties.inputValue !== null && properties.inputValue !== undefined
        ? properties.inputValue
        : '';
    properties.outputValue =
      properties.outputValue !== null && properties.outputValue !== undefined
        ? properties.outputValue
        : '';
    properties.nodeContent = `<div class="binary-converter-content">
            <div class="conversion-type">${properties.conversionType === 'toBinary' ? 'Text → Binary' : 'Binary → Text'}</div>
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
    props.nodeContent = `<div class="binary-converter-content">
            <div class="conversion-type">${props.conversionType === 'toBinary' ? 'Text → Binary' : 'Binary → Text'}</div>
            <div class="input-preview">${this.truncateText(props.inputValue !== null && props.inputValue !== undefined ? props.inputValue : '', 20)}</div>
        </div>`;
    return props.nodeContent;
  }

  generatePropertiesPanel(): string {
    const props = this.properties as BinaryConverterNodeProperties;
    return `
            <div class="property-group-title">Conversion Settings</div>
            <div class="property-row">
                <label for="conversionType">Conversion Type:</label>
                <select id="conversionType" value="${props.conversionType}">
                    <option value="toBinary" ${props.conversionType === 'toBinary' ? 'selected' : ''}>Text to Binary</option>
                    <option value="fromBinary" ${props.conversionType === 'fromBinary' ? 'selected' : ''}>Binary to Text</option>
                </select>
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
    const conversionTypeSelect = panel.querySelector('#conversionType') as HTMLSelectElement;
    const inputValueField = panel.querySelector('#inputValue') as HTMLTextAreaElement;
    const testButton = panel.querySelector('#testConvert') as HTMLButtonElement;

    if (conversionTypeSelect !== null && conversionTypeSelect !== undefined) {
      conversionTypeSelect.addEventListener('change', () => {
        (this.properties as BinaryConverterNodeProperties).conversionType =
          conversionTypeSelect.value;
        this.updateNodeContent();
      });
    }

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

    if (props.conversionType === 'toBinary') {
      output = this.textToBinary(inputValue);
    } else {
      output = this.binaryToText(inputValue);
    }

    props.outputValue = output;

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
      return binary
        .split(' ')
        .map(bin => String.fromCharCode(parseInt(bin, 2)))
        .join('');
    } catch {
      return 'Invalid binary format';
    }
  }

  process(inputValues: Record<string, string | undefined>): Record<string, string> {
    const props = this.properties as BinaryConverterNodeProperties;
    let input: string;
    if (
      typeof inputValues.input === 'string' &&
      inputValues.input !== null &&
      inputValues.input !== undefined
    ) {
      input = inputValues.input;
    } else if (
      typeof props.inputValue === 'string' &&
      props.inputValue !== null &&
      props.inputValue !== undefined
    ) {
      input = props.inputValue;
    } else {
      input = '';
    }
    let output = '';

    if (props.conversionType === 'toBinary') {
      output = this.textToBinary(input);
    } else {
      output = this.binaryToText(input);
    }

    return { output };
  }
}
