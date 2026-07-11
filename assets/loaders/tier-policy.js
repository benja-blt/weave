// assets/loaders/tier-policy.js
// Política de qué ENHANCEMENT (kind del contrato data-enhance) habilita cada device-tier.
// FUNCIONES PURAS: no leen DOM ni navigator; deciden sobre (kind, tier) que se les pasa.
//
// La tabla es la traducción, a los kinds del contrato, de performance-budget.json → deviceTiers
// (`allows`/`denies`). Se hardcodea acá igual que resolve.js hardcodea MINIMAL_AXES: la fuente
// de verdad narrativa es el budget; esto es su forma ejecutable. Si el budget cambia, se ajusta acá.
//
//   budget high:  three:scene, three:product, three:ambient, video-bg, scrollytelling, cursor:custom
//   budget mid :  three:product, three:ambient, video, parallax, cursor:custom
//                 (deniega three:scene y "video-bg autoplay pesado")
//   budget low :  entrance:fade, hover:subtle  (deniega three:*, video-bg, scrollytelling, parallax)

/** @typedef {'video'|'video-bg'|'3d'|'3d-viewer'|'tour'|'lottie'} Kind */
/** @typedef {'high'|'mid'|'low'} Tier */

/**
 * kind → tiers que lo permiten. Alineado con deviceTiers del budget:
 *  - video       (inline, dispara por viewport/gesto): high+mid, low usa fallback.
 *  - video-bg    (autoplay de fondo, "pesado"): SOLO high. mid lo deniega → fallback poster.
 *  - 3d/3d-viewer(three:product, objeto rotable): high+mid. low nunca WebGL.
 *  - tour        (three:scene / recorrido pesado): SOLO high.
 *  - lottie      (vector liviano): high+mid; low sin motion decorativo.
 * @type {Record<Kind, Record<Tier, boolean>>}
 */
const KIND_TIERS = {
  'video': { high: true, mid: true, low: false },
  'video-bg': { high: true, mid: false, low: false },
  '3d': { high: true, mid: true, low: false },
  '3d-viewer': { high: true, mid: true, low: false },
  'tour': { high: true, mid: false, low: false },
  'lottie': { high: true, mid: true, low: false },
};

// Kinds que arrancan sin gesto del usuario → deben respetar prefers-reduced-motion aunque
// el tier los permita (defensa extra: detectTier ya baja a 'low' con reduced-motion, pero
// no dependemos de ese acople).
const AUTOPLAY_KINDS = new Set(['video-bg', '3d', '3d-viewer', 'tour']);

/**
 * ¿El tier permite este kind de enhancement?
 * @param {string} kind
 * @param {string} tier
 * @returns {boolean} false ante kind desconocido o tier faltante (conservador).
 */
export function allowsKind(kind, tier) {
  const row = KIND_TIERS[kind];
  if (!row) return false;
  return row[tier] === true;
}

/** ¿Este kind arranca solo (autoplay) y por ende debe respetar reduced-motion? */
export function isAutoplayKind(kind) {
  return AUTOPLAY_KINDS.has(kind);
}

export { KIND_TIERS };
