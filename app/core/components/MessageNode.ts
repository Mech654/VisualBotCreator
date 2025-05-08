import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface MessageNodeProperties extends NodeProperties {
  title?: string;
  message?: string;
  delay?: number;
  variableName?: string;
  nodeContent?: string; // Add nodeContent property
}

export class MessageNode extends Node {
  static metadata = {
    name: 'Message',
    category: ComponentCategory.CONVERSATION_FLOW,
    description: 'Send a message to the user',
    flowType: 'flow',
    icon: '💬',
  };

  static override shownProperties = ['message'];

  constructor(id: string, properties: MessageNodeProperties = {}) {
    properties.title = properties.title || 'Message';
    properties.message = properties.message || 'Enter your message here...';
    properties.delay = properties.delay || 500;
    properties.variableName = properties.variableName || 'message';

    // Generate the node content for display without using 'this'
    const message = properties.message || '';
    // Truncate long messages
    let displayText = message;
    if (displayText.length > 50) {
      displayText = displayText.substring(0, 47) + '...';
    }

    // Escape HTML
    displayText = displayText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    properties.nodeContent = `<div class="message-bubble">${displayText}</div>`;

    super(id, 'message', properties);

    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('messageText', 'Message Text', 'string'));
  }

  formatMessagePreview(message: string): string {
    // Truncate long messages
    let displayText = message;
    if (displayText.length > 50) {
      displayText = displayText.substring(0, 47) + '...';
    }

    // Escape HTML and wrap in message bubble styling
    displayText = displayText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<div class="message-bubble">${displayText}</div>`;
  }
  /** Update the node content whenever the message changes */
  updateNodeContent() {
    this.properties.nodeContent = this.formatMessagePreview(this.properties.message || '');
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    const processedMessage = this.properties.message;

    return {
      messageText: processedMessage,
    };
  }
}
