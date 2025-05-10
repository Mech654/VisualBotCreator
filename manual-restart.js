// manual-restart.js - A script to manually restart the Electron application
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Create a trigger file that nodemon will watch
const triggerFile = path.join(process.cwd(), 'dist', '.restart-trigger');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🔄 Manual restart helper is running.');
console.log('Type "rs" and press Enter to restart the application.');
console.log('Press Ctrl+C to exit.\n');

// Listen for user input
rl.on('line', input => {
  if (input.trim().toLowerCase() === 'rs') {
    const timestamp = new Date().toISOString();

    // Update the trigger file to cause nodemon to restart
    fs.writeFileSync(triggerFile, timestamp);

    console.log(`🔄 Restart triggered at ${timestamp}`);
  } else {
    console.log('Type "rs" to restart the application.');
  }
});

// Clean up on exit
rl.on('close', () => {
  console.log('Manual restart helper exited.');
  process.exit(0);
});
