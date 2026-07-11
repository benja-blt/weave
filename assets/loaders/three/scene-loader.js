// assets/loaders/three/scene-loader.js
// SCAFFOLD del loader de escenas 3D (L4). enhance.js lo importa LAZY cuando encuentra
// data-enhance="3d" | "3d-viewer" | "tour". Carga un GLB en una THREE.Scene y la REGISTRA
// (registry.js) para que L3 (engines/scroll.js) la anime por scrollytelling.
//
// ── ESTADO HOY ──────────────────────────────────────────────────────────────────────────
// Three.js NO está instalado (sin bundler; misma decisión "camino liviano primero" que
// engines/scroll.js de L3). Este módulo NO monta WebGL: retorna un handle INERTE y deja el
// FALLBACK (la <img> que renderizó la variant) visible. El 3D real se activa en L6.
//
// ── ACTIVACIÓN EN L6 (3 pasos) ──────────────────────────────────────────────────────────
//   1) npm i three three-stdlib          (requiere bundler: Vite/Astro)
//   2) descomentar el bloque import('three') + GLTFLoader/DRACOLoader de loadScene()
//   3) implementar: crear Scene + cámara + renderer sobre un <canvas>, cargar el GLB con Draco,
//      montar la geometría, resolver `ready` y mapear setProgress(p) a rotación/cámara.
//
// ── CONTRATO / SEPARACIÓN DE CAPAS ──────────────────────────────────────────────────────
// loadScene() es el NÚCLEO PURO respecto del DOM: decide por tier y retorna la interfaz
// { scene, setProgress, ready, cleanup }; NO crea ni appendea el <canvas> ni agrega listeners.
// mount() es el adapter que invoca enhance.js (contrato mount(el, {kind, ctx}) de Wave A): lee
// el src/tier del DOM/ctx, llama a loadScene, REGISTRA el handle (el puente con L3) y devuelve un
// cleanup síncrono. En L6, el <canvas> y su montaje al DOM viven en esta capa mount, no en el núcleo.
//
// Sin side effects al importar.

import { register, unregister } from './registry.js';

/** @typedef {{ scene: any, setProgress: (p: number) => void, ready: Promise<any>, cleanup: () => void }} SceneHandle */

/**
 * Handle INERTE: todo no-op. Es lo que se retorna mientras Three no esté instalado o el tier
 * no aplique. El fallback estático se queda visible.
 * @param {string} reason
 * @returns {SceneHandle}
 */
function inertHandle(reason) {
  // `ready` RECHAZADA a propósito: scroll.js hará scene.ready.then(...).catch(...) y el catch
  // absorbe (nunca re-engancha una escena que no existe). Le adjuntamos un catch propio para
  // que no cuente como unhandled rejection mientras nadie la consuma (scroll.js hoy es no-op).
  const ready = Promise.reject(new Error(`[L4/3d] escena no montada: ${reason}`));
  ready.catch(() => {});
  return {
    scene: null,
    setProgress() { /* no-op: sin Three no hay nada que animar */ },
    ready,
    cleanup() { /* no-op: no se montó nada */ },
  };
}

/**
 * Carga (o, hoy, scaffoldea) una escena 3D. NÚCLEO PURO: no toca el DOM; retorna la interfaz.
 * @param {Element} el   host de la sección (en L6 lo usa la capa mount para el <canvas>, no acá)
 * @param {{ src?: string, tier?: 'high'|'mid'|'low', fallback?: string }} [opts]
 * @returns {Promise<SceneHandle>}
 */
export async function loadScene(el, { src, tier = 'low', fallback } = {}) {
  // 3D solo en tier high (three:scene del budget). mid/low → fallback estático (la <img> visible).
  if (tier !== 'high') return inertHandle(`tier=${tier} (3D solo en high)`);
  if (!src) return inertHandle('sin src (GLB)');

  // ── Activación real (pendiente de instalar Three). Dejar comentado hasta L6: ──
  // try {
  //   const THREE = await import('three');
  //   const { GLTFLoader, DRACOLoader } = await import('three-stdlib');
  //   const scene = new THREE.Scene();
  //   // ... cámara + renderer sobre el <canvas> que crea la capa mount, luces, resize, RAF ...
  //   const loader = new GLTFLoader();
  //   const draco = new DRACOLoader(); loader.setDRACOLoader(draco);
  //   const ready = loader.loadAsync(src).then((gltf) => { scene.add(gltf.scene); return scene; });
  //   let progress = 0;
  //   const setProgress = (p) => { progress = p; /* mapear a rotación de cámara/objeto */ };
  //   const cleanup = () => { /* renderer.dispose(), geometrías/texturas, cancelar RAF */ };
  //   return { scene, setProgress, ready, cleanup };
  // } catch (e) {
  //   console.warn('[L4/3d] Three.js no está instalado. Actívalo en L6 cuando instales el bundler.');
  //   return inertHandle('three no instalado');
  // }

  // Scaffold activo: Three no instalado → handle inerte, el fallback se queda.
  if (typeof console !== 'undefined') {
    console.warn('[L4/3d] Three.js no está instalado. Actívalo en L6 cuando instales el bundler.');
  }
  return inertHandle('three no instalado');
}

/**
 * Adapter que llama enhance.js. Lee src/tier del DOM+ctx, dispara loadScene, registra el handle
 * (puente con L3) y devuelve un cleanup SÍNCRONO (enhance.js espera una función, no una promesa).
 * @param {Element} el
 * @param {{kind: string, ctx: {tier: 'high'|'mid'|'low', reducedMotion?: boolean}}} [opts]
 * @returns {() => void} cleanup
 */
export function mount(el, { kind, ctx } = {}) {
  const tier = (ctx && ctx.tier) || 'low';
  const src = el.getAttribute('data-enhance-src');
  const media = el.querySelector('[data-motion-el="media"]') || el.querySelector('img');
  const fallback = media ? (media.currentSrc || media.getAttribute('src') || '') : '';

  let handle = null;
  loadScene(el, { src, tier, fallback })
    .then((h) => { handle = h; register(el, h); }) // registrado → scroll.js (L3) ya lo puede animar
    .catch(() => { /* nunca rompas el boot: el fallback estático se queda */ });

  return () => {
    unregister(el);
    if (handle && typeof handle.cleanup === 'function') {
      try { handle.cleanup(); } catch (e) { /* noop */ }
    }
  };
}
