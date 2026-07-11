// astro.config.mjs — L6.
// Config: Astro "static" (default desde Astro 4+; reemplaza al viejo "hybrid" — ya se comporta
// igual: páginas estáticas por default, rutas server bajo demanda con `export const prerender =
// false`, ver src/pages/api/*). Adapter Netlify: esas rutas se despliegan como Netlify Functions.
// Vite por debajo. NO copiamos components/ ni motion/ a src/: viven en la raíz (ya validados en
// L2–L4). Los resolvemos con alias de Vite, así src/pages y src/layouts los importan por nombre
// y el build los bundlea (CSS + el módulo boot, con code-splitting de los loaders lazy).
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import netlify from '@astrojs/netlify';

const root = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  server: { port: 3000 },
  vite: {
    resolve: {
      alias: {
        '@components': root('./components'),
        '@motion': root('./motion'),
        '@assets': root('./assets'),
        '@tokens': root('./tokens'),
      },
    },
  },
});
