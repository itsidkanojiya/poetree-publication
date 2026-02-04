import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': "http://72.62.227.2:4000/"  // Backend runs on port 4000
    }
  },
  resolve: {
    alias: {
      '@components': '/src/components',
      '@assets': '/src/assets',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfWorker: ['@react-pdf-viewer/core'],
        },
      },
    },
  },
})
