'use strict'
const { send, cors, query, cleanContact, cleanVisitor, clientMeta } = require('./_lib/common')
const { getStore } = require('./_lib/store')

/* GET  /api/likes?contact=ella   → { count, liked }       (X-Visitor: id anónimo del navegador)
   GET  /api/likes?all=1          → { counts: { contacto: n } }
   POST /api/likes { contact }    → alterna el like → { count, liked } */
module.exports = async (req, res) => {
  if (cors(req, res)) return
  const store = getStore()
  try {
    const visitor = cleanVisitor(req.headers['x-visitor'])
    if (req.method === 'GET') {
      const q = query(req)
      if (q.all) {
        const h = await store.hall('likes:count')
        return send(res, 200, { counts: Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v)])) })
      }
      const contact = cleanContact(q.contact)
      if (!contact) return send(res, 400, { error: 'contact inválido' })
      const { count, has } = await store.sInfo(`likes:${contact}`, visitor || '-')
      return send(res, 200, { count, liked: !!visitor && has })
    }
    if (req.method === 'POST') {
      const contact = cleanContact(req.body && req.body.contact)
      if (!contact) return send(res, 400, { error: 'contact inválido' })
      if (!visitor) return send(res, 400, { error: 'visitante inválido' })
      const { ipHash } = clientMeta(req)
      if ((await store.incr(`rl:like:${ipHash}`, 600)) > 30) return send(res, 429, { error: 'demasiados likes, esperá un rato' })
      const { on, count } = await store.sToggle(`likes:${contact}`, visitor)
      await store.hset('likes:count', contact, count)
      return send(res, 200, { count, liked: on })
    }
    send(res, 405, { error: 'método no permitido' })
  } catch (e) {
    send(res, 500, { error: 'error del servidor' })
  }
}
