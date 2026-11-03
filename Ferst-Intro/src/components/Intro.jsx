import { useEffect, useRef, useState } from 'react'
import { asset } from '../asset'
import './Intro.css'

/* Intro: diálogo de confirmación. Los tres botones dicen NO y los tres entran. */
const QUESTION = 'Estas seguro de volver a hacer lo mismo otra vez?'

export default function Intro({ onDone }) {
  const [fade, setFade] = useState(false)
  const first = useRef(null)
  const done = useRef(false)

  useEffect(() => { first.current?.focus() }, [])

  // cualquier NO entra directo a la página
  const enter = () => {
    if (done.current) return
    done.current = true
    setFade(true)
    setTimeout(onDone, 400)
  }

  return (
    <div className={`intro ${fade ? 'is-fade' : ''}`} role="dialog" aria-label="CONFIRMACIÓN">
      <div className="intro-win">
        <div className="intro-bar"><span>CONFIRMACIÓN</span><span className="intro-x">×</span></div>
        <div className="intro-body">
          <img className="intro-icon" src={asset('/icons/warn.png')} alt="" draggable={false} />
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
