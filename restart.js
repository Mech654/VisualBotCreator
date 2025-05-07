// Improved restart script for Electron app with better error handling
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  isDev: process.env.NODE_ENV === 'development',
  isRestart: process.env.NODEMON_RESTART === 'true',
  electronArgs: process.env.ELECTRON_ARGS ? process.env.ELECTRON_ARGS.split(' ') : ['.'],
  restartDelay: process.env.RESTART_DELAY ? parseInt(process.env.RESTART_DELAY) : 0
};

// Prepare restart - with optional delay
async function startElectron() {
  // Optional delay for restart (useful if other processes need to finish)
  if (CONFIG.isRestart && CONFIG.restartDelay > 0) {
    console.log(`🕒 Waiting ${CONFIG.restartDelay}ms before restart...`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.restartDelay));
  }

  // Log appropriate message
  if (CONFIG.isRestart) {
    console.log('🔄 Restarting Electron application...');
  } else {
    console.log('🚀 Starting Electron application...');
  }

  // Start Electron process with proper environment
  const electronProcess = spawn('electron', CONFIG.electronArgs, {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      // Ensure we pass development state to the app
      NODE_ENV: CONFIG.isDev ? 'development' : 'production',
      // Pass restart status to the main process if needed
      APP_IS_RESTART: CONFIG.isRestart ? 'true' : 'false'
    }
  });

  // Handle process exit
  electronProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`⚠️ Electron process exited with code ${code || 0}`);
    } else {
      console.log(`✅ Electron process exited with code ${code || 0}`);
    }
    
    if (CONFIG.isDev) {
      // In development, report memory usage
      const memoryUsage = process.memoryUsage();
      console.log(`📊 Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
    }
  });

  // Handle errors
  electronProcess.on('error', (err) => {
    console.error('❌ Failed to start Electron process:', err);
    process.exit(1);
  });

  return electronProcess;
}

// Handle process signals
function setupSignalHandlers(electronProcess) {
  // Forward termination signals to Electron
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      if (electronProcess && !electronProcess.killed) {
        console.log(`Received ${signal}, terminating Electron...`);
        electronProcess.kill(signal);
      }
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception in restart process:', err);
    if (electronProcess && !electronProcess.killed) {
      electronProcess.kill('SIGTERM');
    }
    process.exit(1);
  });
}

// Main execution
async function main() {
  try {
    const electronProcess = await startElectron();
    setupSignalHandlers(electronProcess);
  } catch (err) {
    console.error('❌ Failed to execute restart process:', err);
    process.exit(1);
  }
}

main();