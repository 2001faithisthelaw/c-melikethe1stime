'use strict'
/* Almacenamiento de likes y comentarios.
   - Con UPSTASH_REDIS_REST_URL/TOKEN (o KV_REST_API_URL/TOKEN, que pone la
     integración de Upstash en Vercel) usa Upstash Redis por REST, sin dependencias.
   - Sin esas variables usa memoria: sirve para desarrollo y pruebas, se borra al reiniciar. */

const MAX_COMMENTS = 5000   // se conservan los últimos N; nada de esto viaja a la página

function memoryStore() {
  const sets = new Map(), hashes = new Map(), counters = new Map()
  let comments = []
  const set = (k) => sets.get(k) || sets.set(k, new Set()).get(k)
  const hash = (k) => hashes.get(k) || hashes.set(k, {}).get(k)
  return {
    kind: 'memory',
    async incr(key, ttl) {
      const now = Date.now(), c = counters.get(key)
      if (!c || c.exp < now) { counters.set(key, { n: 1, exp: now + ttl * 1000 }); return 1 }
      return ++c.n
    },
    async sToggle(key, member) {
      const s = set(key), on = !s.has(member)
      on ? s.add(member) : s.delete(member)
      return { on, count: s.size }
    },
    async sInfo(key, member) { const s = set(key); return { count: s.size, has: s.has(member) } },
    async hset(h, f, v) { hash(h)[f] = String(v) },
    async hincr(h, f) { const o = hash(h); o[f] = String((Number(o[f]) || 0) + 1) },
    async hall(h) { return { ...hash(h) } },
    async addComment(c) { comments.unshift(c); comments = comments.slice(0, MAX_COMMENTS) },
    async recentComments(n) { return comments.slice(0, n) },
    async setFav(id, on) { on ? set('fav').add(id) : set('fav').delete(id) },
    async favSet() { return new Set(set('fav')) },
  }
}

function upstashStore(url, token) {
  const call = async (path, body) => {
    const r = await fetch(url.replace(/\/$/, '') + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(`upstash ${r.status}`)
    return r.json()
  }
  const cmd = async (...args) => (await call('', args)).result
  const pipe = async (list) => (await call('/pipeline', list)).map((x) => x.result)
  return {
    kind: 'upstash',
    async incr(key, ttl) {
      const [n] = await pipe([['INCR', key], ['EXPIRE', key, ttl, 'NX']])
      return n
    },
    async sToggle(key, member) {
      const removed = await cmd('SREM', key, member)
      if (!removed) await cmd('SADD', key, member)
      return { on: !removed, count: await cmd('SCARD', key) }
    },
    async sInfo(key, member) {
      const [count, has] = await pipe([['SCARD', key], ['SISMEMBER', key, member]])
      return { count, has: has === 1 }
    },
    async hset(h, f, v) { await cmd('HSET', h, f, String(v)) },
    async hincr(h, f) { await cmd('HINCRBY', h, f, 1) },
    async hall(h) {
      const flat = (await cmd('HGETALL', h)) || [], o = {}
      for (let i = 0; i < flat.length; i += 2) o[flat[i]] = flat[i + 1]
      return o
    },
    async addComment(c) { await pipe([['LPUSH', 'comments', JSON.stringify(c)], ['LTRIM', 'comments', 0, MAX_COMMENTS - 1]]) },
    async recentComments(n) { return ((await cmd('LRANGE', 'comments', 0, n - 1)) || []).map((s) => JSON.parse(s)) },
    async setFav(id, on) { await cmd(on ? 'SADD' : 'SREM', 'fav', id) },
    async favSet() { return new Set((await cmd('SMEMBERS', 'fav')) || []) },
  }
}

let cached = null
function getStore() {
  if (cached) return cached
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  cached = url && token ? upstashStore(url, token) : memoryStore()
  return cached
}
const resetStore = () => { cached = null }

module.exports = { getStore, resetStore }
