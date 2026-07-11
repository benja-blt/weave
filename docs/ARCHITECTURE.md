# ARCHITECTURE — Generador de Landing Pages Premium
### Blueprint de sistema (v1). Pensado para escalar años, no para una demo.

Principio rector: **el generador no produce componentes, produce un `page.json` validado que se renderiza.**
Todo lo demás (tokens, componentes, motion, assets) es vocabulario que ese spec consume.

Regla de oro transversal: **nivel Awwwards Y Core Web Vitals verde.** El 3D/video son enhancements
opt-in que deben entrar en el presupuesto de performance y tener fallback. Sin excepción.

---

## STACK RECOMENDADO (decisión de CTO)
- **Astro** — output casi estático, islands architecture, cero JS por default. Hidratás solo las islas 3D/interactivas con `client:visible`. Es la herramienta que hace realista "rápido + interactividad selectiva".
- **Design tokens** — Style Dictionary → genera CSS custom properties + JSON. Una sola fuente de verdad.
- **CSS** — vanilla + custom properties (sin framework de estilos pesado). Layers y container queries.
- **Motion** — GSAP + ScrollTrigger + Lenis (smooth scroll). Cargados solo cuando el perfil los pide.
- **3D** — Three.js dentro de islands Astro, lazy, con device-tier detection y fallback estático.
- **Assets** — pipeline propio: AVIF/WebP, glTF+Draco, Lottie, video con poster+lazy, CDN.

---

## LAS 8 CAPAS (orden de construcción corregido)

### L0 — Foundation (contrato + presupuesto)  ← empieza acá
Lo que faltaba en el roadmap original. Define:
- **Page Schema**: la forma del `page.json` (ver abajo). Es el corazón.
- **Section vocabulary**: enum cerrado de tipos de sección (hero, gallery, menu, services…).
- **Performance budget**: LCP < 2.5s, INP < 200ms, JS inicial < ~150KB, peso de página objetivo. Es una CONSTRAINT, no una sugerencia.
- **Component contract**: interfaz que todo componente debe cumplir.

### L1 — Design Tokens
`tokens/` con Style Dictionary. Primitivos → semánticos → temas.
- Primitivos: paleta cruda, escala tipográfica, escala de espaciado (base 4/8), radios, sombras, breakpoints, grid.
- Semánticos: `--color-bg`, `--color-fg`, `--color-accent`, `--space-section`, `--font-display`… (los componentes SOLO usan estos, nunca primitivos).
- **Temas** (cada uno remapea los semánticos): `luxury, tech, editorial, warm, dark, clean, bold, minimal`.
- Output: `theme-[nombre].css` (variables) + `tokens.json` (para el generador y el reverse-eng).

### L2 — Component Library (con contrato estricto)
Cada componente cumple el **contract**:
- `content` tipado (schema propio) — qué datos necesita.
- `variants` — variaciones de layout (ej. hero: split / centered / fullbleed-video / 3d).
- Estilo **solo vía tokens semánticos** (cero hardcode de color/tamaño).
- **Motion hooks** por `data-motion="..."` — el componente no anima, expone puntos de enganche.
- **Media slots con fallback** obligatorio (video→poster, 3D→imagen).
- Debe renderizar y ser usable **con JS y motion apagados** (a11y + perf + fallback).

Componentes (los 28 tuyos): navbar, hero, cta, gallery, cards, services, pricing, testimonials, faq, contact, footer, maps, forms, reservation, product-showcase, team, timeline, stats, logo-cloud, bento-grid, menu-section, before-after, video-section, 3d-viewer, interactive-showcase, tour-section, featured-projects, case-studies.

### L3 — Motion System (ortogonal + progressive enhancement)
NO 7 perfiles arbitrarios. Definí **ejes**:
- `entrance` (none / fade / reveal / dramatic)
- `scroll` (none / parallax / pin / scrollytelling)
- `three` (none / ambient / product / scene)
- `cursor` (default / custom / magnetic)
- `transitions` (instant / smooth / cinematic)
- `hover` (subtle / rich)
Un **perfil** = una combinación nombrada de esos ejes:
`minimal, premium, immersive, luxury, tech, editorial, cinematic`.
Cada perfil declara además: **cuándo usarlo**, **cuándo NO** (por perf/conversión), y su **costo estimado** (peso JS + riesgo INP).
Progressive enhancement: si el device-tier es bajo o `prefers-reduced-motion`, el perfil degrada a `minimal` automáticamente.

### L4 — Asset Pipeline + Performance Gate
- Imágenes → AVIF/WebP, responsive srcset, lazy, LQIP.
- Video → transcode, poster obligatorio, lazy, `preload=none`, versión mobile liviana.
- 3D → glTF + Draco/Meshopt, texturas KTX2, carga diferida en island.
- Lottie → optimizado, solo si < X KB.
- **Device-tier detection** antes de cargar cualquier escena WebGL: hardware fuerte = full; débil = fallback estático que preserva el lenguaje visual y el CTA.
- **Performance Gate**: build falla si un preset excede el budget. La velocidad es un test, no una intención.

### L5 — Archetype Presets (DATOS, no código)
Cada arquetipo es un JSON declarativo:
```
{
  "id": "A1-hospitality",
  "theme": "warm",              // tema de tokens por default (override por cliente)
  "motionProfile": "premium",
  "sections": [
    { "type": "navbar",       "variant": "transparent" },
    { "type": "hero",         "variant": "fullbleed-video", "motion": "cinematic" },
    { "type": "menu-section", "variant": "editorial" },
    { "type": "gallery",      "variant": "masonry" },
    { "type": "reservation",  "variant": "inline" },
    { "type": "maps" }, { "type": "footer" }
  ]
}
```
Agregar A5 = agregar un archivo. Cero código nuevo.
- **A1 Hospitality**: gastronomía, hoteles, cafés, bares, cabañas, vinotecas, pastelerías. Centro: ambiente + menú + galería + reservas.
- **A2 Servicios con turno**: odonto, clínicas, barberías, gym, estética, wellness, kine. Centro: confianza + servicios + equipo + before/after + turnos + WhatsApp.
- **A3 Marcas y productos**: bodegas, bebidas, café, ropa, perfumería, cosmética, joyería. Centro: producto + historia + proceso + 3D/video.
- **A4 B2B / alto ticket**: SaaS, IA, arquitectura, desarrolladores, constructoras, consultoras. Centro: autoridad + casos + bento + leads. (Fase 2: más difícil de cerrar sin portfolio.)

### L6 — Generator Engine (el motor)
Pipeline:
`1) Intake` (contenido + marca del cliente) →
`2) Resolve preset` (arquetipo elegido + overrides) →
`3) Assemble` page.json (secciones + variantes + motion + tema) →
`4) Validate/Lint` (¿secciones válidas? ¿combinación tema×motion permitida? ¿contenido completo?) →
`5) Enhancement resolver` (decide 3D/video/simple por tabla + budget, ver abajo) →
`6) Render` (Astro compila) →
`7) Perf gate` (Core Web Vitals; si falla, degrada motion/assets y reintenta).

### L7 — Pattern Library + Reverse-Engineering
`patterns/` guarda extracciones **normalizadas** de las webs de referencia, en TU vocabulario.
`web-reverseengineering.md` es el ETL que las produce (ver sección dedicada).

---

## PAGE SCHEMA (el corazón del sistema)
```json
{
  "meta": { "client": "La Martu", "archetype": "A1-hospitality", "locale": "es-AR" },
  "theme": "warm",
  "motionProfile": "premium",
  "budget": { "lcp": 2.5, "inp": 200, "jsKb": 150 },
  "sections": [
    {
      "type": "hero",
      "variant": "fullbleed-video",
      "content": { "headline": "...", "media": { "video": "hero.mp4", "poster": "hero.avif" } },
      "motion": { "override": "cinematic" },
      "enhancement": { "requested": "video", "fallback": "poster" }
    }
  ]
}
```
Todo el sistema lee y escribe esta forma. El generador la produce; el reverse-eng la alimenta; el render la consume.

---

## CÓMO DECIDE (las 3 tablas)

### Elegir componente
El preset del arquetipo define el orden base. El intake puede activar/desactivar secciones según el contenido del cliente (¿tiene menú? → menu-section; ¿tiene equipo? → team). Nunca se inventa una sección que no esté en el vocabulario.

### Elegir motion
`motion = override de sección ?? perfil del arquetipo ?? default del tema`
Degradación automática si: device-tier bajo, `prefers-reduced-motion`, o el perfil rompe el budget.

### Decidir 3D / video / simple (tabla + gate)
| Contenido | Enhancement ideal | Condición para activarlo | Fallback |
|---|---|---|---|
| Producto físico hero (botella, objeto) | 3D viewer rotable | glTF < 2MB **y** device-tier alto **y** entra en budget | Imagen con parallax |
| Lugar/espacio (hotel, resto) | Video fondo / tour | Video < X MB, mobile recibe versión liviana | Poster + galería |
| Marca/proceso (bodega) | Scrollytelling + 3D scene | Solo desktop tier alto | Scroll de imágenes por pasos |
| SaaS/IA | Bento + micro-motion (NO 3D pesado) | Siempre liviano | — |
| Servicio local (barbería) | Micro-interacciones + video corto | Mantener minimal | Estático |
Regla dura: **si el enhancement no entra en el budget o no tiene fallback, NO se usa.** Mobile default = fallback.

---

## ESTRUCTURA DE CARPETAS
```
premium-landing-generator/
├── foundation/
│   ├── page-schema.json          # el contrato
│   ├── section-vocabulary.json   # enum de tipos válidos
│   ├── performance-budget.json
│   └── component-contract.md
├── tokens/                       # Style Dictionary
│   ├── primitives/               # color, type, space, radius, shadow, breakpoints, grid
│   ├── semantic/                 # mapeo semántico
│   ├── themes/                   # luxury, tech, editorial, warm, dark, clean, bold, minimal
│   └── build/                    # output: theme-*.css, tokens.json
├── components/                   # cada uno cumple el contract
│   ├── hero/ (index.astro, variants/, hero.schema.json, hero.css)
│   ├── gallery/  ├── menu-section/  ├── 3d-viewer/  ├── ... (los 28)
├── motion/
│   ├── axes.json                 # entrance, scroll, three, cursor, transitions, hover
│   ├── profiles/                 # minimal.json ... cinematic.json (combinaciones + when/when-not + costo)
│   ├── lib/                      # wrappers GSAP/ScrollTrigger/Lenis
│   └── three/                    # escenas base, loaders, device-tier
├── assets/
│   ├── pipeline/                 # scripts de compresión/transcode
│   ├── loaders/                  # lazy, LQIP, KTX2, Draco
│   └── fallbacks/
├── archetypes/                   # PRESETS declarativos (datos)
│   ├── A1-hospitality.json
│   ├── A2-servicios-turno.json
│   ├── A3-marcas-productos.json
│   └── A4-b2b.json
├── generator/                    # el motor
│   ├── intake.js                 # entra contenido+marca del cliente
│   ├── assemble.js               # arma page.json
│   ├── validate.js               # lint del spec (combinaciones permitidas)
│   ├── enhancement-resolver.js   # decide 3D/video/simple vs budget
│   └── render/                   # integración Astro
├── patterns/                     # extracciones normalizadas de las 45 webs
│   ├── raw/                      # captura original (screenshots/notas)
│   ├── extracted/                # pattern.json por sitio (en TU vocabulario)
│   └── recipes/                  # variantes/motion destilados y reutilizables
├── skills/
│   └── web-reverseengineering.md # el ETL
├── clients/                      # data de cada cliente (contenido + overrides)
│   └── la-martu/page.json
└── dist/                         # sitios generados
```

---

## ARCHIVOS BASE A CREAR PRIMERO (orden)
1. `foundation/page-schema.json` + `section-vocabulary.json` + `performance-budget.json` — el contrato.
2. `foundation/component-contract.md` — reglas que todo componente cumple.
3. `tokens/` completo con 1 tema (empezá por `warm` para La Martu).
4. 5 componentes núcleo: navbar, hero, gallery, cta, footer (los que están en TODOS los arquetipos).
5. `motion/axes.json` + 2 perfiles: `minimal` y `premium`.
6. `archetypes/A1-hospitality.json` — tu primer preset.
7. `generator/assemble.js` + `validate.js` — el mínimo motor que arma y valida un page.json.
→ Con esto generás La Martu de punta a punta y probás el sistema entero en un cliente real antes de escalar.

---

## CÓMO SE ENCHUFA web-reverseengineering.md
Es un **ETL**, no un analizador libre. Contrato de la skill:
- **INPUT**: una web de referencia (idealmente HTML/CSS local o screenshots).
- **PROCESO**: identifica tokens (colores, tipos, espaciados, radios, sombras), mapea cada sección a un `type` del `section-vocabulary.json`, y traduce las técnicas de motion a los **ejes** de `motion/axes.json`.
- **OUTPUT**: `patterns/extracted/[sitio].json` con exactamente la forma:
```json
{
  "source": "onyx-restaurant",
  "archetypeGuess": "A1-hospitality",
  "tokens": { "accent": "#...", "fontDisplay": "...", "spacingBase": 8 },
  "sections": [
    { "type": "hero", "variant": "fullbleed-video", "motionAxes": { "scroll": "pin", "entrance": "dramatic" } }
  ]
}
```
Por qué importa: como escribe en el MISMO esquema que lee el generador, cada patrón extraído puede:
1. sugerir una **variante nueva** de un componente,
2. alimentar una **recipe de motion** reutilizable,
3. ajustar los **defaults de un archetype preset**.
Los patrones nunca son 45 análisis sueltos: son datos normalizados que engordan la librería. Ese es el círculo virtuoso.

---

## SECUENCIA DE CONSTRUCCIÓN (resumen)
L0 contrato → L1 tokens(1 tema) → L2 5 componentes núcleo → L3 2 perfiles motion → L5 preset A1 → L6 motor mínimo → **generar La Martu** → recién ahí escalar componentes, temas, perfiles, A2/A3, y activar el reverse-eng para llenar `patterns/`.
