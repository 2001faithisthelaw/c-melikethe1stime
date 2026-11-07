'use strict'
const crypto = require('node:crypto')
const { send, cors, cleanContact, cleanVisitor, cleanText, clientMeta, scoreComment } = require('./_lib/common')
const { getStore } = require('./_lib/store')

/* POST /api/comments { contact, text }  → { ok, id }
   Se guarda con quién (código anónimo de la conexión + id del navegador) y desde dónde
   (país / región / ciudad aproximados). La respuesta NO devuelve los comentarios de otros:
   la página nunca los carga. Se ven en /admin.html. */
module.exports = async (req, res) => {
  if (cors(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { error: 'método no permitido' })
  const store = getStore()
  try {
    const contact = cleanContact(req.body && req.body.contact)
    const text = cleanText(req.body && req.body.text)
    const visitor = cleanVisitor(req.headers['x-visitor'])
    if (!contact || !text) return send(res, 400, { error: 'datos inválidos' })
    const meta = clientMeta(req)
    if ((await store.incr(`rl:comment:${meta.ipHash}`, 600)) > 8) return send(res, 429, { error: 'demasiados mensajes, esperá un rato' })

    const threshold = Number(process.env.FAV_THRESHOLD) || 70
    const score = scoreComment(text)
    const c = { id: crypto.randomUUID(), t: Date.now(), contact, text, score, auto: score >= threshold, visitor: visitor || null, ...meta }
    await store.addComment(c)
    await store.hincr('comments:count', contact)
    if (c.auto) await store.setFav(c.id, true)
    send(res, 200, { ok: true, id: c.id })
  } catch (e) {
    send(res, 500, { error: 'error del servidor' })
  }
}
