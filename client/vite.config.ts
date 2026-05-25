import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/catalog': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/book': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/clientes': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/webhook': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
