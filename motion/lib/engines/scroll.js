// motion/lib/engines/scroll.js
// Motor de SCROLL (ejes scroll: parallax/pin/scrollytelling + transitions: smooth).
// ── SCAFFOLD ──────────────────────────────────────────────────────────────
// GSAP/ScrollTrigger/Lenis todavía NO están instalados (decisión: camino liviano primero,
// sin meter deps ni Astro aún). Este módulo existe para que boot.js lo pueda `import()`
// de forma lazy sin romper: hoy es un no-op documentado. Cuando se active (paso L6):
//
//   1) npm i gsap lenis           (requiere bundler: Vite/Astro)
//   2) descomentar los imports dinámicos de abajo (incluye registry.js de L4)
//   3) implementar parallax sobre [data-motion-el="media"] y, si transitions:smooth,
//      inicializar Lenis una sola vez a nivel documento.
//
// ── SEAM L3↔L4 (3D por scroll) ──────────────────────────────────────────────────────────
// Cuando una sección tiene axes.three != 'none' (escena WebGL) Y un eje scroll activo, L3 no
// carga el 3D: eso es L4 (assets/loaders/three/scene-loader.js), que registra la escena viva en
// assets/loaders/three/registry.js. Acá L3 la BUSCA y la maneja:
//   const scene = registry.get(el);
//   if (scene && scene.setProgress) st.onUpdate = ({ progress }) => scene.setProgress(progress);
// Si la escena aún no cargó (registry.get devuelve undefined o scene.ready pendiente), nos
// suscribimos: scene.ready.then(() => reenganchar).catch(() => {}) — el catch cubre el caso
// "Three no instalado / tier no aplica" (ready rechazada) sin romper nada. L4 carga y expone;
// L3 anima. Cero acoplamiento.
//
// Se importa de forma LAZY (dynamic import) → su peso (~35 KB gzip) NO entra en el JS
// inicial salvo que una sección con eje scroll activo exista y el tier lo permita.
// Sin side effects al importar: exporta una función async; no ejecuta nada al cargar.

/**
 * @param {Array<{el: Element, axes: object}>} targets  secciones con eje scroll activo
 * @param {{tier?: string, reducedMotion?: boolean}} [ctx]
 * @returns {Promise<() => void>} cleanup
 */
export async function initScroll(targets, ctx = {}) {
  if (typeof window === 'undefined' || ctx.reducedMotion) return () => {};

  // ── Activación real (pendiente de instalar GSAP). Dejar comentado hasta L6: ──
  // const { gsap } = await import('gsap');
  // const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  // const registry = await import('../../../assets/loaders/three/registry.js'); // seam L4
  // gsap.registerPlugin(ScrollTrigger);
  //
  // const triggers = [];
  // for (const { el, axes } of targets) {
  //   if (axes.scroll === 'parallax') {
  //     const media = el.querySelector('[data-motion-el="media"]');
  //     if (!media) continue;
  //     triggers.push(gsap.to(media, {
  //       yPercent: 12,
  //       ease: 'none',
  //       scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
  //     }).scrollTrigger);
  //   }
  //
  //   // 3D por scroll (seam L4): si la sección tiene escena WebGL, la manejamos por progreso.
  //   if (axes.three && axes.three !== 'none') {
  //     const hook = (scene) => {
  //       if (!scene || typeof scene.setProgress !== 'function') return;
  //       const st = ScrollTrigger.create({
  //         trigger: el, start: 'top bottom', end: 'bottom top', scrub: true,
  //         onUpdate: ({ progress }) => scene.setProgress(progress),
  //       });
  //       triggers.push(st);
  //     };
  //     const scene = registry.get(el);
  //     if (scene) {
  //       hook(scene);
  //       // por si el modelo aún no terminó de cargar, reenganchamos al resolver ready:
  //       if (scene.ready && typeof scene.ready.then === 'function') scene.ready.then(() => hook(registry.get(el))).catch(() => {});
  //     }
  //     // si registry.get(el) es undefined, la escena todavía no se registró: L4 la registra al
  //     // cargar; en la práctica scene-loader corre antes por el gate de visibilidad de enhance.js.
  //   }
  //
  //   // pin / scrollytelling → Wave posterior.
  // }
  //
  // let lenis;
  // if (targets.some(t => t.axes.transitions === 'smooth')) {
  //   const Lenis = (await import('lenis')).default;
  //   lenis = new Lenis();
  //   const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  //   requestAnimationFrame(raf);
  // }
  //
  // return () => { triggers.forEach(t => t && t.kill()); lenis && lenis.destroy(); };

  // Scaffold activo: no-op. El sitio ya funciona sin scroll-motion (el base es JS-off-safe).
  return () => {};
}
