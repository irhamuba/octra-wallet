#!/usr/bin/env node
/**
 * Custom build script for UBA Wallet Chrome Extension
 * 
 * This script builds the extension in two steps:
 * 1. Build popup (normal Vite build with code splitting)
 * 2. Build background worker (standalone bundle with all deps inlined)
 */

import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildExtension() {
    console.log('🚀 Building UBA Wallet Extension...\n');

    // Step 1: Build popup (main UI)
    console.log('📦 Step 1: Building popup...');
    await build({
        configFile: resolve(__dirname, 'vite.config.js'),
        build: {
            rollupOptions: {
                input: {
                    popup: resolve(__dirname, 'index.html')
                }
            }
        }
    });

    // Step 2: Build background worker (standalone)
    console.log('\n📦 Step 2: Building background service worker...');
    await build({
        configFile: false,
        build: {
            outDir: 'dist',
            emptyOutDir: false,
            lib: {
                entry: resolve(__dirname, 'src/background/background.js'),
                name: 'background',
                fileName: () => 'background.js',
                formats: ['es']
            },
            rollupOptions: {
                output: {
                    inlineDynamicImports: true,
                    manualChunks: undefined
                }
            },
            minify: 'terser'
        }
    });

    console.log('\n✅ Build complete! Extension ready in dist/');
}

buildExtension().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
