import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface IncrementNodeProperties extends NodeProperties {
  incrementBy?: number;
  nodeContent?: string;
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
    properties.incrementBy = properties.incrementBy || 1;
    properties.title = properties.title || 'Increment';
    properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${properties.incrementBy}</span></div>`;
    super(id, 'increment', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('number', 'Number', 'number'));
    this.addOutput(new Port('result', 'Result', 'number'));
  }

  updateNodeContent() {
    this.properties.nodeContent = `<div class="increment-preview">n + <span class="increment-value">${this.properties.incrementBy}</span></div>`;
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    const inputNumber = typeof inputValues['number'] === 'number' ? inputValues['number'] : 0;
    const incrementBy = this.properties.incrementBy || 1;
    const result = inputNumber + incrementBy;
    return {
      result: result,
    };
  }
}
