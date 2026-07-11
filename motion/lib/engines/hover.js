// motion/lib/engines/hover.js
// Motor de hover RICH (eje hover: rich): micro-interacción "magnetic" en botones/items
// vía pointer. Liviano, sin libs. Solo en dispositivos con hover real (no touch). El hover
// subtle NO pasa por acá: ya vive en el CSS de cada componente.
// Sin side effects al importar: exporta una función; engancha listeners al llamarla.

// Constantes de tuning (JS, no CSS): no son estilos hardcodeados del sistema de tokens,
// son parámetros de interacción del motor.
const MAX_PULL_PX = 6;   // desplazamiento máximo del target hacia el cursor
const STRENGTH = 0.3;    // fracción de la distancia cursor→centro que se aplica

/**
 * @param {ParentNode} scope  raíz de sección a la que aplicar hover rich
 * @param {object} [opts]
 * @returns {() => void} cleanup
 */
export function initHover(scope, opts = {}) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  // Solo punteros finos con hover (mouse/trackpad). En touch no hace nada.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};

  const maxPull = opts.maxPull ?? MAX_PULL_PX;
  const strength = opts.strength ?? STRENGTH;

  const targets = scope.querySelectorAll('[data-motion-el="actions"] a, [data-motion-el="item"]');
  const unbinders = [];

  for (const t of targets) {
    const onMove = (e) => {
      const r = t.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const x = Math.max(-maxPull, Math.min(maxPull, dx * strength));
      const y = Math.max(-maxPull, Math.min(maxPull, dy * strength));
      t.style.transform = `translate(${x}px, ${y}px)`;
    };
    const onLeave = () => { t.style.transform = ''; };

    t.addEventListener('pointermove', onMove);
    t.addEventListener('pointerleave', onLeave);
    unbinders.push(() => {
      t.removeEventListener('pointermove', onMove);
      t.removeEventListener('pointerleave', onLeave);
      t.style.transform = '';
    });
  }

  return () => { for (const u of unbinders) u(); };
}
