import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface StringVariableNodeProperties extends NodeProperties {
  value?: string;
  title?: string;
  nodeContent?: string;
  language?: string;
}

export class StringVariableNode extends Node {
  static metadata = {
    name: 'String Variable',
    category: ComponentCategory.VARIABLE,
    description: 'A string variable node',
    flowType: 'data',
    icon: '🔤',
  };

  static override shownProperties = ['value'];

  constructor(id: string, properties: StringVariableNodeProperties = {}) {
    properties.title =
      properties.title !== undefined && properties.title !== null && properties.title !== ''
        ? properties.title
        : 'String Variable';
    properties.value =
      properties.value !== undefined && properties.value !== null && properties.value !== ''
        ? properties.value
        : '';
    properties.language =
      properties.language !== undefined &&
      properties.language !== null &&
      properties.language !== ''
        ? properties.language
        : 'JavaScript';
    properties.nodeContent = `<span class="variable-string">${properties.value}</span>`;
    super(id, 'stringvariable', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('value', 'Value', 'string', 'value'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = `<span class="variable-string">${this.properties.value}</span>`;
    return this.properties.nodeContent as string;
  }

  process(): { value: string } {
    return { value: this.properties.value as string };
  }
}
