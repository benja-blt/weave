#!/usr/bin/env node
/**
 * Token build — sin dependencias.
 * Lee primitives + semantic + themes/*, resuelve referencias {a.b.value},
 * y emite:
 *   build/tokens-base.css   -> :root con primitivos + semánticos (compartidos)
 *   build/theme-<name>.css  -> [data-theme="<name>"] con color/font del tema
 *   build/tokens.json       -> mapa plano { "--token": "valor" } para el generador y el reverse-eng
 *
 * Convención de nombres CSS: la ruta del token con guiones. Ej: color.sand.500 -> --color-sand-500
 * Los semánticos van sin ruido: space.section -> --space-section, color.accent -> --color-accent
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BUILD = join(ROOT, 'build');
mkdirSync(BUILD, { recursive: true });

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Aplana un árbol de tokens a { "color.sand.500": "#..." } ignorando claves $meta. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && 'value' in v) {
      out[prefix ? `${prefix}.${k}` : k] = v.value;
    } else if (v && typeof v === 'object') {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

/** Resuelve referencias {path.value} de forma recursiva contra el mapa global. */
function resolve(value, map, seen = new Set()) {
  if (typeof value !== 'string') return value;
  const ref = value.match(/^\{([^}]+)\}$/);
  const key = (r) => r.replace(/\.value$/, '');
  if (ref) {
    const target = key(ref[1]);
    if (seen.has(target)) throw new Error(`Referencia circular: ${target}`);
    seen.add(target);
    if (!(target in map)) throw new Error(`Referencia rota: {${ref[1]}}`);
    return resolve(map[target], map, seen);
  }
  // referencias embebidas (ej. grid.gutter usa {space.6.value})
  return value.replace(/\{([^}]+)\}/g, (_, r) => {
    const target = key(r);
    if (!(target in map)) throw new Error(`Referencia rota: {${r}}`);
    return resolve(map[target], map, new Set([target]));
  });
}

const cssVar = (path) => '--' + path.replace(/\./g, '-');

/** Emite un bloque CSS a partir de un mapa de tokens ya resueltos. */
function emitBlock(selector, tokens) {
  const lines = Object.entries(tokens).map(([p, v]) => `  ${cssVar(p)}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

// 1) Cargar fuentes
const primitives = readJSON(join(ROOT, 'primitives/primitives.json'));
const semantic   = readJSON(join(ROOT, 'semantic/semantic.json'));
const themeFiles = readdirSync(join(ROOT, 'themes')).filter(f => f.endsWith('.json'));
const themes = Object.fromEntries(
  themeFiles.map(f => [basename(f, '.json'), readJSON(join(ROOT, 'themes', f))])
);

// 2) Mapa global para resolver referencias (primitivos + semánticos + todos los temas)
const globalFlat = {
  ...flatten(primitives),
  ...flatten(semantic),
  ...Object.assign({}, ...Object.values(themes).map(t => flatten(t)))
};
const resolveAll = (flat) => Object.fromEntries(
  Object.entries(flat).map(([k, v]) => [k, resolve(v, globalFlat)])
);

// 3) Base = primitivos + semánticos (compartidos por todos los temas)
const baseTokens = resolveAll({ ...flatten(primitives), ...flatten(semantic) });
const baseCss =
  `/* AUTO-GENERADO por tokens/build.js — no editar a mano */\n` +
  emitBlock(':root', baseTokens);
writeFileSync(join(BUILD, 'tokens-base.css'), baseCss);

// 4) Un CSS por tema (solo color/font — lo que cambia)
const flatJson = { base: baseTokens, themes: {} };
for (const [name, theme] of Object.entries(themes)) {
  const themeTokens = resolveAll(flatten(theme));
  // el tema default (warm) también se aplica a :root para no requerir data-theme
  const selector = name === 'warm' ? `:root, [data-theme="${name}"]` : `[data-theme="${name}"]`;
  const css =
    `/* AUTO-GENERADO — tema ${name} */\n` +
    emitBlock(selector, themeTokens);
  writeFileSync(join(BUILD, `theme-${name}.css`), css);
  flatJson.themes[name] = themeTokens;
}

// 5) JSON plano para el generador / reverse-eng
writeFileSync(join(BUILD, 'tokens.json'), JSON.stringify(flatJson, null, 2));

console.log(`✓ tokens-base.css  (${Object.keys(baseTokens).length} tokens)`);
for (const name of Object.keys(themes)) console.log(`✓ theme-${name}.css`);
console.log(`✓ tokens.json`);
