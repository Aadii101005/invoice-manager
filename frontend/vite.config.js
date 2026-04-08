import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/_/backend': {
        target: 'http://localhost:5000',
        rewrite: (path) => path.replace(/^\/_\/backend/, ''),
        changeOrigin: true,
      },
    },
  },
})
