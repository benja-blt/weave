// assets/loaders/lazy-media.js
// Utilidades de carga diferida compartidas por los loaders de L4. El objetivo es UNO:
// nunca preemptar el LCP. Sin side effects al importar; toleran entornos sin las APIs.
//
// La regla de composición que usa enhance.js es: whenVisible → afterLoad → whenIdle → recién
// ahí se importa y monta el asset pesado. Así el enhancement jamás compite con el paint inicial.

const VISIBLE_DEFAULTS = { rootMargin: '200px 0px', threshold: 0.01 };

/**
 * Ejecuta `cb` una sola vez cuando `el` está por entrar al viewport (rootMargin adelanta la
 * carga). Sin IntersectionObserver (browser viejo) → corre de una (no dejamos el enhancement colgado).
 * @param {Element} el
 * @param {() => void} cb
 * @param {{rootMargin?: string, threshold?: number}} [opts]
 * @returns {() => void} cleanup
 */
export function whenVisible(el, cb, opts = {}) {
  if (typeof window === 'undefined' || !el) return () => {};
  if (!('IntersectionObserver' in window)) { cb(); return () => {}; }

  let fired = false;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      fired = true;
      io.disconnect();
      cb();
      break;
    }
  }, {
    rootMargin: opts.rootMargin ?? VISIBLE_DEFAULTS.rootMargin,
    threshold: opts.threshold ?? VISIBLE_DEFAULTS.threshold,
  });
  io.observe(el);
  return () => { if (!fired) io.disconnect(); };
}

/**
 * Ejecuta `cb` en tiempo ocioso (requestIdleCallback), con fallback a setTimeout.
 * @param {() => void} cb
 * @returns {() => void} cleanup
 */
export function whenIdle(cb) {
  if (typeof window === 'undefined') return () => {};
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout: 2000 });
    return () => { if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id); };
  }
  const id = setTimeout(cb, 200);
  return () => clearTimeout(id);
}

/**
 * Ejecuta `cb` una vez que el documento terminó de cargar (evento `load`). Si ya cargó, corre ya.
 * Protege el LCP: los assets above-the-fold esperan a que el paint principal haya ocurrido.
 * @param {() => void} cb
 * @returns {() => void} cleanup
 */
export function afterLoad(cb) {
  if (typeof window === 'undefined') return () => {};
  if (typeof document !== 'undefined' && document.readyState === 'complete') { cb(); return () => {}; }
  const on = () => cb();
  window.addEventListener('load', on, { once: true });
  return () => window.removeEventListener('load', on);
}
