'use strict'
const { send, cors, query, safeEqual } = require('./_lib/common')
const { getStore } = require('./_lib/store')

/* Panel privado. Header: Authorization: Bearer <ADMIN_TOKEN>
   GET  /api/admin?limit=100[&fav=1]  → { counts, comments:[…con fav], favTotal }
   POST /api/admin { id, fav }        → marca / desmarca un comentario como favorito */
module.exports = async (req, res) => {
  if (cors(req, res, { open: false })) return
  const token = process.env.ADMIN_TOKEN
  if (!token) return send(res, 503, { error: 'ADMIN_TOKEN no configurado' })
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!given || !safeEqual(given, token)) return send(res, 401, { error: 'no autorizado' })
  const store = getStore()
  try {
    if (req.method === 'GET') {
      const q = query(req)
      const limit = Math.min(500, Math.max(1, Number(q.limit) || 100))
      const [list, favs, counts, likes] = await Promise.all([
        store.recentComments(limit), store.favSet(), store.hall('comments:count'), store.hall('likes:count'),
      ])
      let comments = list.map((c) => ({ ...c, fav: favs.has(c.id) }))
      if (q.fav) comments = comments.filter((c) => c.fav)
      return send(res, 200, { store: store.kind, counts, likes, favTotal: favs.size, comments })
    }
    if (req.method === 'POST') {
      const { id, fav } = req.body || {}
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || typeof fav !== 'boolean') return send(res, 400, { error: 'datos inválidos' })
      await store.setFav(id, fav)
      return send(res, 200, { ok: true, id, fav })
    }
    send(res, 405, { error: 'método no permitido' })
  } catch (e) {
    send(res, 500, { error: 'error del servidor' })
  }
}
