import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface BooleanVariableNodeProperties extends NodeProperties {
  value?: boolean;
  title?: string;
  nodeContent?: string;
}

export class BooleanVariableNode extends Node {
  static metadata = {
    name: 'Boolean Variable',
    category: ComponentCategory.VARIABLE,
    description: 'A boolean variable node',
    flowType: 'data',
    icon: '🔘',
  };

  static override shownProperties = ['value'];

  constructor(id: string, properties: BooleanVariableNodeProperties = {}) {
    properties.title = properties.title || 'Boolean Variable';
    properties.value = typeof properties.value === 'boolean' ? properties.value : false;
    properties.nodeContent = `<span class=\"variable-boolean\">${properties.value ? 'true' : 'false'}</span>`;
    super(id, 'booleanvariable', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('value', 'Value', 'boolean', 'value'));
  }

  updateNodeContent() {
    this.properties.nodeContent = `<span class=\"variable-boolean\">${this.properties.value ? 'true' : 'false'}</span>`;
    return this.properties.nodeContent;
  }

  process(): Record<string, any> {
    return { value: this.properties.value };
  }
}
