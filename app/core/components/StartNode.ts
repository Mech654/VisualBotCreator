import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

interface StartNodeProperties extends NodeProperties {
  nodeContent?: string;
}

export class StartNode extends Node {
  static metadata = {
    name: 'Start',
    category: ComponentCategory.CONVERSATION_FLOW,
    description: 'Entry point for the bot conversation',
    flowType: 'flow',
    icon: '🚀',
  };

  static override shownProperties = [];

  constructor(id: string, properties: StartNodeProperties = {}) {
    properties.title = properties.title || 'Start';
    properties.nodeContent = 'Bot conversation starts here';
    super(id, 'start', properties);
    this.addOutput(new Port('next', 'Next', 'control'));
  }

  updateNodeContent() {
    this.properties.nodeContent = 'Bot conversation starts here';
    return this.properties.nodeContent;
  }

  process(): Record<string, any> {
    return { status: 'started' };
  }
}
