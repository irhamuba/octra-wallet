import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          { src: 'manifest.json', dest: '.' },
          { src: 'public/uba-icon.svg', dest: '.' },
          { src: 'public/octra-icon.svg', dest: '.' }
        ]
      })
    ],

    build: {
      outDir: 'dist',
      sourcemap: false,
      emptyOutDir: true,
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'index.html'),
          background: resolve(__dirname, 'src/background/background.js')
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') {
              return 'background.js';
            }
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks: undefined
        }
      }
    },

    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
})
