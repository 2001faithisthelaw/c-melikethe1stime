/* Likes y mensajes de los visitantes.
   Todo va a /api (Vercel + Upstash). Si no hay servidor (p. ej. GitHub Pages), las
   funciones devuelven null y la interfaz sigue funcionando sin esto.
   VITE_API_BASE permite apuntar a otro dominio, p. ej. https://mi-sitio.vercel.app */
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

/* id anónimo y fijo de este navegador (para no contar dos veces el mismo like) */
export function visitorId() {
  try {
    let id = localStorage.getItem('cme-visitor')
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `v-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
      localStorage.setItem('cme-visitor', id)
    }
    return id
  } catch { return 'anon-' + Math.random().toString(16).slice(2, 12) }
}

async function api(path, { method = 'GET', body } = {}) {
  try {
    const r = await fetch(`${BASE}/api/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Visitor': visitorId() },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

export const getLikes   = (contact) => api(`likes?contact=${encodeURIComponent(contact)}`)
export const toggleLike = (contact) => api('likes', { method: 'POST', body: { contact } })
export const sendComment = (contact, text) => api('comments', { method: 'POST', body: { contact, text } })
