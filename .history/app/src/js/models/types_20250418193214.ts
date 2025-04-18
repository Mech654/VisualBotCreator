// Node and component related interfaces

export interface NodeInstance {
  id: string;
  type: string;
  properties: {
    title?: string;
    message?: string;
    condition?: string;
    operation?: string;
    placeholder?: string;
    options?: Array<{ text: string, value: string }>;
    [key: string]: any;
  };
  inputs: PortInstance[];
  outputs: PortInstance[];
}

export interface PortInstance {
  id: string;
  label: string;
  dataType: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeRectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ComponentDefinition {
  type: string;
  icon: string;
  label: string;
  flowType?: string; // 'flow' or 'data'
}

export interface CategoryDefinition {
  name: string;
  icon: string;
  components: ComponentDefinition[];
}

// Define interact.js event types
export interface InteractEvent {
  target: HTMLElement;
  dx: number;
  dy: number;
}

// Connection related interfaces
export interface ConnectionInstance {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  flowType?: string; // 'flow' or 'data'
  lineInstance?: any; // Will hold the LeaderLine instance
}

export enum ConnectionMode {
  NONE = 'none',
  CONNECTING = 'connecting'
}

export interface ConnectionState {
  mode: ConnectionMode;
  startNodeId?: string;
  startPortId?: string;
  startPortElement?: HTMLElement;
  tempLine?: any; // Temporary LeaderLine while drawing
  tempEndPoint?: HTMLElement; // Temporary DOM element for line endpoint
  flowType?: string; // 'flow' or 'data'
}