import '../scss/builder.scss';
declare const module: any;
import { NodeInstance } from './models/types';
import { snapToGrid } from './utils/grid';
import { 
  showPageTransition, 
  enterTransition, 
  exitTransition, 
  addRippleEffect, 
  createRippleEffect,
  highlightElement,
  typeText,
  staggerAnimation,
  addAttentionAnimation
} from './ui/transitions';
import { populateComponentsPanel } from './components/componentPanel';
import {
  createNodeInstance,
  showPropertiesPanel,
  updateNodePosition,
  checkPositionValidity,
  deleteNode,
} from './services/nodeService';
import { initDraggableNodes, setupCanvasDropArea } from './services/dragDropService';
import {
  updateConnections,
  clearConnections,
  exportConnections,
  cancelConnectionDrawing,
} from './services/connectionService';
import { initZoomControls } from './utils/zoom';
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

  // Apply entrance transitions to main UI elements
  const workspace = document.querySelector('.workspace') as HTMLElement;
  const sidePanel = document.querySelector('.side-panel') as HTMLElement;
  const rightPanel = document.querySelector('.right-panel') as HTMLElement;
  const header = document.querySelector('header') as HTMLElement;
  
  if (workspace) enterTransition(workspace, 'fade', 400, 0);
  if (header) enterTransition(header, 'slide-down', 400, 0);
  if (sidePanel) enterTransition(sidePanel, 'slide-right', 400, 100);
  if (rightPanel) enterTransition(rightPanel, 'slide-left', 400, 200);

  // Animate toolbar buttons with stagger effect
  const toolbarButtons = document.querySelectorAll('.toolbar-button');
  if (toolbarButtons.length) {
    staggerAnimation(toolbarButtons, 'fade', 80, 300);
  }
  
  // Add ripple effect to all buttons
  addRippleEffect('.button');
  addRippleEffect('.menu-item');
  addRippleEffect('.toolbar-button');

  // Side panel toggle with improved animation
  const togglePanel = document.querySelector('.toggle-panel');
  togglePanel?.addEventListener('click', (e) => {
    if (sidePanel) {
      sidePanel.classList.toggle('expanded');
      
      // Create ripple effect for the toggle button
      createRippleEffect(togglePanel as HTMLElement, e as MouseEvent);
      
      // Highlight the workspace to indicate the layout change
      if (workspace) {
        setTimeout(() => {
          workspace.style.transition = 'background-color 0.3s ease';
          workspace.style.backgroundColor = 'rgba(0,0,0,0.05)';
          setTimeout(() => {
            workspace.style.backgroundColor = '';
          }, 300);
        }, 100);
      }
    }
  });

  // Right panel expand/collapse with improved animation
  const rightToggle = rightPanel?.querySelector('.toggle-right-panel');
  if (rightPanel && rightToggle) {
    rightToggle.addEventListener('click', (e) => {
      // Create ripple effect for the toggle button
      createRippleEffect(rightToggle as HTMLElement, e as MouseEvent);
      
      const isExpanded = rightPanel.classList.contains('expanded');
      
      if (isExpanded) {
        exitTransition(rightPanel, 'slide-left', 300, 0, false)
          .then(() => {
            rightPanel.classList.remove('expanded');
            rightToggle.textContent = '«';
          });
      } else {
        rightPanel.classList.add('expanded');
        rightToggle.textContent = '»';
        enterTransition(rightPanel, 'slide-left', 300);
      }
    });
    
    // Initially expanded
    rightPanel.classList.add('expanded');
    rightToggle.textContent = '»';
  }

  // Toggle between components and properties panel with smooth transition
  document.getElementById('properties-toggle')?.addEventListener('click', (e) => {
    const componentsPanel = document.querySelector('.components-container') as HTMLElement;
    const propertiesPanel = document.getElementById('properties-panel') as HTMLElement;
    const propertiesToggle = document.getElementById('properties-toggle');
    
    if (!componentsPanel || !propertiesPanel || !propertiesToggle) return;
    
    // Create ripple effect for the toggle button
    createRippleEffect(propertiesToggle as HTMLElement, e as MouseEvent);

    if (propertiesPanel.style.display === 'none') {
      // Switch to properties panel
      exitTransition(componentsPanel, 'fade', 200)
        .then(() => {
          componentsPanel.style.display = 'none';
          propertiesPanel.style.display = 'block';
          propertiesToggle.textContent = '🧩';
          enterTransition(propertiesPanel, 'fade', 200);
        });
    } else {
      // Switch to components panel
      exitTransition(propertiesPanel, 'fade', 200)
        .then(() => {
          componentsPanel.style.display = 'flex';
          propertiesPanel.style.display = 'none';
          propertiesToggle.textContent = '📝';
          enterTransition(componentsPanel, 'fade', 200);
        });
    }
  });

  // Menu navigation with page transition
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', e => {
      const target = e.currentTarget as HTMLElement;
      const page = target.getAttribute('data-page');
      
      // Create ripple effect on menu item click
      createRippleEffect(target, e as MouseEvent);
      
      if (page === 'dashboard') {
        showPageTransition('index.html', {
          message: 'Loading Dashboard...',
          icon: '🏠',
          delay: 600
        });
      }
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
      // Deselect with subtle animation
      document.querySelectorAll('.node-selected').forEach(node => {
        node.classList.remove('node-selected');
        exitTransition(node as HTMLElement, 'scale', 150, 0, false);
      });
      
      cancelConnectionDrawing(); // Cancel connection if in progress
    }
  });

  // Zoom controls
  if (canvas) initZoomControls(canvas);

  // Enable dropping new components on canvas
  setupCanvasDropArea(canvas);
  canvas.addEventListener('drop', async e => {
    e.preventDefault();
    canvas.style.backgroundColor = '#1e1e1e';
    
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;
    
    let nodeType = dataTransfer.getData('text/plain');
    let flowType = 'flow';
    
    try {
      const nodeData = JSON.parse(nodeType);
      nodeType = nodeData.type;
      flowType = nodeData.flowType || 'flow';
    } catch (err) {
      // If not JSON, use the string directly
    }
    
    if (!canvasContent) return;
    
    // Calculate drop position and snap to grid
    const canvasRect = canvas.getBoundingClientRect();
    const currentZoom = parseFloat(canvas.dataset.zoomLevel || '1');
    const x = (e.clientX - canvasRect.left + canvas.scrollLeft) / currentZoom;
    const y = (e.clientY - canvasRect.top + canvas.scrollTop) / currentZoom;
    const snappedX = snapToGrid(x - 90);
    const snappedY = snapToGrid(y - 50);
    
    // Prevent node overlap
    if (!checkPositionValidity(snappedX, snappedY, 220, 150, allNodes)) {
      showNotification('Cannot place node here: overlapping with existing node', 'error');
      return;
    }
    
    // Create and add new node
    try {
      const nodeInstance = await createNodeInstance(
        nodeType,
        snappedX,
        snappedY,
        `${nodeType}-${Math.floor(Math.random() * 1000)}`,
        flowType
      );
      
      const newNodeElement = document.getElementById(nodeInstance.id) as HTMLElement;
      if (newNodeElement) {
        // Add entrance animation for the new node
        enterTransition(newNodeElement, 'scale', 300);
        
        // Highlight the node briefly to draw attention
        setTimeout(() => {
          highlightElement(newNodeElement, 'var(--primary)', 800);
        }, 300);
        
        allNodes = [...allNodes, newNodeElement];
        
        // Make the new node draggable
        initDraggableNodes([newNodeElement], allNodes);
      }
      
      showNotification(`Added ${nodeType} node`, 'success');
    } catch (error) {
      console.error('Error creating node:', error);
      showNotification(`Failed to create ${nodeType} node`, 'error');
    }
  });

  // Keyboard shortcut: Delete selected node (Delete key only)
  document.addEventListener('keydown', e => {
    if (e.key === 'Delete') {
      const selectedNode = document.querySelector('.node-selected') as HTMLElement;
      if (selectedNode) {
        // Animate the node before removal
        exitTransition(selectedNode, 'scale', 200)
          .then(() => {
            const nodeId = selectedNode.id;
            deleteNode(nodeId);
            allNodes = allNodes.filter(node => node.id !== nodeId);
            
            showNotification('Node deleted', 'info');
          });
      }
    }
  });

  // Project save/load
  document.getElementById('save-button')?.addEventListener('click', (e) => {
    // Add ripple effect on save button
    createRippleEffect(e.currentTarget as HTMLElement, e as MouseEvent);
    
    // Add attention animation to indicate saving
    addAttentionAnimation(e.currentTarget as HTMLElement, 'bounce', 500);
    
    saveProject();
  });
  
  document.getElementById('load-button')?.addEventListener('click', (e) => {
    // Add ripple effect on load button
    createRippleEffect(e.currentTarget as HTMLElement, e as MouseEvent);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        loadProject(target.files[0]);
      }
    };
    input.click();
  });

  // Populate the left component panel
  populateComponentsPanel();
  
  // Add welcome message with typing animation
  const welcomeMessage = document.querySelector('.welcome-message') as HTMLElement;
  if (welcomeMessage) {
    typeText(welcomeMessage, 'Welcome to VisualBotCrafter! Drag components to build your bot.', 30, 800);
  }
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
      const el = element as HTMLElement;
      return {
        id: el.id,
        type: el.getAttribute('data-node-type'),
        x: parseInt(el.style.left, 10) || 0,
        y: parseInt(el.style.top, 10) || 0,
        data: el.getAttribute('data-node-data') || '{}',
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
    downloadAnchor.setAttribute('download', `botcrafter_project_${formattedDate}.json`);
    
    document.body.appendChild(downloadAnchor); // Required for Firefox
    downloadAnchor.click();
    downloadAnchor.remove();
    
    showNotification('Project saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save project:', error);
    showNotification('Failed to save project', 'error');
  }
}

// Load a project from a JSON file
async function loadProject(file: File): Promise<void> {
  try {
    const text = await file.text();
    const project = JSON.parse(text);
    
    // Clear existing nodes and connections
    document.querySelectorAll('.node').forEach(node => node.remove());
    clearConnections();
    
    const allLoadedNodes: HTMLElement[] = [];
    
    // Create and position all nodes first
    const nodePromises = project.nodes.map(async (nodeData: any) => {
      const node = await createNodeInstance(
        nodeData.type,
        nodeData.x,
        nodeData.y,
        nodeData.id,
        'flow',
        JSON.parse(nodeData.data)
      );
      
      const nodeElement = document.getElementById(nodeData.id) as HTMLElement;
      if (nodeElement) {
        allLoadedNodes.push(nodeElement);
        
        // Apply fade in animation to each loaded node
        enterTransition(nodeElement, 'fade', 100);
      }
      return node;
    });
    
    await Promise.all(nodePromises);
    
    // Apply stagger animation to all nodes after they're loaded
    staggerAnimation(allLoadedNodes, 'scale', 50, 200);
    
    // Re-create all connections
    setTimeout(() => {
      for (const connection of project.connections) {
        window.nodeSystem.createConnection(
          connection.fromNodeId,
          connection.fromPortId,
          connection.toNodeId,
          connection.toPortId
        );
      }
      
      // Make all nodes draggable
      initDraggableNodes(allLoadedNodes, allLoadedNodes);
      
      showNotification('Project loaded successfully!', 'success');
    }, 300); // Small delay to ensure nodes are rendered properly
  } catch (error) {
    console.error('Failed to load project:', error);
    showNotification('Failed to load project', 'error');
  }
}

// Show a notification message (success, error, info)
function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Apply entrance animation
  enterTransition(notification, 'slide-up', 300);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    // Apply exit animation
    exitTransition(notification, 'slide-up', 300)
      .then(() => {
        notification.remove();
      });
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
    rightPanelEl.style.transition = 'none';
    workspace.style.transition = 'none';
    if (builderContainer) builderContainer.style.transition = 'none';
  };
  
  const enableTransitions = () => {
    rightPanelEl.style.transition = '';
    workspace.style.transition = '';
    if (builderContainer) builderContainer.style.transition = '';
  };
  
  // Add hover effect to the resize handle
  resizeHandle.addEventListener('mouseenter', () => {
    resizeHandle.style.backgroundColor = 'var(--primary-light)';
  });
  
  resizeHandle.addEventListener('mouseleave', () => {
    if (!isResizing) {
      resizeHandle.style.backgroundColor = '';
    }
  });
  
  resizeHandle.addEventListener('mousedown', e => {
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(rightPanelEl).width, 10);
    isResizing = true;
    disableTransitions();
    
    // Change appearance during resize
    resizeHandle.style.backgroundColor = 'var(--primary)';
    document.body.style.cursor = 'col-resize';
    
    // Create overlay to prevent text selection during resize
    const overlay = document.createElement('div');
    overlay.id = 'resize-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'col-resize';
    document.body.appendChild(overlay);
  });
  
  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    let newWidth = startWidth - deltaX;
    
    // Constrain to min/max width
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    rightPanelEl.style.width = `${newWidth}px`;
    
    // Update CSS variable for other components that might depend on it
    document.documentElement.style.setProperty('--right-panel-width', `${newWidth}px`);
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      enableTransitions();
      resizeHandle.style.backgroundColor = '';
      document.body.style.cursor = '';
      
      // Remove overlay
      document.getElementById('resize-overlay')?.remove();
      
      // Apply subtle animation to indicate resize completion
      const width = rightPanelEl.style.width;
      rightPanelEl.style.width = `calc(${width} - 3px)`;
      
      setTimeout(() => {
        rightPanelEl.style.width = width;
      }, 100);
    }
  });
  
  window.addEventListener('blur', () => {
    if (isResizing) {
      isResizing = false;
      enableTransitions();
      resizeHandle.style.backgroundColor = '';
      document.body.style.cursor = '';
      document.getElementById('resize-overlay')?.remove();
    }
  });
}

if (module && module.hot) {
  module.hot.accept();
}
