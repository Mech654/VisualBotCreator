import { contextBridge, ipcRenderer } from 'electron';

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
}

interface UtilsAPI {
  generateNodeId: () => string;
}

contextBridge.exposeInMainWorld('nodeSystem', {
  createNode: (type: string, id: string, properties: any) => {
    return ipcRenderer.invoke('node:create', { type, id, properties });
  },

  getNodeTypes: () => {
    return ipcRenderer.invoke('node:getTypes');
  },

  getRegisteredTypes: () => {
    return ipcRenderer.invoke('node:getRegisteredTypes');
  },

  getNodeById: (id: string) => {
    return ipcRenderer.invoke('node:getById', id);
  },

  processNode: (id: string, inputs: Record<string, any>) => {
    return ipcRenderer.invoke('node:process', { id, inputs });
  },

  createConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => {
    return ipcRenderer.invoke('connection:create', {
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
    });
  },

  deleteConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => {
    return ipcRenderer.invoke('connection:delete', {
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
    });
  },

  getNodeConnections: (nodeId: string) => {
    return ipcRenderer.invoke('connection:getForNode', nodeId);
  },
} as NodeSystemAPI);

contextBridge.exposeInMainWorld('utils', {
  generateNodeId: () => {
    return `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  },
} as UtilsAPI);