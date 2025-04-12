const { Node, Port, Connection } = require('./base');

class NodeFactory {
  static createNode(type, id, properties = {}) {
    return null;
  }
}

module.exports = { 
  Node,
  Port, 
  Connection,
  NodeFactory
};

const StartNode = require('./components/StartNode');
const MessageNode = require('./components/MessageNode');
const OptionsNode = require('./components/OptionsNode');
const ConditionNode = require('./components/ConditionNode');
const InputNode = require('./components/InputNode');
const MathNode = require('./components/MathNode');

const Components = {
  StartNode,
  MessageNode,
  OptionsNode,
  ConditionNode,
  InputNode,
  MathNode
};

NodeFactory.createNode = function(type, id, properties = {}) {
  switch(type) {
    case 'start':
      return new StartNode(id, properties);
    case 'message':
      return new MessageNode(id, properties);
    case 'options':
      return new OptionsNode(id, properties);
    case 'condition':
      return new ConditionNode(id, properties);
    case 'input':
      return new InputNode(id, properties);
    case 'math':
      return new MathNode(id, properties.operation || 'add');
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
};

module.exports.Components = Components;