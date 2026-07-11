# Deploy de Weave en Netlify

## Variables de entorno requeridas

En Netlify Dashboard → Site Settings → Environment Variables:

```
ANTHROPIC_API_KEY=tu_clave_de_anthropic
CLAUDE_MODEL=claude-sonnet-5
```

## Opción A — Drag & Drop (más rápido)

1. `npm run build`
2. Ir a [netlify.com/drop](https://app.netlify.com/drop)
3. Arrastrar la carpeta `/dist`
4. Agregar las variables de entorno en Site Settings
5. Listo — pero las rutas server (`/api/analyze`, `/api/generate`) necesitan la función SSR
   generada en `.netlify/`, que el drag & drop de `/dist` sola NO incluye. Para que el
   "momento mágico" (análisis con Claude) funcione en producción, usá la Opción B.

## Opción B — GitHub (recomendado)

1. Crear un repo en github.com
2. `git remote add origin https://github.com/tu-usuario/weave.git`
3. `git push -u origin main`
4. En netlify.com → **Add new site → Import from Git**
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Agregar `ANTHROPIC_API_KEY` (y opcionalmente `CLAUDE_MODEL`) en Environment Variables
8. Deploy site

Netlify detecta `netlify.toml` y el adapter `@astrojs/netlify` automáticamente: las páginas
(`/`, `/onboarding/*`, `/dashboard`) se sirven estáticas, y `/api/analyze` + `/api/generate`
se despliegan como función serverless (Netlify Functions), generada sola en cada build.

## Verificar el build localmente antes de deployar

```
npm run build
```

Debe generar en `dist/`:
- `index.html`
- `onboarding/` (4 páginas: step-1 a step-4)
- `dashboard/index.html`
- `_astro/` (assets)

Y en `.netlify/v1/functions/ssr` la función que sirve las rutas API — la genera el adapter
automáticamente, no hay que tocarla a mano.
