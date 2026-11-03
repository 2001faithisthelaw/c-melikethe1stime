# C-Me — like the 1st time

**[English](#english) · [Español](#español)**

**Live / En vivo:** https://2001faithisthelaw.github.io/c-melikethe1stime/

---

## English

Interactive launch site for **Illuno's** debut album. It simulates an early-2000s desktop where every window orbits the same absence. The main app, **C-Me**, is a fictional webcam service with nine live feeds, each one a phase of the same obsession.

### What's in it

- **Entry dialog.** The site opens with a confirmation box with three buttons that all say NO. Every one of them lets you in.
- **C-Me (home).** A grid of nine "transmissions": eight videos and one refused connection. The videos are graded pale and washed out, with a soft light burst and blur that follow the face frame by frame.
- **MSN chats.** Click a feed and a chat with that character opens. Each has its own conversation, and `@mentions` inside the logs open other chats.
- **donde_estas?** A fake file-search window (a nod to LimeWire). Each file belongs to a character; double-click opens their chat.
- **Deleted voice notes.** A player with the album's tracks.
- **El Anuncio.** A classifieds page.
- **Address bar.** Typing keywords such as `msn`, `busca`, `mp3` or `anuncio` opens the matching window.
- **Blocked user.** Their cam box never loads; it shows text links over blurred photos that change block by block.

Nothing is locked: everything is reachable from the start by following the cross-references between characters and files.

### Stack

React 18 + Vite. No runtime dependencies beyond React. Everything runs client-side.

### Run locally

```bash
cd Ferst-Intro
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # outputs Ferst-Intro/dist
npm run preview    # serves the build
```

### Deploy (GitHub Pages)

The workflow in `.github/workflows/pages.yml` builds and publishes the site on every push to `main`.

1. Merge your branch into `main`.
2. In the repo go to **Settings → Pages** and set **Source** to **GitHub Actions** (one time only).
3. Wait for the **Actions** run to finish. The link is the one at the top of this file.

### Regenerating the videos

The videos in `Ferst-Intro/public/` are processed from the originals in `Ferst-Intro/media-src/` (not served by the site).

```bash
pip install opencv-python-headless numpy   # also needs ffmpeg installed
python3 Ferst-Intro/tools/heavencore.py
```

Grade, face blur and light are tuned inside `tools/heavencore.py`.

### Credits

- **Illuno** ([@1l_uno](https://www.instagram.com/1l_uno/)) — Music
- **Federica Geriboni** ([@faithisthelawfaithunderwill](https://www.instagram.com/faithisthelawfaithunderwill/)) — Creative Direction & Development

Reference: the 2001 *Donnie Darko* website.

---

## Español

Sitio interactivo de lanzamiento del disco debut de **Illuno**. Simula un escritorio de principios de los 2000 donde cada ventana orbita la misma ausencia. La app principal, **C-Me**, es un servicio ficticio de webcams con nueve transmisiones, cada una una fase de la misma obsesión.

### Qué tiene

- **Diálogo de entrada.** El sitio abre con una caja de confirmación con tres botones que dicen NO. Los tres te dejan entrar.
- **C-Me (home).** Una grilla de nueve "transmisiones": ocho videos y una conexión rechazada. Los videos tienen un color pálido y lavado, con un destello de luz y un blur suave que siguen la cara cuadro a cuadro.
- **Chats de MSN.** Al hacer clic en una transmisión se abre el chat con ese personaje. Cada uno tiene su conversación, y las `@menciones` abren otros chats.
- **donde_estas?** Una ventana falsa de búsqueda de archivos (guiño a LimeWire). Cada archivo es de un personaje; con doble clic se abre su chat.
- **Notas de voz eliminadas.** Un reproductor con los temas del disco.
- **El Anuncio.** Una página de clasificados.
- **Barra de direcciones.** Escribir palabras como `msn`, `busca`, `mp3` o `anuncio` abre la ventana correspondiente.
- **Usuario bloqueado.** Su cámara nunca carga: muestra links de texto sobre fotos desenfocadas que cambian de bloque en bloque.

Nada está bloqueado: todo se alcanza desde el principio siguiendo las referencias cruzadas entre personajes y archivos.

### Tecnología

React 18 + Vite. Sin dependencias de runtime aparte de React. Todo corre en el cliente.

### Correr en local

```bash
cd Ferst-Intro
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # genera Ferst-Intro/dist
npm run preview    # sirve el build
```

### Publicar (GitHub Pages)

El workflow de `.github/workflows/pages.yml` arma y publica el sitio en cada push a `main`.

1. Uní tu rama a `main`.
2. En el repo andá a **Settings → Pages** y en **Source** elegí **GitHub Actions** (una sola vez).
3. Esperá a que termine la corrida en **Actions**. El link es el de arriba de este archivo.

### Regenerar los videos

Los videos de `Ferst-Intro/public/` se procesan a partir de los originales de `Ferst-Intro/media-src/` (que el sitio no sirve).

```bash
pip install opencv-python-headless numpy   # también hace falta ffmpeg
python3 Ferst-Intro/tools/heavencore.py
```

El color, el blur de cara y la luz se ajustan dentro de `tools/heavencore.py`.

### Créditos

- **Illuno** ([@1l_uno](https://www.instagram.com/1l_uno/)) — Música
- **Federica Geriboni** ([@faithisthelawfaithunderwill](https://www.instagram.com/faithisthelawfaithunderwill/)) — Dirección creativa y desarrollo

Referencia: el sitio web de *Donnie Darko* (2001).
