import { ConnectionInstance, ConnectionMode } from '../../models/types';
import { PortCategory, PortType } from '../../../../../core/base';
import { getConnectionState, setConnectionState, CONNECTION_COLORS } from './connectionState';

declare const LeaderLine: any;

export const connections: ConnectionInstance[] = [];

export async function createConnection(
  fromNodeId: string,
  fromPortId: string,
  toNodeId: string,
  toPortId: string
): Promise<ConnectionInstance | null> {
  try {
    await window.nodeSystem.createConnection(fromNodeId, fromPortId, toNodeId, toPortId);
    const connectionId = `connection-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fromPortElement = document.querySelector(
      `.node[data-node-id="${fromNodeId}"] .output-port[data-port-id="${fromPortId}"]`
    ) as HTMLElement;
    const toPortElement = document.querySelector(
      `.node[data-node-id="${toNodeId}"] .input-port[data-port-id="${toPortId}"]`
    ) as HTMLElement;

    if (!fromPortElement || !toPortElement) {
      console.error('Could not find port elements for connection');
      return null;
    }

    const portCategory =
      fromPortElement.dataset.portCategory ||
      (fromPortElement.dataset.portType === PortType.CONTROL
        ? PortCategory.FLOW
        : PortCategory.DATA);
    const connectionColor = CONNECTION_COLORS[portCategory as keyof typeof CONNECTION_COLORS];

    const line = new LeaderLine(fromPortElement, toPortElement, {
      path: 'fluid',
      startPlug: 'disc',
      endPlug: 'arrow3',
      color: connectionColor,
      size: portCategory === PortCategory.FLOW ? 3 : 2,
      startSocketGravity: 20,
      endSocketGravity: 20,
      dash: portCategory === PortCategory.DATA ? { animation: true } : false,
    });

    if (line.element) {
      line.element.classList.add(`${portCategory}-connection`);
    }

    const connection: ConnectionInstance = {
      id: connectionId,
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
      flowType: portCategory,
      lineInstance: line,
    };
    connections.push(connection);

    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.classList.remove('connecting-mode');
      canvas.classList.remove('flow-connecting-mode');
      canvas.classList.remove('data-connecting-mode');
    }
    return connection;
  } catch (error) {
    console.error('Error creating connection:', error);
    return null;
  }
}

export function cancelConnectionDrawing(): void {
  const currentConnectionState = getConnectionState();
  if (currentConnectionState.mode === ConnectionMode.CONNECTING) {
    if (currentConnectionState.tempLine) {
      currentConnectionState.tempLine.remove();
    }
    if (currentConnectionState.tempEndPoint && currentConnectionState.tempEndPoint.parentNode) {
      currentConnectionState.tempEndPoint.parentNode.removeChild(currentConnectionState.tempEndPoint);
    }
    if (currentConnectionState.startPortElement) {
      currentConnectionState.startPortElement.classList.remove('active-port');
    }
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.classList.remove('connecting-mode');
      canvas.classList.remove('flow-connecting-mode');
      canvas.classList.remove('data-connecting-mode');
    }
    setConnectionState({ mode: ConnectionMode.NONE });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cancelConnectionDrawing();
    }
  });
}

export function updateConnections(): void {
  connections.forEach(connection => {
    if (connection.lineInstance) {
      connection.lineInstance.position();
    }
  });
}

export function getNodeConnections(nodeId: string): ConnectionInstance[] {
  return connections.filter(conn => conn.fromNodeId === nodeId || conn.toNodeId === nodeId);
}

export function removeNodeConnections(nodeId: string): void {
  const nodeConnections = getNodeConnections(nodeId);
  nodeConnections.forEach(connection => {
    if (connection.lineInstance) {
      connection.lineInstance.remove();
    }
    const index = connections.findIndex(conn => conn.id === connection.id);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  });
}
