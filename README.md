# Weave — Generador de Landing Pages Premium con IA

Un SaaS que genera landing pages premium en minutos usando IA.

## Características

- **Onboarding de 4 pasos:** nicho + colores + prompt libre, fotos, análisis con Claude Vision, preview real y descarga
- **10 arquetipos visuales:** Cream, Dark Warm, Cinematic 3D, Glassmorphism, Mouse-Reactive, Magazine, Brutalist, Liquid Wave, Newspaper, Spline
- **Librerías premium integradas por arquetipo:** Three.js, Rellax, Lenis, Anime.js, Splitting.js, Vanilla-Tilt, Swiper, GSAP + ScrollTrigger
- **Dashboard de proyectos:** historial de webs generadas (localStorage), descargar/eliminar
- **Deploy Netlify-ready:** rutas estáticas + `/api/*` como función serverless vía `@astrojs/netlify`

## Stack

- **Frontend:** Astro 7 (sin frameworks de UI — JS vanilla en el cliente)
- **Backend:** Node.js + `@anthropic-ai/sdk` (Claude, con Vision para las fotos)
- **Animaciones del output generado:** GSAP + ScrollTrigger (reveals base, todos los arquetipos),
  Three.js (Cinematic 3D), Rellax (Glass + Liquid Wave), Lenis (Glass + Spline), Anime.js (Cream +
  Dark Warm), Splitting.js (Magazine), Vanilla-Tilt (Mouse-Reactive), Swiper (galerías mobile, todos
  los arquetipos)
- **Deploy:** Netlify Functions vía `@astrojs/netlify`

## Setup local

```bash
git clone https://github.com/tu-usuario/weave
cd weave
npm install
echo "ANTHROPIC_API_KEY=tu_clave" > .env
npm run dev
# localhost:3000
```

## Deploy

Ver [DEPLOY.md](./DEPLOY.md) para las instrucciones de Netlify.

## Uso

1. Ir a `localhost:3000` (o la URL de Netlify)
2. Clickear "Empezar gratis"
3. Completar los 4 pasos:
   - **Step 1:** nicho, colores (o dejar que la IA elija), descripción, prompt libre opcional
   - **Step 2:** subir fotos (hasta 10) e Instagram
   - **Step 3:** ver el TOP 3 de patrones recomendados por Claude
   - **Step 4:** preview en vivo (iframe) y descarga del HTML
4. **Dashboard** ("Mis webs"): gestionar el historial de las últimas 10 webs generadas

## Estructura

- Landing: `src/pages/index.astro`
- Onboarding: `src/pages/onboarding/*.astro`
- Dashboard: `src/pages/dashboard.astro`
- Backend: `src/pages/api/analyze.js`, `src/pages/api/generate.js`
- Lógica de negocio: `src/lib/analyzer.js` (Claude + Vision), `src/lib/matcher.js` (scoring contra
  el corpus), `src/lib/generator.js` (arquetipos + librerías premium + HTML autocontenido)
- Data: `src/data/archetypes.json`, `src/data/webs-corpus.json`

## Contribuir

Este es un proyecto de Benja (@valben). PRs bienvenidas.

## Licencia

MIT
