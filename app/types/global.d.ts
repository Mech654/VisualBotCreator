interface Bot {
  Id: string;
  Name: string;
  CreatedAt: string;
  UpdatedAt: string;
  enabled: number;
  description: string;
  run_success_count: number;
  run_failure_count: number;
}

interface DatabaseAPI {
  getAllBots: () => Promise<Bot[]>;
  getBotNodes: (botId: string) => Promise<any[]>;
  getRunConditions: (botId: string) => Promise<{ Key: string; Value: string }[]>;
  setBotEnabled: (botId: string, enabled: boolean) => Promise<void>;
  removeBot: (botId: string) => Promise<void>;
  saveAllNodes: (botId: string) => Promise<{ success: boolean; error?: string }>;
}

interface NodeInstanceGlobal {
  id: string;
  type: string;
  properties: {
    title?: string;
    message?: string;
    condition?: string;
    operation?: string;
    placeholder?: string;
    options?: Array<{ text: string; value: string }>;
    nodeContent?: string;
    [key: string]: any;
  };
  inputs: Array<{
    id: string;
    label: string;
    dataType: string;
  }>;
  outputs: Array<{
    id: string;
    label: string;
    dataType: string;
  }>;
}

interface NodeSystemAPI {
  createNode: (
    type: string,
    id: string,
    properties: Record<string, unknown>,
    position: { x: number; y: number }
  ) => Promise<NodeInstanceGlobal>;
  getNodeTypes: () => Promise<Array<{ type: string; name: string; category: string }>>;
  getRegisteredTypes: () => Promise<Array<{ type: string; name: string; category: string }>>;
  getNodeById: (id: string) => Promise<NodeInstanceGlobal>;
  getAllNodes: () => Promise<any[]>;
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
  getNodeClass?: (type: string) => unknown;
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

interface SweetAlert2 {
  fire(options: any): Promise<any>;
  fire(title?: string, text?: string, icon?: string): Promise<any>;
}

interface ElectronIpcRenderer {
  invoke: (channel: string, ...args: unknown[]) => Promise<any>;
  on: (channel: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, listener: (...args: unknown[]) => void) => void;
}

declare interface Window {
  nodeSystem: NodeSystemAPI;
  utils: UtilsAPI;
  botconfig: BotConfigAPI;
  database?: DatabaseAPI;
  Swal: SweetAlert2;
  electron: {
    ipcRenderer: ElectronIpcRenderer;
  };
}
