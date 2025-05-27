import { exitTransition } from '../../utils/transitions.js';
import { deleteNode } from './nodeService.js';
import { showNotification } from '../../utils/notifications.js';
import { removeNodeById } from './nodeState.js';

export function initNodeManagement(): void {
  document.addEventListener('keydown', e => {
    if (e.key === 'Delete') {
      const selectedNode = document.querySelector('.node-selected') as HTMLElement;
      if (selectedNode) {
        exitTransition(selectedNode, 'scale', 200).then(() => {
          const nodeId = selectedNode.id;
          deleteNode(selectedNode);
          removeNodeById(nodeId);
          showNotification('Node deleted', 'info');
        });
      }
    }
  });
}
