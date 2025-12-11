const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

/**
 * Build script for Zotero plugin
 * Uses esbuild for fast TypeScript compilation
 */

const isWatch = process.argv.includes('--watch');
const isDev = process.argv.includes('--dev') || isWatch;

console.log(`🚀 Building ZoteroPatch AI Reader (${isDev ? 'development' : 'production'} mode)...`);

// Ensure build directory exists
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Build configuration
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'build/index.js',
  platform: 'browser',
  target: ['firefox102'],
  format: 'iife',
  sourcemap: isDev,
  minify: !isDev,
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
  },
  logLevel: 'info',
};

/**
 * Copy directory recursively
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log('👀 Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('✅ Build complete!');

      // Copy manifest and bootstrap to build directory
      fs.copyFileSync(
        path.join(__dirname, '..', 'manifest.json'),
        path.join(buildDir, 'manifest.json')
      );

      if (fs.existsSync(path.join(__dirname, '..', 'bootstrap.js'))) {
        fs.copyFileSync(
          path.join(__dirname, '..', 'bootstrap.js'),
          path.join(buildDir, 'bootstrap.js')
        );
      }

      // Copy chrome.manifest
      if (fs.existsSync(path.join(__dirname, '..', 'chrome.manifest'))) {
        fs.copyFileSync(
          path.join(__dirname, '..', 'chrome.manifest'),
          path.join(buildDir, 'chrome.manifest')
        );
        console.log('📋 chrome.manifest copied');
      }

      // Copy skin directory (icons) to build directory
      const skinDir = path.join(__dirname, '..', 'skin');
      const buildSkinDir = path.join(buildDir, 'skin');
      if (fs.existsSync(skinDir)) {
        if (!fs.existsSync(buildSkinDir)) {
          fs.mkdirSync(buildSkinDir, { recursive: true });
        }
        const skinFiles = fs.readdirSync(skinDir);
        skinFiles.forEach(file => {
          if (file.endsWith('.svg') || file.endsWith('.png')) {
            fs.copyFileSync(
              path.join(skinDir, file),
              path.join(buildSkinDir, file)
            );
          }
        });
        console.log('🎨 Icon files copied to build directory');
      }

      // Copy chrome directory (preferences, content, defaults)
      const chromeDir = path.join(__dirname, '..', 'chrome');
      const buildChromeDir = path.join(buildDir, 'chrome');
      if (fs.existsSync(chromeDir)) {
        copyDirSync(chromeDir, buildChromeDir);
        console.log('📁 Chrome directory copied');
      }

      // Ensure defaults/preferences directory exists in build
      const defaultsDir = path.join(buildChromeDir, 'defaults', 'preferences');
      if (fs.existsSync(defaultsDir)) {
        console.log('📋 Default preferences copied');
      }

      console.log('📦 Manifest and bootstrap copied to build directory');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
