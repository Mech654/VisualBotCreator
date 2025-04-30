import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface RandomNodeProperties extends NodeProperties {
  min?: number;
  max?: number;
  type?: 'integer' | 'float' | 'boolean' | 'string';
  length?: number;
  nodeContent?: string; // Add nodeContent property
}

export class RandomNode extends Node {
  // Define metadata directly in the component class
  static metadata = {
    name: 'Random',
    category: ComponentCategory.DATA_PROCESSING,
    description: 'Generate random values of different types',
    flowType: 'data',
    icon: '🎲',
  };

  constructor(id: string, properties: RandomNodeProperties = {}) {
    // Set default values
    properties.min = properties.min ?? 1;
    properties.max = properties.max ?? 100;
    properties.type = properties.type || 'integer';
    properties.length = properties.length ?? 10;

    // Generate the node content
    properties.nodeContent = generateRandomNodeContent(properties);

    super(id, 'random', properties);

    // Add basic flow ports
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Add data input ports for configuration
    this.addInput(new Port('min', 'Minimum', 'number'));
    this.addInput(new Port('max', 'Maximum', 'number'));
    this.addInput(new Port('seed', 'Seed', 'number'));

    // Add appropriate output port based on type
    if (properties.type === 'boolean') {
      this.addOutput(new Port('value', 'Random Boolean', 'boolean'));
    } else if (properties.type === 'string') {
      this.addOutput(new Port('value', 'Random String', 'string'));
    } else {
      this.addOutput(new Port('value', 'Random Number', 'number'));
    }
  }
  /** Update the node content when properties change */
  updateNodeContent() {
    this.properties.nodeContent = generateRandomNodeContent(this.properties);
    return this.properties.nodeContent;
  }
  /** Generate properties panel for the random node */
  generatePropertiesPanel(): string {
    return `
            <div class="property-group-title">Random Value Settings</div>
            <div class="property-item" data-tooltip="Type of random value to generate">
                <div class="property-label">Value Type</div>
                <select class="property-input random-type" aria-label="Random type">
                    <option value="integer" ${this.properties.type === 'integer' ? 'selected' : ''}>Integer</option>
                    <option value="float" ${this.properties.type === 'float' ? 'selected' : ''}>Float</option>
                    <option value="boolean" ${this.properties.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                    <option value="string" ${this.properties.type === 'string' ? 'selected' : ''}>String</option>
                </select>
            </div>
            
            ${
              this.properties.type !== 'boolean'
                ? `
            <div class="property-item number-range" data-tooltip="Range for random number generation">
                <div class="property-label">Range</div>
                <div class="range-inputs">
                    <input type="number" class="property-input random-min" value="${this.properties.min}" placeholder="Min">
                    <span class="range-separator">to</span>
                    <input type="number" class="property-input random-max" value="${this.properties.max}" placeholder="Max">
                </div>
            </div>
            `
                : ''
            }
            
            ${
              this.properties.type === 'string'
                ? `
            <div class="property-item" data-tooltip="Length of random string">
                <div class="property-label">String Length</div>
                <input type="number" class="property-input random-length" value="${this.properties.length}" min="1" max="100">
            </div>
            `
                : ''
            }
        `;
  }
  /** Set up event listeners for the random node property panel */
  setupPropertyEventListeners(panel: HTMLElement): void {
    const typeSelect = panel.querySelector('.random-type') as HTMLSelectElement;
    const minInput = panel.querySelector('.random-min') as HTMLInputElement;
    const maxInput = panel.querySelector('.random-max') as HTMLInputElement;
    const lengthInput = panel.querySelector('.random-length') as HTMLInputElement;

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        this.properties.type = typeSelect.value as 'integer' | 'float' | 'boolean' | 'string';
        this.updateNodeContent();

        // Redraw properties panel to show/hide relevant inputs
        const propertiesPanel = document.getElementById('properties-panel');
        if (propertiesPanel) {
          propertiesPanel.innerHTML = this.generatePropertiesPanel();
          this.setupPropertyEventListeners(propertiesPanel);
        }
      });
    }

    if (minInput) {
      minInput.addEventListener('change', () => {
        this.properties.min = Number(minInput.value);
        this.updateNodeContent();
      });
    }

    if (maxInput) {
      maxInput.addEventListener('change', () => {
        this.properties.max = Number(maxInput.value);
        this.updateNodeContent();
      });
    }

    if (lengthInput) {
      lengthInput.addEventListener('change', () => {
        this.properties.length = Number(lengthInput.value);
        this.updateNodeContent();
      });
    }
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    // Get configured values or use input values if provided
    const min = inputValues.min !== undefined ? Number(inputValues.min) : this.properties.min;
    const max = inputValues.max !== undefined ? Number(inputValues.max) : this.properties.max;
    const type = this.properties.type;
    const length = this.properties.length;

    // Generate random value based on type
    let value: any;

    switch (type) {
      case 'integer':
        value = Math.floor(Math.random() * (max - min + 1)) + min;
        break;

      case 'float':
        value = Math.random() * (max - min) + min;
        break;

      case 'boolean':
        value = Math.random() >= 0.5;
        break;

      case 'string':
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        value = result;
        break;

      default:
        value = Math.random() * (max - min) + min;
    }

    return { value };
  }
}

/**
 * Helper function to generate content for the random node
 */
function generateRandomNodeContent(properties: RandomNodeProperties): string {
  const type = properties.type || 'integer';

  let contentHtml = '<div class="random-node-content">';

  switch (type) {
    case 'integer':
      contentHtml += `<div class="random-type-badge">Integer</div>`;
      contentHtml += `<div class="random-range">${properties.min} - ${properties.max}</div>`;
      break;

    case 'float':
      contentHtml += `<div class="random-type-badge">Float</div>`;
      contentHtml += `<div class="random-range">${properties.min} - ${properties.max}</div>`;
      break;

    case 'boolean':
      contentHtml += `<div class="random-type-badge">Boolean</div>`;
      contentHtml += `<div class="random-values">true | false</div>`;
      break;

    case 'string':
      contentHtml += `<div class="random-type-badge">String</div>`;
      contentHtml += `<div class="random-length">Length: ${properties.length}</div>`;
      break;
  }

  contentHtml += '</div>';
  return contentHtml;
}
