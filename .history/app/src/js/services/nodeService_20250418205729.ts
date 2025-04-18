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

  // Clear previous content groups except the general one
  const existingGroups = propertiesPanel.querySelectorAll('.property-group:not(:first-child)');
  existingGroups.forEach(group => group.remove());

  // Set node name/ID in properties
  const nameInput = propertiesPanel.querySelector('input[aria-label="Node name"]') as HTMLInputElement;
  if (nameInput) nameInput.value = nodeInstance.properties.title || nodeInstance.type.charAt(0).toUpperCase() + nodeInstance.type.slice(1);

  const idInput = propertiesPanel.querySelector('input[aria-label="Node ID"]') as HTMLInputElement;
  if (idInput) idInput.value = nodeInstance.id;

  // Add node type specific controls based on component type
  switch (nodeInstance.type) {
    case 'message':
      addMessageProperties(propertiesPanel, nodeInstance);
      break;
    case 'math':
      addMathProperties(propertiesPanel, nodeInstance);
      break;
    case 'condition':
      addConditionProperties(propertiesPanel, nodeInstance);
      break;
    case 'options':
      addOptionsProperties(propertiesPanel, nodeInstance);
      break;
    case 'input':
      addInputProperties(propertiesPanel, nodeInstance);
      break;
    default:
      // Handle any component type dynamically
      addDynamicComponentProperties(propertiesPanel, nodeInstance);
      break;
  }
}

/**
 * Add dynamic properties panel for any component type
 */
function addDynamicComponentProperties(panel: HTMLElement, nodeInstance: NodeInstance): void {
  // Create a content group for this component's properties
  const propertiesGroup = document.createElement('div');
  propertiesGroup.className = 'property-group';

  // Add a title for the properties section
  propertiesGroup.innerHTML = `<div class="property-group-title">${nodeInstance.type.charAt(0).toUpperCase() + nodeInstance.type.slice(1)} Properties</div>`;

  // Get all properties except internal ones
  const skipProps = ['title', 'id'];
  const properties = Object.entries(nodeInstance.properties)
    .filter(([key]) => !skipProps.includes(key));

  if (properties.length === 0) {
    propertiesGroup.innerHTML += `
      <div class="property-item">
        <div class="property-label">No configurable properties</div>
      </div>
    `;
  } else {
    // For each property, create an appropriate input control
    properties.forEach(([key, value]) => {
      const propertyType = typeof value;
      let inputHTML = '';

      switch (propertyType) {
        case 'string':
          // For long text, use textarea
          if (String(value).length > 50) {
            inputHTML = `
              <div class="property-item" data-tooltip="Edit ${key}">
                <div class="property-label">${formatPropertyName(key)}</div>
                <textarea class="property-input dynamic-property" 
                      data-property-key="${key}"
                      rows="3">${value}</textarea>
              </div>
            `;
          } else {
            // For short text, use input
            inputHTML = `
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
          inputHTML = `
            <div class="property-item" data-tooltip="Edit ${key}">
              <div class="property-label">${formatPropertyName(key)}</div>
              <input type="number" class="property-input dynamic-property" 
                    value="${value}" 
                    data-property-key="${key}">
            </div>
          `;
          break;

        case 'boolean':
          inputHTML = `
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
          inputHTML = `
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
          inputHTML = `
            <div class="property-item" data-tooltip="${key}">
              <div class="property-label">${formatPropertyName(key)}</div>
              <div class="property-value">${String(value)}</div>
            </div>
          `;
      }

      propertiesGroup.innerHTML += inputHTML;
    });
  }

  // Add the properties group to the panel
  panel.appendChild(propertiesGroup);

  // Add event listeners for property changes
  const propertyInputs = panel.querySelectorAll('.dynamic-property');
  propertyInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const element = e.target as HTMLInputElement | HTMLTextAreaElement;
      const propertyKey = element.dataset.propertyKey;

      if (propertyKey) {
        let value: any;

        // Get the appropriate value based on input type
        if (element.type === 'checkbox') {
          value = (element as HTMLInputElement).checked;
        } else if (element.type === 'number') {
          value = Number(element.value);
        } else if (element.classList.contains('json-property')) {
          try {
            value = JSON.parse(element.value);
          } catch (error) {
            console.error('Invalid JSON:', error);
            return; // Don't update if JSON is invalid
          }
        } else {
          value = element.value;
        }

        // Update the node instance property
        nodeInstance.properties[propertyKey] = value;

        // Update the node in the backend
        window.nodeSystem.createNode(nodeInstance.type, nodeInstance.id, nodeInstance.properties)
          .catch(error => console.error('Error updating node:', error));
      }
    });
  });
}

/**
 * Format a property key into a readable label
 */
function formatPropertyName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    // Insert a space before all caps
    .replace(/([A-Z])/g, ' $1')
    // Uppercase the first character
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Add math node specific properties to the panel
 */
function addMathProperties(panel: HTMLElement, nodeInstance: NodeInstance): void {
  const expressionGroup = document.createElement('div');
  expressionGroup.className = 'property-group';
  expressionGroup.innerHTML = `
    <div class="property-group-title">Math Expression</div>
    <div class="property-item" data-tooltip="Enter a mathematical expression using variables like 'a', 'b'">
      <div class="property-label">Expression</div>
      <input type="text" class="property-input math-expression" 
             value="${nodeInstance.properties.expression || 'a + b'}" 
             aria-label="Math expression">
    </div>
    <div class="property-item" data-tooltip="Test your expression with sample values">
      <div class="property-label">Test Values</div>
      <div class="variable-inputs">
        <div class="variable-row">
          <label>a = </label>
          <input type="number" class="property-input math-var-a" value="0" style="width: 80px;">
          <label style="margin-left: 10px;">b = </label>
          <input type="number" class="property-input math-var-b" value="0" style="width: 80px;">
        </div>
      </div>
    </div>
    <div class="property-item">
      <button class="btn btn-primary test-expression">Test Expression</button>
      <span class="expression-result" style="margin-left: 10px;"></span>
    </div>
    <div class="property-item">
      <div class="property-label">Help</div>
      <div class="math-help">
        <p>Use variables a, b or any other name in your expression.</p>
        <p>Supported: +, -, *, /, ^, sqrt(), sin(), cos(), etc.</p>
        <p>Example: sqrt(a^2 + b^2)</p>
      </div>
    </div>
  `;

  panel.appendChild(expressionGroup);

  // Add event listener for testing the expression
  const testButton = panel.querySelector('.test-expression') as HTMLButtonElement;
  const expressionInput = panel.querySelector('.math-expression') as HTMLInputElement;
  const varAInput = panel.querySelector('.math-var-a') as HTMLInputElement;
  const varBInput = panel.querySelector('.math-var-b') as HTMLInputElement;
  const resultDisplay = panel.querySelector('.expression-result') as HTMLSpanElement;

  if (testButton && expressionInput && varAInput && varBInput && resultDisplay) {
    testButton.addEventListener('click', async () => {
      try {
        const a = Number(varAInput.value);
        const b = Number(varBInput.value);
        const expression = expressionInput.value;

        // Update the node instance with the new expression
        nodeInstance.properties.expression = expression;

        // Call the node's process method to evaluate
        const result = await window.nodeSystem.processNode(nodeInstance.id, {
          a,
          b,
          expression
        });

        if (result.error) {
          resultDisplay.textContent = `Error: ${result.error}`;
          resultDisplay.style.color = 'red';
        } else {
          resultDisplay.textContent = `Result: ${result.result}`;
          resultDisplay.style.color = 'green';
        }
      } catch (error) {
        resultDisplay.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
        resultDisplay.style.color = 'red';
      }
    });

    // Save expression when it changes
    expressionInput.addEventListener('change', () => {
      nodeInstance.properties.expression = expressionInput.value;
      // Update the node in the backend
      window.nodeSystem.createNode(nodeInstance.type, nodeInstance.id, nodeInstance.properties);
    });
  }
}

/**
 * Add message node specific properties to the panel
 */
function addMessageProperties(panel: HTMLElement, nodeInstance: NodeInstance): void {
  const messageGroup = document.createElement('div');
  messageGroup.className = 'property-group';
  messageGroup.innerHTML = `
    <div class="property-group-title">Content</div>
    <div class="property-item" data-tooltip="Text message to display in this node">
      <div class="property-label">Message Text</div>
      <textarea class="property-input" rows="3" aria-label="Node message content">${nodeInstance.properties.message || ''}</textarea>
    </div>
    <div class="property-item" data-tooltip="Variable name to store the message output">
      <div class="property-label">Variable</div>
      <input type="text" class="property-input" value="${nodeInstance.properties.variableName || 'message'}" aria-label="Variable name">
    </div>
  `;

  panel.appendChild(messageGroup);

  // Add event listeners for message properties
  const messageInput = messageGroup.querySelector('textarea') as HTMLTextAreaElement;
  const variableInput = messageGroup.querySelector('input') as HTMLInputElement;

  if (messageInput && variableInput) {
    messageInput.addEventListener('change', () => {
      nodeInstance.properties.message = messageInput.value;
      window.nodeSystem.createNode(nodeInstance.type, nodeInstance.id, nodeInstance.properties);
    });

    variableInput.addEventListener('change', () => {
      nodeInstance.properties.variableName = variableInput.value;
      window.nodeSystem.createNode(nodeInstance.type, nodeInstance.id, nodeInstance.properties);
    });
  }
}

function addConditionProperties(panel: HTMLElement, nodeInstance: NodeInstance): void {
  // Condition node properties implementation
  // Will be implemented as needed
}

function addOptionsProperties(panel: HTMLElement, nodeInstance: NodeInstance): void {
  // Options node properties implementation
  // Will be implemented as needed
}

function addInputProperties(panel: HTMLElement, nodeInstance: NodeInstance): void {
  // Input node properties implementation
  // Will be implemented as needed
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