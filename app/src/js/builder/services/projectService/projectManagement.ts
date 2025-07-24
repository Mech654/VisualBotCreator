import {
  exportConnections,
  clearConnections,
  createConnection,
  connections,
} from '../connectionService/connectionService.js';
import { createNodeInstance } from '../nodeService/nodeService.js';
import { initDraggableNodes } from '../dragDropService/dragDropService.js';
import { showNotification } from '../../utils/notifications.js';
import {
  enterTransition,
  highlightElement,
  staggerAnimation,
  createRippleEffect,
  addAttentionAnimation,
} from '../../utils/transitions.js';
import { getNodes, addNode, setNodes } from '../nodeService/nodeState.js';

// Global variable to track current bot name
let currentBotName: string | null = null;

function setBotName(botName: string): void {
  currentBotName = botName;
  const botNameElement = document.getElementById('current-bot-name') as HTMLElement;

  if (botNameElement) {
    botNameElement.textContent = botName;
    console.log('[ProjectManagement] Set bot name:', botName);
  }
}

function clearBotName(): void {
  currentBotName = null;
  const botNameElement = document.getElementById('current-bot-name') as HTMLElement;

  if (botNameElement) {
    botNameElement.textContent = '';
    console.log('[ProjectManagement] Cleared bot name');
  }
}

function getCurrentBotName(): string | null {
  return currentBotName;
}

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

function showSaveConfirmationModal(botName: string): Promise<'overwrite' | 'cancel'> {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'save-confirmation-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Save Project</h3>
          <button class="modal-close-btn" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <p>You are currently editing "<strong>${botName}</strong>".</p>
          <p>Do you want to overwrite the existing project?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary modal-overwrite-btn">Overwrite</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    function cleanup() {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }

    function onOverwrite() {
      cleanup();
      resolve('overwrite');
    }

    function onCancel() {
      cleanup();
      resolve('cancel');
    }

    const overwriteBtn = modal.querySelector('.modal-overwrite-btn');
    const cancelBtn = modal.querySelector('.modal-cancel-btn');
    const closeBtn = modal.querySelector('.modal-close-btn');
    const overlay = modal.querySelector('.modal-overlay');

    overwriteBtn?.addEventListener('click', onOverwrite);
    cancelBtn?.addEventListener('click', onCancel);
    closeBtn?.addEventListener('click', onCancel);
    overlay?.addEventListener('click', onCancel);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        document.removeEventListener('keydown', handleKeyDown);
      } else if (e.key === 'Enter') {
        onOverwrite();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  });
}

async function saveProject(): Promise<void> {
  try {
    let projectName: string | null = null;

    const currentBot = getCurrentBotName();
    if (currentBot) {
      const action = await showSaveConfirmationModal(currentBot);
      if (action === 'cancel') {
        showNotification('Save cancelled.', 'info');
        return;
      }
      projectName = currentBot;
    } else {
      projectName = await showProjectNameModal();
      if (!projectName) {
        showNotification('Project name is required to save.', 'info');
        return;
      }
    }

    console.log('[SaveProject] Using project name:', projectName);

    const electron = (window as any).electron;
    if (!electron || !electron.ipcRenderer) {
      showNotification('IPC is not available. Project cannot be saved.', 'error');
      return;
    }

    await electron.ipcRenderer.invoke('database:saveAllNodes', projectName);

    setBotName(projectName);

    showNotification('Project saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save project:', error);
    showNotification('Failed to save project', 'error');
  }
}

async function loadProject(): Promise<void> {
  try {
    const botId = await showProjectSelectionModal();
    if (!botId) {
      showNotification('No project selected.', 'info');
      return;
    }

    setBotName(botId);
    localStorage.setItem('editBotId', botId);

    await loadProjectFromDatabase(botId);
    showNotification('Project loaded successfully!', 'success');
  } catch (error) {
    console.error('Failed to load project:', error);
    showNotification('Failed to load project', 'error');
  }
}

function showProjectSelectionModal(): Promise<string | null> {
  return new Promise(async resolve => {
    try {
      const bots = await window.database?.getAllBots();
      if (!bots || bots.length === 0) {
        showNotification('No saved projects found.', 'info');
        resolve(null);
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'project-selection-modal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>Load Project</h3>
            <button class="modal-close-btn" aria-label="Close">×</button>
          </div>
          <div class="modal-body">
            <div class="project-list">
              ${bots
                .map(
                  bot => `
                <div class="project-item" data-bot-id="${bot.Id}">
                  <div class="project-icon">${bot.Id.substring(0, 2).toUpperCase()}</div>
                  <div class="project-info">
                    <div class="project-name">${bot.Id}</div>
                    <div class="project-description">${bot.description || 'No description'}</div>
                    <div class="project-meta">
                      <span class="project-date">Updated: ${new Date(bot.UpdatedAt).toLocaleDateString()}</span>
                      <span class="project-status ${bot.enabled ? 'active' : 'inactive'}">
                        ${bot.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline modal-cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('active'), 10);

      function cleanup() {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }

      modal.addEventListener('click', e => {
        const target = e.target as HTMLElement;

        if (
          target.classList.contains('modal-overlay') ||
          target.classList.contains('modal-close-btn') ||
          target.classList.contains('modal-cancel-btn')
        ) {
          cleanup();
          resolve(null);
          return;
        }

        const projectItem = target.closest('.project-item') as HTMLElement;
        if (projectItem) {
          const botId = projectItem.dataset.botId;
          cleanup();
          resolve(botId || null);
        }
      });

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(null);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNotification('Failed to fetch projects', 'error');
      resolve(null);
    }
  });
}

async function loadProjectFromDatabase(botId: string): Promise<void> {
  try {
    clearConnections();
    setNodes([]);

    await window.nodeSystem?.clearAllNodes?.();

    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (canvas) {
      const nodeElements = canvas.querySelectorAll('.node');
      nodeElements.forEach(node => node.remove());
    }

    const nodeData = await window.database?.getBotNodes(botId);
    if (!nodeData || nodeData.length === 0) {
      showNotification('No nodes found in this project.', 'info');
      return;
    }

    await restoreNodesAndConnections(nodeData);
  } catch (error) {
    console.error('Error loading project from database:', error);
    throw error;
  }
}

async function restoreNodesAndConnections(nodeData: any[]): Promise<void> {
  try {
    const connectionPromises: Promise<void>[] = [];

    for (let i = 0; i < nodeData.length; i++) {
      const node = nodeData[i];
      try {
        const { nodeId, type, properties, position } = node;
        await window.nodeSystem.createNode(
          type,
          nodeId,
          properties,
          position || { x: 100, y: 100 }
        );
        await simulateDropPlacement(
          type,
          position?.x || 100,
          position?.y || 100,
          properties?.flowType || 'flow',
          nodeId,
          properties,
          i * 100
        );
      } catch (error) {
        console.error(`Error restoring node ${node.nodeId}:`, error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, Math.max(500, nodeData.length * 100 + 200)));

    for (const node of nodeData) {
      if (node.outputs) {
        for (const output of node.outputs) {
          if (output.connectedTo && output.connectedTo.length > 0) {
            for (const connection of output.connectedTo) {
              connectionPromises.push(
                restoreConnection(
                  connection.fromNodeId,
                  connection.fromPortId,
                  connection.toNodeId,
                  connection.toPortId
                )
              );
            }
          }
        }
      }
    }

    await Promise.all(connectionPromises);

    console.log(`[LoadProject] Successfully restored ${nodeData.length} nodes`);
  } catch (error) {
    console.error('Error restoring nodes and connections:', error);
    throw error;
  }
}

/**
 * Simulate the drop placement logic for project loading
 * This gives loaded nodes the same visual treatment as user-dropped nodes and also the temp fix for first interaction issue
 */
async function simulateDropPlacement(
  nodeType: string,
  x: number,
  y: number,
  flowType: string,
  existingNodeId: string,
  existingProperties: any,
  delay: number = 0
): Promise<void> {
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const result = await createNodeInstance(
    nodeType,
    x,
    y,
    flowType,
    existingNodeId,
    existingProperties
  );

  if (result) {
    const { nodeElement } = result;
    const canvas = document.querySelector('.canvas-content') as HTMLElement;

    if (canvas) {
      canvas.appendChild(nodeElement);
      addNode(nodeElement);

      nodeElement.style.display = 'block';
      nodeElement.style.visibility = 'visible';
      nodeElement.style.opacity = '1';
      nodeElement.style.position = 'absolute';
      nodeElement.style.transform = 'none';
      nodeElement.style.left = `${x}px`;
      nodeElement.style.top = `${y}px`;
      nodeElement.offsetHeight;

      initDraggableNodes([nodeElement], getNodes());
      enterTransition(nodeElement, 'scale', 300);
      setTimeout(() => {
        highlightElement(nodeElement, 'var(--primary)', 800);
      }, 300);

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
      }, 400);
    }
  }
}

async function restoreConnection(
  fromNodeId: string,
  fromPortId: string,
  toNodeId: string,
  toPortId: string
): Promise<void> {
  try {
    const connection = await createConnection(fromNodeId, fromPortId, toNodeId, toPortId);
    if (connection) {
      console.log(
        `[LoadProject] Restored connection: ${fromNodeId}.${fromPortId} -> ${toNodeId}.${toPortId}`
      );
    } else {
      console.error(
        `Failed to restore connection: ${fromNodeId}.${fromPortId} -> ${toNodeId}.${toPortId}`
      );
    }
  } catch (error) {
    console.error(`Error restoring connection ${fromNodeId} -> ${toNodeId}:`, error);
  }
}

async function checkForAutoLoad(): Promise<void> {
  try {
    const editBotId = localStorage.getItem('editBotId');

    if (editBotId) {
      setBotName(editBotId);
      await loadProjectFromDatabase(editBotId);
      showNotification(`Project "${editBotId}" loaded successfully!`, 'success');
    } else {
      await restoreWorkspaceState();
    }
  } catch (error) {
    console.error('Error in auto-load:', error);
    showNotification('Failed to load project from dashboard', 'error');
  }
}

// Restore workspace state after navigation
async function restoreWorkspaceState(): Promise<void> {
  try {
    const existingNodes = await window.nodeSystem?.getAllNodes?.();

    console.log(
      '[ProjectManagement] Found',
      existingNodes?.length || 0,
      'existing nodes to restore'
    );

    if (existingNodes && existingNodes.length > 0) {
      await restoreNodesAndConnections(existingNodes);
      showNotification('Workspace restored!', 'success');
    }
  } catch (error) {
    console.error('Error restoring workspace state:', error);
  }
}

export async function clearAllAndExitEditMode(): Promise<void> {
  try {
    clearConnections();
    setNodes([]);
    clearBotName();
    await window.nodeSystem?.clearAllNodes?.();

    const canvas = document.querySelector('.canvas-content') as HTMLElement;
    if (canvas) {
      const nodeElements = canvas.querySelectorAll('.node');
      nodeElements.forEach(node => node.remove());
    }

    localStorage.removeItem('editBotId');
    showNotification('Workspace cleared and exited edit mode', 'success');
  } catch (error) {
    console.error('Error clearing workspace:', error);
    showNotification('Error clearing workspace', 'error');
  }
}

export function initProjectManagement(): void {
  clearBotName();

  const saveBtn = document.getElementById('save-button');
  if (saveBtn) {
    saveBtn.addEventListener('click', e => {
      console.log('Save button clicked');
      createRippleEffect(saveBtn, e);
      addAttentionAnimation(saveBtn, 'bounce', 500);
      saveProject();
    });
  } else {
    console.warn('Save button not found in DOM');
  }

  const loadBtn = document.getElementById('load-button');
  if (loadBtn) {
    loadBtn.addEventListener('click', e => {
      console.log('Load button clicked');
      createRippleEffect(loadBtn, e);
      addAttentionAnimation(loadBtn, 'bounce', 500);
      loadProject();
    });
  } else {
    console.warn('Load button not found in DOM');
  }

  // Hook up delete button to clear workspace and exit edit mode
  const deleteBtn = document.querySelector('.tool[title="Delete"]') as HTMLElement;
  if (deleteBtn) {
    deleteBtn.addEventListener('click', e => {
      createRippleEffect(deleteBtn, e);
      addAttentionAnimation(deleteBtn, 'bounce', 500);
      clearAllAndExitEditMode();
    });
  }

  setTimeout(() => {
    checkForAutoLoad();
  }, 500);

  // Debug: Press 'n' to check nodeInstances count
  document.addEventListener('keydown', async e => {
    if (e.key === 'n' || e.key === 'N') {
      try {
        const existingNodes = await window.nodeSystem?.getAllNodes?.();
        console.log('[DEBUG] NodeInstances count:', existingNodes?.length || 0);
        console.log('[DEBUG] NodeInstances data:', existingNodes);
      } catch (error) {
        console.error('[DEBUG] Error getting nodeInstances:', error);
      }
    }
  });
}
