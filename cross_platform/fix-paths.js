/**
 * Script to fix paths in HTML files for cross-platform compatibility
 */
import fs from 'fs';
import path from 'path';

const htmlFiles = [
  path.join('dist', 'src', 'builder.html'),
  path.join('dist', 'src', 'index.html'),
];

// Only show logs if not suppressed by environment variable
const shouldShowLogs = process.env.SUPPRESS_HTML_LOGS !== 'true';

if (shouldShowLogs) {
  console.log('📄 Processing HTML...');
}

// Process each HTML file
htmlFiles.forEach(htmlFile => {
  try {
    let content = fs.readFileSync(htmlFile, 'utf8');
    content = content.replace(/src="\.\/js\//g, 'src="./');
    content = content.replace(/href="\.\/styles\//g, 'href="./');
    fs.writeFileSync(htmlFile, content, 'utf8');
  } catch (error) {
    console.error(`❌ Error processing ${htmlFile}:`, error);
  }
});

if (shouldShowLogs) {
  console.log('✅ HTML ready');
}
