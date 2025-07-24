import { ConnectionInstance, ConnectionMode } from '../../models/types.js';
import { PortCategory, PortType } from '../../../../../core/base.js';
import { getConnectionState, setConnectionState, CONNECTION_COLORS } from './connectionState.js';

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

    // Create invisible center points for more precise connections
    const fromRect = fromPortElement.getBoundingClientRect();
    const toRect = toPortElement.getBoundingClientRect();
    
    const fromCenterPoint = document.createElement('div');
    fromCenterPoint.style.position = 'absolute';
    fromCenterPoint.style.left = `${fromRect.left + fromRect.width / 2}px`;
    fromCenterPoint.style.top = `${fromRect.top + fromRect.height / 2}px`;
    fromCenterPoint.style.width = '1px';
    fromCenterPoint.style.height = '1px';
    fromCenterPoint.style.pointerEvents = 'none';
    fromCenterPoint.style.zIndex = '-1';
    document.body.appendChild(fromCenterPoint);
    
    const toCenterPoint = document.createElement('div');
    toCenterPoint.style.position = 'absolute';
    toCenterPoint.style.left = `${toRect.left + toRect.width / 2}px`;
    toCenterPoint.style.top = `${toRect.top + toRect.height / 2}px`;
    toCenterPoint.style.width = '1px';
    toCenterPoint.style.height = '1px';
    toCenterPoint.style.pointerEvents = 'none';
    toCenterPoint.style.zIndex = '-1';
    document.body.appendChild(toCenterPoint);

    const line = new LeaderLine(fromCenterPoint, toCenterPoint, {
      path: 'fluid',
      startPlug: 'disc',
      endPlug: 'arrow3',
      color: connectionColor,
      size: portCategory === PortCategory.FLOW ? 3 : 2,
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
      fromCenterPoint,
      toCenterPoint,
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
      currentConnectionState.tempEndPoint.parentNode.removeChild(
        currentConnectionState.tempEndPoint
      );
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
    if (connection.lineInstance && connection.fromCenterPoint && connection.toCenterPoint) {
      // Update center point positions
      const fromPortElement = document.querySelector(
        `.node[data-node-id="${connection.fromNodeId}"] .output-port[data-port-id="${connection.fromPortId}"]`
      ) as HTMLElement;
      const toPortElement = document.querySelector(
        `.node[data-node-id="${connection.toNodeId}"] .input-port[data-port-id="${connection.toPortId}"]`
      ) as HTMLElement;
      
      if (fromPortElement && toPortElement) {
        const fromRect = fromPortElement.getBoundingClientRect();
        const toRect = toPortElement.getBoundingClientRect();
        
        connection.fromCenterPoint.style.left = `${fromRect.left + fromRect.width / 2}px`;
        connection.fromCenterPoint.style.top = `${fromRect.top + fromRect.height / 2}px`;
        
        connection.toCenterPoint.style.left = `${toRect.left + toRect.width / 2}px`;
        connection.toCenterPoint.style.top = `${toRect.top + toRect.height / 2}px`;
      }
      
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
    // Clean up center points
    if (connection.fromCenterPoint && connection.fromCenterPoint.parentNode) {
      connection.fromCenterPoint.parentNode.removeChild(connection.fromCenterPoint);
    }
    if (connection.toCenterPoint && connection.toCenterPoint.parentNode) {
      connection.toCenterPoint.parentNode.removeChild(connection.toCenterPoint);
    }
    const index = connections.findIndex(conn => conn.id === connection.id);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  });
}
