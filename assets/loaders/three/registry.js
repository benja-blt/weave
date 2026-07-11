// assets/loaders/three/registry.js
// Registro de escenas 3D vivas, keyed por elemento DOM. Es el PUENTE L4↔L3:
//   - L4 (scene-loader.js) REGISTRA la escena cuando la carga.
//   - L3 (engines/scroll.js) hace get(el) para animarla por scroll (setProgress).
// Cero acoplamiento directo entre módulos: se encuentran acá.
//
// Pequeño y puro. Un Map de módulo NO es un side effect observable (no toca window/DOM/red):
// es estado interno, como el MINIMAL_AXES de resolve.js. Importar este módulo no hace nada visible.

/** @type {Map<Element, object>} sceneObj = { scene, setProgress, ready, cleanup } */
const scenes = new Map();

/** Guarda la escena de un elemento. Sobrescribe si ya había una (idempotente por el). */
export function register(el, sceneObj) {
  scenes.set(el, sceneObj);
}

/** Devuelve la escena registrada para `el`, o undefined si no hay. */
export function get(el) {
  return scenes.get(el);
}

/** Borra la escena de `el` del registro (no la limpia: eso lo hace sceneObj.cleanup()). */
export function unregister(el) {
  scenes.delete(el);
}
