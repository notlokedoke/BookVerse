import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['chrome120', 'firefox120', 'safari17', 'edge120'],
    cssTarget: ['chrome120', 'firefox120', 'safari17', 'edge120'],
    rollupOptions: {
      output: {
        // Split vendor chunks to improve caching and parallel loading
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'http': ['axios'],
          'icons': ['lucide-react'],
        }
      }
    },
    // Warn when a chunk exceeds 400kb gzipped
    chunkSizeWarningLimit: 400,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
