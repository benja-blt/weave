// motion/lib/head-inline.js
// El snippet ANTI-FOUC. Va INLINE en el <head>, síncrono, ANTES del primer paint —
// NO deferred (si se defierea, hay flash de "visible → oculto"). Por eso NO es parte de
// boot.js (que es el módulo deferred). Este archivo solo EXPORTA el fuente del snippet
// como string; el layout base (L6) lo inyecta inline en el <head>.
//
// Qué hace, mínimo: si el usuario NO pidió reduced-motion y NO está en save-data, agrega
// `motion-ready` al <html>. Eso "arma" los from-states de reveal de motion.css antes del
// paint. La detección de tier completa y el cableado de engines los hace boot.js (deferred).
//
// Uso en el layout (Astro, L6):
//   ---
//   import { MOTION_READY_INLINE } from '../motion/lib/head-inline.js';
//   ---
//   <head>
//     <link rel="stylesheet" href="/motion/motion.css" />
//     <script is:inline set:html={MOTION_READY_INLINE}></script>
//   </head>
//   ... y al final del body, deferred:
//   <script type="module">import { boot } from '/motion/lib/boot.js'; boot();</script>

export const MOTION_READY_INLINE = [
  '(function(){try{',
  'var mm=window.matchMedia;',
  'var rm=mm&&mm("(prefers-reduced-motion: reduce)").matches;',
  'var sd=navigator.connection&&navigator.connection.saveData;',
  'if(!rm&&!sd){document.documentElement.classList.add("motion-ready");}',
  '}catch(e){}})();',
].join('');

/** Devuelve el snippet listo para inyectar (por si el layout prefiere una función). */
export function motionReadyInline() {
  return MOTION_READY_INLINE;
}
