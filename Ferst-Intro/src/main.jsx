import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './theme.css'   /* tokens + font-face + variantes de tema */
import './styles.css'  /* layout base (usa los tokens) */
import './darko.css'   /* retoque sutil — se carga último */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
