// src/pages/api/analyze.js — endpoint server-side del "momento mágico" (step-3).
// Recibe los datos del negocio (+ fotos), llama a analyzer.js (Claude Vision) y a matcher.js
// (score contra los 152 patrones del corpus), y devuelve el TOP 3 + el análisis.
export const prerender = false;

import { analyzeBusiness } from '../../lib/analyzer.js';
import { findTopPatterns } from '../../lib/matcher.js';

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

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { name, description, niche, instagram, mood, photos, prompt, colors } = body || {};
  if (!name || !niche) {
    return json({ error: 'missing_fields' }, 400);
  }

  let analysis;
  try {
    analysis = await analyzeBusiness({ name, description, niche, instagram, mood, photos, prompt, colors });
  } catch (err) {
    return json({ error: 'analysis_failed', message: err.message }, 502);
  }

  try {
    const patterns = findTopPatterns(analysis, niche, 3);
    return json({ patterns, analysis });
  } catch (err) {
    return json({ error: 'unexpected_error', message: err.message }, 500);
  }
}
