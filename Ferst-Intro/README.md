# Ferst-Intro · app / la aplicación

**EN** — The React + Vite app behind *C-Me — like the 1st time*. See the [root README](../README.md) for the project overview, how to explore it and how to publish it.
**ES** — La aplicación React + Vite de *C-Me — like the 1st time*. Mirá el [README de la raíz](../README.md) para la descripción del proyecto, cómo explorarlo y cómo publicarlo.

## Commands · Comandos

```bash
npm install
npm run dev        # dev server · servidor de desarrollo (5173)
npm run build      # production build · build de producción → dist/
npm run preview    # serve the build · servir el build
```

`VITE_BASE=/repo-name/ npm run build` builds for a sub-path such as GitHub Pages. · Arma el build para una subruta como GitHub Pages.

## Structure · Estructura

```
src/
├─ main.jsx            entry; loads the styles in order · entrada; carga los estilos en orden
├─ App.jsx             desktop, floating windows, taskbar, entry dialog · escritorio, ventanas, barra de tareas, diálogo de entrada
├─ asset.js            public-file paths that respect Vite's base · rutas de /public que respetan el base de Vite
├─ theme.css           tokens: colors, fonts, sizes, theme variants · colores, fuentes, tamaños y variantes de tema
├─ styles.css          base layout and taskbar · layout base y barra de tareas
├─ darko.css           softer look of the default theme · look más suave del tema por defecto
├─ components/
│   ├─ Intro.jsx       CONFIRMACIÓN dialog · diálogo de entrada
│   ├─ BlockedCam.jsx  empty-signal box with the hyperlink · recuadro sin señal con el hipervínculo
│   ├─ Slot.jsx        video/image slot (auto-loads data-src) · contenedor de video/imagen
│   ├─ RetroPlayer*.jsx  the voice-note player · el reproductor de notas de voz
│   ├─ WindowFrame.jsx draggable window · ventana arrastrable
│   └─ …               dialogs, source viewer, fake dev tools, theme picker
└─ windows/
    ├─ CUSeeMe.jsx     home: grid of nine feeds · home: grilla de nueve transmisiones
    ├─ MSN.jsx         chats with per-contact logs and @mentions · chats con conversaciones y @menciones
    ├─ LimeWire.jsx    "donde_estas?" file search · búsqueda de archivos
    └─ Classifieds.jsx "El Anuncio"
public/                videos, images, tracks, icons · videos, imágenes, temas e íconos
media-src/             original videos (not served) · videos originales (no se sirven)
tools/heavencore.py    video processing script · script que procesa los videos
```

## Media · Archivos

Each `Slot` loads the file in its `data-src` if it exists in `public/`; otherwise it shows the empty-signal box. · Cada `Slot` carga el archivo de su `data-src` si existe en `public/`; si no, muestra el recuadro sin señal.

## Themes · Temas

The default look lives in `theme.css` + `darko.css`. Other font themes (`mssans`, `dos`, `w95fa`, `terminal`) can be picked from the selector at the bottom right; the choice is stored in `localStorage`. · El look por defecto está en `theme.css` + `darko.css`. Los otros temas de tipografía se eligen desde el selector de abajo a la derecha; la elección se guarda en `localStorage`.
