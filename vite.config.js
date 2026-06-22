import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/captures': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/devices': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/patients': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/reports': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/live_feed': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
