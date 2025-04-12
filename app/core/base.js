class Node {
  constructor(id, type, properties = {}) {
    this.id = id;
    this.type = type;
    this.properties = properties;
    this.inputs = [];
    this.outputs = [];
  }

  addInput(port) {
    this.inputs.push(port);
  }

  addOutput(port) {
    this.outputs.push(port);
  }

  process(inputValues) {
    throw new Error(`Process method not implemented for node type: ${this.type}`);
  }
}

class Port {
  constructor(id, label, dataType) {
    this.id = id;
    this.label = label;
    this.dataType = dataType;
    this.connectedTo = [];
  }
}

class Connection {
  constructor(fromNodeId, fromPortId, toNodeId, toPortId) {
    this.fromNodeId = fromNodeId;
    this.fromPortId = fromPortId;
    this.toNodeId = toNodeId;
    this.toPortId = toPortId;
  }
}

exports.Node = Node;
exports.Port = Port; 
exports.Connection = Connection;