import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface IncrementNodeProperties extends NodeProperties {
  incrementBy?: number;
  nodeContent?: string; // Add nodeContent property
}

export class IncrementNode extends Node {
  static metadata = {
    name: 'Increment',
    category: ComponentCategory.DATA_PROCESSING,
    description: 'Takes a number and increments it',
    flowType: 'data',
    icon: '➕',
  };

  static override shownProperties = ['incrementBy'];

  constructor(id: string, properties: IncrementNodeProperties = {}) {
    // Set default increment value to 1 if not provided
    properties.incrementBy = properties.incrementBy || 1;
    properties.title = properties.title || 'Increment';

    // Generate the node content
    properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${properties.incrementBy}</span></div>`;

    super(id, 'increment', properties);

    // Add flow control ports
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Add data ports
    this.addInput(new Port('number', 'Number', 'number'));
    this.addOutput(new Port('result', 'Result', 'number'));
  }

  /** Update the node content when the increment value changes */
  updateNodeContent() {
    this.properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${this.properties.incrementBy}</span></div>`;
    return this.properties.nodeContent;
  }
  /** Generate the HTML for the increment node's properties panel */
  generatePropertiesPanel(): string {
    return `
            <div class="property-group-title">Increment Settings</div>
            <div class="property-item" data-tooltip="Amount to increment the input number by">
                <div class="property-label">Increment By</div>
                <input type="number" class="property-input increment-by-value" 
                       value="${this.properties.incrementBy || 1}" step="1">
            </div>
            <div class="property-item">
                <div class="property-label">Description</div>
                <div class="property-value">
                    This node takes a number input and adds the specified increment value to it.
                </div>
            </div>
        `;
  }
  /** Set up event listeners for the increment node property panel */
  setupPropertyEventListeners(panel: HTMLElement): void {
    const incrementInput = panel.querySelector('.increment-by-value') as HTMLInputElement;

    if (incrementInput) {
      incrementInput.addEventListener('change', () => {
        this.properties.incrementBy = Number(incrementInput.value);
        this.updateNodeContent();
      });
    }
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    // Get the input number or default to 0
    const inputNumber = typeof inputValues['number'] === 'number' ? inputValues['number'] : 0;

    // Get the increment amount from properties
    const incrementBy = this.properties.incrementBy || 1;

    // Calculate the result
    const result = inputNumber + incrementBy;

    // Return the incremented number
    return {
      result: result,
    };
  }
}
