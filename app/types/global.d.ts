// filepath: /home/eagle/Documents/2VSC/app/types/global.d.ts

// Define Bot interface
interface Bot {
  Id: string;
  Name: string; // This will be the same as Id after changes
  CreatedAt: string;
  UpdatedAt: string;
  enabled: number;
  description: string;
  run_success_count: number;
  run_failure_count: number;
}

// Define DatabaseAPI interface
interface DatabaseAPI {
  getAllBots: () => Promise<Bot[]>;
  getRunConditions: (botId: string) => Promise<{ Key: string; Value: string }[]>;
  setBotEnabled: (botId: string, enabled: boolean) => Promise<void>;
}

// Define NodeSystemAPI interface
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
  deleteConnection?: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => Promise<unknown>;
  getNodeConnections?: (nodeId: string) => Promise<unknown[]>;
  clearAllNodes?: () => Promise<{ success: boolean; error?: string }>;
  deleteNode?: (nodeId: string) => Promise<{ success: boolean; error?: string }>;
  /**
   * Returns the Node class (constructor) for a given type string, or undefined if not found.
   */
  getNodeClass?: (type: string) => unknown;
}

interface UtilsAPI {
  generateNodeId: () => string;
}

interface BotConfigAPI {
  changeName: (oldId: string, newId: string) => Promise<{ success: boolean; error?: string }>; // Updated signature
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

declare interface Window {
  nodeSystem: NodeSystemAPI;
  utils: UtilsAPI;
  botconfig: BotConfigAPI;
  database?: DatabaseAPI; // Added DatabaseAPI
  Swal?: unknown; // Added Swal, type set to unknown to avoid 'any'
}
