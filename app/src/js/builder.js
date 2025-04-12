// Script for builder.html (Bot Builder)
document.addEventListener('DOMContentLoaded', () => {
  console.log('Builder script loaded');

  // Grid settings for snapping
  const GRID_SIZE = 20; // Match the grid size in CSS

  // Initialize side panel to be visible on load
  document.querySelector('.side-panel').classList.add('expanded');

  // Toggle Side Panel
  document.querySelector('.toggle-panel').addEventListener('click', () => {
    const sidePanel = document.querySelector('.side-panel');
    const wasExpanded = sidePanel.classList.contains('expanded');
    
    sidePanel.classList.toggle('expanded');
    
    // Adjust builder content margin based on side panel state
    if (wasExpanded) {
      // Add a subtle animation to content shifting
      document.querySelector('.builder-content').style.transition = 'margin-left 0.3s ease, width 0.3s ease';
    }
  });

  // Page transition effect function
  function showPageTransition(destination) {
    // Create transition overlay if it doesn't exist in builder
    let pageTransition = document.querySelector('.page-transition');
    if (!pageTransition) {
      pageTransition = document.createElement('div');
      pageTransition.className = 'page-transition';
      
      const icon = document.createElement('span');
      icon.className = 'transition-icon';
      icon.textContent = '🤖';
      
      pageTransition.appendChild(icon);
      pageTransition.appendChild(document.createTextNode('Loading...'));
      
      document.body.appendChild(pageTransition);
      
      // Add necessary styles if they don't exist
      if (!document.getElementById('transition-styles')) {
        const style = document.createElement('style');
        style.id = 'transition-styles';
        style.textContent = `
          .page-transition {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--dark);
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.4s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
          }
          
          .page-transition.active {
            opacity: 0.9;
            visibility: visible;
          }
          
          .transition-icon {
            font-size: 48px;
            margin-right: 15px;
            animation: pulse 1.5s infinite;
          }
          
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.7; }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    pageTransition.classList.add('active');
    
    // Wait for animation before navigating
    setTimeout(() => {
      window.location.href = destination;
    }, 400);
  }

  // Toggle Properties Panel
  document.getElementById('properties-toggle').addEventListener('click', () => {
    const componentsPanel = document.querySelector('.components-container');
    const propertiesPanel = document.getElementById('properties-panel');
    
    if (propertiesPanel.style.display === 'none') {
      componentsPanel.style.display = 'none';
      propertiesPanel.style.display = 'block';
      document.getElementById('properties-toggle').textContent = '🧩';
    } else {
      componentsPanel.style.display = 'flex';
      propertiesPanel.style.display = 'none';
      document.getElementById('properties-toggle').textContent = '📝';
    }
  });

  // Navigation between pages with transition effect
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const page = e.currentTarget.getAttribute('data-page');
      if (page === 'dashboard') {
        showPageTransition('index.html');
      }
      // Handle other page navigation here
    });
  });

  // Helper function to snap values to grid
  function snapToGrid(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  // Store all nodes for collision detection
  let allNodes = Array.from(document.querySelectorAll('.node'));
  
  // Track node positions for collision detection
  const nodePositions = new Map();
  
  // Function to check if two nodes collide
  function checkCollision(node1Rect, node2Rect, tolerance = 5) {
    return !(
      node1Rect.right < node2Rect.left + tolerance ||
      node1Rect.left > node2Rect.right - tolerance ||
      node1Rect.bottom < node2Rect.top + tolerance ||
      node1Rect.top > node2Rect.bottom - tolerance
    );
  }
  
  // Function to show visual collision feedback
  function showCollisionFeedback(node, isColliding) {
    if (isColliding) {
      node.style.boxShadow = '0 0 0 2px var(--danger)';
    } else {
      node.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
    }
  }
  
  // Use Interact.js for draggable nodes with natural grab behavior
  function initInteractDraggable(nodes) {
    // Initialize each node with interact.js
    nodes.forEach(node => {
      // Store initial position for each node
      updateNodePosition(node);
      
      // Make node selectable
      node.addEventListener('mousedown', (e) => {
        if (e.target.closest('.port')) return; // Don't select when clicking on ports
        
        // Select the node
        document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
        node.classList.add('node-selected');
        
        // Show properties panel
        const componentsPanel = document.querySelector('.components-container');
        const propertiesPanel = document.getElementById('properties-panel');
        componentsPanel.style.display = 'none';
        propertiesPanel.style.display = 'block';
        document.getElementById('properties-toggle').textContent = '🧩';
      });
      
      // Setup interact.js draggable
      interact(node).draggable({
        // Natural grabbing - keep the same relative position within the element
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: '#canvas',
            endOnly: true
          })
        ],
        
        listeners: {
          // Start dragging
          start(event) {
            const target = event.target;
            
            // Set drag state for visuals
            target.classList.add('node-dragging');
            target.style.zIndex = 999;
            target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            
            // Track original position for potential rollback
            target.dataset.originalX = parseFloat(target.getAttribute('data-x') || 0);
            target.dataset.originalY = parseFloat(target.getAttribute('data-y') || 0);
            
            // Position in the actual DOM
            target.dataset.startLeft = target.offsetLeft;
            target.dataset.startTop = target.offsetTop;
            
            // Select this node
            document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
            target.classList.add('node-selected');
          },
          
          // During drag
          move(event) {
            const target = event.target;
            
            // Get current position or default to 0
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            
            // Calculate absolute position
            const absX = parseInt(target.dataset.startLeft) + x;
            const absY = parseInt(target.dataset.startTop) + y;
            
            // Update position during drag
            target.style.left = `${absX}px`;
            target.style.top = `${absY}px`;
            
            // Update data attributes
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
            
            // Check for collisions with all other nodes
            let hasCollision = false;
            const currentRect = {
              left: absX,
              right: absX + target.offsetWidth,
              top: absY,
              bottom: absY + target.offsetHeight
            };
            
            for (const otherNode of allNodes) {
              if (otherNode === target) continue;
              
              const pos = nodePositions.get(otherNode);
              if (!pos) continue;
              
              if (checkCollision(currentRect, {
                left: pos.x,
                right: pos.x + otherNode.offsetWidth,
                top: pos.y,
                bottom: pos.y + otherNode.offsetHeight
              })) {
                hasCollision = true;
                break;
              }
            }
            
            // Visual feedback for collision
            showCollisionFeedback(target, hasCollision);
          },
          
          // End dragging
          end(event) {
            const target = event.target;
            const x = parseFloat(target.getAttribute('data-x')) || 0;
            const y = parseFloat(target.getAttribute('data-y')) || 0;
            
            // Calculate absolute position
            const absX = parseInt(target.dataset.startLeft) + x;
            const absY = parseInt(target.dataset.startTop) + y;
            
            // Apply snapping with smooth transition
            target.style.transition = 'left 0.15s ease, top 0.15s ease, box-shadow 0.2s ease';
            
            // Snap to grid
            const snappedX = snapToGrid(absX);
            const snappedY = snapToGrid(absY);
            
            // Check for collisions at the snapped position
            let hasCollision = false;
            const currentRect = {
              left: snappedX,
              right: snappedX + target.offsetWidth,
              top: snappedY,
              bottom: snappedY + target.offsetHeight
            };
            
            for (const otherNode of allNodes) {
              if (otherNode === target) continue;
              
              const pos = nodePositions.get(otherNode);
              if (!pos) continue;
              
              if (checkCollision(currentRect, {
                left: pos.x,
                right: pos.x + otherNode.offsetWidth,
                top: pos.y,
                bottom: pos.y + otherNode.offsetHeight
              })) {
                hasCollision = true;
                break;
              }
            }
            
            if (hasCollision) {
              // Revert to original position if collision detected
              const originalX = parseInt(target.dataset.startLeft);
              const originalY = parseInt(target.dataset.startTop);
              
              target.style.left = `${originalX}px`;
              target.style.top = `${originalY}px`;
              target.setAttribute('data-x', 0);
              target.setAttribute('data-y', 0);
              
              // Show shake animation
              target.animate([
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(0)' }
              ], {
                duration: 300,
                easing: 'ease-in-out'
              });
            } else {
              // Apply snapped position
              target.style.left = `${snappedX}px`;
              target.style.top = `${snappedY}px`;
              
              // Reset data-x/y since we're using absolute positioning
              target.setAttribute('data-x', 0);
              target.setAttribute('data-y', 0);
              target.dataset.startLeft = snappedX;
              target.dataset.startTop = snappedY;
              
              // Update node position in our tracking
              updateNodePosition(target);
            }
            
            // Reset visual styles
            target.classList.remove('node-dragging');
            target.style.zIndex = '10';
            target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            
            // Reset transition after a short delay
            setTimeout(() => {
              target.style.transition = 'box-shadow 0.2s ease';
            }, 150);
          }
        },
        // Prevent default drag behaviors
        autoScroll: true,
        inertia: false
      });
    });
  }
  
  // Track node positions for collision detection
  function updateNodePosition(node) {
    nodePositions.set(node, {
      x: node.offsetLeft,
      y: node.offsetTop
    });
  }
  
  // Initialize all existing nodes with Interact.js
  initInteractDraggable(allNodes);
  
  // Deselect when clicking canvas
  document.getElementById('canvas').addEventListener('click', (e) => {
    if (e.target === document.getElementById('canvas')) {
      document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
    }
  });
  
  // Enhanced Component drag and drop
  document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', e.target.getAttribute('data-type'));
      // Add a visual effect to the component being dragged
      setTimeout(() => {
        item.style.opacity = '0.4';
      }, 0);
    });
    
    item.addEventListener('dragend', () => {
      // Restore the component appearance
      item.style.opacity = '1';
    });
  });
  
  document.getElementById('canvas').addEventListener('dragover', (e) => {
    e.preventDefault();
    // Visual indicator for valid drop target
    document.getElementById('canvas').style.backgroundColor = '#e9f5fe';
  });
  
  document.getElementById('canvas').addEventListener('dragleave', (e) => {
    // Restore canvas background
    document.getElementById('canvas').style.backgroundColor = '#f0f4f8';
  });

  // Storage for node instances
  const nodeInstances = new Map();

  // Create node instance and DOM element using IPC bridge
  async function createNodeInstance(type, x, y) {
    // Generate a unique ID for the node
    const id = window.utils.generateNodeId();
    
    try {
      // Create node instance using the IPC bridge
      const nodeInstance = await window.nodeSystem.createNode(type, id, {});
      
      // Create DOM element for visual representation
      const nodeElement = document.createElement('div');
      nodeElement.className = 'node';
      nodeElement.id = id;
      nodeElement.dataset.nodeId = id;
      nodeElement.dataset.nodeType = type;
      
      // Position the node
      nodeElement.style.left = `${x}px`;
      nodeElement.style.top = `${y}px`;
      
      // Generate node HTML
      nodeElement.innerHTML = generateNodeHtml(nodeInstance);
      
      // Append to canvas
      document.getElementById('canvas').appendChild(nodeElement);
      
      return { nodeElement, nodeInstance };
    } catch (error) {
      console.error(`Error creating node of type ${type}:`, error);
      return null;
    }
  }

  // Generate HTML for a node based on its instance
  function generateNodeHtml(nodeInstance) {
    const { type, properties, inputs, outputs } = nodeInstance;
    
    // Generate input ports HTML
    const inputPortsHtml = inputs.map(input => {
      return `<div class="port input-port" data-port-id="${input.id}" data-port-type="${input.dataType}" title="${input.label}"></div>`;
    }).join('');
    
    // Generate output ports HTML
    const outputPortsHtml = outputs.map(output => {
      return `<div class="port output-port" data-port-id="${output.id}" data-port-type="${output.dataType}" title="${output.label}"></div>`;
    }).join('');
    
    // Generate content based on node type
    let content = '';
    
    switch (type) {
      case 'start':
        content = '<p>Bot conversation starts here.</p>';
        break;
      case 'message':
        content = `<p>${properties.message || 'Enter your message here...'}</p>`;
        break;
      case 'options':
        content = properties.options.map(opt => 
          `<div class="node-option">${opt.text}</div>`
        ).join('');
        break;
      case 'input':
        content = `<p>${properties.placeholder || 'Waiting for user input...'}</p>`;
        break;
      case 'condition':
        content = `<p>if (${properties.condition}) { ... }</p>`;
        break;
      case 'math':
        content = `<p>Performing ${properties.operation} operation</p>`;
        break;
      default:
        content = '<p>Configure this node</p>';
    }
    
    // Return the complete node HTML
    return `
      <div class="node-header">
        <span>${properties.title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
        <span>⋮</span>
      </div>
      <div class="node-content">
        ${content}
      </div>
      <div class="node-ports">
        <div class="input-ports">
          ${inputPortsHtml}
        </div>
        <div class="output-ports">
          ${outputPortsHtml}
        </div>
      </div>
    `;
  }

  // Override the canvas drop event to use our new node system
  document.getElementById('canvas').addEventListener('drop', async (e) => {
    e.preventDefault();
    
    // Restore canvas background
    document.getElementById('canvas').style.backgroundColor = '#f0f4f8';
    
    const type = e.dataTransfer.getData('text/plain');
    
    // Get canvas coordinates
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Snap the position to the grid
    const snappedX = snapToGrid(x - 90);
    const snappedY = snapToGrid(y - 50);
    
    // Check position validity (collision detection)
    let hasCollision = false;
    const tempRect = {
      left: snappedX,
      right: snappedX + 180, // Default node width
      top: snappedY,
      bottom: snappedY + 150 // Approximate node height
    };
    
    for (const node of allNodes) {
      const pos = nodePositions.get(node);
      if (!pos) continue;
      
      if (checkCollision(tempRect, {
        left: pos.x,
        right: pos.x + node.offsetWidth,
        top: pos.y,
        bottom: pos.y + node.offsetHeight
      })) {
        hasCollision = true;
        break;
      }
    }
    
    if (hasCollision) {
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
      // Create the node instance and DOM element - await the async call
      const result = await createNodeInstance(type, snappedX, snappedY);
      
      if (result && result.nodeElement) {
        const { nodeElement, nodeInstance } = result;
        
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
          initInteractDraggable([nodeElement]);
          
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

  // Show properties panel for a specific node instance
  function showPropertiesPanel(nodeInstance) {
    const componentsPanel = document.querySelector('.components-container');
    const propertiesPanel = document.getElementById('properties-panel');
    
    componentsPanel.style.display = 'none';
    propertiesPanel.style.display = 'block';
    document.getElementById('properties-toggle').textContent = '🧩';
    
    // Populate properties panel based on node instance
    updatePropertiesPanel(nodeInstance);
  }

  // Update properties panel with node instance data
  function updatePropertiesPanel(nodeInstance) {
    const propertiesPanel = document.getElementById('properties-panel');
    
    // Set node name/ID in properties
    const nameInput = propertiesPanel.querySelector('input[aria-label="Node name"]');
    if (nameInput) nameInput.value = nodeInstance.properties.title || '';
    
    const idInput = propertiesPanel.querySelector('input[aria-label="Node ID"]');
    if (idInput) idInput.value = nodeInstance.id;
    
    // Add more property-specific controls based on node type
    // This is just a basic implementation
    const contentArea = propertiesPanel.querySelector('textarea[aria-label="Node message content"]');
    if (contentArea && nodeInstance.type === 'message') {
      contentArea.value = nodeInstance.properties.message || '';
    }
  }

  // Populate components panel with actual node components
  populateComponentsPanel();
});

// Function to populate component categories based on actual node components
function populateComponentsPanel() {
  const componentCategories = document.getElementById('component-categories');
  
  // Define component categories and their associated node types
  const categories = [
    {
      name: 'Conversation Flow',
      icon: '💬',
      components: [
        { type: 'start', icon: '🚀', label: 'Start' },
        { type: 'message', icon: '💬', label: 'Message' },
        { type: 'options', icon: '📋', label: 'Options' },
        { type: 'input', icon: '📝', label: 'User Input' }
      ]
    },
    {
      name: 'Logic',
      icon: '🔀',
      components: [
        { type: 'condition', icon: '🔀', label: 'Condition' },
        { type: 'math', icon: '🧮', label: 'Math' }
      ]
    }
  ];
  
  // Generate HTML for each category
  categories.forEach(category => {
    // Create category container
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'component-category';
    
    // Create category title
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = category.name;
    categoryDiv.appendChild(categoryTitle);
    
    // Create component list
    const componentList = document.createElement('div');
    componentList.className = 'component-list';
    
    // Add components to list
    category.components.forEach(component => {
      const componentItem = document.createElement('div');
      componentItem.className = 'component-item';
      componentItem.setAttribute('draggable', 'true');
      componentItem.setAttribute('data-type', component.type);
      
      const componentIcon = document.createElement('div');
      componentIcon.className = 'component-icon';
      componentIcon.textContent = component.icon;
      
      const componentName = document.createElement('div');
      componentName.className = 'component-name';
      componentName.textContent = component.label;
      
      componentItem.appendChild(componentIcon);
      componentItem.appendChild(componentName);
      componentList.appendChild(componentItem);
      
      // Add drag event listeners
      componentItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', component.type);
        setTimeout(() => {
          componentItem.style.opacity = '0.4';
        }, 0);
      });
      
      componentItem.addEventListener('dragend', () => {
        componentItem.style.opacity = '1';
      });
    });
    
    categoryDiv.appendChild(componentList);
    componentCategories.appendChild(categoryDiv);
  });
}