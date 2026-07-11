// motion/lib/boot.js
// Entry point de L3 (la parte DEFERRED). Escanea el DOM por los hooks data-motion,
// resuelve los ejes efectivos por sección y despacha a los motores/behaviors.
//
// Sin side effects al importar: este módulo SOLO exporta `boot`. El layout base lo llama:
//   <script type="module">import { boot } from '/motion/lib/boot.js'; boot();</script>
// El anti-FOUC (`.motion-ready`) NO se toca acá: lo puso el snippet inline del <head>
// (lib/head-inline.js) antes del paint. boot() asume que ya corrió.
//
// Nota de build: los perfiles se importan como JSON con import attributes (`with { type:
// 'json' }`), soportado por Node 20+ y bundlers modernos (Vite/Astro). Son los datos de
// motion/profiles/. Mantenerlos importados acá evita un fetch en runtime.

import { detectTier, prefersReducedMotion } from './device-tier.js';
import { resolveSection } from './resolve.js';
import { initEntrance } from './engines/entrance.js';
import { initHover } from './engines/hover.js';
import { initNavbarSolidify } from './behaviors/navbar-solidify.js';
import { initCarousel } from './behaviors/carousel.js';
import { initEnhancements } from '../../assets/loaders/enhance.js';

import minimal from '../profiles/minimal.json' with { type: 'json' };
import premium from '../profiles/premium.json' with { type: 'json' };

const PROFILES = { minimal, premium };

/**
 * Cablea el motion de la página. Idempotente por elemento (los motores se auto-cuidan).
 * @param {ParentNode} root  raíz a escanear (default: document)
 * @returns {() => void}  cleanup que desmonta todo lo enganchado
 */
export function boot(root = document) {
  if (typeof window === 'undefined') return () => {};

  const ctx = { tier: detectTier(), reducedMotion: prefersReducedMotion() };
  const cleanups = [];

  // 1) Resolución por sección → juntar targets por eje.
  const revealSections = [];
  const scrollTargets = [];
  for (const el of root.querySelectorAll('[data-motion]')) {
    const name = el.getAttribute('data-motion') || 'minimal';
    const axes = resolveSection(name, PROFILES, ctx);

    if (axes.entrance === 'reveal' || axes.entrance === 'dramatic') revealSections.push(el);
    if (axes.scroll !== 'none') scrollTargets.push({ el, axes });
    if (axes.hover === 'rich') cleanups.push(initHover(el));
  }

  // 2) Entrance (motor liviano, sin GSAP): un solo IO para todas las secciones reveal.
  if (revealSections.length) cleanups.push(initEntrance(revealSections, ctx));

  // 3) Behaviors puntuales — usabilidad, NO decoración → corren con JS on sin importar el
  //    perfil ni el tier (pero respetan reduced-motion internamente).
  for (const nav of root.querySelectorAll('[data-navbar-behavior="scroll-solidify"]')) {
    cleanups.push(initNavbarSolidify(nav));
  }
  for (const gal of root.querySelectorAll('.plg-gallery--carousel[data-gallery-controls]')) {
    cleanups.push(initCarousel(gal, ctx));
  }

  // 4) Scroll engine (GSAP+ScrollTrigger+Lenis): LAZY y SOLO si algún perfil lo pide.
  //    scaffold por ahora (sin GSAP instalado). Ver engines/scroll.js.
  if (scrollTargets.length && !ctx.reducedMotion) {
    import('./engines/scroll.js')
      .then((m) => { const c = m.initScroll(scrollTargets, ctx); if (typeof c === 'function') cleanups.push(c); })
      .catch(() => { /* GSAP aún no instalado: el base ya funciona sin scroll motion */ });
  }

  // 5) L4 — Assets pesados (video/3D): escanea data-enhance, gatea por tier+fallback y difiere
  //    la carga fuera del LCP. Comparte el MISMO ctx (tier detectado una sola vez). Ver
  //    assets/loaders/enhance.js. Los loaders pesados se importan lazy allá adentro.
  cleanups.push(initEnhancements(root, ctx));

  return () => { for (const fn of cleanups) { try { fn && fn(); } catch (e) { /* noop */ } } };
}
