// src/lib/matcher.js — matchea el análisis del negocio (analyzer.js) contra los 152
// patrones de src/data/webs-corpus.json y devuelve el TOP N con score + razones.
// Import estático (no fs.readFileSync): Vite lo bundlea dentro de la función serverless de
// Netlify. Con fs.readFileSync + ruta relativa al archivo, esa ruta no existe en runtime
// (/var/task no tiene src/data/) y la función explota con ENOENT en producción.
import corpus from '../data/webs-corpus.json';

const MOOD_COMPATIBLE = {
  elegante: 'premium',
  premium: 'elegante',
  moderno: 'minimalista',
  minimalista: 'moderno',
  artesanal: 'rústico',
  rústico: 'artesanal',
};

const HEAVY_ELEMENTS = new Set(['fullbleed-video', '3d-model', 'parallax', 'animations-gsap', 'masonry']);

// Filtro obligatorio: si el nicho exacto tiene menos de 3 patrones, se amplía con estos
// nichos afines antes de scorear — nunca se scorea contra el corpus completo sin filtrar.
const SIMILAR_NICHES = {
  restaurant: ['cafe', 'burger', 'food', 'bar', 'hotel'],
  burger: ['restaurant', 'food'],
  cafe: ['restaurant', 'food', 'bar'],
  beauty: ['fashion', 'wellness'],
  dental: ['healthcare'],
  agency: ['studio', 'saas'],
  studio: ['agency', 'portfolio'],
  portfolio: ['studio', 'agency'],
  realestate: ['architecture', 'hotel'],
  fitness: ['wellness', 'education'],
  hotel: ['restaurant', 'realestate'],
  saas: ['agency', 'studio'],
  education: ['saas', 'agency'],
  fashion: ['beauty', 'ecommerce'],
  music: ['studio', 'portfolio'],
  architecture: ['realestate', 'studio'],
  food: ['restaurant', 'cafe', 'burger'],
  bar: ['restaurant', 'cafe'],
  ecommerce: ['fashion', 'food'],
};

const HERO_TYPE_TO_ELEMENT = {
  'fullbleed-video': 'fullbleed-video',
  'editorial-type': 'typography-focus',
  split: 'grid',
  centered: 'typography-focus',
};

function moodScore(pattern, analysis, reasons) {
  if (!analysis.mood) return 0;
  if (pattern.mood === analysis.mood) {
    reasons.push(`mood "${pattern.mood}" coincide exacto (+40)`);
    return 40;
  }
  if (MOOD_COMPATIBLE[analysis.mood] === pattern.mood) {
    reasons.push(`mood "${pattern.mood}" compatible con "${analysis.mood}" (+20)`);
    return 20;
  }
  return 0;
}

function elementsScore(pattern, analysis, reasons) {
  let score = 0;
  const heroEl = HERO_TYPE_TO_ELEMENT[analysis.hero_type];
  if (heroEl && pattern.elements.includes(heroEl)) {
    reasons.push(`tiene ${heroEl} (coincide con hero_type "${analysis.hero_type}", +10)`);
    score += 10;
  }
  for (const el of pattern.elements) {
    const isHeavyEl = HEAVY_ELEMENTS.has(el);
    if (analysis.weight === 'heavy' && isHeavyEl) {
      reasons.push(`elemento "${el}" es heavy, coincide con weight heavy (+5)`);
      score += 5;
    } else if (analysis.weight === 'adaptable' && !isHeavyEl) {
      score += 5;
    }
  }
  return Math.min(score, 30);
}

function weightScore(pattern, analysis, reasons) {
  if (!analysis.weight) return 0;
  if (pattern.weight === analysis.weight) {
    reasons.push(`weight "${pattern.weight}" coincide exacto (+20)`);
    return 20;
  }
  if (pattern.weight === 'adaptable' || analysis.weight === 'adaptable') {
    reasons.push('weight adaptable, parcialmente compatible (+10)');
    return 10;
  }
  return 0;
}

function keywordsScore(pattern, analysis, reasons) {
  if (!Array.isArray(analysis.keywords) || !analysis.keywords.length) return 0;
  const haystack = pattern.description.toLowerCase();
  let score = 0;
  for (const kw of analysis.keywords) {
    if (!kw) continue;
    if (haystack.includes(String(kw).toLowerCase())) {
      reasons.push(`keyword "${kw}" encontrada en la descripción (+2)`);
      score += 2;
    }
    if (score >= 10) break;
  }
  return Math.min(score, 10);
}

function scorePattern(pattern, analysis, niche) {
  const reasons = [];
  const sameNiche = niche != null && pattern.niche === niche;
  if (sameNiche) reasons.push('mismo nicho');
  else reasons.push(`nicho diferente ("${pattern.niche}" vs "${niche}") — score reducido 50%`);

  const raw =
    moodScore(pattern, analysis, reasons) +
    elementsScore(pattern, analysis, reasons) +
    weightScore(pattern, analysis, reasons) +
    keywordsScore(pattern, analysis, reasons);

  const score = Math.round(sameNiche ? raw : raw * 0.5);
  return { pattern, score, reasons };
}

function candidatesFor(niche) {
  const exact = corpus.patterns.filter((p) => p.niche === niche);
  if (exact.length >= 3) return exact;

  const similar = SIMILAR_NICHES[niche] || [];
  const extra = corpus.patterns.filter((p) => p.niche !== niche && similar.includes(p.niche));
  const combined = [...exact, ...extra];
  // Último recurso: nicho desconocido y sin similares definidos -> corpus completo,
  // para no devolver un TOP vacío.
  return combined.length ? combined : corpus.patterns;
}

export function findTopPatterns(analysis, niche, count = 3) {
  if (!analysis) throw new Error('missing_analysis');
  const candidates = candidatesFor(niche);
  const results = candidates.map((pattern) => scorePattern(pattern, analysis, niche));
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
}
