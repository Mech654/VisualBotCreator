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

interface BotConfigAPI {
  changeName: (botId: string, newName: string) => Promise<{success: boolean, error?: string}>;
  changeDescription: (botId: string, newDescription: string) => Promise<{success: boolean, error?: string}>;
  changeStatus: (botId: string, newStatus: boolean) => Promise<{success: boolean, error?: string}>;
  addOrUpdateCondition: (botId: string, key: string, value: string) => Promise<{success: boolean, error?: string}>;
  deleteCondition: (botId: string, key: string) => Promise<{success: boolean, error?: string}>;
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

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  }
});

contextBridge.exposeInMainWorld('database', {
  getAllBots: () => ipcRenderer.invoke('database:getAllBots'),
  getRunConditions: (botId: string) => ipcRenderer.invoke('database:getRunConditions', botId),
  setBotEnabled: (botId: string, enabled: boolean) => ipcRenderer.invoke('database:setBotEnabled', botId, enabled),
});

// Expose botconfig API
contextBridge.exposeInMainWorld('botconfig', {
  changeName: (botId: string, newName: string) => 
    ipcRenderer.invoke('botconfig:changeName', botId, newName),
  changeDescription: (botId: string, newDescription: string) => 
    ipcRenderer.invoke('botconfig:changeDescription', botId, newDescription),
  changeStatus: (botId: string, newStatus: boolean) => 
    ipcRenderer.invoke('botconfig:changeStatus', botId, newStatus),
  addOrUpdateCondition: (botId: string, key: string, value: string) => 
    ipcRenderer.invoke('botconfig:addOrUpdateCondition', botId, key, value),
  deleteCondition: (botId: string, key: string) => 
    ipcRenderer.invoke('botconfig:deleteCondition', botId, key)
} as BotConfigAPI);
