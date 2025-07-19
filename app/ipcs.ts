import { ipcMain } from 'electron';
import { Node, NodeProperties, Connection } from './core/base.js';
import { NodeFactory } from './core/nodeSystem.js';
import {
  saveAllNodes,
  getAllBots,
  getBotNodes,
  getRunConditions,
  setBotEnabled,
  changeNameDb,
  changeDescriptionDb,
  changeStatusDb,
  addOrUpdateBotConditionDb,
  deleteBotConditionDb,
} from './core/database.js';
import { nodeInstances, connections, arePortTypesCompatible } from './main.js';

export function setupIpcHandlers(): void {
  // Handle node creation requests
  ipcMain.handle(
    'node:create',
    (event, { type, id, properties, position }: { type: string; id: string; properties: NodeProperties, position: { x: number; y: number } }) => {
      try {
        // Check if we're updating an existing node
        const existingNode = nodeInstances.get(id);
        let preservedConnections: { inputs: Connection[]; outputs: Connection[] } | null = null;

        if (existingNode) {
          // Preserve connections from the existing node
          preservedConnections = {
            inputs: existingNode.inputs.flatMap(input => input.connectedTo),
            outputs: existingNode.outputs.flatMap(output => output.connectedTo),
          };
        }

        const node = NodeFactory.createNode(type, id, properties, position);

        if (preservedConnections && existingNode) {
          // Restore input connections
          preservedConnections.inputs.forEach(connection => {
            const targetPort = node.inputs.find(input => input.id === connection.toPortId);
            if (targetPort) {
              targetPort.connectedTo.push(connection);
            }
          });

          // Restore output connections
          preservedConnections.outputs.forEach(connection => {
            const sourcePort = node.outputs.find(output => output.id === connection.fromPortId);
            if (sourcePort) {
              sourcePort.connectedTo.push(connection);
            }
          });
        }

        nodeInstances.set(id, node);

        return {
          id: node.id,
          type: node.type,
          properties: node.properties,
          inputs: node.inputs.map(input => ({
            id: input.id,
            label: input.label,
            dataType: input.dataType,
          })),
          outputs: node.outputs.map(output => ({
            id: output.id,
            label: output.label,
            dataType: output.dataType,
          })),
        };
      } catch (error) {
        console.error('Error creating node:', error);
        throw new Error(
          `Failed to create node: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Get all available node types
  ipcMain.handle('node:getTypes', () => {
    return NodeFactory.getNodeTypes();
  });

  // Get all registered node types with metadata
  ipcMain.handle('node:getRegisteredTypes', () => {
    return NodeFactory.getRegisteredTypes();
  });

  // Get node by ID
  ipcMain.handle('node:getById', (event, id: string) => {
    const node = nodeInstances.get(id);
    if (!node) {
      throw new Error(`Node not found with id: ${id}`);
    }

    return {
      id: node.id,
      type: node.type,
      properties: node.properties,
      inputs: node.inputs.map(input => ({
        id: input.id,
        label: input.label,
        dataType: input.dataType,
      })),
      outputs: node.outputs.map(output => ({
        id: output.id,
        label: output.label,
        dataType: output.dataType,
      })),
    };
  });

  // Create a connection between nodes
  ipcMain.handle(
    'connection:create',
    (
      event,
      {
        fromNodeId,
        fromPortId,
        toNodeId,
        toPortId,
      }: {
        fromNodeId: string;
        fromPortId: string;
        toNodeId: string;
        toPortId: string;
      }
    ) => {
      try {
        const sourceNode = nodeInstances.get(fromNodeId);
        const targetNode = nodeInstances.get(toNodeId);

        if (!sourceNode) {
          throw new Error(`Source node not found with id: ${fromNodeId}`);
        }

        if (!targetNode) {
          throw new Error(`Target node not found with id: ${toNodeId}`);
        }

        // Find the source port
        const sourcePort = sourceNode.outputs.find(output => output.id === fromPortId);
        if (!sourcePort) {
          throw new Error(`Output port not found: ${fromPortId}`);
        }

        // Find the target port
        const targetPort = targetNode.inputs.find(input => input.id === toPortId);
        if (!targetPort) {
          throw new Error(`Input port not found: ${toPortId}`);
        }

        // Check if connection types are compatible
        if (!arePortTypesCompatible(sourcePort.dataType, targetPort.dataType)) {
          throw new Error(
            `Incompatible port types: ${sourcePort.dataType} -> ${targetPort.dataType}`
          );
        }

        // Create new connection
        const connection = new Connection(fromNodeId, fromPortId, toNodeId, toPortId);
        connections.push(connection);

        // Add connection reference to both ports
        sourcePort.connectedTo.push(connection);
        targetPort.connectedTo.push(connection);

        return {
          fromNodeId,
          fromPortId,
          toNodeId,
          toPortId,
        };
      } catch (error) {
        console.error('Error creating connection:', error);
        throw new Error(
          `Failed to create connection: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Delete a connection
  ipcMain.handle(
    'connection:delete',
    (
      event,
      {
        fromNodeId,
        fromPortId,
        toNodeId,
        toPortId,
      }: {
        fromNodeId: string;
        fromPortId: string;
        toNodeId: string;
        toPortId: string;
      }
    ) => {
      try {
        const connectionIndex = connections.findIndex(
          conn =>
            conn.fromNodeId === fromNodeId &&
            conn.fromPortId === fromPortId &&
            conn.toNodeId === toNodeId &&
            conn.toPortId === toPortId
        );
        if (connectionIndex === -1) {
          throw new Error('Connection not found');
        }

        // Remove the connection
        connections.splice(connectionIndex, 1);

        // Also remove from port references
        const sourceNode = nodeInstances.get(fromNodeId);
        const targetNode = nodeInstances.get(toNodeId);

        if (sourceNode) {
          const sourcePort = sourceNode.outputs.find(output => output.id === fromPortId);
          if (sourcePort) {
            const connIndex = sourcePort.connectedTo.findIndex(
              conn =>
                conn.fromNodeId === fromNodeId &&
                conn.fromPortId === fromPortId &&
                conn.toNodeId === toNodeId &&
                conn.toPortId === toPortId
            );

            if (connIndex !== -1) {
              sourcePort.connectedTo.splice(connIndex, 1);
            }
          }
        }

        if (targetNode) {
          const targetPort = targetNode.inputs.find(input => input.id === toPortId);
          if (targetPort) {
            const connIndex = targetPort.connectedTo.findIndex(
              conn =>
                conn.fromNodeId === fromNodeId &&
                conn.fromPortId === fromPortId &&
                conn.toNodeId === toNodeId &&
                conn.toPortId === toPortId
            );

            if (connIndex !== -1) {
              targetPort.connectedTo.splice(connIndex, 1);
            }
          }
        }

        return { success: true };
      } catch (error) {
        console.error('Error deleting connection:', error);
        throw new Error(
          `Failed to delete connection: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Get connections for a node
  ipcMain.handle('connection:getForNode', (event, nodeId: string) => {
    try {
      const nodeConnections = connections.filter(
        conn => conn.fromNodeId === nodeId || conn.toNodeId === nodeId
      );

      return nodeConnections;
    } catch (error) {
      console.error('Error getting connections:', error);
      throw new Error(
        `Failed to get connections: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Expose saveAllNodes via IPC
  ipcMain.handle('database:saveAllNodes', async (event, botId: string) => {
    try {
      const nodeObj: { [key: string]: Node } = Object.fromEntries(nodeInstances.entries());
      return await saveAllNodes(botId, nodeObj);
    } catch (error) {
      console.error('Error in saveAllNodes IPC handler:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('node:getAllNodes', async (event) => {
    const allNodes = Array.from(nodeInstances.values()).map(node => ({
      nodeId: node.id,
      type: node.type,
      properties: node.properties,
      position: { x: 100, y: 100 },
      outputs: node.outputs
    }));
    return allNodes;
  });

  // Expose getAllBots via IPC
  ipcMain.handle('database:getAllBots', async (): Promise<unknown[]> => {
    try {
      const bots: unknown[] = await getAllBots();
      return bots;
    } catch (error) {
      console.error('Error in getAllBots IPC handler:', error);
      return [];
    }
  });

  // Expose getBotNodes via IPC
  ipcMain.handle('database:getBotNodes', async (event, botId: string): Promise<unknown[]> => {
    try {
      const nodes: unknown[] = await getBotNodes(botId);
      return nodes;
    } catch (error) {
      console.error('Error in getBotNodes IPC handler:', error);
      return [];
    }
  });

  // Expose getRunConditions via IPC
  ipcMain.handle('database:getRunConditions', async (event, botId: string) => {
    try {
      return await getRunConditions(botId);
    } catch (error) {
      console.error('Error in getRunConditions IPC handler:', error);
      return [];
    }
  });
  // Expose setBotEnabled via IPC
  ipcMain.handle('database:setBotEnabled', async (event, botId: string, enabled: boolean) => {
    try {
      await setBotEnabled(botId, enabled);
      return { success: true };
    } catch (error) {
      console.error('Error in setBotEnabled IPC handler:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  // Expose changeNameDb via IPC
  ipcMain.handle('database:changeName', async (event, oldId: string, newId: string) => {
    try {
      const result = await changeNameDb(oldId, newId);
      return result;
    } catch (error) {
      console.error('Error in database:changeName IPC handler:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  // Expose changeDescriptionDb via IPC
  ipcMain.handle(
    'database:changeDescription',
    async (event, botId: string, newDescription: string) => {
      try {
        await changeDescriptionDb(botId, newDescription);
        return { success: true };
      } catch (error) {
        console.error('Error in changeDescriptionDb IPC handler:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );
  // Expose changeStatusDb via IPC
  ipcMain.handle('database:changeStatus', async (event, botId: string, newStatus: boolean) => {
    try {
      await changeStatusDb(botId, newStatus);
      return { success: true };
    } catch (error) {
      console.error('Error in changeStatusDb IPC handler:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  // Expose addOrUpdateBotConditionDb via IPC
  ipcMain.handle(
    'database:addOrUpdateBotCondition',
    async (event, botId: string, key: string, value: string) => {
      try {
        await addOrUpdateBotConditionDb(botId, key, value);
        return { success: true };
      } catch (error) {
        console.error('Error in addOrUpdateBotConditionDb IPC handler:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );
  // Expose deleteBotConditionDb via IPC
  ipcMain.handle(
    'database:deleteBotCondition',
    async (event, botId: string, conditionId: string) => {
      try {
        await deleteBotConditionDb(botId, conditionId);
        return { success: true };
      } catch (error) {
        console.error('Error in deleteBotConditionDb IPC handler:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  // Bot configuration IPC handlers
  ipcMain.handle('botconfig:changeName', async (event, oldId: string, newId: string) => {
    try {
      // eslint-disable-next-line no-console
      console.log('[MAIN] Received botconfig:changeName IPC request:', { oldId, newId });
      const result = await changeNameDb(oldId, newId);

      if (result.success) {
        // eslint-disable-next-line no-console
        console.log('[MAIN] Successfully updated bot Id/Name in database to:', newId);
      } else {
        console.warn('[MAIN] Failed to update bot Id/Name in database:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Error changing bot Id/Name:', error);
      return {
        success: false,
        error: (error as Error).message || 'Unknown error during ID/Name change',
      };
    }
  });

  ipcMain.handle(
    'botconfig:changeDescription',
    async (event, botId: string, newDescription: string) => {
      try {
        await changeDescriptionDb(botId, newDescription);
        return { success: true };
      } catch (error) {
        console.error('Error changing bot description:', error);
        return { success: false, error: (error as Error).message || 'Unknown error' };
      }
    }
  );

  ipcMain.handle('botconfig:changeStatus', async (event, botId: string, newStatus: boolean) => {
    try {
      await changeStatusDb(botId, newStatus);
      return { success: true };
    } catch (error) {
      console.error('Error changing bot status:', error);
      return { success: false, error: (error as Error).message || 'Unknown error' };
    }
  });

  ipcMain.handle(
    'botconfig:addOrUpdateCondition',
    async (event, botId: string, key: string, value: string) => {
      try {
        await addOrUpdateBotConditionDb(botId, key, value);
        return { success: true };
      } catch (error) {
        console.error('Error adding/updating bot condition:', error);
        return { success: false, error: (error as Error).message || 'Unknown error' };
      }
    }
  );

  ipcMain.handle('botconfig:deleteCondition', async (event, botId: string, key: string) => {
    try {
      await deleteBotConditionDb(botId, key);
      return { success: true };
    } catch (error) {
      console.error('Error deleting bot condition:', error);
      return { success: false, error: (error as Error).message || 'Unknown error' };
    }
  });

  ipcMain.handle('node:clearAll', () => {
    try {
      console.log('[DEBUG-BACKEND] clearAllNodes called! Stack trace:');
      console.trace();
      console.log('[DEBUG-BACKEND] Clearing', nodeInstances.size, 'nodes and', connections.length, 'connections');
      
      nodeInstances.clear();
      connections.length = 0;

      return { success: true };
    } catch (error) {
      console.error('Error clearing all nodes:', error);
      return { success: false, error: (error as Error).message || 'Unknown error' };
    }
  });

  // Delete individual node from backend
  ipcMain.handle('node:delete', (event, nodeId: string) => {
    try {
      const node = nodeInstances.get(nodeId);
      if (!node) {
        return { success: false, error: `Node not found with id: ${nodeId}` };
      }

      nodeInstances.delete(nodeId);

      const nodeConnections = connections.filter(
        conn => conn.fromNodeId === nodeId || conn.toNodeId === nodeId
      );

      for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections[i];
        if (conn.fromNodeId === nodeId || conn.toNodeId === nodeId) {
          connections.splice(i, 1);
        }
      }

      nodeConnections.forEach(connection => {
        const sourceNode = nodeInstances.get(connection.fromNodeId);
        const targetNode = nodeInstances.get(connection.toNodeId);

        if (sourceNode) {
          const sourcePort = sourceNode.outputs.find(output => output.id === connection.fromPortId);
          if (sourcePort) {
            sourcePort.connectedTo = sourcePort.connectedTo.filter(
              conn =>
                !(
                  conn.fromNodeId === connection.fromNodeId &&
                  conn.fromPortId === connection.fromPortId &&
                  conn.toNodeId === connection.toNodeId &&
                  conn.toPortId === connection.toPortId
                )
            );
          }
        }

        if (targetNode) {
          const targetPort = targetNode.inputs.find(input => input.id === connection.toPortId);
          if (targetPort) {
            targetPort.connectedTo = targetPort.connectedTo.filter(
              conn =>
                !(
                  conn.fromNodeId === connection.fromNodeId &&
                  conn.fromPortId === connection.fromPortId &&
                  conn.toNodeId === connection.toNodeId &&
                  conn.toPortId === connection.toPortId
                )
            );
          }
        }
      });

      // eslint-disable-next-line no-console
      console.log(`Node ${nodeId} deleted from backend. Remaining nodes: ${nodeInstances.size}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting node:', error);
      return { success: false, error: (error as Error).message || 'Unknown error' };
    }
  });
}
