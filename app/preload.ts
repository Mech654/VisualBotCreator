import { contextBridge, ipcRenderer } from 'electron';

interface NodeSystemAPI {
  createNode: (type: string, id: string, properties: Record<string, unknown>, position: { x: number; y: number }) => Promise<unknown>;
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

interface BotConfigAPI {
  changeName: (oldId: string, newId: string) => Promise<{ success: boolean; error?: string }>;
  changeDescription: (
    botId: string,
    newDescription: string
  ) => Promise<{ success: boolean; error?: string }>;
  changeStatus: (
    botId: string,
    newStatus: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  addOrUpdateCondition: (
    botId: string,
    key: string,
    value: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCondition: (botId: string, key: string) => Promise<{ success: boolean; error?: string }>;
}

contextBridge.exposeInMainWorld('nodeSystem', {
  createNode: (type: string, id: string, properties: Record<string, unknown>, position: { x: number; y: number }) => {
    return ipcRenderer.invoke('node:create', { type, id, properties, position }) as Promise<unknown>;
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

  processNode: (id: string, inputs: Record<string, unknown>) => {
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

  clearAllNodes: () => {
    return ipcRenderer.invoke('node:clearAll');
  },

  deleteNode: (nodeId: string) => {
    return ipcRenderer.invoke('node:delete', nodeId);
  },
} as NodeSystemAPI);

contextBridge.exposeInMainWorld('utils', {
  generateNodeId: () => {
    return `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  },
} as UtilsAPI);

// Expose database functions for bot configurations
contextBridge.exposeInMainWorld('botconfig', {
  changeName: (oldId: string, newId: string) => {
    // eslint-disable-next-line no-console
    console.log('[PRELOAD] botconfig:changeName called with:', { oldId, newId });
    return ipcRenderer.invoke('botconfig:changeName', oldId, newId);
  },
  changeDescription: (botId: string, newDescription: string) => {
    return ipcRenderer.invoke('botconfig:changeDescription', botId, newDescription);
  },
  changeStatus: (botId: string, newStatus: boolean) => {
    return ipcRenderer.invoke('botconfig:changeStatus', botId, newStatus);
  },
  addOrUpdateCondition: (botId: string, key: string, value: string) => {
    return ipcRenderer.invoke('botconfig:addOrUpdateCondition', botId, key, value);
  },
  deleteCondition: (botId: string, key: string) => {
    return ipcRenderer.invoke('botconfig:deleteCondition', botId, key);
  },
} as BotConfigAPI);

contextBridge.exposeInMainWorld('database', {
  saveAllNodes: (botId: string, nodes: Record<string, unknown>[]) =>
    ipcRenderer.invoke('database:saveAllNodes', botId, nodes),
  getAllBots: () => ipcRenderer.invoke('database:getAllBots'),
  getBotNodes: (botId: string) => ipcRenderer.invoke('database:getBotNodes', botId),
  getRunConditions: (botId: string) => ipcRenderer.invoke('database:getRunConditions', botId),
  setBotEnabled: (botId: string, enabled: boolean) =>
    ipcRenderer.invoke('database:setBotEnabled', botId, enabled),
  changeNameDb: (oldId: string, newId: string) =>
    ipcRenderer.invoke('database:changeName', oldId, newId),
  changeDescriptionDb: (botId: string, newDescription: string) =>
    ipcRenderer.invoke('database:changeDescription', botId, newDescription),
  changeStatusDb: (botId: string, newStatus: boolean) =>
    ipcRenderer.invoke('database:changeStatus', botId, newStatus),
  addOrUpdateBotConditionDb: (botId: string, key: string, value: string) =>
    ipcRenderer.invoke('database:addOrUpdateBotCondition', botId, key, value),
  deleteBotConditionDb: (botId: string, conditionId: string) =>
    ipcRenderer.invoke('database:deleteBotCondition', botId, conditionId),
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  },
});
