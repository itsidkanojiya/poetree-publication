import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:4000/api'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiUrl.replace(/\/api\/?$/, '') || apiUrl,
          changeOrigin: true,
          secure: true,
        },
      },
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
  }
})
