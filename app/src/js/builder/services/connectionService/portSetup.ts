import { NodeInstance, ConnectionMode } from '../../models/types';
import { PortCategory, PortType } from '../../../../../core/base';
import { getConnectionState, setConnectionState, CONNECTION_COLORS } from './connectionState';
import { showConnectionFeedback, checkPortsCompatibility } from './connectionUtils';
import { createConnection, cancelConnectionDrawing } from './connectionLifecycle';

declare const LeaderLine: any;

export function initNodeConnections(nodeElement: HTMLElement, nodeInstance: NodeInstance): void {
  nodeElement.querySelectorAll('.input-port').forEach(port => {
    setupInputPort(port as HTMLElement, nodeElement, nodeInstance);
  });

  nodeElement.querySelectorAll('.output-port').forEach(port => {
    setupOutputPort(port as HTMLElement, nodeElement, nodeInstance);
  });
}

function setupInputPort(
  portElement: HTMLElement,
  nodeElement: HTMLElement,
  nodeInstance: NodeInstance
): void {
  portElement.addEventListener('click', event => {
    event.stopPropagation();
    const currentConnectionState = getConnectionState();

    if (currentConnectionState.mode === ConnectionMode.CONNECTING) {
      const fromNodeId = currentConnectionState.startNodeId as string;
      const fromPortId = currentConnectionState.startPortId as string;
      const toNodeId = nodeElement.dataset.nodeId as string;
      const toPortId = portElement.dataset.portId as string;

      const compatibilityResult = checkPortsCompatibility(
        currentConnectionState.startPortElement as HTMLElement,
        portElement
      );

      if (compatibilityResult.compatible) {
        createConnection(fromNodeId, fromPortId, toNodeId, toPortId);
      } else {
        showConnectionFeedback(
          portElement,
          `Incompatible: ${compatibilityResult.reason}`,
          'var(--danger)'
        );
        portElement.classList.add('incompatible');
        setTimeout(() => {
          portElement.classList.remove('incompatible');
        }, 1000);
      }

      if (currentConnectionState.tempLine) {
        currentConnectionState.tempLine.remove();
      }

      if (currentConnectionState.startPortElement) {
        currentConnectionState.startPortElement.classList.remove('active-port');
      }

      setConnectionState({ mode: ConnectionMode.NONE });

      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.classList.remove('connecting-mode');
        canvas.classList.remove('flow-connecting-mode');
        canvas.classList.remove('data-connecting-mode');
      }
    }
  });

  portElement.addEventListener('mouseover', () => {
    const currentConnectionState = getConnectionState();
    if (currentConnectionState.mode === ConnectionMode.CONNECTING) {
      const compatibilityResult = checkPortsCompatibility(
        currentConnectionState.startPortElement as HTMLElement,
        portElement
      );
      const isCompatible = compatibilityResult.compatible;

      if (isCompatible) {
        portElement.classList.add('compatible');
      } else {
        if (compatibilityResult.reason === 'Category mismatch') {
          portElement.classList.add('category-incompatible');
        } else {
          portElement.classList.add('incompatible');
        }
      }
      showConnectionFeedback(
        portElement,
        isCompatible ? 'Compatible' : compatibilityResult.reason,
        isCompatible ? 'var(--success)' : 'var(--danger)'
      );
    }
  });

  portElement.addEventListener('mouseout', () => {
    portElement.classList.remove('compatible');
    portElement.classList.remove('incompatible');
    portElement.classList.remove('category-incompatible');
    const tooltip = document.querySelector('.port-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  });
}

function setupOutputPort(
  portElement: HTMLElement,
  nodeElement: HTMLElement,
  nodeInstance: NodeInstance
): void {
  portElement.addEventListener('click', event => {
    event.stopPropagation();
    const currentConnectionState = getConnectionState();

    if (currentConnectionState.mode === ConnectionMode.CONNECTING) {
      cancelConnectionDrawing();
      return;
    }

    const nodeId = nodeElement.dataset.nodeId as string;
    const portId = portElement.dataset.portId as string;
    const portType = portElement.dataset.portType || PortType.CONTROL;
    const portCategory =
      portElement.dataset.portCategory ||
      (portType === PortType.CONTROL ? PortCategory.FLOW : PortCategory.DATA);
    const connectionColor = CONNECTION_COLORS[portCategory as keyof typeof CONNECTION_COLORS];

    portElement.classList.add('active-port');

    setConnectionState({
      mode: ConnectionMode.CONNECTING,
      startNodeId: nodeId,
      startPortId: portId,
      startPortElement: portElement,
      flowType: portCategory,
    });

    const tempEndPoint = document.createElement('div');
    tempEndPoint.style.position = 'absolute';
    tempEndPoint.style.left = `${event.pageX}px`;
    tempEndPoint.style.top = `${event.pageY}px`;
    tempEndPoint.style.width = '1px';
    tempEndPoint.style.height = '1px';
    tempEndPoint.style.pointerEvents = 'none';
    document.body.appendChild(tempEndPoint);

    try {
      const tempLine = new LeaderLine(
        portElement,
        tempEndPoint,
        {
          path: 'fluid',
          startPlug: 'disc',
          endPlug: 'arrow3',
          color: connectionColor,
          size: portCategory === PortCategory.FLOW ? 3 : 2,
          startSocketGravity: 20,
          endSocketGravity: 20,
          dash: portCategory === PortCategory.DATA ? { animation: true } : false,
        }
      );

      if (tempLine.element) {
        tempLine.element.classList.add(`${portCategory}-connection`);
      }
      
      const updatedState = getConnectionState();
      updatedState.tempLine = tempLine;
      updatedState.tempEndPoint = tempEndPoint;
      setConnectionState(updatedState);

    } catch (err) {
      console.error('Error creating leader line:', err);
      document.body.removeChild(tempEndPoint);
      return;
    }

    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.classList.add('connecting-mode');
      canvas.classList.add(`${portCategory}-connecting-mode`);

      const mouseMoveHandler = (e: MouseEvent) => {
        const latestConnectionState = getConnectionState();
        if (latestConnectionState.mode === ConnectionMode.CONNECTING) {
          if (latestConnectionState.tempEndPoint) {
            latestConnectionState.tempEndPoint.style.left = `${e.pageX}px`;
            latestConnectionState.tempEndPoint.style.top = `${e.pageY}px`;
            if (latestConnectionState.tempLine) {
              latestConnectionState.tempLine.position();
            }
          }
        }
      };

      const clickHandler = (e: MouseEvent) => {
        if (e.target === canvas && getConnectionState().mode === ConnectionMode.CONNECTING) {
          cancelConnectionDrawing();
          canvas.removeEventListener('mousemove', mouseMoveHandler);
          canvas.removeEventListener('click', clickHandler);
        }
      };

      canvas.addEventListener('mousemove', mouseMoveHandler);
      canvas.addEventListener('click', clickHandler);
    }
  });
}
