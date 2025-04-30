// CommonJS version of the preload script
const { contextBridge, ipcRenderer } = require('electron');

// Expose nodeSystem API to the renderer process
contextBridge.exposeInMainWorld('nodeSystem', {
  // Create a node of specific type
  createNode: (type, id, properties) => {
    return ipcRenderer.invoke('node:create', { type, id, properties });
  },

  // Get node types available in the system
  getNodeTypes: () => {
    return ipcRenderer.invoke('node:getTypes');
  },

  // Get node by ID
  getNodeById: id => {
    return ipcRenderer.invoke('node:getById', id);
  },

  // Process a node with given inputs
  processNode: (id, inputs) => {
    return ipcRenderer.invoke('node:process', { id, inputs });
  },

  // Create a connection between nodes
  createConnection: (fromNodeId, fromPortId, toNodeId, toPortId) => {
    return ipcRenderer.invoke('connection:create', {
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
    });
  },
});

// Expose utility functions
contextBridge.exposeInMainWorld('utils', {
  // Generate a random node ID
  generateNodeId: () => {
    return `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  },
});
