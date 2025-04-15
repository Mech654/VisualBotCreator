import { Node, Port, NodeProperties } from '../base.js';

export class StartNode extends Node {
  constructor(id: string, properties: NodeProperties = {}) {
    properties.title = properties.title || 'Start';
    super(id, 'start', properties);

    // Start node only has a next port as it's the beginning of the flow
    this.addOutput(new Port('next', 'Next', 'control'));
  }

  process(): Record<string, any> {
    return { status: 'started' };
  }
}