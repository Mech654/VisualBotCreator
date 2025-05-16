import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface ConditionNodeProperties extends NodeProperties {
  title?: string;
  condition?: string;
  nodeContent?: string;
}

export class ConditionNode extends Node {
  static metadata = {
    name: 'Condition',
    category: ComponentCategory.FLOW,
    description: 'Condition node',
    flowType: 'flow',
  };

  static override shownProperties = ['condition'];

  constructor(id: string, properties: ConditionNodeProperties = {}) {
    super(id, 'condition', properties);
    properties.title = properties.title || 'Condition';
    properties.condition = properties.condition || 'value == true';
    properties.nodeContent = `<p class="condition-expression">if (${properties.condition}) { ... }</p>`;
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value to Check', 'any', 'condition'));
    this.addOutput(new Port('true', 'True', 'control', 'condition'));
    this.addOutput(new Port('false', 'False', 'control', 'condition'));
  }

  updateNodeContent() {
    this.properties.nodeContent = `<p class="condition-expression">if (${this.properties.condition}) { ... }</p>`;
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    let result = false;
    try {
      const valueToCheck = inputValues['value'];
      const conditionString = this.properties.condition as string;
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
