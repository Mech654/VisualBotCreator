import {
  ConnectionInstance,
  ConnectionMode,
  ConnectionState,
  NodeInstance,
} from '../models/types.js';
import { PortCategory, PortType } from '../../../core/base.js';

// We'll use the leader-line-new library to draw the connections
declare const LeaderLine: any;

// Global connection state
let connectionState: ConnectionState = {
  mode: ConnectionMode.NONE,
};

// Store all active connections
const connections: ConnectionInstance[] = [];

// Connection colors for different flow types
const CONNECTION_COLORS = {
  [PortCategory.FLOW]: '#e67e22', // Orange for control flow
  [PortCategory.DATA]: '#3498db', // Blue for data flow
};

/**
 * Type conversion compatibility mapping for frontend checking
 * This should match the backend compatibility logic
 */
const PORT_TYPE_COMPATIBILITY: Record<string, string[]> = {
  [PortType.ANY]: [
    PortType.STRING,
    PortType.NUMBER,
    PortType.BOOLEAN,
    PortType.OBJECT,
    PortType.ARRAY,
    PortType.ANY,
  ],
  [PortType.NUMBER]: [PortType.STRING],
  [PortType.BOOLEAN]: [PortType.STRING],
  [PortType.STRING]: [],
  [PortType.OBJECT]: [],
  [PortType.ARRAY]: [],
  [PortType.CONTROL]: [],
};

/**
 * Initialize connection functionality for node ports
 */
export function initNodeConnections(nodeElement: HTMLElement, nodeInstance: NodeInstance): void {
  // Initialize input ports as drop targets
  nodeElement.querySelectorAll('.input-port').forEach(port => {
    setupInputPort(port as HTMLElement, nodeElement, nodeInstance);
  });

  // Initialize output ports as drag sources
  nodeElement.querySelectorAll('.output-port').forEach(port => {
    setupOutputPort(port as HTMLElement, nodeElement, nodeInstance);
  });
}

/**
 * Set up input port as connection drop target
 */
function setupInputPort(
  portElement: HTMLElement,
  nodeElement: HTMLElement,
  nodeInstance: NodeInstance
): void {
  portElement.addEventListener('click', event => {
    event.stopPropagation(); // Prevent node selection

    if (connectionState.mode === ConnectionMode.CONNECTING) {
      // Complete the connection
      const fromNodeId = connectionState.startNodeId as string;
      const fromPortId = connectionState.startPortId as string;
      const toNodeId = nodeElement.dataset.nodeId as string;
      const toPortId = portElement.dataset.portId as string;

      // First check port compatibility
      const compatibilityResult = checkPortsCompatibility(
        connectionState.startPortElement as HTMLElement,
        portElement
      );

      if (compatibilityResult.compatible) {
        createConnection(fromNodeId, fromPortId, toNodeId, toPortId);
      } else {
        // Show incompatible types warning with specific message
        showConnectionFeedback(
          portElement,
          `Incompatible: ${compatibilityResult.reason}`,
          'var(--danger)'
        );

        // Add incompatible class for visual feedback
        portElement.classList.add('incompatible');
        setTimeout(() => {
          portElement.classList.remove('incompatible');
        }, 1000);
      }

      // Clean up temp line
      if (connectionState.tempLine) {
        connectionState.tempLine.remove();
      }

      // Remove highlighting from starting port
      if (connectionState.startPortElement) {
        connectionState.startPortElement.classList.remove('active-port');
      }

      // Reset connection state
      connectionState = { mode: ConnectionMode.NONE };

      // Remove connection mode classes from canvas
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.classList.remove('connecting-mode');
        canvas.classList.remove('flow-connecting-mode');
        canvas.classList.remove('data-connecting-mode');
      }
    }
  });

  // Visual feedback on hover during connection mode
  portElement.addEventListener('mouseover', () => {
    if (connectionState.mode === ConnectionMode.CONNECTING) {
      const compatibilityResult = checkPortsCompatibility(
        connectionState.startPortElement as HTMLElement,
        portElement
      );

      const isCompatible = compatibilityResult.compatible;

      // Add appropriate class for visual feedback
      if (isCompatible) {
        portElement.classList.add('compatible');
      } else {
        if (compatibilityResult.reason === 'Category mismatch') {
          portElement.classList.add('category-incompatible');
        } else {
          portElement.classList.add('incompatible');
        }
      }

      // Show feedback based on compatibility
      showConnectionFeedback(
        portElement,
        isCompatible ? 'Compatible' : compatibilityResult.reason,
        isCompatible ? 'var(--success)' : 'var(--danger)'
      );
    }
  });

  portElement.addEventListener('mouseout', () => {
    // Remove visual feedback
    portElement.classList.remove('compatible');
    portElement.classList.remove('incompatible');
    portElement.classList.remove('category-incompatible');

    // Remove tooltip if exists
    const tooltip = document.querySelector('.port-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  });
}

/**
 * Set up output port as connection source
 */
function setupOutputPort(
  portElement: HTMLElement,
  nodeElement: HTMLElement,
  nodeInstance: NodeInstance
): void {
  portElement.addEventListener('click', event => {
    event.stopPropagation(); // Prevent node selection

    // If already in connection mode, cancel the current operation
    if (connectionState.mode === ConnectionMode.CONNECTING) {
      if (connectionState.tempLine) {
        connectionState.tempLine.remove();
      }

      // Remove active-port class from the starting port
      if (connectionState.startPortElement) {
        connectionState.startPortElement.classList.remove('active-port');
      }

      connectionState = { mode: ConnectionMode.NONE };

      // Remove connection mode classes from canvas
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.classList.remove('connecting-mode');
        canvas.classList.remove('flow-connecting-mode');
        canvas.classList.remove('data-connecting-mode');
      }

      return;
    }

    // Start connection process
    const nodeId = nodeElement.dataset.nodeId as string;
    const portId = portElement.dataset.portId as string;

    // Get the port type and category
    const portType = portElement.dataset.portType || PortType.CONTROL;
    const portCategory =
      portElement.dataset.portCategory ||
      (portType === PortType.CONTROL ? PortCategory.FLOW : PortCategory.DATA);

    // Get appropriate connection color based on category
    const connectionColor = CONNECTION_COLORS[portCategory as keyof typeof CONNECTION_COLORS];

    // Highlight the starting port
    portElement.classList.add('active-port');

    // Update connection state
    connectionState = {
      mode: ConnectionMode.CONNECTING,
      startNodeId: nodeId,
      startPortId: portId,
      startPortElement: portElement,
      flowType: portCategory,
    };

    // Create a temporary DOM element for the end point that will follow the mouse
    const tempEndPoint = document.createElement('div');
    tempEndPoint.style.position = 'absolute';
    tempEndPoint.style.left = `${event.pageX}px`;
    tempEndPoint.style.top = `${event.pageY}px`;
    tempEndPoint.style.width = '1px';
    tempEndPoint.style.height = '1px';
    tempEndPoint.style.pointerEvents = 'none';
    document.body.appendChild(tempEndPoint);

    // Create temporary line that follows the mouse pointer using the temporary end point
    try {
      const tempLine = new LeaderLine(
        portElement,
        tempEndPoint, // Use the temporary DOM element as end point
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

      // Apply proper CSS class for styling
      if (tempLine.element) {
        tempLine.element.classList.add(`${portCategory}-connection`);
      }

      // Store the temporary line and endpoint for later cleanup
      connectionState.tempLine = tempLine;
      connectionState.tempEndPoint = tempEndPoint;
    } catch (err) {
      console.error('Error creating leader line:', err);
      document.body.removeChild(tempEndPoint);
      return;
    }

    // Add mouse move handler to canvas
    const canvas = document.getElementById('canvas');
    if (canvas) {
      // Add connecting-mode class to canvas for cursor styling
      canvas.classList.add('connecting-mode');
      canvas.classList.add(`${portCategory}-connecting-mode`);

      const mouseMoveHandler = (e: MouseEvent) => {
        if (connectionState.mode === ConnectionMode.CONNECTING) {
          if (connectionState.tempEndPoint) {
            // Update the position of our temporary end point element
            connectionState.tempEndPoint.style.left = `${e.pageX}px`;
            connectionState.tempEndPoint.style.top = `${e.pageY}px`;

            // Update the leader line position
            if (connectionState.tempLine) {
              connectionState.tempLine.position();
            }
          }
        }
      };

      // Add click handler to abort on canvas click
      const clickHandler = (e: MouseEvent) => {
        // Only handle direct canvas clicks, not bubbled events from ports
        if (e.target === canvas && connectionState.mode === ConnectionMode.CONNECTING) {
          if (connectionState.tempLine) {
            connectionState.tempLine.remove();
          }

          // Remove the temporary end point
          if (connectionState.tempEndPoint && connectionState.tempEndPoint.parentNode) {
            connectionState.tempEndPoint.parentNode.removeChild(connectionState.tempEndPoint);
          }

          // Remove highlighting from starting port
          if (connectionState.startPortElement) {
            connectionState.startPortElement.classList.remove('active-port');
          }

          // Remove connecting-mode classes
          canvas.classList.remove('connecting-mode');
          canvas.classList.remove('flow-connecting-mode');
          canvas.classList.remove('data-connecting-mode');

          connectionState = { mode: ConnectionMode.NONE };

          // Clean up event listeners
          canvas.removeEventListener('mousemove', mouseMoveHandler);
          canvas.removeEventListener('click', clickHandler);
        }
      };

      canvas.addEventListener('mousemove', mouseMoveHandler);
      canvas.addEventListener('click', clickHandler);
    }
  });
}

/**
 * Create a new connection between two nodes
 */
export async function createConnection(
  fromNodeId: string,
  fromPortId: string,
  toNodeId: string,
  toPortId: string
): Promise<ConnectionInstance | null> {
  try {
    // Call the backend API to create the connection
    await window.nodeSystem.createConnection(fromNodeId, fromPortId, toNodeId, toPortId);

    // Generate a unique ID for the connection
    const connectionId = `connection-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Find the port elements
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

    // Determine the port category (flow or data)
    const portCategory =
      fromPortElement.dataset.portCategory ||
      (fromPortElement.dataset.portType === PortType.CONTROL
        ? PortCategory.FLOW
        : PortCategory.DATA);

    const connectionColor = CONNECTION_COLORS[portCategory as keyof typeof CONNECTION_COLORS];

    // Create a visual connection using LeaderLine
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

    // Apply proper CSS class for styling
    if (line.element) {
      line.element.classList.add(`${portCategory}-connection`);
    }

    // Create connection instance
    const connection: ConnectionInstance = {
      id: connectionId,
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
      flowType: portCategory,
      lineInstance: line,
    };

    // Add to connections array
    connections.push(connection);

    // Remove connecting-mode class from canvas
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.classList.remove('connecting-mode');
      canvas.classList.remove('flow-connecting-mode');
      canvas.classList.remove('data-connecting-mode');
    }

    // Return the new connection
    return connection;
  } catch (error) {
    console.error('Error creating connection:', error);
    return null;
  }
}

/**
 * Show visual feedback when hovering over a port during connection
 */
function showConnectionFeedback(portElement: HTMLElement, message: string, color: string): void {
  // Remove existing tooltip
  const existingTooltip = document.querySelector('.port-tooltip');
  if (existingTooltip) existingTooltip.remove();

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'port-tooltip';
  tooltip.textContent = message;
  tooltip.style.position = 'absolute';
  tooltip.style.background = color;
  tooltip.style.color = 'white';
  tooltip.style.padding = '4px 8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.zIndex = '100';
  tooltip.style.pointerEvents = 'none';

  // Position the tooltip near the port
  const rect = portElement.getBoundingClientRect();
  const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();

  if (canvasRect) {
    tooltip.style.left = `${rect.left + rect.width / 2 - canvasRect.left}px`;
    tooltip.style.top = `${rect.top - 30 - canvasRect.top}px`;

    // Add to canvas
    document.getElementById('canvas')?.appendChild(tooltip);
  }
}

/**
 * Check if two ports are compatible for connection with detailed feedback
 */
function checkPortsCompatibility(
  sourcePort: HTMLElement,
  targetPort: HTMLElement
): { compatible: boolean; reason: string } {
  // Check if one is an output port and one is an input port
  const isSourceOutput = sourcePort.classList.contains('output-port');
  const isTargetInput = targetPort.classList.contains('input-port');

  if (!isSourceOutput || !isTargetInput) {
    return {
      compatible: false,
      reason: 'Must connect from output to input',
    };
  }

  // Get port categories
  const sourceCategory =
    sourcePort.dataset.portCategory ||
    (sourcePort.dataset.portType === PortType.CONTROL ? PortCategory.FLOW : PortCategory.DATA);

  const targetCategory =
    targetPort.dataset.portCategory ||
    (targetPort.dataset.portType === PortType.CONTROL ? PortCategory.FLOW : PortCategory.DATA);

  // Check if categories match (flow to flow, data to data)
  if (sourceCategory !== targetCategory) {
    return {
      compatible: false,
      reason: 'Category mismatch',
    };
  }

  // If they're flow ports and categories match, they're compatible
  if (sourceCategory === PortCategory.FLOW && targetCategory === PortCategory.FLOW) {
    return { compatible: true, reason: 'Flow ports match' };
  }

  // For data ports, check specific type compatibility
  const sourceType = sourcePort.dataset.portType || '';
  const targetType = targetPort.dataset.portType || '';

  // ANY type can connect to any other data type
  if (sourceType === PortType.ANY || targetType === PortType.ANY) {
    return { compatible: true, reason: 'Compatible via ANY type' };
  }

  // Direct type match
  if (sourceType === targetType) {
    return { compatible: true, reason: 'Types match' };
  }

  // Check if source can be converted to target
  const compatibleTypes = PORT_TYPE_COMPATIBILITY[sourceType] || [];
  if (compatibleTypes.includes(targetType)) {
    return { compatible: true, reason: `${sourceType} can convert to ${targetType}` };
  }

  // Types are incompatible
  return {
    compatible: false,
    reason: `Type mismatch: ${sourceType} → ${targetType}`,
  };
}

/**
 * Update all connections positions (call after node movement)
 */
export function updateConnections(): void {
  connections.forEach(connection => {
    if (connection.lineInstance) {
      connection.lineInstance.position();
    }
  });
}

/**
 * Find connections related to a node
 */
export function getNodeConnections(nodeId: string): ConnectionInstance[] {
  return connections.filter(conn => conn.fromNodeId === nodeId || conn.toNodeId === nodeId);
}

/**
 * Remove connections related to a node
 */
export function removeNodeConnections(nodeId: string): void {
  const nodeConnections = getNodeConnections(nodeId);

  nodeConnections.forEach(connection => {
    if (connection.lineInstance) {
      // Remove the visual line
      connection.lineInstance.remove();
    }

    // Remove from the connections array
    const index = connections.findIndex(conn => conn.id === connection.id);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  });
}

/**
 * Export connections to a JSON format for saving
 */
export function exportConnections(): Record<string, any>[] {
  return connections.map(connection => ({
    fromNodeId: connection.fromNodeId,
    fromPortId: connection.fromPortId,
    toNodeId: connection.toNodeId,
    toPortId: connection.toPortId,
    flowType: connection.flowType || PortCategory.FLOW,
  }));
}

/**
 * Import connections from JSON format
 */
export async function importConnections(connectionData: Record<string, any>[]): Promise<void> {
  // Clear existing connections
  clearConnections();

  // Create each connection
  for (const data of connectionData) {
    await createConnection(data.fromNodeId, data.fromPortId, data.toNodeId, data.toPortId);
  }
}

/**
 * Clear all connections
 */
export function clearConnections(): void {
  connections.forEach(connection => {
    if (connection.lineInstance) {
      connection.lineInstance.remove();
    }
  });

  // Clear connections array
  connections.length = 0;
}
