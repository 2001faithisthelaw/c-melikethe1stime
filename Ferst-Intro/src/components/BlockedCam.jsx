import { useState } from 'react'
import { asset } from '../asset'

/* Recuadro "sin señal".
   - Por defecto: un solo link, "we will eventually find each other", sobre una
     foto desenfocada. Cada click pasa al siguiente bloque (cambia la foto).
   - Con `photo`: muestra esa imagen fija con el link encima (cámara de usuario_bloqueado). */
const PHOTOS = [1, 2, 3, 4, 5, 6].map(n => asset(`/blocks/b${n}.jpg`))

export default function BlockedCam({ photo }) {
  const [idx, setIdx] = useState(0)
  const [seen, setSeen] = useState(false)
  const [swap, setSwap] = useState(false)

  const click = () => {
    setSeen(true)
    setSwap(true)
    setTimeout(() => { setIdx(i => (i + 1) % PHOTOS.length); setSwap(false) }, 180)
  }

  if (photo) {
    return (
      <div className="bcam bcam-fixed">
        <img src={photo} alt="f(x)" draggable={false} />
        <button type="button" className={`bcam-link lead bcam-over ${seen ? 'seen' : ''}`} onClick={() => setSeen(true)}>
          we will eventually find each other
        </button>
      </div>
    )
  }

  return (
    <div className="bcam">
      <div className={`bcam-photo ${swap ? 'swap' : ''}`} style={{ backgroundImage: `url(${PHOTOS[idx]})` }} />
      <div className="bcam-veil" />
      <div className="bcam-links">
        <button type="button" className={`bcam-link lead ${seen ? 'seen' : ''}`} onClick={click}>
          we will eventually find each other
        </button>
      </div>
    </div>
  )
}
