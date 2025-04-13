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
    options?: Array<{text: string, value: string}>;
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