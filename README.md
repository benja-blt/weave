# Premium Landing Generator

Generador de landing pages premium (nivel Awwwards) que reutiliza componentes, motion y assets
en vez de plantillas por industria. Objetivo: diseño de altísimo nivel **y** carga rápida.

**Stack:** Astro (islands) · Design tokens propios · GSAP · Three.js
**Núcleo:** el sistema gira alrededor del `page.json` (una landing descrita como datos).

---

## ▶️ Quickstart
Requisito: **Node.js 18+**.

```bash
# 1. generar el CSS de tokens
node tokens/build.js

# 2. ver la preview del tema warm
#    abrí tokens/preview.html en el navegador
```

Eso ya funciona hoy: compila los tokens y muestra el tema warm.

---

## 📁 Estructura
```
premium-landing-generator/
├── foundation/        # L0 — el contrato (page-schema, vocabulario, budget, contract)
├── tokens/            # L1 — design tokens (primitivos → semánticos → temas) + build.js
│   ├── primitives/    #      valores crudos
│   ├── semantic/      #      aliases que usan los componentes
│   ├── themes/        #      warm.json (+ luxury, tech, dark... a futuro)
│   ├── build/         #      CSS generado (auto) + tokens.json
│   ├── build.js       #      compilador sin dependencias
│   └── preview.html   #      preview visual del tema
├── docs/              # ARCHITECTURE.md (el blueprint) + estrategia de nichos
├── components/        # L2 — (próximo) navbar, hero, gallery, cta, footer...
├── motion/            # L3 — (pendiente) perfiles GSAP/Three/scroll
├── assets/            # L4 — (pendiente) pipeline de video/3D/optimización
├── archetypes/        # L5 — (pendiente) presets A1..A4
├── generator/         # L6 — (pendiente) el motor
└── patterns/          # L7 — (pendiente) patrones de las 45 webs (via reverse-engineering)
```

---

## 🗺️ Roadmap (orden de construcción)
- [x] **L0** Contrato (`foundation/`)
- [x] **L1** Tokens + tema warm (`tokens/`)
- [ ] **L2** Componentes núcleo ← próximo
- [ ] **L3** Motion / efectos (GSAP, Three.js, scroll)
- [ ] **L4** Assets pesados (video, 3D, Core Web Vitals)
- [ ] **L5** Presets de arquetipos (A1 Hospitality primero)
- [ ] **L6** Motor generador (assemble → validate → build)
- [ ] **L7** Patrones de las 45 webs (skill `web-reverseengineering.md`)

Ver `docs/ARCHITECTURE.md` para el detalle completo de cada capa, las tablas de decisión
(componente / motion / 3D-vs-video) y cómo se enchufa el reverse-engineering.

---

## 📌 Nota
Las 45 webs de referencia y los efectos **todavía no están** en el proyecto: son L7 y L3,
que vienen más adelante. Primero componentes, después motion, y al final se destilan las
webs *dentro* del sistema como patrones reutilizables.
