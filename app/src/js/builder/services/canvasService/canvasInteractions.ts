import { snapToGrid } from '../../utils/grid';
import { exitTransition, highlightElement, enterTransition } from '../../utils/transitions';
import { createNodeInstance, checkPositionValidity } from '../nodeService/nodeService';
import { initDraggableNodes, setupCanvasDropArea } from '../dragDropService/dragDropService';
import { cancelConnectionDrawing } from '../connectionService/connectionService';
import { initZoomControls } from '../../utils/zoom';
import { showNotification } from '../../utils/notifications';
import { getNodes, addNode } from '../nodeService/nodeState';

export function initCanvasInteractions(): void {
  const canvas = document.getElementById('canvas') as HTMLElement;
  const canvasContent = canvas?.querySelector('.canvas-content') as HTMLElement;

  if (!canvas || !canvasContent) return;

  canvas.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (target.id === 'canvas' || target.classList.contains('canvas-content')) {
      document.querySelectorAll('.node-selected').forEach(node => {
        node.classList.remove('node-selected');
        exitTransition(node as HTMLElement, 'scale', 150, 0, false);
      });
      cancelConnectionDrawing();
    }
  });

  initZoomControls(canvas);
  setupCanvasDropArea(canvas);

  canvas.addEventListener('drop', async e => {
    e.preventDefault();
    canvas.style.backgroundColor = '#1e1e1e';

    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;

    let nodeType = dataTransfer.getData('text/plain');
    let flowType = 'flow';

    try {
      const nodeData = JSON.parse(dataTransfer.getData('application/json') || nodeType);
      nodeType = nodeData.type;
      flowType = nodeData.flowType || 'flow';
    } catch (err) {
      console.log('Using direct type:', nodeType);
    }

    const canvasRect = canvas.getBoundingClientRect();
    const currentZoom = parseFloat(canvas.dataset.zoomLevel || '1');
    const x = (e.clientX - canvasRect.left + canvas.scrollLeft) / currentZoom;
    const y = (e.clientY - canvasRect.top + canvas.scrollTop) / currentZoom;
    const snappedX = snapToGrid(x - 90);
    const snappedY = snapToGrid(y - 50);

    console.log(`Drop position: x=${x}, y=${y}, snapped: x=${snappedX}, y=${snappedY}`);

    if (!checkPositionValidity(snappedX, snappedY, 220, 150, getNodes())) {
      showNotification('Cannot place node here: overlapping with existing node', 'error');
      return;
    }

    try {
      const result = await createNodeInstance(nodeType, snappedX, snappedY, flowType);
      if (result) {
        const { nodeElement } = result;
        nodeElement.style.display = 'block';
        nodeElement.style.visibility = 'visible';
        nodeElement.style.opacity = '1';
        nodeElement.style.position = 'absolute';
        nodeElement.style.left = `${snappedX}px`;
        nodeElement.style.top = `${snappedY}px`;
        canvasContent.appendChild(nodeElement);
        enterTransition(nodeElement, 'scale', 300);
        setTimeout(() => {
          highlightElement(nodeElement, 'var(--primary)', 800);
        }, 300);
        addNode(nodeElement);
        initDraggableNodes([nodeElement], getNodes());

        setTimeout(() => {
          const rect = nodeElement.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const moveDelta = -30;
          const pointerDown = new PointerEvent('pointerdown', {
            bubbles: true,
            clientX: centerX,
            clientY: centerY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          });
          nodeElement.dispatchEvent(pointerDown);
          const pointerMove = new PointerEvent('pointermove', {
            bubbles: true,
            clientX: centerX + moveDelta,
            clientY: centerY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          });
          document.dispatchEvent(pointerMove);
          const pointerUp = new PointerEvent('pointerup', {
            bubbles: true,
            clientX: centerX + moveDelta,
            clientY: centerY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          });
          document.dispatchEvent(pointerUp);
        }, 0);
        console.log(`Successfully added ${nodeType} node at x=${snappedX}, y=${snappedY}`);
      }
    } catch (error) {
      console.error('Error creating node:', error);
      showNotification(`Failed to create ${nodeType} node`, 'error');
    }
  });
  initDraggableNodes(getNodes(), getNodes());
}
