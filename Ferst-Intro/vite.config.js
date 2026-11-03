import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages sirve el sitio en /nombre-del-repo/ — se pasa con VITE_BASE
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { port: 5173, open: true }
})
