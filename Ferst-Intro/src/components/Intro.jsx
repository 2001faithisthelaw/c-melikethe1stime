import { useEffect, useRef, useState } from 'react'
import './Intro.css'

/* Intro: diálogo de confirmación. Los tres botones dicen NO y los tres entran. */
const QUESTION = 'Estas seguro de volver a hacer lo mismo otra vez?'

/* calavera pixelada (16x16) — '#' hueso, 'k' negro */
const SKULL = [
  '....########....',
  '..############..',
  '.##############.',
  '.##############.',
  '.###kkk##kkk###.',
  '.##kkkk##kkkk##.',
  '.##kkkk##kkkk##.',
  '.###kkk##kkk###.',
  '..######kk######',
  '..#####kkkk####.',
  '...##########...',
  '...##.#.#.#.##..',
  '...##.#.#.#.##..',
  '....##########..',
]

function Skull() {
  const rects = []
  SKULL.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={c === 'k' ? '#111' : '#f0f0f0'} />)
  }))
  return (
    <svg className="intro-icon" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <g stroke="#111" strokeWidth="2.6" strokeLinecap="square"><line x1="1.5" y1="10.5" x2="14.5" y2="15.2" /><line x1="14.5" y1="10.5" x2="1.5" y2="15.2" /></g>
      <g stroke="#f0f0f0" strokeWidth="1.2" strokeLinecap="square"><line x1="1.5" y1="10.5" x2="14.5" y2="15.2" /><line x1="14.5" y1="10.5" x2="1.5" y2="15.2" /></g>
      {rects}
    </svg>
  )
}

const pad = (n) => String(n).padStart(2, '0')

export default function Intro({ onDone }) {
  const [fade, setFade] = useState(false)
  const [left, setLeft] = useState(28 * 86400 + 6 * 3600 + 42 * 60 + 12)
  const first = useRef(null)
  const done = useRef(false)

  useEffect(() => { first.current?.focus() }, [])

  // cuenta regresiva (28:06:42:12) — referencia sutil
  useEffect(() => {
    const id = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // cualquier NO entra directo a la página
  const enter = () => {
    if (done.current) return
    done.current = true
    setFade(true)
    setTimeout(onDone, 400)
  }

  const d = Math.floor(left / 86400), h = Math.floor(left % 86400 / 3600)
  const m = Math.floor(left % 3600 / 60), s = left % 60

  return (
    <div className={`intro ${fade ? 'is-fade' : ''}`} role="dialog" aria-label="CONFIRMACIÓN">
      <div className="intro-clock" aria-hidden="true">{pad(d)}:{pad(h)}:{pad(m)}:{pad(s)}</div>
      <div className="intro-win">
        <div className="intro-bar"><span>CONFIRMACIÓN</span><span className="intro-x">×</span></div>
        <div className="intro-body">
          <Skull />
          <p>{QUESTION}</p>
        </div>
        <div className="intro-foot">
          {[0, 1, 2].map(i => (
            <button key={i} ref={i === 0 ? first : undefined} type="button" className="intro-btn" onClick={enter}>NO</button>
          ))}
        </div>
      </div>
    </div>
  )
}
