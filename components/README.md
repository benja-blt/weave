# Components (L2) — convención compartida

Cada componente cumple `foundation/component-contract.md`. Resumen operativo:

## Props (interfaz de instancia)
```ts
interface SectionProps {
  id: string;                 // id de instancia (ej. "hero-1")
  variant: string;            // una variant válida del type (section-vocabulary.json)
  content: object;            // validado por <type>.schema.json
  theme?: string;             // tema activo (solo utilitario; NO se hardcodea con él)
  motion?: ResolvedMotion;    // perfil/ejes ya resueltos por el motor (L3/L6)
  enhancement?: ResolvedEnhancement; // { active, kind, fallbackSrc }
}
```
`index.astro` recibe estas props, elige la partial de `variants/` según `variant`
(con default) y le pasa `content`/`motion`/`enhancement`. La partial solo pinta HTML.

## Estilo
- **Solo** tokens semánticos: `var(--color-*)`, `var(--font-*)`, `var(--space-*)`,
  `var(--radius-*)`, `var(--shadow-*)`, `var(--motion-*)`.
- Cero primitivos crudos, cero colores/tamaños hardcodeados. Cambiar de tema no toca el componente.
- Clases namespaced `plg-<type>__*` para evitar colisiones (CSS global).

## Motion (desacoplado — el componente NO anima)
El componente solo expone puntos de enganche; la capa L3 lee estos atributos y engancha
GSAP/ScrollTrigger/Three según el perfil resuelto. **Nada de importar GSAP/Three acá.**

| atributo | dónde | para qué |
|---|---|---|
| `data-motion="<perfil>"` | raíz de la sección | scope: qué perfil aplica L3 a esta sección |
| `data-motion-el="<rol>"` | elementos internos | qué animar (headline, media, item, logo…) |
| `data-motion-order="<n>"` | elementos internos | orden de stagger |

**Regla dura:** con JS/motion apagados el componente se ve y se usa bien. El estado
inicial oculto (para reveals) lo pone L3 *solo* cuando el JS bootea (ej. `:root.motion-ready`)
y siempre bajo `@media (prefers-reduced-motion: no-preference)`. Nunca se oculta contenido por CSS del componente.

## Media + enhancement
El fallback se renderiza por default. El enhancement pesado (video/3D) reemplaza al
fallback **solo si** `enhancement.active === true` (lo decide el enhancement-resolver por
budget + device-tier). Imágenes con `width`/`height` + `loading="lazy"` (salvo el LCP).

## Variants
Hoy hay **1 variant default por componente**, completa. El prop `variant` ya está cableado
en un registro dentro de cada `index.astro`: sumar una variant = agregar la partial y una
entrada al registro. Sin tocar el resto.
