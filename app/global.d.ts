interface NodeSystemAPI {
  createNode: (type: string, id: string, properties: any) => Promise<any>;
  getNodeTypes: () => Promise<Array<{ type: string; name: string; category: string }>>;
  getRegisteredTypes: () => Promise<Array<{ type: string; name: string; category: string }>>;
  getNodeById: (id: string) => Promise<any>;
  processNode: (id: string, inputs: Record<string, any>) => Promise<any>;
  createConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => Promise<any>;
  deleteConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => Promise<any>;
  getNodeConnections: (nodeId: string) => Promise<any[]>;
  clearAllNodes: () => Promise<{ success: boolean; error?: string }>;
  deleteNode: (nodeId: string) => Promise<{ success: boolean; error?: string }>;
}

interface UtilsAPI {
  generateNodeId: () => string;
}

// All Window interface augmentations have been moved to app/types/global.d.ts
// This file can be removed or repurposed if no other global types are defined here.

// The following were moved to app/types/global.d.ts:
// declare interface Window {
//   nodeSystem: any;
//   utils: any;
// }
