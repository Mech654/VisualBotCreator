import { NodeInstance, NodePosition } from '../models/types.js';
import { generateNodeHtml } from '../ui/nodeRenderer.js';
import { snapToGrid, checkCollision } from '../utils/grid.js';
import { initNodeConnections, removeNodeConnections, updateConnections } from './connectionService.js';

// Store node positions for collision detection
const nodePositions = new Map<HTMLElement, NodePosition>();

/**
 * Update position for a node in the tracking map
 */
export function updateNodePosition(node: HTMLElement): void {
  nodePositions.set(node, {
    x: node.offsetLeft,
    y: node.offsetTop
  });

  // Update any connections attached to this node
  updateConnections();
}

/**
 * Check if adding a node at a position would collide with existing nodes
 */
export function checkPositionValidity(x: number, y: number, width: number, height: number, allNodes: HTMLElement[]): boolean {
  const tempRect = {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height
  };

  for (const node of allNodes) {
    const position = nodePositions.get(node);
    if (!position) continue;

    if (checkCollision({
      left: position.x,
      right: position.x + node.offsetWidth,
      top: position.y,
      bottom: position.y + node.offsetHeight
    }, tempRect)) {
      return false;
    }
  }

  return true;
}

/**
 * Shows the properties panel for a node instance
 */
export function showPropertiesPanel(nodeInstance: NodeInstance): void {
  const componentsPanel = document.querySelector('.components-container') as HTMLElement;
  const propertiesPanel = document.getElementById('properties-panel') as HTMLElement;

  if (!componentsPanel || !propertiesPanel) return;

  componentsPanel.style.display = 'none';
  propertiesPanel.style.display = 'block';

  const propertiesToggle = document.getElementById('properties-toggle');
  if (propertiesToggle) propertiesToggle.textContent = '🧩';

  // Populate properties panel based on node instance
  updatePropertiesPanel(nodeInstance);
}

/**
 * Update properties panel with node instance data
 */
export function updatePropertiesPanel(nodeInstance: NodeInstance): void {
  const propertiesPanel = document.getElementById('properties-panel');
  if (!propertiesPanel) return;

  // Set node name/ID in properties
  const nameInput = propertiesPanel.querySelector('input[aria-label="Node name"]') as HTMLInputElement;
  if (nameInput) nameInput.value = nodeInstance.properties.title || '';

  const idInput = propertiesPanel.querySelector('input[aria-label="Node ID"]') as HTMLInputElement;
  if (idInput) idInput.value = nodeInstance.id;

  // Add more property-specific controls based on node type
  const contentArea = propertiesPanel.querySelector('textarea[aria-label="Node message content"]') as HTMLTextAreaElement;
  if (contentArea && nodeInstance.type === 'message') {
    contentArea.value = nodeInstance.properties.message || '';
  }
}

/**
 * Create node instance and DOM element using IPC bridge
 * @param type The type of node to create
 * @param x X position of the node
 * @param y Y position of the node
 * @param flowType The flow type ('flow' or 'data')
 */
export async function createNodeInstance(
  type: string,
  x: number,
  y: number,
  flowType: string = 'flow'
): Promise<{ nodeElement: HTMLElement, nodeInstance: NodeInstance } | null> {
  // Generate a unique ID for the node
  const id = window.utils.generateNodeId();

  try {
    // Create node instance using the IPC bridge
    const nodeInstance = await window.nodeSystem.createNode(type, id, {
      flowType // Pass flow type to the backend
    });

    // Create DOM element for visual representation
    const nodeElement = document.createElement('div');
    nodeElement.className = 'node';
    nodeElement.id = id;
    nodeElement.dataset.nodeId = id;
    nodeElement.dataset.nodeType = type;
    nodeElement.dataset.flowType = flowType; // Store flow type in DOM

    // Position the node
    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;

    // Set node header style based on flow type
    if (flowType === 'data') {
      nodeElement.classList.add('data-node');
    } else {
      nodeElement.classList.add('flow-node');
    }

    // Generate node HTML
    nodeElement.innerHTML = generateNodeHtml(nodeInstance);

    // Initialize connection functionality for the node
    setTimeout(() => {
      initNodeConnections(nodeElement, nodeInstance);

      // Set port types based on flow type
      const ports = nodeElement.querySelectorAll('.port');
      ports.forEach(port => {
        const portEl = port as HTMLElement;

        // Get specific data type from port's data attribute
        const specificType = portEl.dataset.portType;

        // Only update ports that don't have specific types
        if (!specificType || specificType === 'control') {
          if (flowType === 'data') {
            portEl.classList.add('port-data');
            portEl.dataset.portType = 'data';
          } else {
            portEl.classList.add('port-control');
            portEl.dataset.portType = 'control';
          }
        }
      });
    }, 0);

    return { nodeElement, nodeInstance };
  } catch (error) {
    console.error(`Error creating node of type ${type}:`, error);
    return null;
  }
}

/**
 * Delete a node and remove its connections
 */
export function deleteNode(nodeElement: HTMLElement): void {
  // Get node ID
  const nodeId = nodeElement.dataset.nodeId;

  if (nodeId) {
    // Remove any connections to/from this node
    removeNodeConnections(nodeId);

    // Remove from DOM
    nodeElement.remove();

    // Remove from position tracking
    nodePositions.delete(nodeElement);
  }
}