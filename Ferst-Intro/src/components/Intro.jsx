import { useEffect, useRef, useState } from 'react'
import './Intro.css'

/* Intro: diálogo de confirmación. Los tres botones dicen NO y los tres entran. */
const QUESTION = 'Estas seguro de volver a hacer lo mismo otra vez?'
const OUTRO = ['es un círculo,', 'no una espiral.']

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
  const [phase, setPhase] = useState('confirm')   // confirm | outro | fade
  const [typed, setTyped] = useState(['', ''])
  const [left, setLeft] = useState(28 * 86400 + 6 * 3600 + 42 * 60 + 12)
  const first = useRef(null)
  const done = useRef(false)

  useEffect(() => { first.current?.focus() }, [])

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

  const d = Math.floor(left / 86400), h = Math.floor(left % 86400 / 3600)
  const m = Math.floor(left % 3600 / 60), s = left % 60

  return (
    <div
      className={`intro ${phase === 'fade' ? 'is-fade' : ''}`}
      onClick={phase === 'outro' ? finish : undefined}
      role="dialog" aria-label="CONFIRMACIÓN"
    >
      <div className="intro-clock" aria-hidden="true">{pad(d)}:{pad(h)}:{pad(m)}:{pad(s)}</div>

      {phase === 'confirm' && (
        <div className="intro-win">
          <div className="intro-bar"><span>CONFIRMACIÓN</span><span className="intro-x">×</span></div>
          <div className="intro-body">
            <Skull />
            <p>{QUESTION}</p>
          </div>
          <div className="intro-foot">
            {[0, 1, 2].map(i => (
              <button key={i} ref={i === 0 ? first : undefined} type="button" className="intro-btn" onClick={() => setPhase('outro')}>NO</button>
            ))}
          </div>
        </div>
      )}

      {phase !== 'confirm' && (
        <div className="intro-out" aria-live="polite">
          <p>{typed[0]}<span className="cur">{typed[1] === '' ? '▍' : ''}</span></p>
          <p>{typed[1]}<span className="cur">{typed[1] !== '' ? '▍' : ''}</span></p>
        </div>
      )}
    </div>
  )
}
