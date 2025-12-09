const fs = require('fs');
const path = require('path');

/**
 * Prepare script for Zotero plugin development
 * Creates necessary directories and checks environment
 */

const dirs = [
  'src',
  'src/panel',
  'src/services',
  'src/prefs',
  'src/types',
  'build',
  'addon',
  'scripts'
];

console.log('🔧 Preparing project directories...');

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('✨ Project preparation complete!');
