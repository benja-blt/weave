# Component Contract

Todo componente del generador **debe** cumplir este contrato. Es lo que garantiza que los componentes sean intercambiables, que los temas de tokens funcionen sin tocar el componente, y que el motion sea desacoplado. Un componente que no cumple el contrato no entra al sistema.

> Stack confirmado: **Astro**. Cada componente es un `.astro` (islands solo donde hay 3D/interactividad real).

---

## 1. Estructura de carpeta
Cada componente vive en `components/<type>/` con:

```
components/hero/
├── index.astro          # el componente (recibe props tipadas)
├── hero.schema.json     # valida el `content` de esta sección
├── variants/            # una parcial por variante de layout
│   ├── split.astro
│   ├── fullbleed-video.astro
│   └── 3d-scene.astro
├── hero.css             # estilos, SOLO con tokens semánticos
└── island.ts            # opcional: lógica cliente (3D/interacción) para hidratar
```

El `type` y las `variants` deben coincidir **exactamente** con lo declarado en `foundation/section-vocabulary.json`.

---

## 2. Contenido tipado
- El componente recibe `content` según su `*.schema.json`.
- Los campos requeridos son los `contentRequired` del vocabulary.
- Si falta contenido requerido → el generador NO renderiza la sección (falla el validate, no rompe en runtime).

---

## 3. Estilo: solo tokens semánticos
- **Prohibido** hardcodear color, tamaño de fuente, espaciado, radio o sombra.
- Se usan **únicamente** tokens semánticos vía CSS custom properties: `var(--color-fg)`, `var(--space-section)`, `var(--font-display)`, `var(--radius-md)`, etc.
- Esto es lo que hace que cambiar de tema (`warm` → `luxury`) reestilice todo sin tocar el componente.
- Nada de valores mágicos: si necesitás un valor nuevo, se agrega como token, no en el CSS del componente.

---

## 4. Motion desacoplado (progressive enhancement)
- El componente **no anima**. Renderiza HTML semántico y expone **puntos de enganche** con `data-motion="..."` y `data-motion-el="..."`.
- El sistema de motion (capa L3) lee esos data-attributes y engancha GSAP/ScrollTrigger/Three según el perfil activo.
- **Regla dura:** el componente tiene que verse bien y ser usable **con el JS y el motion apagados**. El motion suma, nunca es requisito para entender o usar la sección.
- `prefers-reduced-motion` → el motion se degrada a `minimal` automáticamente.

---

## 5. Media con fallback obligatorio
- Todo slot de media pesada declara su fallback:
  - `video` → `poster` (imagen) obligatoria.
  - `3d` → imagen del producto/escena obligatoria.
  - `tour` → galería de imágenes obligatoria.
- El fallback se renderiza por default; el enhancement lo reemplaza **solo si** el enhancement-resolver lo aprueba (budget + device-tier).
- Imágenes: `AVIF/WebP`, `srcset` responsive, `loading="lazy"` (salvo el LCP), `width`/`height` para evitar CLS.

---

## 6. Accesibilidad (no negociable)
- HTML semántico (`<header>`, `<nav>`, `<section>`, headings en orden).
- Contraste que pase WCAG con el tema activo (los temas dark exigen chequeo aparte).
- Foco visible, navegación por teclado, `alt` en imágenes, labels en forms.
- Cualquier animación respeta `prefers-reduced-motion`.

---

## 7. Presupuesto de performance
- El componente declara su **costo estimado** (peso aproximado + si dispara enhancement) para que el perf-gate pueda sumar el total de la página.
- Un componente nunca importa GSAP/Three en el bundle inicial: esas libs se cargan por island/lazy solo si el perfil de motion las pide.

---

## 8. Interfaz mínima (resumen de props)
```ts
interface SectionProps {
  id: string;                 // id de instancia
  variant: string;            // una de las variants válidas del type
  content: object;            // validado por <type>.schema.json
  theme: ThemeName;           // tema activo (para clases utilitarias, no para hardcodear)
  motion: ResolvedMotion;     // perfil/ejes ya resueltos por el motor
  enhancement: ResolvedEnhancement; // { active: boolean, kind, fallbackSrc }
}
```

---

## Checklist para aceptar un componente nuevo
- [ ] `type` y `variants` coinciden con `section-vocabulary.json`.
- [ ] Tiene `*.schema.json` que valida su `content`.
- [ ] CSS usa **solo** tokens semánticos.
- [ ] Motion vía `data-motion`, funciona con JS off.
- [ ] Media con fallback declarado.
- [ ] Pasa a11y (semántica, contraste, teclado, reduced-motion).
- [ ] Declara su costo de performance y no infla el bundle inicial.
