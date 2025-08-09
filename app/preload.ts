import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nodeSystem', {
  createNode: (
    type: string,
    id: string,
    properties: Record<string, unknown>,
    position: { x: number; y: number }
  ) => {
    return ipcRenderer.invoke('node:create', {
      type,
      id,
      properties,
      position,
    }) as Promise<unknown>;
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

  getAllNodes: () => {
    return ipcRenderer.invoke('node:getAllNodes');
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
  setNodePosition: (id: string, x: number, y: number) => {
    return ipcRenderer.invoke('node:updatePosition', { id, x, y });
  },
});

contextBridge.exposeInMainWorld('utils', {
  generateNodeId: () => {
    return `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  },
});

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
});

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
  removeBot: (botId: string) => ipcRenderer.invoke('database:removeBot', botId),
  saveDebugNodes: () =>
    ipcRenderer.invoke('database:saveDebugNodes'),
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_event, ...args) => listener(...args)),
    removeListener: (channel: string, listener: (...args: unknown[]) => void) => ipcRenderer.removeListener(channel, listener),
  },
});
