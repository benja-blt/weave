// motion/lib/device-tier.js
// Detección de device-tier (high/mid/low) alineada con foundation/performance-budget.json.
// ES module: sin side effects al importar. Las funciones leen navigator/matchMedia SOLO
// cuando se las llama, y toleran entornos sin esas APIs (SSR/Node → devuelven defaults seguros).

/** @typedef {'high'|'mid'|'low'} Tier */

/** ¿El usuario pidió menos movimiento? (o no hay matchMedia → false). */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** ¿Está en modo ahorro de datos? */
export function saveData() {
  if (typeof navigator === 'undefined') return false;
  const c = navigator.connection;
  return !!(c && c.saveData);
}

/**
 * Clasifica el device en un tier. Heurística barata (sin libs) sobre las señales que el
 * browser expone. Conservadora: ante la duda, baja de tier (mejor perder show que romper INP).
 * @returns {Tier}
 */
export function detectTier() {
  // Sin entorno de browser (SSR/Node): el motion es client-only, devolvemos 'low' como piso.
  if (typeof window === 'undefined') return 'low';

  // Señales que fuerzan 'low' de una: respeto explícito o red/ahorro pobre.
  if (prefersReducedMotion() || saveData()) return 'low';

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4;
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 4;
  const eff = nav.connection && nav.connection.effectiveType ? nav.connection.effectiveType : '4g';

  const slowNet = eff === 'slow-2g' || eff === '2g' || eff === '3g';
  if (slowNet || cores <= 2 || mem <= 2) return 'low';

  const strongCpu = cores >= 8 && mem >= 8;
  if (strongCpu && eff === '4g') return 'high';

  return 'mid';
}

/** Contexto de runtime que consume resolve.js. Puro respecto de sus entradas. */
export function runtimeContext() {
  return { tier: detectTier(), reducedMotion: prefersReducedMotion() };
}
