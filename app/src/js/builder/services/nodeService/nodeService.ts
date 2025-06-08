import { NodeInstance, NodePosition } from '../../models/types.js';
import { generateNodeHtml } from './nodeRenderer.js';
import { snapToGrid } from '../../utils/grid.js';
import { updateConnections } from '../connectionService/connectionService.js';
import { checkCollision } from '../dragDropService/dragDropService.js';
import {
  initNodeConnections,
  removeNodeConnections,
} from '../connectionService/connectionService.js';
import { updateNodeElementContent, setupPropertyEventListeners } from './nodeUI.js';

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

  const existingGroups = propertiesPanel.querySelectorAll('.property-group');
  existingGroups.forEach(group => group.remove());

  const propertiesGroup = document.createElement('div');
  propertiesGroup.className = 'property-group';

  try {
    propertiesGroup.innerHTML = generateDefaultPropertiesPanel(nodeInstance);
    propertiesPanel.appendChild(propertiesGroup);

    setupPropertyEventListeners(nodeInstance, propertiesGroup, async (key, value) => {
      nodeInstance.properties[key] = value;
      try {
        const updatedNode = await window.nodeSystem.createNode(
          nodeInstance.type,
          nodeInstance.id,
          nodeInstance.properties
        );
        nodeInstance.properties = updatedNode.properties;
        const nodeElement = document.querySelector(
          `[data-node-id="${nodeInstance.id}"]`
        ) as HTMLElement;
        if (nodeElement) {
          const contentEl = nodeElement.querySelector('.node-content');
          if (contentEl && updatedNode.properties.nodeContent) {
            contentEl.innerHTML = updatedNode.properties.nodeContent;
          }
          updateNodeElementContent(nodeInstance, nodeElement);
        }
      } catch (err) {
        console.error('Failed to update node content:', err);
      }
    });
  } catch (error) {
    console.error('Error generating properties panel:', error);
    propertiesGroup.innerHTML = generateDefaultPropertiesPanel(nodeInstance);
    propertiesPanel.appendChild(propertiesGroup);
  }
}

/**
 * Generate a default properties panel for a node based on its properties
 */
function generateDefaultPropertiesPanel(nodeInstance: NodeInstance): string {
  let html = `<div class="property-group-title">${nodeInstance.type.charAt(0).toUpperCase() + nodeInstance.type.slice(1)} Properties</div>`;

  html += `
    <div class="property-item name-input">
      <div class="property-label">Name</div>
      <input type="text" aria-label="Node name" class="property-input dynamic-property" data-property-key="title" value="${
        nodeInstance.properties.title ||
        nodeInstance.type.charAt(0).toUpperCase() + nodeInstance.type.slice(1)
      }">
    </div>
  `;

  // Determine which properties to show
  let shownProps: string[] | null = null;
  // Try to get the class constructor from the nodeInstance
  const nodeClass = window.nodeSystem?.getNodeClass?.(nodeInstance.type);
  if (nodeClass && Array.isArray(nodeClass.shownProperties)) {
    shownProps = nodeClass.shownProperties;
  } else if (
    (nodeInstance as any).constructor &&
    Array.isArray((nodeInstance as any).constructor.shownProperties)
  ) {
    shownProps = (nodeInstance as any).constructor.shownProperties;
  }

  // Always skip these
  const alwaysSkip = ['id', 'nodeContent', 'flowType', 'language'];

  let properties: [string, any][];
  if (shownProps) {
    properties = shownProps
      .filter(key => !alwaysSkip.includes(key) && key !== 'title')
      .map(key => [key, nodeInstance.properties[key]] as [string, any])
      .filter(([, value]) => value !== undefined);
  } else {
    properties = Object.entries(nodeInstance.properties).filter(
      ([key]) => !alwaysSkip.includes(key) && key !== 'title'
    );
  }

  if (properties.length === 0) {
    html += `
      <div class="property-item">
        <div class="property-label">No configurable properties</div>
      </div>
    `;
  } else {
    for (const [key, value] of properties) {
      const propertyType = typeof value;
      switch (propertyType) {
        case 'string':
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
          html += `
            <div class="property-item" data-tooltip="${key}">
              <div class="property-label">${formatPropertyName(key)}</div>
              <div class="property-value">${String(value)}</div>
            </div>
          `;
      }
    }
  }
  return html;
}

/**
 * Format a property key into a readable label
 */
function formatPropertyName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
  const id = window.utils.generateNodeId();

  try {
    const nodeInstance = await window.nodeSystem.createNode(type, id, {
      flowType,
    });

    const nodeElement = document.createElement('div');
    nodeElement.className = 'node';
    nodeElement.id = id;
    nodeElement.dataset.nodeId = id;
    nodeElement.dataset.nodeType = type;
    nodeElement.dataset.flowType = flowType;

    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;

    if (flowType === 'data') {
      nodeElement.classList.add('data-node');
    } else {
      nodeElement.classList.add('flow-node');
    }

    nodeElement.innerHTML = generateNodeHtml(nodeInstance);

    setTimeout(() => {
      initNodeConnections(nodeElement, nodeInstance);

      const ports = nodeElement.querySelectorAll('.port');
      ports.forEach(port => {
        const portEl = port as HTMLElement;

        const specificType = portEl.dataset.portType;

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
  const nodeId = nodeElement.dataset.nodeId;

  if (nodeId) {
    removeNodeConnections(nodeId);

    nodeElement.remove();

    nodePositions.delete(nodeElement);
  }
}
