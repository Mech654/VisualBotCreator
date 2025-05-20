import { exportConnections, clearConnections } from '../connectionService/connectionService';
import { createNodeInstance } from '../nodeService/nodeService';
import { initDraggableNodes } from '../dragDropService/dragDropService';
import { showNotification } from '../../utils/notifications';
import {
  enterTransition,
  staggerAnimation,
  createRippleEffect,
  addAttentionAnimation,
} from '../../utils/transitions';
import { getNodes, addNode, setNodes } from '../nodeService/nodeState';
declare global {
  interface Window {
    electron?: {
      ipcRenderer?: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}
function showProjectNameModal(): Promise<string | null> {
  return new Promise(resolve => {
    const modal = document.getElementById('project-name-modal') as HTMLElement;
    const input = document.getElementById('project-name-input') as HTMLInputElement;
    const saveBtn = document.getElementById('modal-save-btn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('modal-cancel-btn') as HTMLButtonElement;

    if (!modal || !input || !saveBtn || !cancelBtn) {
      resolve(null);
      return;
    }

    input.value = '';
    modal.style.display = 'flex';
    input.focus();

    function cleanup() {
      modal.style.display = 'none';
      saveBtn.removeEventListener('click', onSave);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeyDown);
    }

    function onSave() {
      const value = input.value.trim();
      cleanup();
      resolve(value || null);
    }
    function onCancel() {
      cleanup();
      resolve(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        onSave();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    }

    saveBtn.addEventListener('click', onSave);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
  });
}

async function saveProject(): Promise<void> {
  try {
    const projectName = await showProjectNameModal();
    if (!projectName) {
      showNotification('Project name is required to save.', 'info');
      return;
    }
    console.log('[SaveProject] Using project name:', projectName);

    // Check for ipcRenderer existence (bypass TS error)
    const electron = (window as any).electron;
    if (!electron || !electron.ipcRenderer) {
      console.error('[SaveProject] window.electron or ipcRenderer is undefined!');
      showNotification('IPC is not available. Project cannot be saved.', 'error');
      return;
    }

    const result = await electron.ipcRenderer.invoke('database:saveAllNodes', projectName);
    console.log('[SaveProject] IPC result:', result);

    showNotification('Project saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save project:', error);
    showNotification('Failed to save project', 'error');
  }
}

async function loadProject(file: File): Promise<void> {
  try {
    const text = await file.text();
    const project = JSON.parse(text);

    document.querySelectorAll('.node').forEach(node => node.remove());
    clearConnections();

    const allLoadedNodes: HTMLElement[] = [];

    const nodePromises = project.nodes.map(async (nodeData: any) => {
      const result = await createNodeInstance(nodeData.type, nodeData.x, nodeData.y, 'flow');

      if (result && result.nodeElement) {
        result.nodeElement.id = nodeData.id;
        result.nodeElement.dataset.nodeId = nodeData.id;
        allLoadedNodes.push(result.nodeElement);
        enterTransition(result.nodeElement, 'fade', 100);
      }
      return result;
    });

    await Promise.all(nodePromises);
    setNodes(allLoadedNodes);

    staggerAnimation(getNodes(), 'scale', 50, 200);

    setTimeout(() => {
      for (const connection of project.connections) {
        (window as any).nodeSystem.createConnection(
          connection.fromNodeId,
          connection.fromPortId,
          connection.toNodeId,
          connection.toPortId
        );
      }
      initDraggableNodes(getNodes(), getNodes());
      showNotification('Project loaded successfully!', 'success');
    }, 300);
  } catch (error) {
    console.error('Failed to load project:', error);
    showNotification('Failed to load project', 'error');
  }
}

export function initProjectManagement(): void {
  // Use event delegation or direct binding for div.tool#save-button
  const saveBtn = document.getElementById('save-button');
  if (saveBtn) {
    saveBtn.addEventListener('click', e => {
      console.log('Save button clicked'); // Debug: verify event fires
      createRippleEffect(saveBtn as HTMLElement, e);
      addAttentionAnimation(saveBtn as HTMLElement, 'bounce', 500);
      saveProject();
    });
  } else {
    console.warn('Save button not found in DOM');
  }

  document.getElementById('load-button')?.addEventListener('click', e => {
    createRippleEffect(e.currentTarget as HTMLElement, e);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async event => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        await loadProject(target.files[0]);
      }
    };
    input.click();
  });
}
