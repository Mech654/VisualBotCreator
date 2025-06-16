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
    properties.language =
      properties.language !== undefined &&
      properties.language !== null &&
      properties.language !== ''
        ? properties.language
        : 'JavaScript';
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
  updateNodeContent(): string {
    this.properties.nodeContent = generateRandomNodeContent(this.properties);
    return this.properties.nodeContent as string;
  }

  process(inputValues: Record<string, unknown>): Record<string, unknown> {
    const min: number =
      typeof inputValues.min === 'number'
        ? inputValues.min
        : inputValues.min !== undefined
          ? Number(inputValues.min)
          : (this.properties.min as number);
    const max: number =
      typeof inputValues.max === 'number'
        ? inputValues.max
        : inputValues.max !== undefined
          ? Number(inputValues.max)
          : (this.properties.max as number);
    // Define the type for better readability
    type RandomType = 'integer' | 'float' | 'boolean' | 'string';
    const type: RandomType = this.properties.type as RandomType;
    const length: number = typeof this.properties.length === 'number' ? this.properties.length : 10;
    let value: unknown;
    switch (type) {
      case 'integer':
        value = Math.floor(Math.random() * (max - min + 1)) + min;
        break;
      case 'float':
        value = Math.random() * (max - min) + min;
        break;
      case 'boolean':
        value = Math.random() >= 0.5;
        break;
      case 'string': {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        value = result;
        break;
      }
      default:
        value = Math.random() * (max - min) + min;
    }
    return { value };
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
