// motion/lib/engines/entrance.js
// Motor de entrada LIVIANO: IntersectionObserver, sin GSAP. Realiza el eje entrance
// (reveal/fade). No oculta nada por su cuenta: el from-state lo pone motion.css bajo
// `.motion-ready`; este motor solo (a) setea el índice de stagger --motion-i por elemento
// y (b) agrega `.is-in` cuando el elemento entra al viewport (one-shot).
// Sin side effects al importar: exporta una función; el trabajo ocurre al llamarla.

const DEFAULTS = { rootMargin: '0px 0px -10% 0px', threshold: 0.12 };

/**
 * @param {Element[]} sections  raíces de sección con entrance reveal (data-motion="premium")
 * @param {object} [opts]
 * @returns {() => void} cleanup (desconecta el observer)
 */
export function initEntrance(sections, opts = {}) {
  if (typeof window === 'undefined' || !sections || !sections.length) return () => {};

  // Hijos animables (la propia raíz lleva data-motion-el pero queda excluida por ser el
  // ancestro de scope — igual que el selector descendiente de motion.css).
  const els = [];
  for (const s of sections) {
    for (const el of s.querySelectorAll('[data-motion-el]')) {
      const order = el.getAttribute('data-motion-order');
      if (order != null && order !== '') el.style.setProperty('--motion-i', order);
      els.push(el);
    }
  }
  if (!els.length) return () => {};

  // Sin IO (browser viejo): mostramos todo de una (no dejamos contenido oculto).
  if (!('IntersectionObserver' in window)) {
    for (const el of els) el.classList.add('is-in');
    return () => {};
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target); // one-shot: no re-animar
    }
  }, {
    rootMargin: opts.rootMargin ?? DEFAULTS.rootMargin,
    threshold: opts.threshold ?? DEFAULTS.threshold,
  });

  for (const el of els) io.observe(el);
  return () => io.disconnect();
}
