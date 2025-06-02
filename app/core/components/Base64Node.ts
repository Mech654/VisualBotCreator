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

  constructor(id: string, properties: Base64NodeProperties = {}) {
    properties.title = properties.title || 'Base64';
    properties.language = properties.language || 'JavaScript';
    properties.nodeContent = 'Encodes input to Base64';
    super(id, 'base64', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value', 'string', 'value'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('base64', 'Base64', 'string', 'base64'));
  }

  updateNodeContent() {
    this.properties.nodeContent = 'Encodes input to Base64';
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    const value = inputValues['value'] ?? '';
    let base64 = '';
    try {
      base64 = typeof value === 'string' ? btoa(unescape(encodeURIComponent(value))) : '';
    } catch (e) {
      base64 = '';
    }
    return { base64 };
  }
}
