'use strict'
const crypto = require('node:crypto')

/* ─── respuesta y CORS ─── */
function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}

function allowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS
  return (env ? env.split(',') : ['https://2001faithisthelaw.github.io']).map((s) => s.trim()).filter(Boolean)
}

/* Devuelve true si ya respondió (preflight o origen no permitido). */
function cors(req, res, { open = true } = {}) {
  const origin = req.headers.origin
  if (origin && open) {
    const host = req.headers.host
    const same = (() => { try { return new URL(origin).host === host } catch { return false } })()
    if (same || allowedOrigins().includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Visitor')
    } else if (req.method === 'OPTIONS') {
      send(res, 403, { error: 'origen no permitido' }); return true
    }
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true }
  return false
}

function query(req) {
  if (req.query) return req.query
  try { return Object.fromEntries(new URL(req.url, 'http://x').searchParams) } catch { return {} }
}

/* ─── validación ─── */
const CONTACT_RE = /^[\w.@?\-áéíóúñÁÉÍÓÚÑ]{1,40}$/
const VISITOR_RE = /^[a-zA-Z0-9-]{8,64}$/
const cleanContact = (v) => (typeof v === 'string' && CONTACT_RE.test(v) ? v : null)
const cleanVisitor = (v) => (typeof v === 'string' && VISITOR_RE.test(v) ? v : null)
function cleanText(v) {
  if (typeof v !== 'string') return null
  const t = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 500)
  return t.length ? t : null
}

/* ─── quién y desde dónde ─── */
function clientMeta(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ip = fwd || String(req.headers['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || ''
  const salt = process.env.IP_SALT || 'cme-default-salt'
  const dec = (v) => { try { return decodeURIComponent(v || '') } catch { return v || '' } }
  const meta = {
    ipHash: crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 16),
    country: dec(req.headers['x-vercel-ip-country']),
    region: dec(req.headers['x-vercel-ip-country-region']),
    city: dec(req.headers['x-vercel-ip-city']),
    ua: String(req.headers['user-agent'] || '').slice(0, 160),
  }
  if (process.env.STORE_RAW_IP === '1') meta.ip = ip   // apagado por defecto
  return meta
}

/* ─── puntaje de "composición" (heurística simple, sin IA) ─── */
const INSULTS = /\b(pelotud[oa]s?|boludo[as]?|forro[as]?|hdp|hijo de puta|puto[as]?|mierda|idiota|imbecil|imbécil|estupid[oa]|fuck|shit|asshole|bitch)\b/i
function scoreComment(text) {
  const t = text.trim(), len = t.length
  const words = t.toLowerCase().split(/\s+/).filter(Boolean)
  const letters = (t.match(/\p{L}/gu) || []).length
  let s = 0
  s += Math.min(35, Math.round((len / 140) * 35))                       // largo razonable
  if (words.length >= 4) s += 15
  if (words.length && new Set(words).size / words.length >= 0.6) s += 10 // no repite
  if (len && letters / len >= 0.7) s += 15                               // mayormente letras
  if (/[.!?…,;:]/.test(t)) s += 10                                       // puntuación
  if (/\p{Ll}/u.test(t) && /^\p{Lu}|[.!?]\s+\p{Lu}/u.test(t)) s += 5     // alguna mayúscula bien puesta
  if (/(.)\1{3,}/u.test(t)) s -= 20                                      // aaaaa, !!!!!
  const up = (t.match(/\p{Lu}/gu) || []).length
  if (letters > 8 && up / letters > 0.7) s -= 15                         // TODO EN MAYÚSCULAS
  if (/https?:\/\/|www\./i.test(t)) s -= 25                              // links
  if (len < 6) s -= 30
  if (INSULTS.test(t)) s -= 20
  return Math.max(0, Math.min(100, s))
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

module.exports = { send, cors, query, cleanContact, cleanVisitor, cleanText, clientMeta, scoreComment, safeEqual }
