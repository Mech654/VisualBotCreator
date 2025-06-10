import { exitTransition } from '../../utils/transitions.js';
import { deleteNode } from './nodeService.js';
import { showNotification } from '../../utils/notifications.js';
import { removeNodeById } from './nodeState.js';

export function initNodeManagement(): void {
  document.addEventListener('keydown', e => {
    if (e.key === 'Delete') {
      const selectedNode = document.querySelector('.node-selected') as HTMLElement;
      if (selectedNode) {
        exitTransition(selectedNode, 'scale', 200).then(async () => {
          const nodeId = selectedNode.id;
          try {
            await deleteNode(selectedNode);
            removeNodeById(nodeId);
            showNotification('Node deleted', 'info');
          } catch (error) {
            console.error('Error deleting node:', error);
            showNotification('Failed to delete node', 'error');
          }
        });
      }
    }
  });
}
