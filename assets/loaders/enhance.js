// assets/loaders/enhance.js
// Entry point de L4 (assets pesados). Escanea el DOM por el contrato data-enhance, decide por
// device-tier + fallback si upgradear, y difiere la carga del asset pesado fuera del LCP.
// boot.js (L3) lo invoca con el MISMO ctx (tier detectado una sola vez). Sin side effects al importar.
//
// ── CONTRATO data-enhance (fuente de verdad) ────────────────────────────────────────────
// Una sección que quiere un enhancement pesado declara, sobre su nodo raíz:
//   data-enhance="<kind>"        kind ∈ video | video-bg | 3d | 3d-viewer | tour | lottie
//                                (mismo vocabulario que page-schema → enhancement.requested)
//   data-enhance-src="<url|id>"  fuente del asset (Wave A: URL directa; Wave B+: id de asset-manifest)
//   data-enhance-fallback="poster|static"   SEÑAL DURA de que existe fallback estático ya renderizado.
//                                Sin este atributo NO se upgradea (regla "enhancement sin fallback = prohibido").
// El fallback (poster/imagen/estático) ya está pintado por la variant L2. El enhancement se monta
// ENCIMA, in-place. Nunca es el render primario. Estado observable: data-enhance-state="fallback|pending|active".
//
// ── DISPATCH ────────────────────────────────────────────────────────────────────────────
// Cada kind mapea a un loader importado LAZY (dynamic import) recién cuando el asset va a montarse:
//   video / video-bg → ./video.js         (Wave B — todavía no existe: el import falla y se queda el fallback)
//   3d / 3d-viewer / tour → ./three/scene-loader.js  (Wave C — SCAFFOLD no-op, como engines/scroll.js)
//   lottie → ./lottie.js                   (Wave posterior)
// Se importan con .catch igual que boot.js con scroll.js: si el loader aún no está, el base ya funciona.
// Cada loader expone `mount(el, { kind, ctx }) => (() => void)?` (cleanup opcional).

import { decideEnhancement } from '../fallbacks/resolve.js';
import { whenVisible, whenIdle, afterLoad } from './lazy-media.js';

/** kind → import() del loader correspondiente. */
const LOADERS = {
  'video': () => import('./video.js'),
  'video-bg': () => import('./video.js'),
  '3d': () => import('./three/scene-loader.js'),
  '3d-viewer': () => import('./three/scene-loader.js'),
  'tour': () => import('./three/scene-loader.js'),
  'lottie': () => import('./lottie.js'),
};

/**
 * Cablea los enhancements de la página. Idempotente por elemento (marca data-enhance-state).
 * @param {ParentNode} [root=document]
 * @param {{tier: 'high'|'mid'|'low', reducedMotion?: boolean}} [ctx]
 * @returns {() => void} cleanup que desmonta lo enganchado
 */
export function initEnhancements(root = document, ctx = { tier: 'low', reducedMotion: false }) {
  if (typeof window === 'undefined') return () => {};

  const cleanups = [];

  for (const el of root.querySelectorAll('[data-enhance]')) {
    if (el.dataset.enhanceState) continue; // ya procesado (idempotencia)

    const kind = el.getAttribute('data-enhance');
    const descriptor = { kind, hasFallback: el.hasAttribute('data-enhance-fallback') };
    const decision = decideEnhancement(descriptor, ctx);

    if (!decision.activate) {
      el.dataset.enhanceState = 'fallback'; // el estático se queda; nada que cargar
      continue;
    }

    el.dataset.enhanceState = 'pending';

    // Carga diferida: recién visible → tras el load → en idle → importar y montar.
    const cancelVisible = whenVisible(el, () => {
      const cancelLoad = afterLoad(() => {
        const cancelIdle = whenIdle(() => {
          const load = LOADERS[kind];
          if (!load) { el.dataset.enhanceState = 'fallback'; return; }
          load()
            .then((m) => {
              const c = m && typeof m.mount === 'function' ? m.mount(el, { kind, ctx }) : null;
              if (typeof c === 'function') cleanups.push(c);
              el.dataset.enhanceState = 'active';
            })
            .catch(() => { el.dataset.enhanceState = 'fallback'; /* loader aún no instalado: base funciona */ });
        });
        cleanups.push(cancelIdle);
      });
      cleanups.push(cancelLoad);
    });
    cleanups.push(cancelVisible);
  }

  return () => { for (const fn of cleanups) { try { fn && fn(); } catch (e) { /* noop */ } } };
}
