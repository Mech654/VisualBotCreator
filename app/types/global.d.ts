// Type definitions for the global window object

interface NodeSystemAPI {
  createNode: (type: string, id: string, properties: any) => Promise<any>;
  getNodeTypes: () => Promise<Array<{ type: string, name: string, category: string }>>;
  getNodeById: (id: string) => Promise<any>;
  processNode: (id: string, inputs: Record<string, any>) => Promise<any>;
  createConnection: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => Promise<any>;
}

interface UtilsAPI {
  generateNodeId: () => string;
}

declare interface Window {
  nodeSystem: NodeSystemAPI;
  utils: UtilsAPI;
}

// Type definition for interact.js library (basic)
declare const interact: any;