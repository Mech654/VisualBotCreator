// Debug service for Visual Bot Creator
// Handles debugging workflow execution with real-time node highlighting

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
  private socket: WebSocket | null = null;
  private currentSession: DebugSession | null = null;
  private readonly DEBUGGER_URL = 'ws://localhost:5000';

  /**
   * Start a debug session
   */
  async startDebugSession(startNodeId: string): Promise<void> {
    try {
      // First, temporarily save the current workflow to database
      const saveResult = await this.saveWorkflowForDebug();
      if (!saveResult.success) {
        throw new Error(`Failed to save workflow: ${saveResult.error}`);
      }

      // Initialize debug session
      this.currentSession = {
        id: `debug_${Date.now()}`,
        startNodeId,
        isRunning: true,
        executionHistory: []
      };

      // Connect to debugger WebSocket
      await this.connectToDebugger();

      // Send start command with the start node ID
      this.sendDebugCommand('start', { startNodeId, botId: saveResult.botId });

      console.log(`[DEBUG] Started debug session for node: ${startNodeId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[DEBUG] Failed to start debug session:', error);
      this.showDebugError(`Failed to start debug session: ${errorMsg}`);
    }
  }

  /**
   * Stop the current debug session
   */
  stopDebugSession(): void {
    if (this.currentSession) {
      this.currentSession.isRunning = false;
      this.sendDebugCommand('stop', {});
      this.clearNodeHighlights();
      this.currentSession = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    console.log('[DEBUG] Debug session stopped');
  }

  /**
   * Connect to the C# debugger WebSocket server
   */
  private connectToDebugger(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.DEBUGGER_URL);

        this.socket.onopen = () => {
          console.log('[DEBUG] Connected to debugger');
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleDebugMessage(event.data);
        };

        this.socket.onerror = (error) => {
          console.error('[DEBUG] WebSocket error:', error);
          reject(new Error('Failed to connect to debugger'));
        };

        this.socket.onclose = () => {
          console.log('[DEBUG] Disconnected from debugger');
          this.stopDebugSession();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle messages from the debugger
   */
  private handleDebugMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log('[DEBUG] Received message:', message);

      switch (message.type) {
        case 'node_start':
          this.handleNodeStart(message.data.nodeId);
          break;
        case 'node_complete':
          this.handleNodeComplete(message.data.nodeId, message.data.result);
          break;
        case 'node_error':
          this.handleNodeError(message.data.nodeId, message.data.error);
          break;
        case 'execution_complete':
          this.handleExecutionComplete();
          break;
        case 'execution_error':
          this.handleExecutionError(message.data.error);
          break;
        case 'execution_stopped':
          this.handleExecutionStopped();
          break;
      }
    } catch (error) {
      console.error('[DEBUG] Failed to parse debug message:', error);
    }
  }

  /**
   * Handle when a node starts executing
   */
  private handleNodeStart(nodeId: string): void {
    if (!this.currentSession) return;

    const execution: NodeExecution = {
      nodeId,
      status: 'executing',
      timestamp: Date.now()
    };

    this.currentSession.executionHistory.push(execution);
    this.currentSession.currentNodeId = nodeId;

    // Highlight the executing node
    this.highlightNode(nodeId, 'executing');
  }

  /**
   * Handle when a node completes execution
   */
  private handleNodeComplete(nodeId: string, result: any): void {
    if (!this.currentSession) return;

    // Find the execution record and update it
    const execution = this.currentSession.executionHistory.find(
      exec => exec.nodeId === nodeId && exec.status === 'executing'
    );

    if (execution) {
      execution.status = 'completed';
      execution.executionTime = Date.now() - execution.timestamp;
      execution.result = result;
    }

    // Update node highlighting
    this.highlightNode(nodeId, 'completed');

    // Clear highlighting after a delay
    setTimeout(() => {
      this.clearNodeHighlight(nodeId);
    }, 2000);
  }

  /**
   * Handle when a node encounters an error
   */
  private handleNodeError(nodeId: string, error: string): void {
    if (!this.currentSession) return;

    // Find the execution record and update it
    const execution = this.currentSession.executionHistory.find(
      exec => exec.nodeId === nodeId && exec.status === 'executing'
    );

    if (execution) {
      execution.status = 'error';
      execution.executionTime = Date.now() - execution.timestamp;
      execution.error = error;
    }

    // Highlight the error node
    this.highlightNode(nodeId, 'error');

    // Show error details
    this.showDebugError(`Node ${nodeId} failed: ${error}`);
  }

  /**
   * Handle when execution completes
   */
  private handleExecutionComplete(): void {
    if (!this.currentSession) return;

    this.currentSession.isRunning = false;
    console.log('[DEBUG] Execution completed');

    // Show completion notification
    this.showDebugNotification('Bot execution completed successfully');

    // Auto-stop session and reset UI
    setTimeout(() => {
      this.stopDebugSession();
      this.resetDebugUI();
    }, 2000);
  }

  /**
   * Handle when execution encounters an error
   */
  private handleExecutionError(error: string): void {
    if (!this.currentSession) return;

    this.currentSession.isRunning = false;
    console.error('[DEBUG] Execution error:', error);

    // Show error notification
    this.showDebugError(`Execution failed: ${error}`);

    // Auto-stop session and reset UI
    setTimeout(() => {
      this.stopDebugSession();
      this.resetDebugUI();
    }, 3000);
  }

  /**
   * Handle when execution is stopped
   */
  private handleExecutionStopped(): void {
    if (!this.currentSession) return;

    this.currentSession.isRunning = false;
    console.log('[DEBUG] Execution stopped');

    // Show stop notification
    this.showDebugNotification('Bot execution stopped');
    
    // Reset UI
    this.resetDebugUI();
  }

  /**
   * Reset the debug UI to normal state
   */
  private resetDebugUI(): void {
    // Remove debug mode overlay
    const overlay = document.getElementById('debug-mode-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }

    // Reset debug button
    const debugButton = document.getElementById('debug-button');
    if (debugButton) {
      debugButton.classList.remove('debug-active', 'debug-disabled');
      debugButton.title = 'Run Bot';
    }
  }

  /**
   * Send a command to the debugger
   */
  private sendDebugCommand(command: string, data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[DEBUG] Cannot send command: WebSocket not connected');
      return;
    }

    const message = {
      command,
      ...data
    };

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Save the current workflow temporarily for debugging
   */
  private async saveWorkflowForDebug(): Promise<{ success: boolean; botId?: string; error?: string }> {
    try {
      // Generate a temporary bot ID for debugging
      const debugBotId = `debug_${Date.now()}`;

      // Get all nodes from the canvas
      const nodes = await window.nodeSystem.getAllNodes();
      if (!nodes || nodes.length === 0) {
        return { success: false, error: 'No nodes to debug' };
      }

      // Save all nodes to the database with the debug bot ID
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

  /**
   * Highlight a node based on its execution state
   */
  private highlightNode(nodeId: string, state: 'executing' | 'completed' | 'error'): void {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!nodeElement) return;

    // Remove existing state classes
    nodeElement.classList.remove('node-executing', 'node-completed', 'node-error');

    // Add new state class
    nodeElement.classList.add(`node-${state}`);

    // Add execution state indicator
    this.updateExecutionStateIndicator(nodeElement, state);

    // Scroll to the node if it's not visible
    this.scrollToNode(nodeElement);
  }

  /**
   * Clear highlighting from a specific node
   */
  private clearNodeHighlight(nodeId: string): void {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!nodeElement) return;

    nodeElement.classList.remove('node-executing', 'node-completed', 'node-error');
    this.removeExecutionStateIndicator(nodeElement);
  }

  /**
   * Clear highlighting from all nodes
   */
  private clearNodeHighlights(): void {
    const allNodes = document.querySelectorAll('.node');
    allNodes.forEach(node => {
      node.classList.remove('node-executing', 'node-completed', 'node-error');
      this.removeExecutionStateIndicator(node as HTMLElement);
    });
  }

  /**
   * Update the execution state indicator for a node
   */
  private updateExecutionStateIndicator(nodeElement: HTMLElement, state: string): void {
    // Remove existing indicator
    const existingIndicator = nodeElement.querySelector('.node-execution-state');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = `node-execution-state state-${state}`;
    nodeElement.appendChild(indicator);
  }

  /**
   * Remove execution state indicator from a node
   */
  private removeExecutionStateIndicator(nodeElement: HTMLElement): void {
    const indicator = nodeElement.querySelector('.node-execution-state');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Scroll to a node if it's not visible
   */
  private scrollToNode(nodeElement: HTMLElement): void {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const nodeRect = nodeElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Check if node is outside visible area
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

  /**
   * Show a debug error notification
   */
  private showDebugError(message: string): void {
    // Create error notification
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

  /**
   * Show a debug success notification
   */
  private showDebugNotification(message: string): void {
    // Create success notification
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

  /**
   * Show a notification
   */
  private showNotification(notification: HTMLElement): void {
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  /**
   * Find the start node in the current workflow
   */
  async findStartNode(): Promise<string | null> {
    try {
      // First, try to find start node in the backend nodeInstances
      const nodes = await window.nodeSystem.getAllNodes();
      console.log('[DEBUG] Checking backend nodeInstances for start nodes:', nodes);
      const startNode = nodes.find(node => node.type === 'start');
      
      if (startNode) {
        // Backend returns nodeId instead of id
        const nodeId = startNode.nodeId || startNode.id;
        console.log('[DEBUG] Found start node in backend:', nodeId);
        return nodeId;
      }

      // Fallback: Check for start nodes in the visual canvas
      console.log('[DEBUG] No start node in backend, checking visual canvas...');
      const visualStartNodes = document.querySelectorAll('[data-node-type="start"]');
      console.log('[DEBUG] Found visual start nodes:', visualStartNodes.length);
      
      if (visualStartNodes.length > 0) {
        const firstStartNode = visualStartNodes[0] as HTMLElement;
        const nodeId = firstStartNode.dataset.nodeId || firstStartNode.id;
        console.log('[DEBUG] Using visual start node:', nodeId);
        
        // Try to register this node in the backend if it's missing
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

  /**
   * Get current debug session
   */
  getCurrentSession(): DebugSession | null {
    return this.currentSession;
  }

  /**
   * Check if debugging is currently active
   */
  isDebugging(): boolean {
    return this.currentSession?.isRunning || false;
  }
}

// Export singleton instance
export const debugService = new DebugService();
