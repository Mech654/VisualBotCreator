#!/usr/bin/env node

/**
 * dev-runner.js - Clean development runner that hides all npm verbosity
 * 
 * This script runs the development environment with minimal console output
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Clear the terminal and show starting message
console.clear();
console.log('⏳ Starting development environment...\n');

// Function to run a command without npm verbosity
async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      ...options,
      stdio: 'pipe',
      env: {
        ...process.env,
        npm_config_loglevel: 'silent',
        npm_config_progress: 'false',
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    // Capture stdout
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      
      // Filter and display important messages
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.includes('Cleaning') || 
            line.includes('Starting') || 
            line.includes('Building') || 
            line.includes('Compiling') ||
            line.includes('Processing') ||
            line.includes('✅') ||
            line.includes('🚀') ||
            line.includes('⚙️') ||
            line.includes('🎨') ||
            line.includes('📦') ||
            line.includes('🌐')) {
          console.log(line);
        }
      }
    });
    
    // Display all error messages
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

// Main execution function
async function main() {
  try {
    // Run clean operation
    console.log('🧹 Cleaning output directory...');
    await runCommand('npm', ['run', 'clean', '--silent'], { cwd: rootDir });
    
    // Run dev setup
    console.log('📂 Setting up development environment...');
    await runCommand('npm', ['run', 'dev-setup', '--silent'], { cwd: rootDir });
    
    // Run the actual development environment with all components
    console.log('🚀 Starting development servers...');
    
    // Start all processes using concurrently with the log filter
    const devProcess = spawn('npm', [
      'run', 
      'dev:actual', 
      '--silent', 
      '--no-progress'
    ], {
      cwd: rootDir,
      env: {
        ...process.env,
        npm_config_loglevel: 'silent',
        npm_config_progress: 'false',
      },
      stdio: 'inherit'  // Use inherit to preserve process signals properly
    });
    
    // Handle process exit
    devProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Development process exited with code ${code}`);
      }
    });

    // Forward termination signals
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        if (devProcess && !devProcess.killed) {
          devProcess.kill(signal);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error starting development environment:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();