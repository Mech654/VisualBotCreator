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
    properties.incrementBy = properties.incrementBy || 1;
    properties.title = properties.title || 'Increment';

    properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${properties.incrementBy}</span></div>`;

    super(id, 'increment', properties);

    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    this.addInput(new Port('number', 'Number', 'number'));
    this.addOutput(new Port('result', 'Result', 'number'));
  }

  updateNodeContent() {
    this.properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${this.properties.incrementBy}</span></div>`;
    return this.properties.nodeContent;
  }
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
    const inputNumber = typeof inputValues['number'] === 'number' ? inputValues['number'] : 0;

    const incrementBy = this.properties.incrementBy || 1;

    const result = inputNumber + incrementBy;

    return {
      result: result,
    };
  }
}
