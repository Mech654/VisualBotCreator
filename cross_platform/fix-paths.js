/**
 * Script to fix paths in HTML files for cross-platform compatibility
 * This replaces the functionality that was previously using sed
 */
import fs from 'fs';
import path from 'path';

const htmlFiles = [
  path.join('dist', 'src', 'builder.html'),
  path.join('dist', 'src', 'index.html'),
];

console.log('\n====================');
console.log('Copying HTML files to dist/src...');
console.log('====================\n');

// Process each HTML file
htmlFiles.forEach(htmlFile => {
  console.log(`Processing ${htmlFile}...`);

  try {
    // Read the file content
    let content = fs.readFileSync(htmlFile, 'utf8');

    // Fix paths in the HTML file
    // Replace relative paths with the correct paths for the dist folder
    content = content.replace(/src="\.\/js\//g, 'src="./');
    content = content.replace(/href="\.\/styles\//g, 'href="./');

    // Write the modified content back to the file
    fs.writeFileSync(htmlFile, content, 'utf8');
    console.log(`Successfully updated paths in ${htmlFile}`);
  } catch (error) {
    console.error(`Error processing ${htmlFile}:`, error);
  }
});
