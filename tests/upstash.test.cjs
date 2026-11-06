'use strict'
/* Prueba el adaptador de Upstash contra un servidor falso con el mismo protocolo REST
   (POST / con [CMD, args…] → {result}; POST /pipeline con [[…],[…]] → [{result}]).
   No reemplaza probar con la base real, pero valida formato de pedidos y respuestas. */
const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')

function fakeUpstash(token) {
  const strings = new Map(), sets = new Map(), hashes = new Map(), lists = new Map(), exp = new Map()
  const S = (k) => sets.get(k) || sets.set(k, new Set()).get(k)
  const H = (k) => hashes.get(k) || hashes.set(k, new Map()).get(k)
  const L = (k) => lists.get(k) || lists.set(k, []).get(k)
  const run = ([c, ...a]) => {
    switch (String(c).toUpperCase()) {
      case 'INCR': { const n = (Number(strings.get(a[0])) || 0) + 1; strings.set(a[0], n); return n }
      case 'EXPIRE': { if (a[2] === 'NX' && exp.has(a[0])) return 0; exp.set(a[0], Date.now() + a[1] * 1000); return 1 }
      case 'SADD': { const had = S(a[0]).has(a[1]); S(a[0]).add(a[1]); return had ? 0 : 1 }
      case 'SREM': return S(a[0]).delete(a[1]) ? 1 : 0
      case 'SCARD': return S(a[0]).size
      case 'SISMEMBER': return S(a[0]).has(a[1]) ? 1 : 0
      case 'SMEMBERS': return [...S(a[0])]
      case 'HSET': H(a[0]).set(a[1], String(a[2])); return 1
      case 'HINCRBY': { const n = (Number(H(a[0]).get(a[1])) || 0) + Number(a[2]); H(a[0]).set(a[1], String(n)); return n }
      case 'HGETALL': return [...H(a[0])].flat()
      case 'LPUSH': L(a[0]).unshift(a[1]); return L(a[0]).length
      case 'LTRIM': lists.set(a[0], L(a[0]).slice(Number(a[1]), Number(a[2]) + 1)); return 'OK'
      case 'LRANGE': return L(a[0]).slice(Number(a[1]), a[2] === -1 ? undefined : Number(a[2]) + 1)
      default: throw new Error('comando no soportado: ' + c)
    }
  }
  return http.createServer((req, res) => {
    let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
      if (req.headers.authorization !== `Bearer ${token}`) { res.statusCode = 401; return res.end('{"error":"unauthorized"}') }
      try {
        const body = JSON.parse(b)
        const out = req.url === '/pipeline' ? body.map((c) => ({ result: run(c) })) : { result: run(body) }
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(out))
      } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
    })
  })
}

function call(handler, { method = 'GET', url = '/', headers = {}, body } = {}) {
  return new Promise((resolve) => {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v }, end(d) { resolve({ status: this.statusCode, json: d ? JSON.parse(d) : null }) } }
    handler({ method, url, headers: { host: 'x.test', 'x-forwarded-for': '203.0.113.7', ...headers }, body, socket: {} }, res)
  })
}

test('adaptador de Upstash: likes, comentarios, favoritos y límite de ritmo', async () => {
  const server = fakeUpstash('tok123'); await new Promise((r) => server.listen(0, r))
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${server.address().port}`
  process.env.UPSTASH_REDIS_REST_TOKEN = 'tok123'; process.env.ADMIN_TOKEN = 'secreto'
  require('../api/_lib/store').resetStore()
  const likes = require('../api/likes.js'), comments = require('../api/comments.js'), admin = require('../api/admin.js')
  const A = { authorization: 'Bearer secreto' }, V = { 'x-visitor': 'visitor-aaaa-1111' }
  try {
    let r = await call(likes, { method: 'POST', headers: V, body: { contact: 'ella' } })
    assert.deepEqual(r.json, { count: 1, liked: true })
    r = await call(likes, { url: '/api/likes?contact=ella', headers: V })
    assert.deepEqual(r.json, { count: 1, liked: true })
    r = await call(likes, { method: 'POST', headers: V, body: { contact: 'ella' } })
    assert.deepEqual(r.json, { count: 0, liked: false })
    await call(likes, { method: 'POST', headers: V, body: { contact: 'ella' } })
    assert.deepEqual((await call(likes, { url: '/api/likes?all=1' })).json.counts, { ella: 1 })

    const text = 'No me contestás, pero igual sigo escribiéndote cosas que nunca voy a mandar.'
    r = await call(comments, { method: 'POST', headers: { ...V, 'x-vercel-ip-country': 'AR', 'x-vercel-ip-city': 'Rosario' }, body: { contact: 'ella', text } })
    assert.equal(r.status, 200)
    await call(comments, { method: 'POST', headers: V, body: { contact: 'ella', text: 'jaja' } })
    const a = (await call(admin, { headers: A })).json
    assert.equal(a.store, 'upstash'); assert.equal(a.comments.length, 2); assert.equal(a.counts.ella, '2')
    assert.equal(a.comments[1].city, 'Rosario'); assert.equal(a.comments[1].fav, true)      // el bien armado entró solo
    assert.equal(a.comments[0].fav, false)
    const short = a.comments[0]
    await call(admin, { method: 'POST', headers: A, body: { id: short.id, fav: true } })
    assert.equal((await call(admin, { url: '/api/admin?fav=1', headers: A })).json.comments.length, 2)

    let last; for (let i = 0; i < 8; i++) last = await call(comments, { method: 'POST', headers: V, body: { contact: 'ella', text: `otro mensaje número ${i}, bien escrito.` } })
    assert.equal(last.status, 429)
  } finally { server.close(); delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN; require('../api/_lib/store').resetStore() }
})

test('adaptador de Upstash: con token incorrecto falla sin filtrar datos', async () => {
  const server = fakeUpstash('bueno'); await new Promise((r) => server.listen(0, r))
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${server.address().port}`; process.env.UPSTASH_REDIS_REST_TOKEN = 'malo'
  require('../api/_lib/store').resetStore()
  try {
    const r = await call(require('../api/likes.js'), { url: '/api/likes?contact=ella', headers: { 'x-visitor': 'visitor-aaaa-1111' } })
    assert.equal(r.status, 500); assert.deepEqual(r.json, { error: 'error del servidor' })
  } finally { server.close(); delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN; require('../api/_lib/store').resetStore() }
})
