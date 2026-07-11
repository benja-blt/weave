// assets/fallbacks/resolve.js
// Resolución RUNTIME de un enhancement: dado un descriptor + contexto, ¿lo activo o me quedo
// en el fallback estático? FUNCIÓN PURA (no toca DOM ni navigator): testeable en Node.
//
// Implementa la "regla de tres" de performance-budget.json → enhancementRules:
//   (1) tiene fallback declarado   (regla dura: "enhancement sin fallback = prohibido")
//   (2) el device-tier lo permite  (tier-policy)
//   (3) su peso entra en budget    (opcional acá; el enforcement duro vive en el perf-gate de build)
// Si falla cualquiera → NO se activa y el fallback (ya renderizado en el DOM) se queda.

import { allowsKind, isAutoplayKind } from '../loaders/tier-policy.js';

/** @typedef {{ kind: string, hasFallback: boolean, weightKb?: number, maxKb?: number }} Descriptor */
/** @typedef {{ tier: 'high'|'mid'|'low', reducedMotion?: boolean }} Ctx */
/** @typedef {{ activate: boolean, reason: string }} Decision */

const deny = (reason) => ({ activate: false, reason });

/**
 * @param {Descriptor} desc
 * @param {Ctx} ctx
 * @returns {Decision}
 */
export function decideEnhancement(desc, ctx) {
  const kind = desc && desc.kind;
  if (!kind || kind === 'none') return deny('no-enhancement');

  // (1) Regla dura: sin fallback, prohibido. Antes que nada.
  if (!desc.hasFallback) return deny('no-fallback');

  const tier = (ctx && ctx.tier) || 'low';

  // reduced-motion mata los kinds que arrancan solos, aunque el tier los dejara pasar.
  if (ctx && ctx.reducedMotion && isAutoplayKind(kind)) return deny('reduced-motion');

  // (2) Gate de tier.
  if (!allowsKind(kind, tier)) return deny('tier');

  // (3) Gate de peso, sólo si el caller ya conoce los bytes (Wave B+ con manifest).
  //     El enforcement duro es build-time (perf-gate); acá es una red blanda.
  if (typeof desc.weightKb === 'number' && typeof desc.maxKb === 'number' && desc.weightKb > desc.maxKb) {
    return deny('over-budget');
  }

  return { activate: true, reason: 'ok' };
}
