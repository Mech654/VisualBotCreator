// This script handles both initial launch and restarts of the Electron app
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean up any stale lock file
const lockFile = path.join(__dirname, '.restart-lock');
try {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
} catch (err) {
  console.error('Failed to remove lock file:', err);
}

// Detect if this is an actual file change or initial launch
const isRestart = process.env.NODEMON_RESTART === 'true';

if (isRestart) {
  console.log('🔄 Backend code changed - Restarting Electron application...');
  
  // For actual restarts, we create a lock file
  fs.writeFileSync(lockFile, Date.now().toString());
} else {
  console.log('🚀 Starting Electron application...');
}

// Start Electron
const electron = spawn('electron', ['.'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Handle Electron exit
electron.on('exit', (code) => {
  console.log(`Electron process exited with code ${code || 0}`);
  
  // Clean up lock file
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch (err) {
    // Ignore if file doesn't exist
  }
});

// Forward signals to the Electron process
process.on('SIGTERM', () => {
  electron.kill('SIGTERM');
});

process.on('SIGINT', () => {
  electron.kill('SIGINT');
});