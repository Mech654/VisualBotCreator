// Preload script - securely exposes Node.js functionality to the renderer process
import { contextBridge, ipcRenderer } from 'electron';

// Define types for the APIs exposed to the renderer
interface NodeSystemAPI {
  createNode: (type: string, id: string, properties: any) => Promise<any>;
  getNodeTypes: () => Promise<Array<{ type: string, name: string, category: string }>>;
  getNodeById: (id: string) => Promise<any>;
  processNode: (id: string, inputs: Record<string, any>) => Promise<any>;
  createConnection: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => Promise<any>;
  deleteConnection: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => Promise<any>;
  getNodeConnections: (nodeId: string) => Promise<any[]>;
}

interface UtilsAPI {
  generateNodeId: () => string;
}

// Expose nodeSystem API to the renderer process
contextBridge.exposeInMainWorld('nodeSystem', {
  // Create a node of specific type
  createNode: (type: string, id: string, properties: any) => {
    return ipcRenderer.invoke('node:create', { type, id, properties });
  },

  // Get node types available in the system
  getNodeTypes: () => {
    return ipcRenderer.invoke('node:getTypes');
  },

  // Get node by ID
  getNodeById: (id: string) => {
    return ipcRenderer.invoke('node:getById', id);
  },

  // Process a node with given inputs
  processNode: (id: string, inputs: Record<string, any>) => {
    return ipcRenderer.invoke('node:process', { id, inputs });
  },

  // Create a connection between nodes
  createConnection: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
    return ipcRenderer.invoke('connection:create', {
      fromNodeId, fromPortId, toNodeId, toPortId
    });
  },

  // Delete a connection between nodes
  deleteConnection: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
    return ipcRenderer.invoke('connection:delete', {
      fromNodeId, fromPortId, toNodeId, toPortId
    });
  },

  // Get all connections for a node
  getNodeConnections: (nodeId: string) => {
    return ipcRenderer.invoke('connection:getForNode', nodeId);
  }
} as NodeSystemAPI);

// Expose utility functions
contextBridge.exposeInMainWorld('utils', {
  // Generate a random node ID
  generateNodeId: () => {
    return `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
} as UtilsAPI);

// TypeScript declaration file to augment the Window interface is in global.d.ts