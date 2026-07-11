#!/usr/bin/env node
// assets/pipeline/perf-gate.mjs
// BUILD-TIME (Node CLI, ESM). El GATE DURO de L4: suma los pesos declarados en asset-manifest.json
// contra foundation/performance-budget.json, degrada los enhancements que no entran y FALLA el
// build si, aun degradando, la página sigue sobre el max. Hace real el pitch "Awwwards Y rápido".
//
// ── SEMÁNTICA (alineada con budget.gate = "degrade-then-fail") ───────────────────────────────
//   • Por sección: se resuelve su asset en el manifest y se compara el peso por tier vs budget.
//   • Rompe el MAX de un asset (videoKb[tier].max / modelKb.max) → se DEGRADA ese enhancement
//     (video-bg→poster, 3d→imagen: se quita el data-enhance) y su peso deja de contar. Recuperable.
//   • Rompe el TARGET (pero no el max) → WARNING, pasa sin degradar.
//   • Peso TOTAL de página (tras degradar) sobre totalPageKb.max → ERROR: el build FALLA
//     (el baseline no entra ni sacando los enhancements).
//
// Nota: el video es diferido (no cuenta en la primera vista), pero el gate suma la rendition `high`
// como cota superior conservadora del peso servible. Es un scaffold: con manifest vacío todo da 0.
//
// Sin side effects al importar: la CLI está guardada por isMain(). enforcePerformanceBudget() es
// pura (entradas → reporte; no escribe archivos ni muta el pageSpec).

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KB = 1024; // bytes por KB (KiB). Los budgets están en KB; el manifest en bytes.
const DEFAULT_BUDGET = path.resolve(HERE, '..', '..', 'foundation', 'performance-budget.json');
const DEFAULT_MANIFEST = path.resolve(HERE, '..', 'asset-manifest.json');

/**
 * Verifica el pageSpec contra el budget usando los pesos del manifest.
 * @param {object} manifest  salida de manifest.mjs ({ assets: {...} })
 * @param {object} budget    foundation/performance-budget.json
 * @param {object} pageSpec  page.json a validar ({ sections: [...] })
 * @returns {{passed: boolean, warnings: string[], errors: string[], degraded: Record<string,string>, totalKb: number}}
 */
export async function enforcePerformanceBudget(manifest, budget, pageSpec) {
  const wb = (budget && budget.weightBudgets) || {};
  const assets = (manifest && manifest.assets) || {};
  const sections = (pageSpec && pageSpec.sections) || [];

  const warnings = [];
  const errors = [];
  const degraded = {};
  let pageBytes = 0; // peso servible acumulado (rendition high), tras degradaciones

  for (const section of sections) {
    const id = section.id || section.type || '(sin id)';
    const requested = section.enhancement && section.enhancement.requested;
    if (!requested || requested === 'none') continue;

    const asset = assets[resolveAssetKey(section)];

    // ── Video (video / video-bg) ─────────────────────────────────────────────
    if (requested === 'video' || requested === 'video-bg') {
      const caps = wb.videoKb || {};
      let broke = false;
      for (const tier of ['high', 'mid']) {
        const rendition = asset && asset[tier];
        if (!rendition || typeof rendition.bytes !== 'number') continue;
        const kb = rendition.bytes / KB;
        const cap = caps[tier] || {};
        if (typeof cap.max === 'number' && kb > cap.max) {
          broke = true;
          warnings.push(`[${id}] video ${tier}=${Math.round(kb)}KB > max ${cap.max}KB → degradado a poster`);
        } else if (typeof cap.target === 'number' && kb > cap.target) {
          warnings.push(`[${id}] video ${tier}=${Math.round(kb)}KB > target ${cap.target}KB (pasa)`);
        }
      }
      if (broke) {
        degraded[id] = 'video-bg → poster (quita data-enhance)';
      } else if (asset && asset.high && typeof asset.high.bytes === 'number') {
        pageBytes += asset.high.bytes;
      }
    }

    // ── 3D (3d / 3d-viewer / tour) ───────────────────────────────────────────
    if (requested === '3d' || requested === '3d-viewer' || requested === 'tour') {
      const cap = wb.modelKb || {};
      const rendition = (asset && (asset.high || asset.mid)) || null;
      if (rendition && typeof rendition.bytes === 'number') {
        const kb = rendition.bytes / KB;
        if (typeof cap.max === 'number' && kb > cap.max) {
          degraded[id] = '3d → imagen (quita data-enhance)';
          warnings.push(`[${id}] modelo=${Math.round(kb)}KB > max ${cap.max}KB → degradado a imagen`);
        } else {
          if (typeof cap.target === 'number' && kb > cap.target) {
            warnings.push(`[${id}] modelo=${Math.round(kb)}KB > target ${cap.target}KB (pasa)`);
          }
          pageBytes += rendition.bytes;
        }
      }
    }
  }

  // ── Peso total de página, ya con las degradaciones aplicadas ────────────────
  const totalKb = pageBytes / KB;
  const totalCap = wb.totalPageKb || {};
  if (typeof totalCap.max === 'number' && totalKb > totalCap.max) {
    errors.push(`Peso total ${Math.round(totalKb)}KB > max ${totalCap.max}KB incluso tras degradar → build FALLA.`);
  } else if (typeof totalCap.target === 'number' && totalKb > totalCap.target) {
    warnings.push(`Peso total ${Math.round(totalKb)}KB > target ${totalCap.target}KB (pasa).`);
  }

  return { passed: errors.length === 0, warnings, errors, degraded, totalKb };
}

/** Cómo una sección referencia su asset en el manifest: media.assetId | media.model | media.video | id. */
function resolveAssetKey(section) {
  const media = (section.content && section.content.media) || {};
  return media.assetId || media.model || media.video || section.id || '';
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { help: false, dryRun: false, page: null, manifest: null, budget: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--page') args.page = argv[++i];
    else if (a === '--manifest') args.manifest = argv[++i];
    else if (a === '--budget') args.budget = argv[++i];
  }
  return args;
}

function printHelp() {
  console.log(`perf-gate — gate de performance de L4 (build-time)

Uso:
  node assets/pipeline/perf-gate.mjs [--page <page.json>] [--dry-run]
                                     [--manifest <asset-manifest.json>] [--budget <budget.json>]

Opciones:
  --page      page.json a validar (default: sin secciones → pasa vacío).
  --dry-run   corre el gate y reporta, pero exit 0 siempre (no rompe el build).
  --manifest  override del asset-manifest.json (default: assets/asset-manifest.json).
  --budget    override del performance-budget.json (default: foundation/performance-budget.json).
  -h, --help  esta ayuda.

Salida: reporte JSON a stdout. Exit 0 si pasó, 1 si falla (salvo --dry-run).`);
}

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}
async function readJsonOptional(p, fallback) {
  try { return await readJson(p); } catch { return fallback; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }

  const budget = await readJson(args.budget || DEFAULT_BUDGET);
  const manifest = await readJsonOptional(args.manifest || DEFAULT_MANIFEST, { assets: {} });
  const pageSpec = args.page ? await readJson(args.page) : { sections: [] };

  const report = await enforcePerformanceBudget(manifest, budget, pageSpec);
  console.log(JSON.stringify(report, null, 2));

  if (args.dryRun) {
    console.log('\n[dry-run] no se aplican degradaciones ni se rompe el build.');
    process.exit(0);
  }
  if (!report.passed) console.error('\n[perf-gate] FALLA: la página no entra en el budget.');
  process.exit(report.passed ? 0 : 1);
}

function isMain(metaUrl) {
  return !!process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(metaUrl));
}
if (isMain(import.meta.url)) {
  main().catch((e) => { console.error('[perf-gate] error:', e); process.exit(1); });
}
