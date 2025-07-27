export interface DebugSession {
  id: string;
  startNodeId: string;
  isRunning: boolean;
  currentNodeId?: string;
  executionHistory: NodeExecution[];
}

export interface NodeExecution {
  nodeId: string;
  status: 'waiting' | 'executing' | 'completed' | 'error';
  timestamp: number;
  executionTime?: number;
  result?: any;
  error?: string;
}

class DebugService {
  private currentSession: DebugSession | null = null;
  private _debugPollActive: boolean = false;
  private _debugMessageListener?: (message: any) => void;

  async startDebugSession(startNodeId: string): Promise<void> {
    try 
    {
      const saveResult = await this.saveWorkflowForDebug();
      if (!saveResult.success) {
        throw new Error(`Failed to save workflow: ${saveResult.error}`);
      }
      this.currentSession = {
        id: `debug_${Date.now()}`,
        startNodeId,
        isRunning: true,
        executionHistory: []
      };
      if (this._debugMessageListener) {
        window.electron.ipcRenderer.removeListener('debug:message', this._debugMessageListener);
      }
      this._debugMessageListener = (message: any) => {
        console.log('[DEBUG] Received message:', message);
        if (message) this.handleDebugMessage(message);
      };
      window.electron.ipcRenderer.on('debug:message', this._debugMessageListener);
      await window.electron?.ipcRenderer?.invoke('debug:send', {
        command: 'start',
        startNodeId,
        botId: saveResult.botId
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[DEBUG] Failed to start debug session:', error);
      this.showDebugError(`Failed to start debug session: ${errorMsg}`);
    }
  }

  async stopDebugSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.isRunning = false;
      await window.electron?.ipcRenderer?.invoke('debug:send', {
        command: 'stop'
      });
      this.clearNodeHighlights();
      this.currentSession = null;
    }
    this._debugPollActive = false;
    console.log('[DEBUG] Debug session stopped');
  }

  private handleDebugMessage(message: any): void {
    try {
      if (!message) {
        console.warn('[DEBUG] Received undefined debug message');
        return;
      }
      console.log('[DEBUG] Received message:', message);
      const data = message.data || {};
      switch (message.type) {
        case 'node_start':
          this.handleNodeStart(data.nodeId);
          break;
        case 'node_complete':
          this.handleNodeComplete(data.nodeId, data.result);
          break;
        case 'node_error':
          this.handleNodeError(data.nodeId, data.error);
          break;
        case 'execution_complete':
          this.handleExecutionComplete();
          break;
        case 'execution_error':
          this.handleExecutionError(data.error);
          break;
        case 'execution_stopped':
          this.handleExecutionStopped();
          break;
        default:
          console.warn('[DEBUG] Unknown debug message type:', message.type);
      }
    } catch (error) {
      console.error('[DEBUG] Failed to handle debug message:', error);
    }
  }

  private handleNodeStart(nodeId: string): void {
    if (!this.currentSession) return;
    this.clearNodeHighlights();
    const execution: NodeExecution = {
      nodeId,
      status: 'executing',
      timestamp: Date.now()
    };
    this.currentSession.executionHistory.push(execution);
    this.currentSession.currentNodeId = nodeId;
    console.log(`[DEBUG] Node ${nodeId} started executing`);
    this.highlightNode(nodeId, 'executing');
  }

  private handleNodeComplete(nodeId: string, result: any): void {
    if (!this.currentSession) return;
    const execution = this.currentSession.executionHistory.find(
      exec => exec.nodeId === nodeId && exec.status === 'executing'
    );
    if (execution) {
      execution.status = 'completed';
      execution.executionTime = Date.now() - execution.timestamp;
      execution.result = result;
    }
    this.highlightNode(nodeId, 'completed');
    setTimeout(() => {
      this.clearNodeHighlight(nodeId);
    }, 2000);
  }

  private async handleNodeError(nodeId: string, error: string): Promise<void> {
    if (!this.currentSession) return;
    const execution = this.currentSession.executionHistory.find(
      exec => exec.nodeId === nodeId && exec.status === 'executing'
    );
    if (execution) {
      execution.status = 'error';
      execution.executionTime = Date.now() - execution.timestamp;
      execution.error = error;
    }
    this.highlightNode(nodeId, 'error');

    // Get node name/title for display
    let nodeName = 'Unknown Node';
    try {
      const nodes = await window.nodeSystem.getAllNodes();
      const node = nodes.find((n: any) => n.nodeId === nodeId || n.id === nodeId);
      nodeName = node?.properties?.title || node?.properties?.name || node?.type || 'Unknown Node';
    } catch (e) {
      // fallback to nodeId if lookup fails
    }
    this.showErrorPanel(nodeName, error);
  }
  private showErrorPanel(nodeName: string, error: string): void {
    // Remove any existing error panel
    const existing = document.getElementById('debug-error-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'debug-error-panel';
    panel.className = 'debug-error-panel';
    panel.innerHTML = `
      <div class="debug-error-panel-content">
        <div class="debug-error-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#ff4d4f"/>
            <path d="M12 7v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1.2" fill="#fff"/>
          </svg>
        </div>
        <div class="debug-error-details">
          <div class="debug-error-title">Workflow Error</div>
          <div class="debug-error-node">at <span class="debug-error-node-name">${this.escapeHtml(nodeName)}</span></div>
          <div class="debug-error-message">${this.escapeHtml(error)}</div>
        </div>
        <button class="debug-error-close" aria-label="Close">&times;</button>
      </div>
    `;
    document.body.appendChild(panel);
    setTimeout(() => panel.classList.add('show'), 50);
    const closeBtn = panel.querySelector('.debug-error-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.classList.remove('show');
        setTimeout(() => panel.remove(), 300);
      });
    }
  }

  private escapeHtml(str: string): string {
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[tag]||tag));
  }

  private handleExecutionComplete(): void {
    if (!this.currentSession) return;
    this.currentSession.isRunning = false;
    console.log('[DEBUG] Execution completed');
    this.showDebugNotification('Bot execution completed successfully');
    setTimeout(() => {
      this.stopDebugSession();
      this.resetDebugUI();
    }, 2000);
  }

  private handleExecutionError(error: string): void {
    if (!this.currentSession) return;
    this.currentSession.isRunning = false;
    console.error('[DEBUG] Execution error:', error);
    this.showDebugError(`Execution failed: ${error}`);
    setTimeout(() => {
      this.stopDebugSession();
      this.resetDebugUI();
    }, 3000);
  }

  private handleExecutionStopped(): void {
    if (!this.currentSession) return;
    this.currentSession.isRunning = false;
    console.log('[DEBUG] Execution stopped');
    this.showDebugNotification('Bot execution stopped');
    this.resetDebugUI();
  }

  private resetDebugUI(): void {
    const overlay = document.getElementById('debug-mode-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
    const debugButton = document.getElementById('debug-button');
    if (debugButton) {
      debugButton.classList.remove('debug-active', 'debug-disabled');
      debugButton.title = 'Run Bot';
    }
  }

  private async saveWorkflowForDebug(): Promise<{ success: boolean; botId?: string; error?: string }> {
    try {
      const debugBotId = `debug_${Date.now()}`;
      const nodes = await window.nodeSystem.getAllNodes();
      if (!nodes || nodes.length === 0) {
        return { success: false, error: 'No nodes to debug' };
      }
      if (!window.database) {
        return { success: false, error: 'Database not available' };
      }
      const saveResult = await window.database.saveAllNodes(debugBotId);
      if (!saveResult.success) {
        return { success: false, error: `Failed to save nodes: ${saveResult.error}` };
      }
      return { success: true, botId: debugBotId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  }

  private highlightNode(nodeId: string, state: 'executing' | 'completed' | 'error'): void {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!nodeElement) return;
    nodeElement.classList.remove('node-executing', 'node-completed', 'node-error');
    nodeElement.classList.add(`node-${state}`);
    this.updateExecutionStateIndicator(nodeElement, state);
    this.scrollToNode(nodeElement);
  }

  private clearNodeHighlight(nodeId: string): void {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!nodeElement) return;
    nodeElement.classList.remove('node-executing', 'node-completed', 'node-error');
    this.removeExecutionStateIndicator(nodeElement);
  }

  private clearNodeHighlights(): void {
    const allNodes = document.querySelectorAll('.node');
    allNodes.forEach(node => {
      node.classList.remove('node-executing', 'node-completed', 'node-error');
      this.removeExecutionStateIndicator(node as HTMLElement);
    });
  }

  private updateExecutionStateIndicator(nodeElement: HTMLElement, state: string): void {
    const existingIndicator = nodeElement.querySelector('.node-execution-state');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    const indicator = document.createElement('div');
    indicator.className = `node-execution-state state-${state}`;
    nodeElement.appendChild(indicator);
  }

  private removeExecutionStateIndicator(nodeElement: HTMLElement): void {
    const indicator = nodeElement.querySelector('.node-execution-state');
    if (indicator) {
      indicator.remove();
    }
  }

  private scrollToNode(nodeElement: HTMLElement): void {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    const nodeRect = nodeElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const isVisible = (
      nodeRect.top >= canvasRect.top &&
      nodeRect.bottom <= canvasRect.bottom &&
      nodeRect.left >= canvasRect.left &&
      nodeRect.right <= canvasRect.right
    );
    if (!isVisible) {
      nodeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }

  private showDebugError(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'debug-notification debug-error';
    notification.innerHTML = `
      <div class="debug-notification-content">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>${message}</span>
      </div>
    `;
    this.showNotification(notification);
  }

  private showDebugNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'debug-notification debug-success';
    notification.innerHTML = `
      <div class="debug-notification-content">
        <i class="bi bi-check-circle-fill"></i>
        <span>${message}</span>
      </div>
    `;
    this.showNotification(notification);
  }

  private showNotification(notification: HTMLElement): void {
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  async findStartNode(): Promise<string | null> {
    try {
      const nodes = await window.nodeSystem.getAllNodes();
      console.log('[DEBUG] Checking backend nodeInstances for start nodes:', nodes);
      const startNode = nodes.find(node => node.type === 'start');
      if (startNode) {
        const nodeId = startNode.nodeId || startNode.id;
        console.log('[DEBUG] Found start node in backend:', nodeId);
        return nodeId;
      }
      console.log('[DEBUG] No start node in backend, checking visual canvas...');
      const visualStartNodes = document.querySelectorAll('[data-node-type="start"]');
      console.log('[DEBUG] Found visual start nodes:', visualStartNodes.length);
      if (visualStartNodes.length > 0) {
        const firstStartNode = visualStartNodes[0] as HTMLElement;
        const nodeId = firstStartNode.dataset.nodeId || firstStartNode.id;
        console.log('[DEBUG] Using visual start node:', nodeId);
        try {
          const nodeType = firstStartNode.dataset.nodeType || 'start';
          const nodeRect = firstStartNode.getBoundingClientRect();
          await window.nodeSystem.createNode(nodeType, nodeId, { flowType: 'flow' }, {
            x: parseInt(firstStartNode.style.left) || 100,
            y: parseInt(firstStartNode.style.top) || 100
          });
          console.log('[DEBUG] Successfully registered visual start node in backend');
        } catch (regError) {
          console.warn('[DEBUG] Failed to register visual start node:', regError);
        }
        return nodeId;
      }
      console.log('[DEBUG] No start nodes found in backend or visual canvas');
      return null;
    } catch (error) {
      console.error('[DEBUG] Failed to find start node:', error);
      return null;
    }
  }

  getCurrentSession(): DebugSession | null {
    return this.currentSession;
  }

  isDebugging(): boolean {
    return this.currentSession?.isRunning || false;
  }
}

export const debugService = new DebugService();
