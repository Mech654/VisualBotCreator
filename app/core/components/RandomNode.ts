import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface RandomNodeProperties extends NodeProperties {
  min?: number;
  max?: number;
  type?: 'integer' | 'float' | 'boolean' | 'string';
  length?: number;
  nodeContent?: string;
  language?: string;
}

export class RandomNode extends Node {
  static metadata = {
    name: 'Random',
    category: ComponentCategory.DATA,
    description: 'Random node',
    flowType: 'data',
  };

  static override shownProperties = ['min', 'max', 'type', 'length'];

  constructor(id: string, properties: RandomNodeProperties = {}) {
    properties.min = properties.min ?? 1;
    properties.max = properties.max ?? 100;
    properties.type = properties.type || 'integer';
    properties.length = properties.length ?? 10;
    properties.language = properties.language || 'JavaScript';
    properties.nodeContent = generateRandomNodeContent(properties);
    super(id, 'random', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('min', 'Minimum', 'number', 'min'));
    this.addInput(new Port('max', 'Maximum', 'number', 'max'));
    this.addInput(new Port('seed', 'Seed', 'number', 'seed'));
    if (properties.type === 'boolean') {
      this.addOutput(new Port('value', 'Random Boolean', 'boolean', 'value'));
    } else if (properties.type === 'string') {
      this.addOutput(new Port('value', 'Random String', 'string', 'value'));
    } else {
      this.addOutput(new Port('value', 'Random Number', 'number', 'value'));
    }
  }
  updateNodeContent() {
    this.properties.nodeContent = generateRandomNodeContent(this.properties);
    return this.properties.nodeContent;
  }
}

function generateRandomNodeContent(properties: RandomNodeProperties): string {
  const type = properties.type || 'integer';
  let content = '';
  switch (type) {
    case 'integer':
      content = `Random Integer (${properties.min} - ${properties.max})`;
      break;
    case 'float':
      content = `Random Float (${properties.min} - ${properties.max})`;
      break;
    case 'boolean':
      content = 'Random Boolean (true/false)';
      break;
    case 'string':
      content = `Random String (length ${properties.length})`;
      break;
    default:
      content = 'Random Value';
  }
  return `<div class="random-node-preview">${content}</div>`;
}
