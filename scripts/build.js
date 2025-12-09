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

      console.log('📦 Manifest and bootstrap copied to build directory');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
