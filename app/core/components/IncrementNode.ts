import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface IncrementNodeProperties extends NodeProperties {
  incrementBy?: number;
  nodeContent?: string;
  language?: string;
}

export class IncrementNode extends Node {
  static metadata = {
    name: 'Increment',
    category: ComponentCategory.DATA,
    description: 'Increment node',
    flowType: 'data',
    icon: '➕',
  };

  static override shownProperties = ['incrementBy'];

  constructor(id: string, properties: IncrementNodeProperties = {}) {
    properties.incrementBy =
      typeof properties.incrementBy === 'number' && !isNaN(properties.incrementBy)
        ? properties.incrementBy
        : 1;
    properties.title = typeof properties.title === 'string' ? properties.title : 'Increment';
    properties.language =
      typeof properties.language === 'string' && properties.language.trim() !== ''
        ? properties.language
        : 'JavaScript';
    properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${properties.incrementBy}</span></div>`;
    super(id, 'increment', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('number', 'Number', 'number', 'number'));
    this.addOutput(new Port('result', 'Result', 'number', 'incrementBy'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${this.properties.incrementBy}</span></div>`;
    return this.properties.nodeContent as string;
  }
}
