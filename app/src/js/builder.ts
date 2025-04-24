// Script for builder.html (Bot Builder)
import { NodeInstance } from './models/types.js';
import { snapToGrid } from './utils/grid.js';
import { showPageTransition } from './ui/transitions.js';
import { populateComponentsPanel } from './components/componentPanel.js';
import { createNodeInstance, showPropertiesPanel, updateNodePosition, checkPositionValidity, deleteNode } from './services/nodeService.js';
import { initDraggableNodes, setupCanvasDropArea } from './services/dragDropService.js';
import { updateConnections, clearConnections, exportConnections } from './services/connectionService.js';
import { initZoomControls } from './utils/zoom.js';

// Add this line to declare the LeaderLine global
declare const LeaderLine: any;

document.addEventListener('DOMContentLoaded', async () => {
  // Store all nodes for collision detection
  let allNodes = Array.from(document.querySelectorAll('.node')) as HTMLElement[];

  // Add LeaderLine script dynamically
  await loadLeaderLineScript();

  // Setup component panel resizing
  setupComponentPanelResize();

  // Show side panel by default when the page loads
  const sidePanel = document.querySelector('.side-panel') as HTMLElement;
  sidePanel?.classList.add('expanded');
  console.log("Side panel initialized with class:", sidePanel?.className);

  // Toggle Side Panel - improved with logging and force rendering
  const togglePanel = document.querySelector('.toggle-panel');
  togglePanel?.addEventListener('click', () => {
    const sidePanel = document.querySelector('.side-panel') as HTMLElement;
    if (sidePanel) {
      if (sidePanel.classList.contains('expanded')) {
        sidePanel.classList.remove('expanded');
        console.log("Side panel collapsed, classes:", sidePanel.className);
      } else {
        sidePanel.classList.add('expanded');
        console.log("Side panel expanded, classes:", sidePanel.className);
      }
      
      // Force reflow to ensure CSS changes take effect
      void sidePanel.offsetWidth;
      
      // Update connections after panel toggle with delay to ensure CSS transition completes
      setTimeout(() => {
        updateConnections();
      }, 300);
    }
  });

  // Toggle Properties Panel
  document.getElementById('properties-toggle')?.addEventListener('click', () => {
    const componentsPanel = document.querySelector('.components-container') as HTMLElement;
    const propertiesPanel = document.getElementById('properties-panel') as HTMLElement;

    if (!componentsPanel || !propertiesPanel) return;

    if (propertiesPanel.style.display === 'none') {
      componentsPanel.style.display = 'none';
      propertiesPanel.style.display = 'block';

      const propertiesToggle = document.getElementById('properties-toggle');
      if (propertiesToggle) propertiesToggle.textContent = '🧩';
    } else {
      componentsPanel.style.display = 'flex';
      propertiesPanel.style.display = 'none';

      const propertiesToggle = document.getElementById('properties-toggle');
      if (propertiesToggle) propertiesToggle.textContent = '📝';
    }
  });

  // Navigation between pages with transition effect
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const page = target.getAttribute('data-page');
      if (page === 'dashboard') {
        showPageTransition('index.html');
      }
      // Handle other page navigation here
    });
  });

  // Initialize all existing nodes with Interact.js
  initDraggableNodes(allNodes, allNodes);

  // Deselect when clicking canvas
  const canvas = document.getElementById('canvas') as HTMLElement;
  const canvasContent = canvas?.querySelector('.canvas-content') as HTMLElement;

  canvas?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'canvas' || target.classList.contains('canvas-content')) {
      document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
    }
  });

  // Initialize zoom controls
  if (canvas) {
    initZoomControls(canvas);
  }

  // Set up canvas as drop target for components
  setupCanvasDropArea(canvas);

  // Setup handling of dropping components on canvas
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();

    // Restore canvas background
    canvas.style.backgroundColor = '#f0f4f8';

    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;

    let nodeType = dataTransfer.getData('text/plain');
    let flowType = 'flow'; // Default flow type

    // Try to get the flow type from JSON data
    try {
      const jsonData = dataTransfer.getData('application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.flowType) {
          flowType = data.flowType;
        }
        // If type is provided in JSON, use it
        if (data.type) {
          nodeType = data.type;
        }
      }
    } catch (err) {
      console.error('Error parsing component data:', err);
    }

    if (!canvasContent) {
      console.error('Canvas content element not found');
      return;
    }

    // Get canvas container coordinates
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate position relative to the canvas content
    const currentZoom = parseFloat(canvas.dataset.zoomLevel || '1');

    // Adjust coordinates for scroll position and zoom
    const x = (e.clientX - canvasRect.left + canvas.scrollLeft) / currentZoom;
    const y = (e.clientY - canvasRect.top + canvas.scrollTop) / currentZoom;

    // Snap the position to the grid
    const snappedX = snapToGrid(x - 90);
    const snappedY = snapToGrid(y - 50);

    // Check for collisions (use standard node size)
    if (!checkPositionValidity(snappedX, snappedY, 220, 150, allNodes)) {
      // Show error indication
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Cannot place node here - overlaps with existing node';
      errorMsg.style.position = 'absolute';
      errorMsg.style.left = `${snappedX}px`;
      errorMsg.style.top = `${snappedY - 30}px`;
      errorMsg.style.backgroundColor = 'var(--danger)';
      errorMsg.style.color = 'white';
      errorMsg.style.padding = '5px 10px';
      errorMsg.style.borderRadius = '4px';
      errorMsg.style.fontSize = '12px';
      errorMsg.style.zIndex = '100';
      canvasContent.appendChild(errorMsg);

      // Remove after a brief delay
      setTimeout(() => {
        canvasContent.removeChild(errorMsg);
      }, 2000);

      return; // Don't create the node
    }

    try {
      // Create the node instance and DOM element with flow type
      const result = await createNodeInstance(nodeType, snappedX, snappedY, flowType);

      if (result && result.nodeElement) {
        const { nodeElement, nodeInstance } = result;

        // Append to canvas content instead of canvas
        canvasContent.appendChild(nodeElement);

        // Add to the list of all nodes for collision detection
        allNodes.push(nodeElement);
        updateNodePosition(nodeElement);

        // Animation for node creation
        nodeElement.style.opacity = '0';
        nodeElement.style.transform = 'scale(0.8)';
        nodeElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Trigger animation
        setTimeout(() => {
          nodeElement.style.opacity = '1';
          nodeElement.style.transform = 'scale(1)';

          // Initialize with Interact.js - IMPORTANT: Do this after the node is visible
          initDraggableNodes([nodeElement], allNodes);

          // Select the newly created node
          document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
          nodeElement.classList.add('node-selected');

          // Show properties panel
          showPropertiesPanel(nodeInstance);
        }, 10);
      }
    } catch (error) {
      console.error('Error creating node:', error);
    }
  });

  // Setup keyboard shortcut for deleting nodes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedNode = document.querySelector('.node-selected') as HTMLElement;
      if (selectedNode) {
        // Delete the node
        deleteNode(selectedNode);

        // Remove from allNodes array
        allNodes = allNodes.filter(node => node !== selectedNode);

        // Show components panel
        const componentsPanel = document.querySelector('.components-container') as HTMLElement;
        const propertiesPanel = document.getElementById('properties-panel') as HTMLElement;

        if (componentsPanel && propertiesPanel) {
          componentsPanel.style.display = 'flex';
          propertiesPanel.style.display = 'none';

          const propertiesToggle = document.getElementById('properties-toggle');
          if (propertiesToggle) propertiesToggle.textContent = '📝';
        }
      }
    }
  });

  // Add save project functionality
  document.getElementById('save-button')?.addEventListener('click', () => {
    saveProject();
  });

  // Add load project functionality
  document.getElementById('load-button')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        loadProject(file);
      }
    };
    input.click();
  });

  // Populate components panel with actual node components
  populateComponentsPanel();
});

/**
 * Load the LeaderLine script
 */
async function loadLeaderLineScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof LeaderLine !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/leader-line-new@1.1.9/leader-line.min.js';
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load LeaderLine: ' + err));
    document.head.appendChild(script);
  });
}

/**
 * Save project to JSON file
 */
async function saveProject(): Promise<void> {
  try {
    // Get all nodes - fixed the type casting issue
    const nodes = Array.from(document.querySelectorAll('.node')).map((element) => {
      const node = element as HTMLElement;
      return {
        id: node.dataset.nodeId,
        type: node.dataset.nodeType,
        flowType: node.dataset.flowType || 'flow', // Save the flow type
        x: node.offsetLeft,
        y: node.offsetTop
      };
    });

    // Get all connections
    const connections = exportConnections();

    // Create project JSON
    const project = {
      nodes,
      connections,
      version: '1.0.0'
    };

    // Create downloadable link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "bot-project.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Show success message
    showNotification('Project saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving project:', error);
    showNotification('Error saving project', 'error');
  }
}

/**
 * Load project from JSON file
 */
async function loadProject(file: File): Promise<void> {
  try {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const project = JSON.parse(e.target?.result as string);

        // Clear canvas
        const canvas = document.getElementById('canvas');
        const canvasContent = canvas?.querySelector('.canvas-content') as HTMLElement;
        if (!canvas || !canvasContent) return;

        // Remove all existing nodes
        document.querySelectorAll('.node').forEach(node => node.remove());

        // Clear all connections
        clearConnections();

        // Reset allNodes array
        let allNodes: HTMLElement[] = [];

        // Create each node
        for (const nodeData of project.nodes) {
          // Create node with proper flow type
          const result = await createNodeInstance(
            nodeData.type,
            nodeData.x,
            nodeData.y,
            nodeData.flowType || 'flow'
          );

          if (result && result.nodeElement) {
            // Append to canvas content instead of canvas
            canvasContent.appendChild(result.nodeElement);

            // Add to allNodes
            allNodes.push(result.nodeElement);
            updateNodePosition(result.nodeElement);

            // Initialize with Interact.js
            initDraggableNodes([result.nodeElement], allNodes);
          }
        }

        // Wait a moment for nodes to be fully initialized
        setTimeout(async () => {
          // Create connections
          if (project.connections) {
            for (const connection of project.connections) {
              try {
                await window.nodeSystem.createConnection(
                  connection.fromNodeId,
                  connection.fromPortId,
                  connection.toNodeId,
                  connection.toPortId
                );

                // Find the port elements
                const fromPortElement = document.querySelector(
                  `.node[data-node-id="${connection.fromNodeId}"] .output-port[data-port-id="${connection.fromPortId}"]`
                );

                const toPortElement = document.querySelector(
                  `.node[data-node-id="${connection.toNodeId}"] .input-port[data-port-id="${connection.toPortId}"]`
                );

                if (fromPortElement && toPortElement) {
                  // Get connection color based on flow type
                  const flowType = connection.flowType || 'flow';
                  const connectionColor = flowType === 'flow' ? 'var(--flow-color)' : 'var(--data-color)';

                  // Create a visual connection using LeaderLine
                  new LeaderLine(
                    fromPortElement,
                    toPortElement,
                    {
                      path: 'fluid',
                      startPlug: 'disc',
                      endPlug: 'arrow3',
                      color: connectionColor,
                      size: flowType === 'flow' ? 3 : 2,
                      startSocketGravity: 20,
                      endSocketGravity: 20,
                      dash: flowType === 'data' ? { animation: true } : false
                    }
                  );
                }
              } catch (error) {
                console.error('Error creating connection:', error);
              }
            }
          }

          showNotification('Project loaded successfully!', 'success');
        }, 500);
      } catch (error) {
        console.error('Error parsing project file:', error);
        showNotification('Error loading project: Invalid file format', 'error');
      }
    };

    reader.readAsText(file);
  } catch (error) {
    console.error('Error loading project:', error);
    showNotification('Error loading project', 'error');
  }
}

/**
 * Show a notification message
 */
function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Setup component panel resizing functionality
 */
function setupComponentPanelResize(): void {
  const rightPanel = document.querySelector('.right-panel') as HTMLElement;
  const resizeHandle = document.querySelector('.right-panel-resize-handle') as HTMLElement;
  const workspace = document.querySelector('.workspace') as HTMLElement;
  const builderContainer = document.querySelector('.builder-container') as HTMLElement;
  
  if (!rightPanel || !resizeHandle || !workspace) return;
  
  let startX = 0;
  let startWidth = 0;
  let isResizing = false;
  
  // Get min and max values from CSS variables
  const styleProps = getComputedStyle(document.documentElement);
  const minWidth = parseInt(styleProps.getPropertyValue('--right-panel-min-width').trim(), 10) || 250;
  const maxWidth = parseInt(styleProps.getPropertyValue('--right-panel-max-width').trim(), 10) || 500;
  
  // Disable all animations during resize
  const disableTransitions = () => {
    document.body.classList.add('disable-transitions');
    rightPanel.style.willChange = 'width';
    workspace.style.willChange = 'width';
  };
  
  // Re-enable animations after resize
  const enableTransitions = () => {
    document.body.classList.remove('disable-transitions');
    rightPanel.style.willChange = 'auto';
    workspace.style.willChange = 'auto';
  };
  
  // Mouse down event - start resizing
  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    
    isResizing = true;
    startX = e.pageX;
    startWidth = rightPanel.offsetWidth;
    
    // Add resizing class for visual feedback
    rightPanel.classList.add('right-panel-resizing');
    disableTransitions();
    
    // Use direct style width to avoid any CSS transitions
    rightPanel.style.width = `${startWidth}px`;
    
    // Prevent selection during resizing
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  });
  
  // Mouse move event - update sizes during resize
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    // Calculate width change (moving left increases width)
    const deltaX = startX - e.pageX;
    const newWidth = startWidth + deltaX;
    
    // Constrain within min and max values
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    // Apply the width directly without transitions
    requestAnimationFrame(() => {
      // Update panel width directly
      rightPanel.style.width = `${constrainedWidth}px`;
      
      // Calculate workspace width to maintain correct layout
      const containerWidth = builderContainer.offsetWidth;
      const workspaceWidth = containerWidth - constrainedWidth;
      workspace.style.width = `${workspaceWidth}px`;
    });
  });
  
  // Mouse up event - end resizing
  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    
    isResizing = false;
    rightPanel.classList.remove('right-panel-resizing');
    enableTransitions();
    
    // Reset cursor and selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Store the final width in CSS variable for persistence
    const finalWidth = rightPanel.offsetWidth;
    document.documentElement.style.setProperty('--right-panel-width', `${finalWidth}px`);
    
    // Update connections after resizing is complete
    updateConnections();
  });
  
  // Handle edge case if mouse is released outside the window
  window.addEventListener('blur', () => {
    if (isResizing) {
      isResizing = false;
      rightPanel.classList.remove('right-panel-resizing');
      enableTransitions();
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      updateConnections();
    }
  });
}