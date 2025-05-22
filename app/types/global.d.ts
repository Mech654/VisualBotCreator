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

declare interface Window {
  nodeSystem: NodeSystemAPI;
  utils: UtilsAPI;
  botconfig: BotConfigAPI;
}
