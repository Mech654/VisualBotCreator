// Debug initialization for Visual Bot Creator Builder
// Integrates the debug service with the builder UI

import { debugService } from '../debugService/debugService.js';

export function initDebugControls(): void {
  const debugButton = document.getElementById('debug-button');
  if (!debugButton) {
    console.warn('[DEBUG] Run button not found in DOM');
    return;
  }

  debugButton.addEventListener('click', handleDebugButtonClick);

  // Add keyboard shortcut for running bot (F5)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5') {
      e.preventDefault();
      handleDebugButtonClick();
    }
  });

  console.log('[DEBUG] Run controls initialized');
}

async function handleDebugButtonClick(): Promise<void> {
  try {
    if (debugService.isDebugging()) {
      showDebugError('Bot is already running. Please wait for it to complete.');
      return;
    }

    // Find the start node
    const startNodeId = await debugService.findStartNode();
    if (!startNodeId) {
      showDebugError('No Start node found. Please add a Start node to run the bot.');
      return;
    }

    // Start running the bot
    await startDebugging(startNodeId);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[DEBUG] Error running bot:', error);
    showDebugError(`Failed to run bot: ${errorMsg}`);
  }
}

async function startDebugging(startNodeId: string): Promise<void> {
  const debugButton = document.getElementById('debug-button');
  if (!debugButton) return;

  try {
    // Update UI to show running state
    debugButton.classList.add('debug-active');
    debugButton.title = 'Running Bot...';

    // Add debug mode overlay
    addDebugModeOverlay();

    // Temporarily disable the button during execution
    debugButton.classList.add('debug-disabled');

    // Start the debug session
    await debugService.startDebugSession(startNodeId);

    console.log('[DEBUG] Bot execution started successfully');

  } catch (error) {
    // Reset UI on error
    resetDebugButton();
    removeDebugModeOverlay();
    throw error;
  }
}

function resetDebugButton(): void {
  const debugButton = document.getElementById('debug-button');
  if (!debugButton) return;

  // Reset button to normal state
  debugButton.classList.remove('debug-active', 'debug-disabled');
  debugButton.title = 'Run Bot';

  console.log('[DEBUG] Run button reset');
}

function addDebugModeOverlay(): void {
  // Remove existing overlay if present
  removeDebugModeOverlay();

  const overlay = document.createElement('div');
  overlay.className = 'debug-mode-overlay';
  overlay.id = 'debug-mode-overlay';
  document.body.appendChild(overlay);

  // Activate after a small delay for animation
  setTimeout(() => overlay.classList.add('active'), 100);
}

function removeDebugModeOverlay(): void {
  const overlay = document.getElementById('debug-mode-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
}

// Remove the old functions that are no longer needed
function removeToolDisabling(): void {
  // We don't disable tools anymore, just show visual feedback
}

function showDebugError(message: string): void {
  // Create error notification
  const notification = document.createElement('div');
  notification.className = 'debug-notification debug-error';
  notification.innerHTML = `
    <div class="debug-notification-content">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add('show'), 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
