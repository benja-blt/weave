// assets/loaders/video.js
// Loader RUNTIME de video (L4). enhance.js lo importa LAZY cuando encuentra en el DOM
// data-enhance="video" o data-enhance="video-bg". Upgradea un nodo de imagen estática a
// <video> SIN destruir el fallback: el poster (la <img> que renderizó la variant L2) sigue en
// el DOM y reaparece si el video falla o se pausa. Nunca deja un estado roto.
//
// Estilos: NO se hardcodean acá. La presentación del video (position/cover/crossfade) vive en
// assets/assets.css (capa L4). El loader SOLO togglea clases y `data-video-state`; el CSS hace
// la transición con tokens semánticos. Motivo de la separación de assets.css vs motion.css:
// el crossfade poster→video es asset pipeline (L4), no coreografía de motion (L3).
//
// Sin side effects al importar: exporta funciones; nada corre hasta que se las llama.

import { prefersReducedMotion } from '../../motion/lib/device-tier.js';

/**
 * Adapter que invoca enhance.js (contrato `mount(el, { kind, ctx })`). Lee del DOM la fuente y
 * el fallback, elige rendition por tier y delega en mountVideo.
 * @param {Element} el  host con data-enhance
 * @param {{kind: string, ctx: {tier: 'high'|'mid'|'low', reducedMotion?: boolean}}} [opts]
 * @returns {() => void} cleanup
 */
export function mount(el, { kind, ctx } = {}) {
  const tier = (ctx && ctx.tier) || 'low';
  const src = el.getAttribute('data-enhance-src');
  const srcMid = el.getAttribute('data-enhance-src-mid');
  // Rendition por tier: mid usa la liviana si el pipeline la generó; si no, cae a src.
  // El gate de PESO es responsabilidad del pipeline/perf-gate (Wave D), no del loader.
  const chosen = tier === 'mid' && srcMid ? srcMid : src;
  const posterImg = findPoster(el);
  const fallback = posterImg ? (posterImg.currentSrc || posterImg.getAttribute('src') || '') : '';
  return mountVideo(el, { src: chosen, kind, tier, fallback });
}

/**
 * Núcleo testeable: monta el <video> sobre `el` según el kind. Devuelve un cleanup que remueve
 * el <video> y restaura el poster.
 * @param {Element} el
 * @param {{src: string, kind: string, tier: 'high'|'mid'|'low', fallback: string}} [opts]
 * @returns {() => void} cleanup
 */
export function mountVideo(el, { src, kind, tier, fallback } = {}) {
  // Defensa en profundidad: low NUNCA recibe video (enhance.js ya lo filtró por tier-policy).
  if (typeof document === 'undefined' || tier === 'low' || !src) return () => {};

  const isBg = kind === 'video-bg';
  const reduce = prefersReducedMotion();
  const posterImg = findPoster(el);

  const video = document.createElement('video');
  video.className = isBg ? 'plg-video plg-video--bg' : 'plg-video plg-video--inline';
  video.preload = 'none';
  video.playsInline = true;
  video.setAttribute('playsinline', ''); // iOS necesita el atributo, no solo la prop

  if (isBg) {
    video.muted = true;
    video.loop = true;
    // Autoplay salvo reduced-motion (el resolver ya lo bloquea antes; esto es defensa extra).
    if (!reduce) { video.autoplay = true; video.setAttribute('autoplay', ''); }
  } else {
    video.controls = true;
    if (fallback) video.poster = fallback; // el poster attr cubre hasta el play
  }

  // Fuente. Slot dejado para AV1/WebM futuros (Wave D): por ahora solo mp4.
  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.appendChild(source);

  if (isBg && posterImg) posterImg.classList.add('plg-video-poster');
  // Estado observable para el CSS (crossfade). Arranca en fallback → poster visible.
  el.setAttribute('data-video-state', 'fallback');

  let torn = false;
  const onPlaying = () => { if (!torn) el.setAttribute('data-video-state', 'playing'); };
  const onPause = () => { if (!torn) el.setAttribute('data-video-state', 'fallback'); }; // poster reaparece
  const onError = () => {
    if (typeof console !== 'undefined') console.warn('[L4/video] no cargó, se queda el poster:', src);
    teardown(); // nunca un estado roto
  };
  video.addEventListener('playing', onPlaying);
  video.addEventListener('pause', onPause);
  video.addEventListener('error', onError);
  source.addEventListener('error', onError); // el error de <source> no siempre burbujea al <video>

  // Inserción según kind.
  if (isBg) {
    el.appendChild(video); // detrás del texto, sobre el poster (mismo layer, gana por orden DOM)
  } else if (posterImg && posterImg.parentNode) {
    posterImg.parentNode.insertBefore(video, posterImg); // inline: reemplaza el placeholder
    posterImg.hidden = true;
  } else {
    el.appendChild(video);
  }

  // Cargar recién ahora (preload=none evitó el fetch hasta este punto).
  video.load();
  if (isBg && !reduce) {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay bloqueado: poster se queda */ });
  }

  function teardown() {
    if (torn) return;
    torn = true;
    video.removeEventListener('playing', onPlaying);
    video.removeEventListener('pause', onPause);
    video.removeEventListener('error', onError);
    source.removeEventListener('error', onError);
    try { video.pause(); } catch (e) { /* noop */ }
    video.removeAttribute('src');
    if (video.parentNode) video.parentNode.removeChild(video);
    if (posterImg) { posterImg.classList.remove('plg-video-poster'); posterImg.hidden = false; }
    el.setAttribute('data-video-state', 'fallback');
  }
  return teardown;
}

/** Encuentra el poster/fallback dentro del host: el nodo media declarado (si es <img>) o la 1ª <img>. */
function findPoster(el) {
  const media = el.querySelector('[data-motion-el="media"]');
  if (media && media.tagName === 'IMG') return media;
  return el.querySelector('img');
}
