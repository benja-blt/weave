// src/pages/api/generate.js — endpoint del "momento WOW" (step-4). Busca el patrón elegido
// y el arquetipo más cercano, y le pide a generator.js el HTML final auto-contenido.
export const prerender = false;

import { generateLanding } from '../../lib/generator.js';
// Import estático (no fs.readFileSync + ruta relativa): Vite lo bundlea dentro de la función
// serverless de Netlify. Con fs esa ruta no existe en runtime (/var/task no tiene src/data/)
// y la función explota con ENOENT en producción (anda en dev porque ahí sí existe el repo).
import corpusData from '../../data/webs-corpus.json';
import archetypesData from '../../data/archetypes.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function GET() {
  return json({ error: 'method_not_allowed' }, 405);
}

function findPattern(patternId) {
  return corpusData.patterns.find((p) => p.id === patternId) || null;
}

function findArchetype(niche, mood) {
  const list = archetypesData.archetypes;
  const exact = list.find((a) => a.niche === niche && a.mood === mood);
  if (exact) return exact;
  const sameNiche = list.find((a) => a.niche === niche);
  if (sameNiche) return sameNiche;
  return list.find((a) => a.id === 'cafe-minimalista') || list[0];
}

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { business, patternId, analysis, colors, colorMode } = body || {};
  if (!business?.name || !business?.niche || !patternId) {
    return json({ error: 'missing_fields' }, 400);
  }

  const pattern = findPattern(patternId);
  if (!pattern) {
    return json({ error: 'pattern_not_found' }, 404);
  }

  const archetype = findArchetype(business.niche, analysis?.mood);

  try {
    const result = await generateLanding({
      business: { ...business, colors, colorMode },
      pattern,
      analysis: analysis || {},
      archetype,
    });
    return json(result);
  } catch (err) {
    return json({ error: 'generation_failed', message: err.message }, 500);
  }
}
