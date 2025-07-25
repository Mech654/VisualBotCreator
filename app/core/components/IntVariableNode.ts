import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface IntVariableNodeProperties extends NodeProperties {
  value?: number;
  title?: string;
  nodeContent?: string;
  language?: string;
}

export class IntVariableNode extends Node {
  static metadata = {
    name: 'Int Variable',
    category: ComponentCategory.VARIABLE,
    description: 'An integer variable node',
    flowType: 'data',
    icon: '🔢',
  };

  static override shownProperties = ['value'];

  constructor(
    id: string,
    properties: IntVariableNodeProperties = {},
    position: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    if (typeof properties.title !== 'string' || properties.title.trim() === '') {
      properties.title = 'Int Variable';
    }
    properties.value = typeof properties.value === 'number' ? properties.value : 0;
    properties.language =
      typeof properties.language === 'string' && properties.language.trim() !== ''
        ? properties.language
        : 'JavaScript';
    properties.nodeContent = `<span class="variable-int">${properties.value}</span>`;
    super(id, 'intvariable', properties, position);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('value', 'Value', 'number', 'value'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = `<span class="variable-int">${this.properties.value}</span>`;
    return this.properties.nodeContent as string;
  }
}
