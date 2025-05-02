import { NodeInstance } from './models/types.js';
import { snapToGrid } from './utils/grid.js';
import { showPageTransition } from './ui/transitions.js';
import { populateComponentsPanel } from './components/componentPanel.js';
import {
  createNodeInstance,
  showPropertiesPanel,
  updateNodePosition,
  checkPositionValidity,
  deleteNode,
} from './services/nodeService.js';
import { initDraggableNodes, setupCanvasDropArea } from './services/dragDropService.js';
import {
  updateConnections,
  clearConnections,
  exportConnections,
  cancelConnectionDrawing,
} from './services/connectionService.js';
import { initZoomControls } from './utils/zoom.js';
declare const LeaderLine: any;

// Type for global node system
interface Window {
  nodeSystem: {
    createConnection: (
      fromNodeId: string,
      fromPortId: string,
      toNodeId: string,
      toPortId: string
    ) => Promise<void>;
  };
}

// Main builder logic
// ------------------
document.addEventListener('DOMContentLoaded', async () => {
  let allNodes = Array.from(document.querySelectorAll('.node')) as HTMLElement[];
  await loadLeaderLineScript();
  setupComponentPanelResize();

  // Side panel toggle
  const togglePanel = document.querySelector('.toggle-panel');
  togglePanel?.addEventListener('click', () => {
    const sidePanel = document.querySelector('.side-panel');
    if (sidePanel) sidePanel.classList.toggle('expanded');
  });

  // Right panel expand/collapse
  const rightPanel = document.querySelector('.right-panel');
  const rightToggle = rightPanel?.querySelector('.toggle-right-panel');
  if (rightPanel && rightToggle) {
    rightToggle.addEventListener('click', () => {
      rightPanel.classList.toggle('expanded');
      rightToggle.textContent = rightPanel.classList.contains('expanded') ? '»' : '«';
    });
    rightPanel.classList.add('expanded');
    rightToggle.textContent = '»';
  }

  // Toggle between components and properties panel
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

  // Menu navigation
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', e => {
      const target = e.currentTarget as HTMLElement;
      const page = target.getAttribute('data-page');
      if (page === 'dashboard') showPageTransition('index.html');
    });
  });

  // Enable drag and drop for all nodes
  initDraggableNodes(allNodes, allNodes);

  // Canvas click: deselect nodes and cancel connection if drawing
  const canvas = document.getElementById('canvas') as HTMLElement;
  const canvasContent = canvas?.querySelector('.canvas-content') as HTMLElement;
  canvas?.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (target.id === 'canvas' || target.classList.contains('canvas-content')) {
      document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
      cancelConnectionDrawing(); // Cancel connection if in progress
    }
  });

  // Zoom controls
  if (canvas) initZoomControls(canvas);

  // Enable dropping new components on canvas
  setupCanvasDropArea(canvas);
  canvas.addEventListener('drop', async e => {
    e.preventDefault();
    canvas.style.backgroundColor = '#f0f4f8';
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;
    let nodeType = dataTransfer.getData('text/plain');
    let flowType = 'flow';
    try {
      const jsonData = dataTransfer.getData('application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.flowType) flowType = data.flowType;
        if (data.type) nodeType = data.type;
      }
    } catch (err) {
      console.error('Error parsing component data:', err);
    }
    if (!canvasContent) {
      console.error('Canvas content element not found');
      return;
    }
    // Calculate drop position and snap to grid
    const canvasRect = canvas.getBoundingClientRect();
    const currentZoom = parseFloat(canvas.dataset.zoomLevel || '1');
    const x = (e.clientX - canvasRect.left + canvas.scrollLeft) / currentZoom;
    const y = (e.clientY - canvasRect.top + canvas.scrollTop) / currentZoom;
    const snappedX = snapToGrid(x - 90);
    const snappedY = snapToGrid(y - 50);
    // Prevent node overlap
    if (!checkPositionValidity(snappedX, snappedY, 220, 150, allNodes)) {
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
      setTimeout(() => {
        canvasContent.removeChild(errorMsg);
      }, 2000);
      return;
    }
    // Create and add new node
    try {
      const result = await createNodeInstance(nodeType, snappedX, snappedY, flowType);
      if (result && result.nodeElement) {
        const { nodeElement, nodeInstance } = result;
        canvasContent.appendChild(nodeElement);
        allNodes.push(nodeElement);
        updateNodePosition(nodeElement);
        nodeElement.style.opacity = '0';
        nodeElement.style.transform = 'scale(0.8)';
        nodeElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
          nodeElement.style.opacity = '1';
          nodeElement.style.transform = 'scale(1)';
          initDraggableNodes([nodeElement], allNodes);
          document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
          nodeElement.classList.add('node-selected');
          showPropertiesPanel(nodeInstance);
        }, 10);
      }
    } catch (error) {
      console.error('Error creating node:', error);
    }
  });

  // Keyboard shortcut: Delete selected node (Delete key only)
  document.addEventListener('keydown', e => {
    if (e.key === 'Delete') {
      const selectedNode = document.querySelector('.node-selected') as HTMLElement;
      if (selectedNode) {
        deleteNode(selectedNode);
        allNodes = allNodes.filter(node => node !== selectedNode);
        // Show components panel after deletion
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

  // Project save/load
  document.getElementById('save-button')?.addEventListener('click', () => {
    saveProject();
  });
  document.getElementById('load-button')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) loadProject(file);
    };
    input.click();
  });

  // Populate the left component panel
  populateComponentsPanel();
});

// Dynamically load LeaderLine library for drawing connections
async function loadLeaderLineScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof LeaderLine !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/leader-line-new@1.1.9/leader-line.min.js';
    script.onload = () => resolve();
    script.onerror = err => reject(new Error('Failed to load LeaderLine: ' + err));
    document.head.appendChild(script);
  });
}

// Save the current project (nodes and connections) as a JSON file
async function saveProject(): Promise<void> {
  try {
    const nodes = Array.from(document.querySelectorAll('.node')).map(element => {
      const node = element as HTMLElement;
      return {
        id: node.dataset.nodeId,
        type: node.dataset.nodeType,
        flowType: node.dataset.flowType || 'flow',
        x: node.offsetLeft,
        y: node.offsetTop,
      };
    });
    const connections = exportConnections();
    const project = {
      nodes,
      connections,
      version: '1.0.0',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10);
    downloadAnchor.setAttribute('download', `bot-project-${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Project saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving project:', error);
    showNotification('Error saving project', 'error');
  }
}

// Load a project from a JSON file
async function loadProject(file: File): Promise<void> {
  try {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const project = JSON.parse(e.target?.result as string);
        const canvas = document.getElementById('canvas');
        const canvasContent = canvas?.querySelector('.canvas-content') as HTMLElement;
        if (!canvas || !canvasContent) return;
        document.querySelectorAll('.node').forEach(node => node.remove());
        clearConnections();
        const allNodes: HTMLElement[] = [];
        for (const nodeData of project.nodes) {
          const result = await createNodeInstance(
            nodeData.type,
            nodeData.x,
            nodeData.y,
            nodeData.flowType || 'flow'
          );
          if (result && result.nodeElement) {
            canvasContent.appendChild(result.nodeElement);
            allNodes.push(result.nodeElement);
            updateNodePosition(result.nodeElement);
            initDraggableNodes([result.nodeElement], allNodes);
          }
        }
        setTimeout(async () => {
          if (project.connections) {
            for (const connection of project.connections) {
              try {
                await window.nodeSystem.createConnection(
                  connection.fromNodeId,
                  connection.fromPortId,
                  connection.toNodeId,
                  connection.toPortId
                );
                const fromPortElement = document.querySelector(
                  `.node[data-node-id="${connection.fromNodeId}"] .output-port[data-port-id="${connection.fromPortId}"]`
                );
                const toPortElement = document.querySelector(
                  `.node[data-node-id="${connection.toNodeId}"] .input-port[data-port-id="${connection.toPortId}"]`
                );
                if (fromPortElement && toPortElement) {
                  const flowType = connection.flowType || 'flow';
                  const connectionColor =
                    flowType === 'flow' ? 'var(--flow-color)' : 'var(--data-color)';
                  new LeaderLine(fromPortElement, toPortElement, {
                    path: 'fluid',
                    startPlug: 'disc',
                    endPlug: 'arrow3',
                    color: connectionColor,
                    size: flowType === 'flow' ? 3 : 2,
                    startSocketGravity: 20,
                    endSocketGravity: 20,
                    dash: flowType === 'data' ? { animation: true } : false,
                  });
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

// Show a notification message (success, error, info)
function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 10);
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Allow resizing of the right property panel
function setupComponentPanelResize(): void {
  const rightPanelEl = document.querySelector('.right-panel') as HTMLElement;
  const resizeHandle = document.querySelector('.right-panel-resize-handle') as HTMLElement;
  const workspace = document.querySelector('.workspace') as HTMLElement;
  const builderContainer = document.querySelector('.builder-container') as HTMLElement;
  if (!rightPanelEl || !resizeHandle || !workspace) return;
  let startX = 0;
  let startWidth = 0;
  let isResizing = false;
  const styleProps = getComputedStyle(document.documentElement);
  const minWidth =
    parseInt(styleProps.getPropertyValue('--right-panel-min-width').trim(), 10) || 250;
  const maxWidth =
    parseInt(styleProps.getPropertyValue('--right-panel-max-width').trim(), 10) || 500;
  const disableTransitions = () => {
    document.body.classList.add('disable-transitions');
    rightPanelEl.style.willChange = 'width';
    workspace.style.willChange = 'width';
  };
  const enableTransitions = () => {
    document.body.classList.remove('disable-transitions');
    rightPanelEl.style.willChange = 'auto';
    workspace.style.willChange = 'auto';
  };
  resizeHandle.addEventListener('mousedown', e => {
    e.preventDefault();
    isResizing = true;
    startX = e.pageX;
    startWidth = rightPanelEl.offsetWidth;
    rightPanelEl.classList.add('right-panel-resizing');
    disableTransitions();
    rightPanelEl.style.width = `${startWidth}px`;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  });
  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const deltaX = startX - e.pageX;
    const newWidth = startWidth + deltaX;
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    requestAnimationFrame(() => {
      rightPanelEl.style.width = `${constrainedWidth}px`;
      const containerWidth = builderContainer.offsetWidth;
      const workspaceWidth = containerWidth - constrainedWidth;
      workspace.style.width = `${workspaceWidth}px`;
    });
  });
  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    rightPanelEl.classList.remove('right-panel-resizing');
    enableTransitions();
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    const finalWidth = rightPanelEl.offsetWidth;
    document.documentElement.style.setProperty('--right-panel-width', `${finalWidth}px`);
    updateConnections();
  });
  window.addEventListener('blur', () => {
    if (isResizing) {
      isResizing = false;
      rightPanelEl.classList.remove('right-panel-resizing');
      enableTransitions();
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      updateConnections();
    }
  });
}
