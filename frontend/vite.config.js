import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      // Any request the browser makes to /api/* during `npm run dev`
      // will be forwarded to your local backend.
      '/api': 'http://localhost:3000',
    },
  },
})
