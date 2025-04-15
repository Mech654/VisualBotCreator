// Port categories and types
export enum PortCategory {
  FLOW = 'flow',
  DATA = 'data'
}

export enum PortType {
  // Flow types
  CONTROL = 'control',

  // Data types
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  ANY = 'any'
}

// Port category to types mapping
export const PORT_CATEGORIES = {
  [PortCategory.FLOW]: [PortType.CONTROL],
  [PortCategory.DATA]: [
    PortType.STRING,
    PortType.NUMBER,
    PortType.BOOLEAN,
    PortType.OBJECT,
    PortType.ARRAY,
    PortType.ANY
  ]
};

export interface NodeProperties {
  [key: string]: any;
}

export interface PortData {
  id: string;
  label: string;
  dataType: string;
  category?: PortCategory;
}

export class Node {
  id: string;
  type: string;
  properties: NodeProperties;
  inputs: Port[];
  outputs: Port[];

  constructor(id: string, type: string, properties: NodeProperties = {}) {
    this.id = id;
    this.type = type;
    this.properties = properties;
    this.inputs = [];
    this.outputs = [];
  }

  addInput(port: Port): void {
    this.inputs.push(port);
  }

  addOutput(port: Port): void {
    this.outputs.push(port);
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    throw new Error(`Process method not implemented for node type: ${this.type}`);
  }
}

export class Port {
  id: string;
  label: string;
  dataType: string;
  category: PortCategory;
  connectedTo: Connection[];

  constructor(id: string, label: string, dataType: string) {
    this.id = id;
    this.label = label;
    this.dataType = dataType;
    // Determine category based on data type
    this.category = PORT_CATEGORIES[PortCategory.FLOW].includes(dataType as PortType)
      ? PortCategory.FLOW
      : PortCategory.DATA;
    this.connectedTo = [];
  }
}

export class Connection {
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;

  constructor(fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) {
    this.fromNodeId = fromNodeId;
    this.fromPortId = fromPortId;
    this.toNodeId = toNodeId;
    this.toPortId = toPortId;
  }
}