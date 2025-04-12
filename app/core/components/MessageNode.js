// MessageNode.js - Handles text messages in bot conversations
const { Node, Port } = require('../base');

class MessageNode extends Node {
  constructor(id, properties = {}) {
    properties.title = properties.title || 'Message';
    properties.message = properties.message || 'Enter your message here...';
    properties.delay = properties.delay || 500;
    
    super(id, 'message', properties);
    
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addOutput(new Port('messageText', 'Message Text', 'string'));
  }
  
  process(inputValues) {
    console.log(`Processing message node ${this.id}: ${this.properties.message}`);
    let processedMessage = this.properties.message;
    
    return { 
      messageText: processedMessage
    };
  }
}

module.exports = MessageNode;