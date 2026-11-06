'use strict'
/* Pruebas de likes, comentarios y panel. Corren con:  node --test tests/ */
const test = require('node:test')
const assert = require('node:assert/strict')
const { resetStore } = require('../api/_lib/store')

const likes = require('../api/likes.js'), comments = require('../api/comments.js'), admin = require('../api/admin.js')
const { scoreComment } = require('../api/_lib/common')

function call(handler, { method = 'GET', url = '/', headers = {}, body, ip = '203.0.113.7' } = {}) {
  return new Promise((resolve) => {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v }, end(d) { resolve({ status: this.statusCode, headers: this.headers, json: d ? JSON.parse(d) : null }) } }
    const req = { method, url, headers: { host: 'x.test', 'x-forwarded-for': ip, 'user-agent': 'TestAgent/1.0', ...headers }, body, socket: {} }
    handler(req, res)
  })
}
const V1 = 'visitor-aaaa-1111', V2 = 'visitor-bbbb-2222'
const geo = { 'x-vercel-ip-country': 'AR', 'x-vercel-ip-country-region': 'C', 'x-vercel-ip-city': 'Buenos%20Aires' }
const GOOD = 'No me contestás, pero igual sigo escribiéndote cosas que nunca voy a mandar.'

test.beforeEach(() => {
  resetStore()
  for (const k of ['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL', 'STORE_RAW_IP', 'FAV_THRESHOLD', 'ALLOWED_ORIGINS']) delete process.env[k]
  process.env.ADMIN_TOKEN = 'secreto'
})

test('likes: cuenta, alterna y no duplica por visitante', async () => {
  let r = await call(likes, { url: '/api/likes?contact=ella', headers: { 'x-visitor': V1 } })
  assert.deepEqual(r.json, { count: 0, liked: false })
  r = await call(likes, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella' } })
  assert.deepEqual(r.json, { count: 1, liked: true })
  r = await call(likes, { method: 'POST', headers: { 'x-visitor': V2 }, body: { contact: 'ella' } })
  assert.equal(r.json.count, 2)
  r = await call(likes, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella' } })   // quita el suyo
  assert.deepEqual(r.json, { count: 1, liked: false })
  r = await call(likes, { url: '/api/likes?all=1' })
  assert.deepEqual(r.json.counts, { ella: 1 })
})

test('likes: rechaza datos inválidos', async () => {
  assert.equal((await call(likes, { url: '/api/likes?contact=a b<script>' })).status, 400)
  assert.equal((await call(likes, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: '' } })).status, 400)
  assert.equal((await call(likes, { method: 'POST', body: { contact: 'ella' } })).status, 400)   // sin visitante
})

test('comentario: se guarda con ubicación y código de conexión, sin IP cruda', async () => {
  const r = await call(comments, { method: 'POST', headers: { 'x-visitor': V1, ...geo }, body: { contact: 'ella', text: GOOD } })
  assert.equal(r.status, 200)
  assert.deepEqual(Object.keys(r.json).sort(), ['id', 'ok'])           // no devuelve comentarios de nadie
  const a = await call(admin, { headers: { authorization: 'Bearer secreto' } })
  const c = a.json.comments[0]
  assert.equal(c.text, GOOD)
  assert.equal(c.country, 'AR'); assert.equal(c.city, 'Buenos Aires')
  assert.match(c.ipHash, /^[0-9a-f]{16}$/)
  assert.equal(c.ip, undefined)
  assert.equal(c.visitor, V1)
  assert.equal(a.json.counts.ella, '1')
})

test('comentario: la IP cruda solo se guarda si se activa STORE_RAW_IP', async () => {
  process.env.STORE_RAW_IP = '1'
  await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: GOOD }, ip: '198.51.100.9' })
  const a = await call(admin, { headers: { authorization: 'Bearer secreto' } })
  assert.equal(a.json.comments[0].ip, '198.51.100.9')
})

test('la misma conexión da el mismo código y otra da uno distinto', async () => {
  await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: GOOD }, ip: '1.1.1.1' })
  await call(comments, { method: 'POST', headers: { 'x-visitor': V2 }, body: { contact: 'ella', text: GOOD }, ip: '1.1.1.1' })
  await call(comments, { method: 'POST', headers: { 'x-visitor': V2 }, body: { contact: 'ella', text: GOOD }, ip: '2.2.2.2' })
  const [c, b, a] = (await call(admin, { headers: { authorization: 'Bearer secreto' } })).json.comments
  assert.equal(a.ipHash, b.ipHash); assert.notEqual(a.ipHash, c.ipHash)
})

test('puntaje: lo bien armado sube, lo basura baja', () => {
  assert.ok(scoreComment(GOOD) >= 70, 'bien armado')
  assert.ok(scoreComment('AAAAAAAAAA!!!!!!') < 30, 'repeticiones y gritos')
  assert.ok(scoreComment('sos un pelotudo de mierda') < 70, 'insultos')
  assert.ok(scoreComment('jaja') < 30, 'muy corto')
  assert.ok(scoreComment('mirá esto https://spam.example/x') < 70, 'links')
})

test('favoritos: los bien armados entran solos, se ven y se pueden marcar a mano', async () => {
  await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: GOOD } })
  await call(comments, { method: 'POST', headers: { 'x-visitor': V2 }, body: { contact: 'ella', text: 'jaja' } })
  let a = await call(admin, { url: '/api/admin?fav=1', headers: { authorization: 'Bearer secreto' } })
  assert.equal(a.json.comments.length, 1); assert.equal(a.json.comments[0].text, GOOD); assert.equal(a.json.comments[0].auto, true)
  const all = (await call(admin, { headers: { authorization: 'Bearer secreto' } })).json.comments
  const short = all.find((c) => c.text === 'jaja')
  const set = await call(admin, { method: 'POST', headers: { authorization: 'Bearer secreto' }, body: { id: short.id, fav: true } })
  assert.equal(set.status, 200)
  a = await call(admin, { url: '/api/admin?fav=1', headers: { authorization: 'Bearer secreto' } })
  assert.equal(a.json.comments.length, 2)
  await call(admin, { method: 'POST', headers: { authorization: 'Bearer secreto' }, body: { id: short.id, fav: false } })
  assert.equal((await call(admin, { url: '/api/admin?fav=1', headers: { authorization: 'Bearer secreto' } })).json.comments.length, 1)
})

test('límite: el mensaje 9 en 10 minutos desde la misma conexión se frena', async () => {
  let last
  for (let i = 0; i < 9; i++) last = await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: `mensaje número ${i} bien escrito, con varias palabras.` } })
  assert.equal(last.status, 429)
})

test('panel: sin token o con token malo no deja ver nada; sin ADMIN_TOKEN queda apagado', async () => {
  await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: GOOD } })
  assert.equal((await call(admin)).status, 401)
  assert.equal((await call(admin, { headers: { authorization: 'Bearer malo' } })).status, 401)
  delete process.env.ADMIN_TOKEN
  assert.equal((await call(admin, { headers: { authorization: 'Bearer secreto' } })).status, 503)
})

test('comentario: validaciones y límite de largo', async () => {
  assert.equal((await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: '   ' } })).status, 400)
  assert.equal((await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'x y', text: 'hola' } })).status, 400)
  assert.equal((await call(comments, { method: 'GET' })).status, 405)
  await call(comments, { method: 'POST', headers: { 'x-visitor': V1 }, body: { contact: 'ella', text: 'a'.repeat(2000) } })
  const c = (await call(admin, { headers: { authorization: 'Bearer secreto' } })).json.comments[0]
  assert.equal(c.text.length, 500)
})

test('CORS: GitHub Pages sí, otros orígenes no', async () => {
  let r = await call(likes, { method: 'OPTIONS', headers: { origin: 'https://2001faithisthelaw.github.io' } })
  assert.equal(r.status, 204); assert.equal(r.headers['access-control-allow-origin'], 'https://2001faithisthelaw.github.io')
  r = await call(likes, { method: 'OPTIONS', headers: { origin: 'https://otro.example' } })
  assert.equal(r.status, 403)
})
