import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface MessageNodeProperties extends NodeProperties {
  title?: string;
  message?: string;
  delay?: number;
  variableName?: string;
  nodeContent?: string;
  language?: string;
}

export class MessageNode extends Node {
  static metadata = {
    name: 'Message',
    category: ComponentCategory.FLOW,
    description: 'Message node',
    flowType: 'flow',
    icon: '💬',
  };

  static override shownProperties = ['message'];

  constructor(id: string, properties: MessageNodeProperties = {}) {
    properties.title =
      properties.title !== undefined && properties.title !== null && properties.title !== ''
        ? properties.title
        : 'Message';
    properties.message =
      properties.message !== undefined && properties.message !== null && properties.message !== ''
        ? properties.message
        : 'Enter your message here...';
    properties.delay =
      properties.delay !== undefined &&
      properties.delay !== null &&
      typeof properties.delay === 'number' &&
      Number.isFinite(properties.delay)
        ? properties.delay
        : 500;
    properties.variableName =
      properties.variableName !== undefined &&
      properties.variableName !== null &&
      properties.variableName !== ''
        ? properties.variableName
        : 'message';
    properties.language =
      properties.language !== undefined &&
      properties.language !== null &&
      properties.language !== ''
        ? properties.language
        : 'JavaScript';
    const message = properties.message || '';
    let displayText = message;
    if (displayText.length > 50) {
      displayText = displayText.substring(0, 47) + '...';
    }
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
    this.addOutput(new Port('messageText', 'Message Text', 'string', 'message'));
  }

  formatMessagePreview(message: string): string {
    let displayText = message;
    if (displayText.length > 50) {
      displayText = displayText.substring(0, 47) + '...';
    }
    displayText = displayText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return `<div class="message-bubble">${displayText}</div>`;
  }
  updateNodeContent(): string {
    const message: string =
      typeof this.properties.message === 'string'
        ? this.properties.message
        : String(this.properties.message ?? '');
    this.properties.nodeContent = this.formatMessagePreview(message);
    return this.properties.nodeContent as string;
  }

  process(_inputValues: Record<string, unknown>): Record<string, unknown> {
    const processedMessage: string =
      typeof this.properties.message === 'string'
        ? this.properties.message
        : String(this.properties.message ?? '');
    return {
      messageText: processedMessage,
    };
  }
}
