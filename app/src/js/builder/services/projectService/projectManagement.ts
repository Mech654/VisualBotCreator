import { exportConnections, clearConnections } from '../connectionService/connectionService';
import { createNodeInstance } from '../nodeService/nodeService';
import { initDraggableNodes } from '../dragDropService/dragDropService';
import { showNotification } from '../../utils/notifications';
import { enterTransition, staggerAnimation, createRippleEffect, addAttentionAnimation } from '../../utils/transitions';
import { getNodes, addNode, setNodes } from '../nodeService/nodeState';

async function saveProject(): Promise<void> {
  try {
    const nodes = getNodes().map(element => {
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

    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

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
      const result = await createNodeInstance(
        nodeData.type,
        nodeData.x,
        nodeData.y,
        'flow'
      );

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
  document.getElementById('save-button')?.addEventListener('click', e => {
    createRippleEffect(e.currentTarget as HTMLElement, e as MouseEvent);
    addAttentionAnimation(e.currentTarget as HTMLElement, 'bounce', 500);
    saveProject();
  });

  document.getElementById('load-button')?.addEventListener('click', e => {
    createRippleEffect(e.currentTarget as HTMLElement, e as MouseEvent);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        await loadProject(target.files[0]);
      }
    };
    input.click();
  });
}
