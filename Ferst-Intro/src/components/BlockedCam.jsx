import { useState } from 'react'

/* Recuadro de cam de usuario_bloqueado: links de texto sobre una foto desenfocada.
   Cada click pasa al siguiente bloque: cambia la foto y el link queda "visitado". */
const BLOCKS = [
  { text: 'we will eventually find each other', lead: true },
  { text: 'CLICK to apologize!' },
  { text: 'CLICK to be saved!' },
  { text: 'CLICK to forgive!' },
  { text: 'CLICK to forget!' },
  { text: 'CLICK to be pure!' },
]
const PHOTOS = [1, 2, 3, 4, 5, 6].map(n => `/blocks/b${n}.jpg`)

export default function BlockedCam() {
  const [idx, setIdx] = useState(0)
  const [seen, setSeen] = useState({})
  const [swap, setSwap] = useState(false)

  const go = () => {
    setSwap(true)
    setTimeout(() => { setIdx(i => (i + 1) % PHOTOS.length); setSwap(false) }, 180)
  }
  const click = (i) => { setSeen(s => ({ ...s, [i]: true })); go() }

  return (
    <div className="bcam">
      <div className={`bcam-photo ${swap ? 'swap' : ''}`} style={{ backgroundImage: `url(${PHOTOS[idx]})` }} />
      <div className="bcam-veil" />
      <div className="bcam-links">
        {BLOCKS.map((b, i) => (
          <button
            key={i}
            type="button"
            className={`bcam-link ${b.lead ? 'lead' : ''} ${seen[i] ? 'seen' : ''}`}
            onClick={() => click(i)}
          >{b.text}</button>
        ))}
      </div>
    </div>
  )
}
