import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sri from 'vite-plugin-sri'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      sri({
        algorithms: ['sha384'],
        crossorigin: 'anonymous'
      }),
      // Copy manifest to dist for extension
      viteStaticCopy({
        targets: [
          {
            src: 'manifest.json',
            dest: '.'
          }
        ]
      })
    ],

    build: {
      outDir: 'dist',
      sourcemap: false, // Disable sourcemaps in production for security
      minify: 'terser',
      terserOptions: {
        compress: {
          // SECURITY: Strip all console logs in production
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.debug', 'console.info'] : []
        },
        mangle: {
          // Mangle variable names for obfuscation
          toplevel: true
        },
        format: {
          // Remove comments
          comments: false
        }
      },
      rollupOptions: {
        input: {
          main: './index.html',
          background: './src/background/service-worker.js'
        },
        output: {
          entryFileNames: (chunkInfo) => {
            // Keep service worker path clean
            return chunkInfo.name === 'background'
              ? 'src/background/[name].js'
              : 'assets/[name]-[hash].js';
          }
        }
      }
    },

    server: {
      proxy: {
        '/api': {
          target: 'https://octra.network',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: true,
        }
      }
    },

    // SECURITY: Strict CSP headers for development
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
})
