#!/usr/bin/env node

/**
 * log-filter.js - Ultra minimal build process indicator with no repeats
 */

// Track what messages we've shown to prevent duplicates
const shown = new Set();
let alreadyStarted = false;
let inSeparatorBlock = false;
let sawDevServers = false;

// Process each line of input
process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    processLine(line);
  }
});

process.stdin.on('end', () => {
  if (buffer) processLine(buffer);
});

function processLine(line) {
  const trimmedLine = line.trim();
  if (!trimmedLine) return;
  
  if (line.match(/^={10,}$/)) {
    inSeparatorBlock = !inSeparatorBlock;
    return;
  }
  
  if (inSeparatorBlock || line.includes('Copying HTML files to dist/src')) {
    return;
  }
  
  if (trimmedLine.match(/^>\s*visualbotcrafter@\d+\.\d+\.\d+\s/) || 
      trimmedLine.match(/^npm run/) ||
      trimmedLine.includes('Starting compilation') ||
      trimmedLine.includes('webpack compiled') ||
      trimmedLine.includes('waiting for changes') ||
      trimmedLine.includes('webpack built')) {
    return;
  }

  if (!alreadyStarted && (trimmedLine.includes('Starting') || trimmedLine.includes('Cleaning'))) {
    console.log('⏳ Starting development environment...');
    alreadyStarted = true;
    return;
  }
  
  if (trimmedLine.includes('Starting development servers')) {
    sawDevServers = true;
    console.log('🚀 Starting development servers...');
    return;
  }
  
  if ((trimmedLine.includes('Processing dist/src/') && trimmedLine.includes('.html')) || 
      trimmedLine.includes('fix-paths') ||
      trimmedLine === '📄 Processing HTML...') {
    
    if (!sawDevServers) {
      return;
    }
    
    if (!shown.has('📄 Processing HTML...')) {
      console.log('📄 Processing HTML...');
      shown.add('📄 Processing HTML...');
    }
    return;
  }
  
  if (trimmedLine.includes('Successfully updated paths') || trimmedLine === '✅ HTML ready') {
    if (!sawDevServers) {
      return;
    }
    
    if (!shown.has('✅ HTML ready')) {
      console.log('✅ HTML ready');
      shown.add('✅ HTML ready');
    }
    return;
  }
  
  if (trimmedLine.includes('[electron]') && trimmedLine.includes('🏍️ Running electron app')) {
    console.log('🏍️ Running electron app');
    return;
  }
  
  const statusMessages = [
    { pattern: /cleaning|rimraf|removing/i, message: '🧹 Cleaning...' },
    { pattern: /copying|copy-assets|shx cp|shx mkdir/i, message: '📂 Copying assets...' },
    { pattern: /sass|scss|styles|css/i, message: '🎨 Building styles...' },
    { pattern: /tsc|typescript|compiling typescript/i, message: '⚙️ Compiling TypeScript...' },
    { pattern: /webpack|bundle|webpack-dev/i, message: '📦 Starting webpack...' },
    { pattern: /webpack-dev-server|localhost|server running/i, message: '🌐 Starting dev server...' },
    { pattern: /preload|building preload/i, message: '🔌 Building preload script...' },
    { pattern: /tsc.*?found 0 errors/i, message: '✅ TypeScript ready' },
    { pattern: /sass.*?found 0 errors|compilation complete/i, message: '✅ Styles ready' },
    { pattern: /webpack.*?compiled successfully|compiled/i, message: '✅ Webpack ready' },
    { pattern: /listening on|ready in|http:\/\/localhost/i, message: '✅ Dev server ready' },
  ];
  
  for (const { pattern, message } of statusMessages) {
    if (pattern.test(trimmedLine) && !shown.has(message)) {
      console.log(message);
      shown.add(message);
      return;
    }
  }
  
  if ((/error/i.test(trimmedLine) && !trimmedLine.includes('Found 0 errors')) || 
      /fail/i.test(trimmedLine) && !trimmedLine.includes('typescript')) {
    console.error('❌ ' + trimmedLine);
    return;
  }
  
  if (/warning/i.test(trimmedLine) && !trimmedLine.includes('[webpack]')) {
    console.warn('⚠️ ' + trimmedLine);
    return;
  }
  
  if (trimmedLine.includes('🏍️ Running electron app')) {
    console.log('🏍️ Running electron app');
    return;
  }
}