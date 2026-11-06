import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages sirve el sitio en /nombre-del-repo/ — se pasa con VITE_BASE
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  // /api → servidor local (tools/dev-api.mjs) en desarrollo y en preview
  server: { port: 5173, open: true, proxy: { '/api': 'http://localhost:8787' } },
  preview: { proxy: { '/api': 'http://localhost:8787' } }
})
