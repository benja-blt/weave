// motion/lib/resolve.js
// Resolución de perfil → ejes efectivos. FUNCIONES PURAS: no leen el DOM ni navigator,
// no importan datos; operan sobre los objetos que se les pasan. 100% testeable en Node.
// (device-tier.js provee el contexto; boot.js provee el mapa de perfiles cargado del JSON.)

const MINIMAL_AXES = {
  entrance: 'fade',
  scroll: 'none',
  three: 'none',
  cursor: 'default',
  transitions: 'instant',
  hover: 'subtle',
};

/**
 * Busca los ejes de un perfil por nombre. Fallback a 'minimal' si no existe.
 * @param {string} name
 * @param {Record<string, {axes: object}>} profiles  mapa nombre → perfil (JSON cargado)
 * @returns {object} copia de los ejes del perfil
 */
export function axesFor(name, profiles) {
  const p = profiles && profiles[name];
  if (!p || !p.axes) return { ...MINIMAL_AXES };
  return { ...MINIMAL_AXES, ...p.axes };
}

/**
 * Degrada un set de ejes según el contexto de runtime (tier + reduced-motion).
 * Regla (ARCHITECTURE §"Elegir motion" + performance-budget deviceTiers):
 *   - reducedMotion o tier 'low' → colapsa a minimal.
 *   - tier 'mid' → recorta los ejes caros (pin/scrollytelling, cursor custom/magnetic,
 *     transitions cinematic) a su versión liviana; parallax y reveal se mantienen.
 *   - tier 'high' → pasa tal cual.
 * @param {object} axes
 * @param {{tier: 'high'|'mid'|'low', reducedMotion: boolean}} ctx
 * @returns {object} nuevos ejes efectivos (no muta la entrada)
 */
export function degrade(axes, ctx) {
  const base = { ...MINIMAL_AXES, ...axes };
  const tier = ctx && ctx.tier ? ctx.tier : 'low';
  const rm = !!(ctx && ctx.reducedMotion);

  if (rm || tier === 'low') return { ...MINIMAL_AXES };

  if (tier === 'mid') {
    return {
      ...base,
      scroll: (base.scroll === 'pin' || base.scroll === 'scrollytelling') ? 'parallax' : base.scroll,
      three: base.three === 'scene' ? 'product' : base.three,
      cursor: base.cursor === 'default' ? 'default' : 'default', // mid no habilita cursor custom
      transitions: base.transitions === 'cinematic' ? 'smooth' : base.transitions,
    };
  }

  return base; // high
}

/**
 * Atajo: nombre de perfil + contexto → ejes efectivos. Puro (recibe profiles y ctx).
 * @param {string} name
 * @param {Record<string, object>} profiles
 * @param {{tier: string, reducedMotion: boolean}} ctx
 */
export function resolveSection(name, profiles, ctx) {
  return degrade(axesFor(name, profiles), ctx);
}

export { MINIMAL_AXES };
