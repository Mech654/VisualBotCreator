import { debugService } from '../debugService/debugService.js';

export function initDebugControls(): void {
  const debugButton = document.getElementById('debug-button');
  if (!debugButton) {
    console.warn('[DEBUG] Run button not found in DOM');
    return;
  }

  debugButton.addEventListener('click', handleDebugButtonClick);

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

    const startNodeId = await debugService.findStartNode();
    if (!startNodeId) {
      showDebugError('No Start node found. Please add a Start node to run the bot.');
      return;
    }

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
    debugButton.classList.add('debug-active');
    debugButton.title = 'Running Bot...';
    debugButton.classList.add('debug-disabled');
    await debugService.startDebugSession(startNodeId);
  } catch (error) {
    resetDebugButton();
    removeDebugModeOverlay();
    throw error;
  }
}

function resetDebugButton(): void {
  const debugButton = document.getElementById('debug-button');
  if (!debugButton) return;
  debugButton.classList.remove('debug-active', 'debug-disabled');
  debugButton.title = 'Run Bot';
  console.log('[DEBUG] Run button reset');
}

function addDebugModeOverlay(): void {
  removeDebugModeOverlay();
  const overlay = document.createElement('div');
  overlay.className = 'debug-mode-overlay';
  overlay.id = 'debug-mode-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('active'), 100);
}

function removeDebugModeOverlay(): void {
  const overlay = document.getElementById('debug-mode-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
}

function removeToolDisabling(): void {
}

function showDebugError(message: string): void {
  const notification = document.createElement('div');
  notification.className = 'debug-notification debug-error';
  notification.innerHTML = `
    <div class="debug-notification-content">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
