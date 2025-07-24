import { PortCategory } from '../../../../../core/base.js';
import { createConnection, connections } from './connectionLifecycle.js';

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
    // Clean up center points
    if (connection.fromCenterPoint && connection.fromCenterPoint.parentNode) {
      connection.fromCenterPoint.parentNode.removeChild(connection.fromCenterPoint);
    }
    if (connection.toCenterPoint && connection.toCenterPoint.parentNode) {
      connection.toCenterPoint.parentNode.removeChild(connection.toCenterPoint);
    }
  });
  connections.length = 0;
}
