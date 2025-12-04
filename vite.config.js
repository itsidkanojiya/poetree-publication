import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': "https://poetreebackend.netlify.app"  // Assuming backend runs on port 3000
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
