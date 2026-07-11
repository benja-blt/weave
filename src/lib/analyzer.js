// src/lib/analyzer.js — recibe los datos del negocio, llama a Claude (Messages API +
// Claude Vision si hay fotos) y devuelve el análisis de identidad visual estructurado.
// Server-side only (Node): usa @anthropic-ai/sdk, nunca se importa desde código de browser.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.CLAUDE_MODEL || import.meta.env?.CLAUDE_MODEL || 'claude-sonnet-5';
const MAX_PHOTOS = 5;

// `new Anthropic()` sin argumentos no resuelve la key de forma confiable bajo el SSR de
// Vite/Astro (process.env no siempre queda poblado ahí) — se la pasamos explícita, cubriendo
// ambas fuentes.
const API_KEY = process.env.ANTHROPIC_API_KEY || import.meta.env?.ANTHROPIC_API_KEY;
const client = new Anthropic({ apiKey: API_KEY });

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    mood: {
      type: 'string',
      enum: ['elegante', 'moderno', 'minimalista', 'artesanal', 'premium', 'playful', 'rústico'],
    },
    style: { type: 'string', description: 'Descripción corta del estilo visual, máximo 10 palabras.' },
    colors: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: 'Color primario sugerido, en #hex.' },
        accent: { type: 'string', description: 'Color de acento sugerido, en #hex.' },
      },
      required: ['primary', 'accent'],
      additionalProperties: false,
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: '3 a 5 palabras clave del negocio.',
    },
    weight: {
      type: 'string',
      enum: ['adaptable', 'heavy'],
      description: '¿El negocio se beneficia de video/3D (heavy) o alcanza con algo liviano (adaptable)?',
    },
    hero_type: {
      type: 'string',
      enum: ['fullbleed-video', 'editorial-type', 'split', 'centered'],
    },
  },
  required: ['mood', 'style', 'colors', 'keywords', 'weight', 'hero_type'],
  additionalProperties: false,
};

const SYSTEM_PROMPT =
  'Sos un experto en diseño web premium. Analizás negocios y extraés su identidad visual ' +
  '(mood, estilo, colores, palabras clave) para elegir el patrón de landing page que mejor les queda.';

function defaultsFor(niche) {
  return {
    mood: niche === 'cafe' ? 'artesanal' : 'moderno',
    style: 'diseño limpio y profesional',
    colors: { primary: '#0A0A0A', accent: '#4F8EF7' },
    keywords: [niche].filter(Boolean),
    weight: 'adaptable',
    hero_type: 'centered',
  };
}

function guessMediaType(photo) {
  const match = /^data:(image\/[a-z0-9+.-]+);base64,/i.exec(photo);
  return match ? match[1] : 'image/jpeg';
}

function toBase64(photo) {
  const idx = photo.indexOf('base64,');
  return idx === -1 ? photo : photo.slice(idx + 'base64,'.length);
}

function buildUserContent(data) {
  const { name, description, niche, instagram, mood, photos, prompt: userPrompt, colors: userColors } = data;
  const lines = [
    'Analizá este negocio y devolvé su identidad visual.',
    '',
    'NEGOCIO:',
    `- Nombre: ${name}`,
    `- Descripción: ${description || 'no provista'}`,
    `- Tipo: ${niche}`,
    `- Instagram: ${instagram || 'no provisto'}`,
    `- Palabra clave del dueño: ${mood || 'no provisto'}`,
  ];

  if (userPrompt && userPrompt.trim()) {
    lines.push(
      '',
      `El dueño describió exactamente lo que quiere: "${userPrompt.trim()}"`,
      'Tené esto MUY en cuenta para el análisis.',
    );
  }

  if (userColors?.primary && userColors?.accent) {
    lines.push(
      '',
      'El dueño eligió estos colores específicos:',
      `Primary: ${userColors.primary}`,
      `Accent: ${userColors.accent}`,
      'Respetá estos colores exactos.',
    );
  }

  const content = [];
  const usablePhotos = Array.isArray(photos) ? photos.slice(0, MAX_PHOTOS) : [];
  if (usablePhotos.length) {
    lines.push('', 'También analizá las fotos adjuntas.');
    for (const photo of usablePhotos) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: guessMediaType(photo), data: toBase64(photo) },
      });
    }
  }
  content.push({ type: 'text', text: lines.join('\n') });
  return content;
}

async function requestAnalysis(userContent) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
  });
  return response;
}

export async function analyzeBusiness(data) {
  if (!data || !data.name || !data.niche) {
    throw new Error('missing_fields');
  }

  const userContent = buildUserContent(data);

  let response;
  try {
    response = await requestAnalysis(userContent);
  } catch (err) {
    throw new Error('analysis_failed: ' + err.message);
  }

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    try {
      response = await requestAnalysis(userContent);
    } catch (err) {
      throw new Error('analysis_failed: ' + err.message);
    }
  }

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    return defaultsFor(data.niche);
  }

  return response.parsed_output;
}
