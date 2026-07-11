// motion/lib/behaviors/navbar-solidify.js
// Resuelve el hook data-navbar-behavior="scroll-solidify" del navbar transparent.
// Togglea `.is-solid` según el scroll (el CSS ya existe: .plg-navbar--transparent.is-solid
// → bg surface + border). Es LEGIBILIDAD, no decoración: corre con JS on sin importar el
// perfil ni el tier. Bajo reduced-motion igual solidifica (la transición de bg ya es sutil
// y la define el CSS del componente, no este script).
// Sin side effects al importar: exporta una función; escucha scroll al llamarla.

const DEFAULT_THRESHOLD = 8; // px de scroll a partir de los cuales se vuelve sólida

/**
 * @param {HTMLElement} nav  el <header> del navbar transparent
 * @param {object} [opts]
 * @returns {() => void} cleanup
 */
export function initNavbarSolidify(nav, opts = {}) {
  if (typeof window === 'undefined' || !nav) return () => {};
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;

  let ticking = false;
  const apply = () => {
    nav.classList.toggle('is-solid', window.scrollY > threshold);
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  };

  apply(); // estado inicial (por si se carga ya scrolleado)
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}
