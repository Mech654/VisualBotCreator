import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface Base64NodeProperties extends NodeProperties {
  nodeContent?: string;
  language?: string;
}

export class Base64Node extends Node {
  static metadata = {
    name: 'Base64',
    category: ComponentCategory.DATA,
    description: 'Encodes a value to Base64',
    flowType: 'data',
    icon: '🗝️',
  };

  static override shownProperties: string[] = [];

  constructor(id: string, properties: Base64NodeProperties = {}, position: { x: number; y: number } = { x: 0, y: 0 }) {
    super(id, 'base64', properties, position);
    properties.title = typeof properties.title === 'string' ? properties.title : 'Base64';
    properties.language =
      typeof properties.language === 'string' ? properties.language : 'JavaScript';
    properties.nodeContent = 'Encodes input to Base64';
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value', 'string', 'value'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('base64', 'Base64', 'string', 'base64'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = 'Encodes input to Base64';
    return this.properties.nodeContent as string;
  }

  process(inputValues: Record<string, unknown>): Record<string, string> {
    const value: string = typeof inputValues['value'] === 'string' ? inputValues['value'] : '';
    let base64 = '';
    try {
      base64 = typeof value === 'string' ? btoa(unescape(encodeURIComponent(value))) : '';
    } catch {
      base64 = '';
    }
    return { base64 };
  }
}
