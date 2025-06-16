interface NodeSystemAPI {
  createNode: (type: string, id: string, properties: Record<string, unknown>) => Promise<unknown>;
  getNodeTypes: () => Promise<Array<{ type: string; name: string; category: string }>>;
  getRegisteredTypes: () => Promise<Array<{ type: string; name: string; category: string }>>;
  getNodeById: (id: string) => Promise<unknown>;
  processNode: (id: string, inputs: Record<string, unknown>) => Promise<unknown>;
  createConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => Promise<unknown>;
  deleteConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => Promise<unknown>;
  getNodeConnections: (nodeId: string) => Promise<unknown[]>;
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
