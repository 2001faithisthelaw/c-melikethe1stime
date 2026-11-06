/* Servidor local de la API (usa memoria, o Upstash si hay variables).
   Uso:  node Ferst-Intro/tools/dev-api.mjs   →  http://localhost:8787
   En desarrollo, Vite reenvía /api a este puerto. */
import http from 'node:http'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const routes = {
  '/api/likes': require('../../api/likes.js'),
  '/api/comments': require('../../api/comments.js'),
  '/api/admin': require('../../api/admin.js'),
}
process.env.ADMIN_TOKEN ||= 'dev'   // sólo local

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const handler = routes[url.pathname]
  if (!handler) { res.statusCode = 404; return res.end('{"error":"no existe"}') }
  let raw = ''
  req.on('data', (d) => (raw += d))
  req.on('end', () => {
    req.query = Object.fromEntries(url.searchParams)
    try { req.body = raw ? JSON.parse(raw) : undefined } catch { req.body = undefined }
    handler(req, res)
  })
}).listen(8787, () => console.log('API local en http://localhost:8787 (token del panel: ' + process.env.ADMIN_TOKEN + ')'))
