// assets/pipeline/manifest.mjs
// BUILD-TIME (Node CLI, ESM). Escanea los assets pesados generados por el pipeline y emite
// asset-manifest.json. Lo consume enhance.js/video.js en runtime para elegir la rendition por tier
// (data-enhance-src / -src-mid) y lo consume perf-gate.mjs para verificar pesos vs budget.
//
// ── ESTRUCTURA emitida ────────────────────────────────────────────────────────────────────
//   {
//     "version": "1.0.0",
//     "generatedAt": "<ISO>",
//     "assets": {
//       "hero-bg-video":  { "high": { "src": "...", "bytes": 1200000 },
//                           "mid":  { "src": "...", "bytes": 600000 },
//                           "low":  null },                 // low NUNCA recibe video/3D
//       "model-scene-01": { "high": { "src": "...", "bytes": 800000 },
//                           "mid":  { "src": "...", "bytes": 350000 },
//                           "low":  null }
//     }
//   }
//
// ── ESTADO HOY (scaffold) ───────────────────────────────────────────────────────────────────
// No hay pipeline real de video/3D corriendo (sin bundler, mismos motivos que scene-loader.js).
// scanAssets() devuelve {} → manifest VACÍO. Con manifest vacío, perf-gate pasa limpio (0 bytes).
//
// ── ACTIVACIÓN EN L6 (3 pasos) ──────────────────────────────────────────────────────────────
//   1) correr el pipeline real (video.mjs → renditions AV1/mp4 por tier; model.mjs → GLB+Draco)
//      que deja los assets en assetsDir con un naming por tier (ej. hero-bg.high.mp4 / .mid.mp4).
//   2) implementar scanAssets(): readdir recursivo, agrupar por asset-id, `stat().size` cada
//      rendition, mapear el sufijo de tier (.high/.mid) a las claves high/mid, low = null.
//   3) correr `node assets/pipeline/manifest.mjs` en el build antes del perf-gate.
//
// Sin side effects al importar: el runner CLI está guardado por isMain().

import { writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ASSETS_DIR = path.resolve(HERE, '..');                 // assets/
const DEFAULT_OUTPUT = path.resolve(HERE, '..', 'asset-manifest.json'); // assets/asset-manifest.json

/**
 * Genera el manifest escaneando `assetsDir` y lo escribe en `outputPath`.
 * @param {string} assetsDir  raíz donde el pipeline dejó las renditions
 * @param {string} outputPath  destino del asset-manifest.json
 * @returns {Promise<object>} el manifest emitido
 */
export async function generateManifest(assetsDir = DEFAULT_ASSETS_DIR, outputPath = DEFAULT_OUTPUT) {
  const assets = await scanAssets(assetsDir);
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    assets,
  };
  await writeFile(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return manifest;
}

/**
 * Escanea las renditions de assetsDir y las agrupa por asset-id + tier.
 * HOY: no hay pipeline real → devuelve {}. La firma y el flujo ya están; L6 implementa el body
 * (ver los 3 pasos del header). Se deja `stat`/`readdir` importados para esa activación.
 * @param {string} _assetsDir
 * @returns {Promise<Record<string, {high: object|null, mid: object|null, low: null}>>}
 */
async function scanAssets(_assetsDir) {
  // L6 (paso 2): readdir recursivo + stat().size por rendition, agrupado por asset-id/tier.
  // void para no dejar los imports “sin usar” hasta entonces:
  void readdir; void stat;
  return {};
}

// ── CLI (guardado: importar este módulo NO ejecuta nada) ─────────────────────────────────────
function isMain(metaUrl) {
  return !!process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(metaUrl));
}
if (isMain(import.meta.url)) {
  generateManifest()
    .then((m) => {
      const n = Object.keys(m.assets).length;
      console.log(`[manifest] emitido ${DEFAULT_OUTPUT} — ${n} asset(s).`);
      if (n === 0) console.log('[manifest] vacío (scaffold): no hay pipeline de video/3D todavía. Se llena en L6.');
    })
    .catch((e) => { console.error('[manifest] error:', e); process.exit(1); });
}
