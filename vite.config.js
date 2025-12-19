import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sri from 'vite-plugin-sri'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sri({
      algorithms: ['sha384'],
      crossorigin: 'anonymous'
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://octra.network',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
      }
    }
  }
})
