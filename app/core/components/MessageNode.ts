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
    icon: '💬'
  };

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
  
  /**
   * Format the message for preview in the node
   */
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
  
  /**
   * Update the node content whenever the message changes
   */
  updateNodeContent() {
    this.properties.nodeContent = this.formatMessagePreview(this.properties.message || '');
    return this.properties.nodeContent;
  }

  /**
   * Generate the HTML for the message node's properties panel
   */
  generatePropertiesPanel(): string {
    return `
      <div class="property-group-title">Content</div>
      <div class="property-item" data-tooltip="Text message to display in this node">
        <div class="property-label">Message Text</div>
        <textarea class="property-input message-text" rows="3" aria-label="Node message content">${this.properties.message || ''}</textarea>
      </div>
      <div class="property-item" data-tooltip="Variable name to store the message output">
        <div class="property-label">Variable</div>
        <input type="text" class="property-input variable-name" value="${this.properties.variableName || 'message'}" aria-label="Variable name">
      </div>
      <div class="property-item" data-tooltip="Delay in milliseconds before showing the message">
        <div class="property-label">Delay (ms)</div>
        <input type="number" class="property-input message-delay" min="0" value="${this.properties.delay || 500}" aria-label="Message delay">
      </div>
    `;
  }

  /**
   * Set up event listeners for the message node property panel
   */
  setupPropertyEventListeners(panel: HTMLElement): void {
    // Add event listeners for message properties
    const messageInput = panel.querySelector('.message-text') as HTMLTextAreaElement;
    const variableInput = panel.querySelector('.variable-name') as HTMLInputElement;
    const delayInput = panel.querySelector('.message-delay') as HTMLInputElement;

    if (messageInput) {
      messageInput.addEventListener('change', () => {
        this.properties.message = messageInput.value;
        // Update the node content
        this.updateNodeContent();
      });
    }

    if (variableInput) {
      variableInput.addEventListener('change', () => {
        this.properties.variableName = variableInput.value;
      });
    }

    if (delayInput) {
      delayInput.addEventListener('change', () => {
        this.properties.delay = Number(delayInput.value);
      });
    }
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    let processedMessage = this.properties.message;

    return {
      messageText: processedMessage
    };
  }
}