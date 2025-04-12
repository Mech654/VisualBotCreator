const { Node, Port } = require('../base');

class StartNode extends Node {
  constructor(id, properties = {}) {
    properties.title = properties.title || 'Start';
    super(id, 'start', properties);
    this.addOutput(new Port('next', 'Next', 'control'));
  }
  
  process() {
    console.log(`Starting conversation flow from node: ${this.id}`);
    return {};
  }
}

module.exports = StartNode;