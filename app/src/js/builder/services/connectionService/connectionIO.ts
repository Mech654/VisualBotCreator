import { PortCategory } from '../../../../../core/base';
import { createConnection, connections } from './connectionLifecycle';

export function exportConnections(): Record<string, any>[] {
  return connections.map(connection => ({
    fromNodeId: connection.fromNodeId,
    fromPortId: connection.fromPortId,
    toNodeId: connection.toNodeId,
    toPortId: connection.toPortId,
    flowType: connection.flowType || PortCategory.FLOW,
  }));
}

export async function importConnections(connectionData: Record<string, any>[]): Promise<void> {
  clearConnections();
  for (const data of connectionData) {
    await createConnection(data.fromNodeId, data.fromPortId, data.toNodeId, data.toPortId);
  }
}

export function clearConnections(): void {
  connections.forEach(connection => {
    if (connection.lineInstance) {
      connection.lineInstance.remove();
    }
  });
  connections.length = 0;
}
