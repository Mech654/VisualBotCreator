// Restart script with clear status messages
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const isRestart = process.env.NODEMON_RESTART === 'true';
const isDev = process.env.NODE_ENV === 'development';
const args = process.env.ELECTRON_ARGS ? process.env.ELECTRON_ARGS.split(' ') : ['.'];

// Show appropriate status message
if (isRestart) {
  console.log('🔄 Restarting Electron application...');
} else {
  console.log('🚀 Starting Electron application...');
}

// Start Electron process with proper environment
const electronProcess = spawn('electron', args, {
  stdio: 'inherit',
  env: { ...process.env },
});

// Handle process exit
electronProcess.on('exit', code => {
  console.log(`Electron process exited with code ${code || 0}`);
});

// Handle termination signals
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    if (!electronProcess.killed) {
      console.log(`Received ${signal}, shutting down Electron...`);
      electronProcess.kill(signal);
    }
  });
});
