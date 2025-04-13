import { Node, Port, NodeProperties } from '../base.js';

export class StartNode extends Node {
  constructor(id: string, properties: NodeProperties = {}) {
    properties.title = properties.title || 'Start';
    super(id, 'start', properties);
    this.addOutput(new Port('next', 'Next', 'control'));
  }
  
  process(): Record<string, any> {
    return { status: 'started' };
  }
}