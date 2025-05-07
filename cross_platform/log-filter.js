#!/usr/bin/env node

/**
 * log-filter.js - Ultra minimal build process indicator with no repeats
 * This version uses a much simpler approach that won't repeat messages
 */

// Track what messages we've shown to prevent duplicates
const shown = new Set();
let alreadyStarted = false;

// Process each line of input
process.stdin.setEncoding('utf8');
let buffer = '';

// Process input stream
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep any unterminated line in buffer
  
  for (const line of lines) {
    processLine(line.trim());
  }
});

process.stdin.on('end', () => {
  if (buffer) processLine(buffer.trim());
});

// Simplified message detection and display
function processLine(line) {
  if (!line) return;
  
  // Skip npm noise and other verbose output
  if (line.match(/^>\s*visualbotcrafter@\d+\.\d+\.\d+\s/) || 
      line.match(/^npm run/) ||
      line.match(/^={10,}/) ||
      line.includes('Starting compilation') ||
      line.includes('webpack compiled') ||
      line.includes('waiting for changes') ||
      line.includes('webpack built')) {
    return;
  }

  // Show initial message only once
  if (!alreadyStarted && (line.includes('Starting') || line.includes('Cleaning'))) {
    console.log('⏳ Starting development environment...');
    alreadyStarted = true;
  }
  
  // Core status messages to extract and display
  const statusMessages = [
    // Cleaning and setup
    { pattern: /cleaning|rimraf|removing/i, message: '🧹 Cleaning...' },
    { pattern: /copying|copy-assets|shx cp|shx mkdir/i, message: '📂 Copying assets...' },
    
    // Building
    { pattern: /sass|scss|styles|css/i, message: '🎨 Building styles...' },
    { pattern: /html|copy-html|fix-paths/i, message: '📄 Processing HTML...' },
    { pattern: /tsc|typescript|compiling typescript/i, message: '⚙️ Compiling TypeScript...' },
    { pattern: /webpack|bundle|webpack-dev/i, message: '📦 Starting webpack...' },
    { pattern: /webpack-dev-server|localhost|server running/i, message: '🌐 Starting dev server...' },
    { pattern: /preload|building preload/i, message: '🔌 Building preload script...' },
    
    // Completion messages
    { pattern: /tsc.*?found 0 errors/i, message: '✅ TypeScript ready' },
    { pattern: /sass.*?found 0 errors|compilation complete/i, message: '✅ Styles ready' },
    { pattern: /webpack.*?compiled successfully|compiled/i, message: '✅ Webpack ready' },
    { pattern: /successfully updated paths/i, message: '✅ HTML ready' },
    { pattern: /listening on|ready in|http:\/\/localhost/i, message: '✅ Dev server ready' },
  ];
  
  // The motorcycle icon message is handled in the package.json script directly
  
  // Check for status messages
  for (const { pattern, message } of statusMessages) {
    if (pattern.test(line) && !shown.has(message)) {
      console.log(message);
      shown.add(message);
      return;
    }
  }
  
  // Always show errors and warnings
  if ((/error/i.test(line) && !line.includes('Found 0 errors')) || 
      /fail/i.test(line) && !line.includes('typescript')) {
    console.error('❌ ' + line);
    return;
  }
  
  if (/warning/i.test(line) && !line.includes('[webpack]')) {
    console.warn('⚠️ ' + line);
    return;
  }
  
  // Allow motorcycle message to pass through
  if (line.includes('🏍️ Running electron app')) {
    console.log(line);
    return;
  }
}