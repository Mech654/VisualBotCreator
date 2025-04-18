import { Node, Port, NodeProperties } from '../base.js';

export class StartNode extends Node {
  // Add static metadata property to the class itself
  static metadata = {
    name: 'Start',
    category: 'Conversation Flow',
    description: 'Entry point for the bot conversation',
    flowType: 'flow',
    icon: '🚀'
  };

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