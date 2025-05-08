import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

interface StartNodeProperties extends NodeProperties {
  nodeContent?: string; // Add nodeContent property
}

export class StartNode extends Node {
  // Update to use ComponentCategory enum
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

    // Generate the node content
    properties.nodeContent = 'Bot conversation starts here';

    super(id, 'start', properties);

    // Start node only has a next port as it's the beginning of the flow
    this.addOutput(new Port('next', 'Next', 'control'));
  }

  /** Update the node content - no updates needed for Start node as content is static */
  updateNodeContent() {
    // StartNode content doesn't change based on properties
    this.properties.nodeContent = 'Bot conversation starts here';
    return this.properties.nodeContent;
  }

  process(): Record<string, any> {
    return { status: 'started' };
  }
}
