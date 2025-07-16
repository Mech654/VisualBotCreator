import { exportConnections, clearConnections, createConnection, connections } from '../connectionService/connectionService.js';
import { createNodeInstance } from '../nodeService/nodeService.js';
import { initDraggableNodes } from '../dragDropService/dragDropService.js';
import { showNotification } from '../../utils/notifications.js';
import {
  enterTransition,
  staggerAnimation,
  createRippleEffect,
  addAttentionAnimation,
} from '../../utils/transitions.js';
import { getNodes, addNode, setNodes } from '../nodeService/nodeState.js';

// Global variable to track current bot name
let currentBotName: string | null = null;

// Utility functions for bot name display
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

// Function to start a new project (clears everything)
function startNewProject(): void {
  clearBotName();
  clearConnections();
  setNodes([]);
  
  const canvas = document.querySelector('.canvas') as HTMLElement;
  if (canvas) {
    const nodeElements = canvas.querySelectorAll('.node');
    nodeElements.forEach(node => node.remove());
  }
  
  console.log('[ProjectManagement] Started new project');
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

    // Event listeners
    const overwriteBtn = modal.querySelector('.modal-overwrite-btn');
    const cancelBtn = modal.querySelector('.modal-cancel-btn');
    const closeBtn = modal.querySelector('.modal-close-btn');
    const overlay = modal.querySelector('.modal-overlay');

    overwriteBtn?.addEventListener('click', onOverwrite);
    cancelBtn?.addEventListener('click', onCancel);
    closeBtn?.addEventListener('click', onCancel);
    overlay?.addEventListener('click', onCancel);

    // Keyboard event
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
    
    // Check if we're editing an existing bot
    const currentBot = getCurrentBotName();
    if (currentBot) {
      // Show overwrite confirmation for existing bot
      const action = await showSaveConfirmationModal(currentBot);
      if (action === 'cancel') {
        showNotification('Save cancelled.', 'info');
        return;
      }
      projectName = currentBot; // Use existing bot name for overwrite
    } else {
      // Show name input modal for new bot
      projectName = await showProjectNameModal();
      if (!projectName) {
        showNotification('Project name is required to save.', 'info');
        return;
      }
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

    // Update the displayed bot name after successful save
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

    await loadProjectFromDatabase(botId);
    setBotName(botId); // Set the bot name after loading
    showNotification('Project loaded successfully!', 'success');
  } catch (error) {
    console.error('Failed to load project:', error);
    showNotification('Failed to load project', 'error');
  }
}

function showProjectSelectionModal(): Promise<string | null> {
  return new Promise(async (resolve) => {
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
              ${bots.map(bot => `
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
              `).join('')}
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

      modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        if (target.classList.contains('modal-overlay') || 
            target.classList.contains('modal-close-btn') || 
            target.classList.contains('modal-cancel-btn')) {
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
    // Clear current state
    clearConnections();
    setNodes([]);
    clearBotName(); // Clear any previous bot name
    
    const canvas = document.querySelector('.canvas') as HTMLElement;
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

    // Create all nodes first
    for (const node of nodeData) {
      try {
        const { nodeId, type, properties, position } = node;
        
        // Create node instance in the backend with existing ID
        await window.nodeSystem.createNode(type, nodeId, properties);
        
        // Create visual node in the frontend with existing ID and position
        const result = await createNodeInstance(
          type, 
          position?.x || 100, 
          position?.y || 100, 
          properties?.flowType || 'flow',
          nodeId,
          properties
        );
        
        if (result) {
          const canvas = document.querySelector('.canvas-content') as HTMLElement;
          if (canvas) {
            canvas.appendChild(result.nodeElement);
            addNode(result.nodeElement);
          }
        }
        
        console.log(`[LoadProject] Restored node: ${nodeId} (${type}) at ${position?.x}, ${position?.y}`);
      } catch (error) {
        console.error(`Error restoring node ${node.nodeId}:`, error);
      }
    }

    // Wait for nodes to be fully rendered before creating connections
    await new Promise(resolve => setTimeout(resolve, 100));

    // Restore connections
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
    initDraggableNodes(getNodes(), getNodes());

    console.log(`[LoadProject] Successfully restored ${nodeData.length} nodes`);
  } catch (error) {
    console.error('Error restoring nodes and connections:', error);
    throw error;
  }
}

async function restoreConnection(
  fromNodeId: string,
  fromPortId: string,
  toNodeId: string,
  toPortId: string
): Promise<void> {
  try {
    // Use the frontend createConnection which handles both backend and visual connections
    const connection = await createConnection(fromNodeId, fromPortId, toNodeId, toPortId);
    if (connection) {
      console.log(`[LoadProject] Restored connection: ${fromNodeId}.${fromPortId} -> ${toNodeId}.${toPortId}`);
    } else {
      console.error(`Failed to restore connection: ${fromNodeId}.${fromPortId} -> ${toNodeId}.${toPortId}`);
    }
  } catch (error) {
    console.error(`Error restoring connection ${fromNodeId} -> ${toNodeId}:`, error);
  }
}

// Auto-loads bot when coming from dashboard edit button
async function checkForAutoLoad(): Promise<void> {
  try {
    const editBotId = localStorage.getItem('editBotId');
    const preserveState = localStorage.getItem('preserveNodesOnTransition');
    
    if (editBotId) {
      console.log('[ProjectManagement] Auto-loading bot from dashboard:', editBotId);
      
      localStorage.removeItem('editBotId');
      localStorage.removeItem('preserveNodesOnTransition');
      
      await loadProjectFromDatabase(editBotId);
      setBotName(editBotId); // Set the bot name after auto-loading
      showNotification(`Project "${editBotId}" loaded successfully!`, 'success');
    } else if (preserveState) {
      // Try to restore the last workspace state
      console.log('[ProjectManagement] Checking for workspace state to restore...');
      await restoreWorkspaceState();
    }
  } catch (error) {
    console.error('Error in auto-load:', error);
    showNotification('Failed to load project from dashboard', 'error');
    
    localStorage.removeItem('editBotId');
    localStorage.removeItem('preserveNodesOnTransition');
  }
}

// Save current workspace state before navigation
export async function saveWorkspaceState(): Promise<void> {
  try {
    const nodes = getNodes();
    console.log('[ProjectManagement] Saving workspace state, nodes found:', nodes.length);
    
    if (nodes.length === 0) {
      console.log('[ProjectManagement] No nodes to save');
      return;
    }

    const workspaceData = [];
    for (const nodeElement of nodes) {
      const nodeId = nodeElement.dataset.nodeId;
      const nodeType = nodeElement.dataset.nodeType;
      
      if (!nodeId || !nodeType) continue;

      try {
        const nodeInstance = await window.nodeSystem.getNodeById(nodeId);
        const position = {
          x: nodeElement.offsetLeft,
          y: nodeElement.offsetTop
        };

        workspaceData.push({
          nodeId,
          type: nodeType,
          properties: (nodeInstance as any)?.properties || {},
          position,
          outputs: (nodeInstance as any)?.outputs || []
        });
      } catch (error) {
        console.error(`Error saving node ${nodeId}:`, error);
      }
    }

    localStorage.setItem('workspaceState', JSON.stringify(workspaceData));
    console.log('[ProjectManagement] Workspace state saved, data:', workspaceData.length, 'nodes');
  } catch (error) {
    console.error('Error saving workspace state:', error);
  }
}

// Restore workspace state after navigation
async function restoreWorkspaceState(): Promise<void> {
  try {
    const savedState = localStorage.getItem('workspaceState');
    console.log('[ProjectManagement] Saved state found:', !!savedState);
    
    if (!savedState) {
      console.log('[ProjectManagement] No saved state found, cleaning up...');
      localStorage.removeItem('preserveNodesOnTransition');
      return;
    }

    const workspaceData = JSON.parse(savedState);
    console.log('[ProjectManagement] Parsed workspace data:', workspaceData.length, 'nodes');
    
    if (workspaceData.length === 0) {
      console.log('[ProjectManagement] Empty workspace data, cleaning up...');
      localStorage.removeItem('preserveNodesOnTransition');
      localStorage.removeItem('workspaceState');
      return;
    }

    console.log('[ProjectManagement] Restoring workspace state...');
    await restoreNodesAndConnections(workspaceData);
    
    // Clean up
    localStorage.removeItem('preserveNodesOnTransition');
    localStorage.removeItem('workspaceState');
    
    showNotification('Workspace restored!', 'success');
  } catch (error) {
    console.error('Error restoring workspace state:', error);
    localStorage.removeItem('preserveNodesOnTransition');
    localStorage.removeItem('workspaceState');
  }
}

export function initProjectManagement(): void {
  // Initialize bot name as empty
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

  setTimeout(() => {
    checkForAutoLoad();
  }, 500);
}
