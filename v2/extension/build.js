#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');
const isProduction = !isWatch && !process.argv.includes('--dev');

// Build configuration
const config = {
  entryPoints: [join(__dirname, 'content.ts'), join(__dirname, 'background.ts')],
  bundle: true,
  outdir: join(__dirname, 'dist'),
  format: 'iife',
  target: 'chrome90',
  platform: 'browser',
  sourcemap: !isProduction,
  minify: isProduction,
  treeShaking: true,
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
  tsconfig: join(__dirname, 'tsconfig.json'),
  logLevel: 'info',
  drop: isProduction ? ['console', 'debugger'] : [],
  legalComments: 'none',
  keepNames: !isProduction,
};

// Plugin to copy manifest and other assets
const copyAssetsPlugin = {
  name: 'copy-assets',
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length > 0) {
        console.error('❌ Build failed with errors');
        return;
      }

      try {
        // Ensure dist directory exists
        mkdirSync(join(__dirname, 'dist'), { recursive: true });

        // Copy manifest.json
        const manifestSrc = join(__dirname, 'manifest.json');
        const manifestDest = join(__dirname, 'dist/manifest.json');
        copyFileSync(manifestSrc, manifestDest);

        // Update manifest version if needed
        const manifest = JSON.parse(readFileSync(manifestDest, 'utf8'));
        if (isProduction) {
          // Add build timestamp to production builds
          manifest.version_name = `${manifest.version} (${new Date().toISOString().slice(0, 19).replace('T', ' ')})`;
        }
        writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));

        console.log('✅ Assets copied successfully');
      } catch (error) {
        console.error('❌ Failed to copy assets:', error);
      }
    });
  },
};

// Error handling plugin
const errorHandlerPlugin = {
  name: 'error-handler',
  setup(build) {
    build.onEnd(result => {
      const errors = result.errors.length;
      const warnings = result.warnings.length;

      if (errors > 0) {
        console.error(`❌ Build failed with ${errors} error(s)`);
        if (!isWatch) {
          process.exit(1);
        }
      } else if (warnings > 0) {
        console.warn(`⚠️  Build completed with ${warnings} warning(s)`);
        if (isProduction) {
          console.error('❌ Production builds must have zero warnings');
          process.exit(1);
        }
      } else {
        const mode = isProduction ? 'production' : 'development';
        console.log(`✅ Build successful (${mode})`);
      }
    });
  },
};

// Add plugins to config
config.plugins = [copyAssetsPlugin, errorHandlerPlugin];

async function build() {
  try {
    console.log(
      `🔨 Building extension in ${isProduction ? 'production' : 'development'} mode...`
    );

    if (isWatch) {
      console.log('👀 Watching for changes...');
      const context = await esbuild.context(config);
      await context.watch();

      // Keep the process alive
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping watch mode...');
        await context.dispose();
        process.exit(0);
      });
    } else {
      await esbuild.build(config);
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
