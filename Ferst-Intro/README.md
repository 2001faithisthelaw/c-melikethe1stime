# Ferst — Intro

Intro visual para el disco de **Illuno aka Ferst** · dirección **Fé**.

Simulación de un escritorio de fines de los 90 / principios de los 2000 donde
cada ventana orbita la misma ausencia. La aplicación principal se llama
**C-Me — like the 1st time · welcome 2 our memories**: un servicio ficticio de
webcams donde 9 usuarios transmiten, cada uno una fase de la misma obsesión.
Desde ahí se abren, como diálogos flotantes, los chats de MSN, la búsqueda de
donde_estas? (ex-LimeWire), y el visor de El Anuncio (clasificados).

## Stack

- **React 18** + **Vite** — el bundler más rápido para React, HMR instantáneo.
- Zero dependencias runtime más allá de React.
- Fuentes servidas desde CDN (unpkg / cdnfonts / Google Fonts).
- Todo el motor de slots corre 100% en el cliente — nada se sube.

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Build producción

```bash
npm run build      # genera /dist
npm run preview    # sirve el build para probar
```

## Deploy a Vercel

**CLI:**
```bash
npm i -g vercel
vercel        # primera vez: enlaza el proyecto
vercel --prod # deploy definitivo
```

**Git:** push a GitHub → entrás a vercel.com → *New Project* → seleccionás
este repo. Vercel detecta Vite automáticamente (ya está `vercel.json`).

## Estructura

```
src/
├─ main.jsx                  # entry — importa theme.css primero
├─ App.jsx                   # OS: CU-SeeMe fullscreen + ventanas flotantes + taskbar
├─ theme.css                 # ★ TOKENS CENTRALES (colores, fuentes, sizes)
├─ asua.css                  # skin asua (default) + blur de feeds
├─ styles.css                # layout base del escritorio
├─ components/
│   ├─ Slot.jsx              # motor drag&drop / click-to-browse (data-src auto)
│   ├─ WindowFrame.jsx       # wrapper draggable para ventanas flotantes
│   └─ ThemePicker.jsx       # picker de tema (esquina abajo-derecha)
└─ windows/
    ├─ CUSeeMe.jsx           # app principal · grilla de 9 transmisiones
    ├─ MSN.jsx               # chat con logs custom por contacto + @-refs
    ├─ LimeWire.jsx          # "donde_estas?" · búsqueda con opens/refs
    └─ Classifieds.jsx       # "El Anuncio" · clasificados en 3 columnas
```

### Poner videos/imágenes reales

Cada `[data-slot]` acepta:
- **Drag & drop** de un archivo local (video o imagen)
- **Click** para abrir el file picker
- **`data-src="/cam01.mp4"`** — si el archivo existe en `public/`, se carga solo

Los nombres esperados en `public/` (opcional):
- `cam01.mp4` … `cam09.mp4` — feeds de C-me (uno por tile, en el orden que aparecen)
- `msn-cam.mp4` — webcam dentro del chat MSN
- `lw01.mp4` — preview de LimeWire
- `ad-photo-1.jpg`, `ad-photo-2.jpg`, `ad-photo-3.jpg` — fotos de El Anuncio

Si un archivo no existe se muestra el overlay retro "SIN SEÑAL".

## Sistema de diseño

Todo (colores, fuentes, tamaños, bordes, sombras) vive en `src/theme.css`.
Cambiar tipografía en toda la plataforma = editar una línea.

**Default: `asua`** — misma skin que asua-creative (`src/asua.css`): papel sage
`#d7dcd6`, tinta `#031819`, rojo de anillo `#a3161b`, chrome biselado plano,
Chemian para la marca "c-me", Special Elite para títulos y Arial 11px para la UI.
Los feeds de video se muestran desenfocados (blur + scanlines) en todos los temas.

**Temas alternativos** cambiables en vivo desde el picker (`localStorage`
persiste la elección):

- `asua` — Chemian + Special Elite + Arial (default)
- `silkroad` — Georgia italic + Verdana
- `mssans` — todo MS Sans Serif 8×16
- `dos` — todo Perfect DOS VGA 437
- `w95fa` — todo W95FA
- `terminal` — DOS con fósforo verde invertido

Ver `moodboard.html` para la referencia visual completa.

## Créditos

Una obra de **Illuno** (aka Ferst) · dirección **Fé** · 2026.
