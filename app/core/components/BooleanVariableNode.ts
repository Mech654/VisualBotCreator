import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface BooleanVariableNodeProperties extends NodeProperties {
  value?: boolean;
  title?: string;
  nodeContent?: string;
  language?: string;
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
    properties.title = typeof properties.title === 'string' ? properties.title : 'Boolean Variable';
    properties.value = typeof properties.value === 'boolean' ? properties.value : false;
    properties.language =
      typeof properties.language === 'string' ? properties.language : 'JavaScript';
    properties.nodeContent = `<span class="variable-boolean">${(typeof properties.value === 'boolean' ? properties.value : false) ? 'true' : 'false'}</span>`;
    super(id, 'booleanvariable', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('value', 'Value', 'boolean', 'value'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = `<span class="variable-boolean">${(typeof this.properties.value === 'boolean' ? this.properties.value : false) ? 'true' : 'false'}</span>`;
    return this.properties.nodeContent as string;
  }

  process(): { value: boolean } {
    return { value: typeof this.properties.value === 'boolean' ? this.properties.value : false };
  }
}
