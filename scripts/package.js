const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Package script for Zotero plugin
 * Creates .xpi file from build directory
 */

const buildDir = path.join(__dirname, '..', 'build');
const rootDir = path.join(__dirname, '..');
const packageJson = require(path.join(rootDir, 'package.json'));
const xpiName = `${packageJson.name}.xpi`;
const xpiPath = path.join(rootDir, xpiName);

console.log('📦 Packaging ZoteroPatch AI Reader...');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Remove old .xpi if exists
if (fs.existsSync(xpiPath)) {
  fs.unlinkSync(xpiPath);
  console.log('🗑️  Removed old .xpi file');
}

// Create .xpi (which is just a zip file)
try {
  process.chdir(buildDir);
  execSync(`zip -r "${xpiPath}" .`, { stdio: 'inherit' });
  console.log(`✅ Package created: ${xpiName}`);
} catch (error) {
  console.error('❌ Packaging failed:', error.message);
  process.exit(1);
}
