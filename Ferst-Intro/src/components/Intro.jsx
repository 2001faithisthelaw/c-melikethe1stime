import { useEffect, useRef, useState } from 'react'
import './Intro.css'

/* Intro / captcha de entrada.
   La frase sale de la letra del disco ("es un círculo, no una espiral").
   Se muestra deformada y turbia; hay que escribirla para entrar. */
const ANSWER = 'es un circulo no una espiral'
const LINES  = ['es un círculo,', 'no una espiral']
const OUTRO  = ['es un círculo,', 'no una espiral.']
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const rng = (seed) => { let s = (seed | 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

function drawCaptcha(cv, seed) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'), r = rng(seed)
  const off = document.createElement('canvas'); off.width = W; off.height = H
  const o = off.getContext('2d')
  // fondo sucio, gris azulado
  o.fillStyle = '#c1c2ca'; o.fillRect(0, 0, W, H)
  for (let i = 0; i < 1100; i++) {
    const v = 140 + r() * 90 | 0
    o.fillStyle = `rgba(${v},${v},${v + 8},.4)`
    o.fillRect(r() * W, r() * H, 1 + r() * 2, 1)
  }
  // texto: sombra fantasma desenfocada + trazo oscuro
  o.textBaseline = 'middle'; o.textAlign = 'center'
  o.font = 'italic 700 31px "Times New Roman", Times, serif'
  LINES.forEach((t, i) => {
    const y = 27 + i * 36
    o.save(); o.filter = 'blur(3px)'; o.fillStyle = 'rgba(45,45,80,.5)'
    o.translate(W / 2 + 5, y + 3); o.rotate((r() - .5) * .05); o.fillText(t, 0, 0); o.restore()
    o.save(); o.fillStyle = 'rgba(16,16,30,.72)'
    o.translate(W / 2, y); o.rotate((r() - .5) * .06); o.fillText(t, 0, 0); o.restore()
  })
  // borrones: se come partes de las letras
  for (let i = 0; i < 15; i++) {
    o.fillStyle = `rgba(200,201,209,${.35 + r() * .3})`
    o.beginPath(); o.ellipse(r() * W, r() * H, 5 + r() * 15, 3 + r() * 7, r() * 3, 0, 7); o.fill()
  }
  // línea ondulada que cruza
  o.strokeStyle = 'rgba(30,30,45,.55)'; o.lineWidth = 1.4; o.beginPath()
  for (let x = 0; x <= W; x += 4) {
    const y = H / 2 + Math.sin(x * .035 + seed) * 11
    x ? o.lineTo(x, y) : o.moveTo(x, y)
  }
  o.stroke()
  // desgarro tipo VHS: desplaza filas sueltas
  g.clearRect(0, 0, W, H)
  for (let y = 0; y < H; y++) {
    let dx = Math.sin(y * .13 + seed) * 2
    if (r() < .07) dx += (r() - .5) * 20
    g.drawImage(off, 0, y, W, 1, dx, y, W, 1)
  }
  // scanlines
  g.fillStyle = 'rgba(0,0,0,.07)'
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1)
  g.filter = 'blur(.9px)'; g.drawImage(cv, 0, 0); g.filter = 'none'
}

const pad = (n) => String(n).padStart(2, '0')

export default function Intro({ onDone }) {
  const [phase, setPhase] = useState('captcha')   // captcha | outro | fade
  const [seed, setSeed] = useState(3)
  const [value, setValue] = useState('')
  const [err, setErr] = useState('')
  const [hint, setHint] = useState(false)
  const [shake, setShake] = useState(false)
  const [typed, setTyped] = useState(['', ''])
  const [left, setLeft] = useState(28 * 86400 + 6 * 3600 + 42 * 60 + 12)
  const cv = useRef(null)
  const input = useRef(null)
  const done = useRef(false)

  useEffect(() => { if (cv.current) drawCaptcha(cv.current, seed) }, [seed, phase])
  useEffect(() => { input.current?.focus() }, [])

  // cuenta regresiva (28:06:42:12) — referencia sutil
  useEffect(() => {
    const id = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const finish = () => {
    if (done.current) return
    done.current = true
    setPhase('fade')
    setTimeout(onDone, 900)
  }

  // salida: la frase se escribe sola, después se funde
  useEffect(() => {
    if (phase !== 'outro') return
    let cancelled = false
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    ;(async () => {
      for (let li = 0; li < OUTRO.length; li++) {
        for (let c = 1; c <= OUTRO[li].length; c++) {
          if (cancelled) return
          setTyped(t => t.map((x, i) => (i === li ? OUTRO[li].slice(0, c) : x)))
          await sleep(60)
        }
        await sleep(260)
      }
      await sleep(900)
      if (!cancelled) finish()
    })()
    return () => { cancelled = true }
  }, [phase])

  const submit = (e) => {
    e?.preventDefault()
    if (norm(value) === ANSWER || norm(value).replace(/ /g, '') === ANSWER.replace(/ /g, '')) {
      setErr(''); setPhase('outro'); return
    }
    setErr(value.trim() ? 'eso no es lo que dice.' : 'escribí lo que ves.')
    setShake(false); requestAnimationFrame(() => setShake(true))
    input.current?.select()
  }

  const d = Math.floor(left / 86400), h = Math.floor(left % 86400 / 3600)
  const m = Math.floor(left % 3600 / 60), s = left % 60

  return (
    <div
      className={`intro ${phase === 'fade' ? 'is-fade' : ''}`}
      onClick={phase === 'outro' ? finish : undefined}
      role="dialog" aria-label="verificación"
    >
      <div className="intro-clock" aria-hidden="true">{pad(d)}:{pad(h)}:{pad(m)}:{pad(s)}</div>

      {phase === 'captcha' && (
        <form className={`intro-win ${shake ? 'shake' : ''}`} onSubmit={submit} onAnimationEnd={() => setShake(false)}>
          <div className="intro-bar"><span>verificación — C-Me</span><span className="intro-x">×</span></div>
          <div className="intro-body">
            <p>para entrar tenés que demostrar que no sos un recuerdo.</p>
            <p className="intro-sub">escribí lo que ves, aunque no lo veas bien.</p>
            <canvas ref={cv} className="intro-cap" width="340" height="92" aria-label="texto deformado" />
            <label className="intro-row">
              <span>txt:</span>
              <input
                ref={input} value={value} autoComplete="off" autoCapitalize="off" spellCheck="false"
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <div className="intro-err" role="alert">{err}</div>
            <div className="intro-links">
              <button type="button" className="intro-link" onClick={() => setSeed(v => v + 7)}>no puedo leerlo</button>
              <button type="button" className="intro-link" onClick={() => setHint(true)}>CLICK to remember</button>
            </div>
            {hint && <p className="intro-hint">pista: la letra dice que no es una espiral.</p>}
          </div>
          <div className="intro-foot">
            <button type="submit" className="intro-btn primary">verificar</button>
          </div>
        </form>
      )}

      {phase !== 'captcha' && (
        <div className="intro-out" aria-live="polite">
          <p>{typed[0]}<span className="cur">{typed[1] === '' ? '▍' : ''}</span></p>
          <p>{typed[1]}<span className="cur">{typed[1] !== '' ? '▍' : ''}</span></p>
        </div>
      )}
    </div>
  )
}
