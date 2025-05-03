import { NodeInstance, NodePosition } from '../models/types.js';
import { generateNodeHtml } from '../ui/nodeRenderer';
import { snapToGrid } from '../utils/grid';
import { updateConnections } from './connectionService';
import { checkCollision } from './dragDropService';
import { initNodeConnections, removeNodeConnections } from './connectionService';

// Store node positions for collision detection
const nodePositions = new Map<HTMLElement, NodePosition>();

/**
 * Update position for a node in the tracking map
 */
export function updateNodePosition(node: HTMLElement): void {
  nodePositions.set(node, {
    x: node.offsetLeft,
    y: node.offsetTop,
  });

  // Update any connections attached to this node
  updateConnections();
}

/**
 * Check if adding a node at a position would collide with existing nodes
 */
export function checkPositionValidity(
  x: number,
  y: number,
  width: number,
  height: number,
  allNodes: HTMLElement[]
): boolean {
  const tempRect = {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
  };

  for (const node of allNodes) {
    const position = nodePositions.get(node);
    if (!position) continue;

    if (
      checkCollision(
        {
          left: position.x,
          right: position.x + node.offsetWidth,
          top: position.y,
          bottom: position.y + node.offsetHeight,
        },
        tempRect
      )
    ) {
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

  // Clear previous content groups except the general one
  const existingGroups = propertiesPanel.querySelectorAll('.property-group:not(:first-child)');
  existingGroups.forEach(group => group.remove());

  // Set node name/ID in properties
  const nameInput = propertiesPanel.querySelector(
    'input[aria-label="Node name"]'
  ) as HTMLInputElement;
  if (nameInput)
    nameInput.value =
      nodeInstance.properties.title ||
      nodeInstance.type.charAt(0).toUpperCase() + nodeInstance.type.slice(1);

  const idInput = propertiesPanel.querySelector('input[aria-label="Node ID"]') as HTMLInputElement;
  if (idInput) idInput.value = nodeInstance.id;

  // Create a property group for this node type
  const propertiesGroup = document.createElement('div');
  propertiesGroup.className = 'property-group';

  try {
    // Request the HTML for this node's property panel from the backend
    window.nodeSystem
      .getNodeById(nodeInstance.id)
      .then((node: any) => {
        // If the node exists and has a generatePropertiesPanel method, use it
        if (node) {
          // Generate the HTML content through the Node API
          propertiesGroup.innerHTML = node.generatePropertiesPanel
            ? node.generatePropertiesPanel()
            : generateDefaultPropertiesPanel(nodeInstance);

          // Add the properties group to the panel
          propertiesPanel.appendChild(propertiesGroup);

          // Set up event listeners
          if (node.setupPropertyEventListeners) {
            node.setupPropertyEventListeners(propertiesGroup);
          }

          // Add a change event handler that updates the node in the backend
          const inputs = propertiesGroup.querySelectorAll('input, textarea, select');
          inputs.forEach(input => {
            input.addEventListener('change', () => {
              // Update the node in the backend
              window.nodeSystem
                .createNode(nodeInstance.type, nodeInstance.id, nodeInstance.properties)
                .catch((error: unknown) => console.error('Error updating node:', error));
            });
          });
        }
      })
      .catch((error: unknown) => {
        console.error('Error fetching node for properties panel:', error);
        // Fallback to generic panel
        propertiesGroup.innerHTML = generateDefaultPropertiesPanel(nodeInstance);
        propertiesPanel.appendChild(propertiesGroup);
      });
  } catch (error: unknown) {
    console.error('Error generating properties panel:', error);
    // Fallback to generic panel
    propertiesGroup.innerHTML = generateDefaultPropertiesPanel(nodeInstance);
    propertiesPanel.appendChild(propertiesGroup);
  }
}

/**
 * Generate a default properties panel for a node based on its properties
 */
function generateDefaultPropertiesPanel(nodeInstance: NodeInstance): string {
  let html = `<div class="property-group-title">${nodeInstance.type.charAt(0).toUpperCase() + nodeInstance.type.slice(1)} Properties</div>`;

  // Get all properties except internal ones
  const skipProps = ['title', 'id'];
  const properties = Object.entries(nodeInstance.properties).filter(
    ([key]) => !skipProps.includes(key)
  );

  if (properties.length === 0) {
    html += `
      <div class="property-item">
        <div class="property-label">No configurable properties</div>
      </div>
    `;
  } else {
    // For each property, create an appropriate input control
    properties.forEach(([key, value]) => {
      const propertyType = typeof value;

      switch (propertyType) {
        case 'string':
          // For long text, use textarea
          if (String(value).length > 50) {
            html += `
              <div class="property-item" data-tooltip="Edit ${key}">
                <div class="property-label">${formatPropertyName(key)}</div>
                <textarea class="property-input dynamic-property" 
                      data-property-key="${key}"
                      rows="3">${value}</textarea>
              </div>
            `;
          } else {
            // For short text, use input
            html += `
              <div class="property-item" data-tooltip="Edit ${key}">
                <div class="property-label">${formatPropertyName(key)}</div>
                <input type="text" class="property-input dynamic-property" 
                      value="${value}" 
                      data-property-key="${key}">
              </div>
            `;
          }
          break;

        case 'number':
          html += `
            <div class="property-item" data-tooltip="Edit ${key}">
              <div class="property-label">${formatPropertyName(key)}</div>
              <input type="number" class="property-input dynamic-property" 
                    value="${value}" 
                    data-property-key="${key}">
            </div>
          `;
          break;

        case 'boolean':
          html += `
            <div class="property-item" data-tooltip="Toggle ${key}">
              <div class="property-label">${formatPropertyName(key)}</div>
              <label class="switch">
                <input type="checkbox" class="dynamic-property" 
                      ${value ? 'checked' : ''} 
                      data-property-key="${key}">
                <span class="slider round"></span>
              </label>
            </div>
          `;
          break;

        case 'object':
          // For objects, display a simplified representation
          const objStr = JSON.stringify(value, null, 2);
          html += `
            <div class="property-item" data-tooltip="Edit ${key} (JSON)">
              <div class="property-label">${formatPropertyName(key)}</div>
              <textarea class="property-input dynamic-property json-property" 
                    data-property-key="${key}"
                    rows="3">${objStr}</textarea>
            </div>
          `;
          break;

        default:
          // For unknown types, show as read-only
          html += `
            <div class="property-item" data-tooltip="${key}">
              <div class="property-label">${formatPropertyName(key)}</div>
              <div class="property-value">${String(value)}</div>
            </div>
          `;
      }
    });
  }

  return html;
}

/**
 * Format a property key into a readable label
 */
function formatPropertyName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return (
    key
      // Insert a space before all caps
      .replace(/([A-Z])/g, ' $1')
      // Uppercase the first character
      .replace(/^./, str => str.toUpperCase())
  );
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
): Promise<{ nodeElement: HTMLElement; nodeInstance: NodeInstance } | null> {
  // Generate a unique ID for the node
  const id = window.utils.generateNodeId();

  try {
    // Create node instance using the IPC bridge
    const nodeInstance = await window.nodeSystem.createNode(type, id, {
      flowType, // Pass flow type to the backend
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
