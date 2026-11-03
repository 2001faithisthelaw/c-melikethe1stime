/* Ruta de un archivo de /public respetando el `base` de Vite
   (en GitHub Pages el sitio vive en /nombre-del-repo/). */
export const asset = (p) => import.meta.env.BASE_URL + String(p).replace(/^\//, '')
