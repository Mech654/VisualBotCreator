import { InteractEvent, NodeRectangle, NodeInstance } from '../../models/types.js';
import { showCollisionFeedback, snapToGrid } from '../../utils/grid.js';
import { updateNodePosition, showPropertiesPanel } from '../nodeService/nodeService.js';
import { updateConnections } from '../connectionService/connectionService.js';

// Declare the global interact object for TypeScript
declare const interact: any;

/**
 * Initialize Interact.js draggable for nodes
 */
export function initDraggableNodes(nodes: HTMLElement[], allNodes: HTMLElement[]): void {
  nodes.forEach(node => {
    updateNodePosition(node);

    node.addEventListener('mousedown', async e => {
      const target = e.target as HTMLElement;
      if (target.closest('.port')) return;

      // Select the node
      document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
      node.classList.add('node-selected');

      // Get node data and show properties panel
      const nodeId = node.dataset.nodeId;
      if (nodeId) {
        try {
          // Fetch the node instance data from the backend
          const nodeInstance = await window.nodeSystem.getNodeById(nodeId) as NodeInstance;

          // Show the properties panel with this node's data
          if (nodeInstance) {
            showPropertiesPanel(nodeInstance);
          }
        } catch (error) {
          console.error('Error fetching node data:', error);
        }
      }
    });

    // Setup interact.js draggable
    if (typeof interact !== 'undefined') {
      interact(node).draggable({
        // Natural grabbing - keep the same relative position within the element
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: '.canvas-content', // Restrict to canvas-content instead of canvas
            endOnly: true,
          }),
        ],

        listeners: {
          // Start dragging
          start(event: InteractEvent) {
            const target = event.target;

            // Set drag state for visuals
            target.classList.add('node-dragging');
            target.style.zIndex = '999';
            target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';

            // Track original position for potential rollback
            target.dataset.originalX = String(parseFloat(target.getAttribute('data-x') || '0'));
            target.dataset.originalY = String(parseFloat(target.getAttribute('data-y') || '0'));

            // Position in the actual DOM
            target.dataset.startLeft = String(target.offsetLeft);
            target.dataset.startTop = String(target.offsetTop);

            // Select this node
            document.querySelectorAll('.node').forEach(n => n.classList.remove('node-selected'));
            target.classList.add('node-selected');
          },

          // During drag
          move(event: InteractEvent) {
            const target = event.target;
            const canvas = document.getElementById('canvas');

            // Apply zoom scaling to dx and dy
            let scaleFactor = 1;
            if (canvas && canvas.dataset.zoomLevel) {
              scaleFactor = parseFloat(canvas.dataset.zoomLevel);
            }

            // Get current position or default to 0
            const x = parseFloat(target.getAttribute('data-x') || '0') + event.dx / scaleFactor;
            const y = parseFloat(target.getAttribute('data-y') || '0') + event.dy / scaleFactor;

            // Calculate absolute position
            const absX = parseInt(target.dataset.startLeft || '0') + x;
            const absY = parseInt(target.dataset.startTop || '0') + y;

            // Update position during drag
            target.style.left = `${absX}px`;
            target.style.top = `${absY}px`;

            // Update data attributes
            target.setAttribute('data-x', String(x));
            target.setAttribute('data-y', String(y));

            // Update any connections attached to this node
            updateConnections();

            // Check for collisions with all other nodes
            let hasCollision = false;
            const currentRect: NodeRectangle = {
              left: absX,
              right: absX + target.offsetWidth,
              top: absY,
              bottom: absY + target.offsetHeight,
            };

            for (const otherNode of allNodes) {
              if (otherNode === target) continue;

              const position = {
                x: otherNode.offsetLeft,
                y: otherNode.offsetTop,
              };

              const otherRect: NodeRectangle = {
                left: position.x,
                right: position.x + otherNode.offsetWidth,
                top: position.y,
                bottom: position.y + otherNode.offsetHeight,
              };

              if (checkCollision(currentRect, otherRect)) {
                hasCollision = true;
                break;
              }
            }
            // Visual feedback for collision
            showCollisionFeedback(target, hasCollision);
          },

          // End dragging
          end(event: InteractEvent) {
            const target = event.target;
            const x = parseFloat(target.getAttribute('data-x') || '0');
            const y = parseFloat(target.getAttribute('data-y') || '0');

            // Calculate absolute position
            const absX = parseInt(target.dataset.startLeft || '0') + x;
            const absY = parseInt(target.dataset.startTop || '0') + y;

            // Apply snapping with smooth transition
            target.style.transition = 'left 0.15s ease, top 0.15s ease, box-shadow 0.2s ease';

            // Snap to grid
            const snappedX = snapToGrid(absX);
            const snappedY = snapToGrid(absY);

            // Check for collisions at the snapped position
            let hasCollision = false;
            const currentRect: NodeRectangle = {
              left: snappedX,
              right: snappedX + target.offsetWidth,
              top: snappedY,
              bottom: snappedY + target.offsetHeight,
            };

            for (const otherNode of allNodes) {
              if (otherNode === target) continue;

              const position = {
                x: otherNode.offsetLeft,
                y: otherNode.offsetTop,
              };

              const otherRect: NodeRectangle = {
                left: position.x,
                right: position.x + otherNode.offsetWidth,
                top: position.y,
                bottom: position.y + otherNode.offsetHeight,
              };

              if (checkCollision(currentRect, otherRect)) {
                hasCollision = true;
                break;
              }
            }

            if (hasCollision) {
              // Revert to original position if collision detected
              const originalX = parseInt(target.dataset.startLeft || '0');
              const originalY = parseInt(target.dataset.startTop || '0');

              target.style.left = `${originalX}px`;
              target.style.top = `${originalY}px`;
              target.setAttribute('data-x', '0');
              target.setAttribute('data-y', '0');

              // Show shake animation
              target.animate(
                [
                  { transform: 'translateX(-5px)' },
                  { transform: 'translateX(5px)' },
                  { transform: 'translateX(-5px)' },
                  { transform: 'translateX(0)' },
                ],
                {
                  duration: 300,
                  easing: 'ease-in-out',
                }
              );
            } else {
              // Apply snapped position
              target.style.left = `${snappedX}px`;
              target.style.top = `${snappedY}px`;

              // Reset data-x/y since we're using absolute positioning
              target.setAttribute('data-x', '0');
              target.setAttribute('data-y', '0');
              target.dataset.startLeft = String(snappedX);
              target.dataset.startTop = String(snappedY);

              // Update node position in our tracking
              updateNodePosition(target);
            }

            // Final update of connections after node movement is complete
            setTimeout(() => {
              updateConnections();
            }, 150);

            // Reset visual styles
            target.classList.remove('node-dragging');
            target.style.zIndex = '10';
            target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';

            setTimeout(() => {
              target.style.transition = 'box-shadow 0.2s ease';
            }, 150);
          },
        },
        autoScroll: true,
        inertia: false,
      });
    }
  });
}

/**
 * Check if two node rectangles collide
 */
export function checkCollision(
  rect1: NodeRectangle,
  rect2: NodeRectangle,
  tolerance: number = 5
): boolean {
  return !(
    rect1.right < rect2.left + tolerance ||
    rect1.left > rect2.right - tolerance ||
    rect1.bottom < rect2.top + tolerance ||
    rect1.top > rect2.bottom - tolerance
  );
}

/**
 * Set up canvas drop area for component drag and drop
 */
export function setupCanvasDropArea(canvas: HTMLElement): void {
  const originalBgColor = canvas.style.backgroundColor || '#1e1e1e';

  canvas.addEventListener('dragover', e => {
    e.preventDefault();
    canvas.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    canvas.style.cursor = 'copy';
  });

  canvas.addEventListener('dragleave', () => {
    canvas.style.backgroundColor = originalBgColor;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('drop', () => {
    canvas.style.backgroundColor = originalBgColor;
    canvas.style.cursor = 'default';
  });
}
