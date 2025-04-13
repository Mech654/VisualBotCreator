import { Node, Port, NodeProperties } from '../base.js';

export interface MessageNodeProperties extends NodeProperties {
  title?: string;
  message?: string;
  delay?: number;
}

export class MessageNode extends Node {
  constructor(id: string, properties: MessageNodeProperties = {}) {
    properties.title = properties.title || 'Message';
    properties.message = properties.message || 'Enter your message here...';
    properties.delay = properties.delay || 500;
    
    super(id, 'message', properties);
    
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('messageText', 'Message Text', 'string'));
  }
  
  process(inputValues: Record<string, any>): Record<string, any> {
    let processedMessage = this.properties.message;
    
    return { 
      messageText: processedMessage
    };
  }
}