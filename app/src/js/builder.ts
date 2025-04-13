// Script for builder.html (Bot Builder)
import { NodeInstance } from './models/types.js';
import { snapToGrid } from './utils/grid.js';
import { showPageTransition } from './ui/transitions.js';
import { populateComponentsPanel } from './components/componentPanel.js';
import { createNodeInstance, showPropertiesPanel, updateNodePosition, checkPositionValidity } from './services/nodeService.js';
import { initDraggableNodes, setupCanvasDropArea } from './services/dragDropService.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize side panel to be visible on load
  document.querySelector('.side-panel')?.classList.add('expanded');

  // Store all nodes for collision detection
  let allNodes = Array.from(document.querySelectorAll('.node')) as HTMLElement[];

  // Toggle Side Panel
  document.querySelector('.toggle-panel')?.addEventListener('click', () => {
    const sidePanel = document.querySelector('.side-panel');
    const wasExpanded = sidePanel?.classList.contains('expanded');
    
    sidePanel?.classList.toggle('expanded');
    
    // Adjust builder content margin based on side panel state
    if (wasExpanded) {
      const builderContent = document.querySelector('.builder-content') as HTMLElement;
      if (builderContent) {
        builderContent.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
      }
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
  canvas?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'canvas') {
      document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
    }
  });
  
  // Set up canvas as drop target for components
  setupCanvasDropArea(canvas);
  
  // Setup handling of dropping components on canvas
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    
    // Restore canvas background
    canvas.style.backgroundColor = '#f0f4f8';
    
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;
    
    const type = dataTransfer.getData('text/plain');
    
    // Get canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Snap the position to the grid
    const snappedX = snapToGrid(x - 90);
    const snappedY = snapToGrid(y - 50);
    
    // Check for collisions (use standard node size)
    if (!checkPositionValidity(snappedX, snappedY, 180, 150, allNodes)) {
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
      canvas.appendChild(errorMsg);
      
      // Remove after a brief delay
      setTimeout(() => {
        canvas.removeChild(errorMsg);
      }, 2000);
      
      return; // Don't create the node
    }
    
    try {
      // Create the node instance and DOM element
      const result = await createNodeInstance(type, snappedX, snappedY);
      
      if (result && result.nodeElement) {
        const { nodeElement, nodeInstance } = result;
        
        // Append to canvas
        canvas.appendChild(nodeElement);
        
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

  // Populate components panel with actual node components
  populateComponentsPanel();
});