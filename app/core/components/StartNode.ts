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
    icon: '🚀'
  };

  constructor(id: string, properties: StartNodeProperties = {}) {
    properties.title = properties.title || 'Start';
    
    // Generate the node content
    properties.nodeContent = '<div class="start-node-content">Bot conversation starts here</div>';
    
    super(id, 'start', properties);

    // Start node only has a next port as it's the beginning of the flow
    this.addOutput(new Port('next', 'Next', 'control'));
  }

  /**
   * Update the node content - no updates needed for Start node as content is static
   */
  updateNodeContent() {
    // StartNode content doesn't change based on properties
    this.properties.nodeContent = '<div class="start-node-content">Bot conversation starts here</div>';
    return this.properties.nodeContent;
  }

  /**
   * Generate properties panel for the start node
   */
  generatePropertiesPanel(): string {
    return `
      <div class="property-group-title">Start Settings</div>
      <div class="property-item">
        <div class="property-label">Description</div>
        <div class="property-value">This is the entry point of your bot's conversation flow.</div>
      </div>
      <div class="property-item">
        <div class="property-label">Tips</div>
        <div class="property-value">
          <ul>
            <li>Each flow should have exactly one Start node</li>
            <li>Connect this to the first message or interaction</li>
            <li>The flow begins execution from this node</li>
          </ul>
        </div>
      </div>
    `;
  }

  process(): Record<string, any> {
    return { status: 'started' };
  }
}