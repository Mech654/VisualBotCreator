import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface ConditionNodeProperties extends NodeProperties {
  title?: string;
  condition?: string;
  nodeContent?: string; // Add nodeContent property
}

export class ConditionNode extends Node {
  // Update to use ComponentCategory enum
  static metadata = {
    name: 'Condition',
    category: ComponentCategory.LOGIC,
    description: 'Evaluate a condition and branch flow',
    flowType: 'flow',
    icon: '❓',
  };

  constructor(id: string, properties: ConditionNodeProperties = {}) {
    super(id, 'condition', properties);

    properties.title = properties.title || 'Condition';
    properties.condition = properties.condition || 'value == true';

    // Generate the node content for display directly in properties
    properties.nodeContent = `<p class="condition-expression">if (${properties.condition}) { ... }</p>`;

    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value to Check', 'any'));
    this.addOutput(new Port('true', 'True', 'control'));
    this.addOutput(new Port('false', 'False', 'control'));
    this.addOutput(new Port('result', 'Result', 'boolean'));
  }

  /** Update the node content whenever the condition changes */
  updateNodeContent() {
    this.properties.nodeContent = `<p class="condition-expression">if (${this.properties.condition}) { ... }</p>`;
    return this.properties.nodeContent;
  }
  /** Override the default property panel with a custom one */
  generatePropertiesPanel(): string {
    return `
      <div class="property-group-title">Condition</div>
      <div class="property-item" data-tooltip="Enter a condition to evaluate">
        <div class="property-label">Expression</div>
        <input type="text" class="property-input condition-expression" 
               value="${this.properties.condition}" 
               aria-label="Condition expression">
      </div>
      <div class="property-item">
        <div class="property-label">Help</div>
        <div class="condition-help">
          <p>Use 'value' to refer to the input value.</p>
          <p>Examples:</p>
          <ul>
            <li>value == true</li>
            <li>value > 10</li>
            <li>value != "error"</li>
          </ul>
        </div>
      </div>
    `;
  }
  /** Set up event listeners for the condition node property panel */
  setupPropertyEventListeners(panel: HTMLElement): void {
    const expressionInput = panel.querySelector('.condition-expression') as HTMLInputElement;
    if (expressionInput) {
      expressionInput.addEventListener('change', () => {
        this.properties.condition = expressionInput.value;
        this.updateNodeContent();
      });
    }
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    let result = false;

    try {
      const valueToCheck = inputValues['value'];
      const conditionString = this.properties.condition as string;

      // Safer condition evaluation without eval
      if (conditionString === 'value == true') {
        result = valueToCheck === true;
      } else if (conditionString === 'value == false') {
        result = valueToCheck === false;
      } else if (conditionString.includes('==')) {
        const parts = conditionString.split('==').map(part => part.trim());
        if (parts[0] === 'value') {
          result = valueToCheck == parts[1];
        }
      } else if (conditionString.includes('>')) {
        const threshold = parseFloat(conditionString.split('>')[1].trim());
        result = parseFloat(String(valueToCheck)) > threshold;
      } else if (conditionString.includes('<')) {
        const threshold = parseFloat(conditionString.split('<')[1].trim());
        result = parseFloat(String(valueToCheck)) < threshold;
      } else if (conditionString.includes('!=')) {
        const parts = conditionString.split('!=').map(part => part.trim());
        if (parts[0] === 'value') {
          result = valueToCheck != parts[1];
        }
      } else {
        result = Boolean(valueToCheck);
      }
    } catch (error) {
      result = false;
    }

    return { result };
  }
}
