// assets/loaders/lottie.js
// SCAFFOLD del loader de Lottie (L4). enhance.js lo importa LAZY cuando encuentra
// data-enhance="lottie". Igual patrón que engines/scroll.js y three/scene-loader.js:
// existe para que el import() dinámico del dispatch RESUELVA (build) sin traer todavía
// la dependencia real (lottie-web). Hoy es un no-op documentado → el fallback estático
// (la <img>/poster que renderizó la variant L2) se queda visible.
//
// ── ACTIVACIÓN FUTURA (Wave posterior) ──────────────────────────────────────────────────
//   1) npm i lottie-web
//   2) descomentar el import('lottie-web') de mount()
//   3) crear el player sobre un contenedor, leer data-enhance-src (JSON de la animación),
//      respetar reduced-motion (no autoplay) y devolver un cleanup que destruya la instancia.
//
// Contrato (igual que video.js / scene-loader.js): mount(el, { kind, ctx }) => (() => void)?.
// Sin side effects al importar.

/**
 * Monta (hoy: scaffoldea) una animación Lottie sobre `el`. No-op inerte mientras lottie-web
 * no esté instalado: deja el fallback estático visible y marca el estado observable.
 * @param {Element} el
 * @param {{ kind?: string, ctx?: { tier?: 'high'|'mid'|'low', reducedMotion?: boolean } }} [opts]
 * @returns {() => void} cleanup
 */
export function mount(el, { kind, ctx } = {}) {
  if (typeof document === 'undefined') return () => {};

  // ── Activación real (pendiente de instalar lottie-web). Dejar comentado: ──
  // const src = el.getAttribute('data-enhance-src');
  // if (!src) return () => {};
  // const lottie = (await import('lottie-web')).default;
  // const anim = lottie.loadAnimation({
  //   container: el,
  //   renderer: 'svg',
  //   loop: true,
  //   autoplay: !(ctx && ctx.reducedMotion),
  //   path: src,
  // });
  // return () => { try { anim.destroy(); } catch (e) { /* noop */ } };

  // Scaffold activo: no-op. El fallback estático de la variant se queda visible.
  return () => {};
}
