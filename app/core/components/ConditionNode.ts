import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface ConditionNodeProperties extends NodeProperties {
  title?: string;
  condition?: string;
  nodeContent?: string;
  language?: string;
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
    properties.title = properties.title || 'Condition';
    properties.condition = properties.condition || 'value == true';
    properties.language = properties.language || 'JavaScript';
    properties.nodeContent = `<p class="condition-expression">if (${properties.condition}) { ... }</p>`;
    super(id, 'condition', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value to Check', 'any', 'condition'));
    this.addOutput(new Port('true', 'True', 'control', 'condition'));
    this.addOutput(new Port('false', 'False', 'control', 'condition'));
  }

  updateNodeContent() {
    this.properties.nodeContent = `<p class="condition-expression">if (${this.properties.condition}) { ... }</p>`;
    return this.properties.nodeContent;
  }
}
