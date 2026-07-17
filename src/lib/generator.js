// src/lib/generator.js — motor de generación de la landing final (Step-4, "el WOW").
// Arma un page.json en memoria a partir de negocio + patrón elegido + análisis de la IA +
// arquetipo, y lo renderiza a un único HTML auto-contenido, ahora integrando la skill
// "adrian-saenz-hostinger-premium-website": cada uno de los 38 arquetipos de Weave
// (niche+mood) se mapea a UNO de los 10 arquetipos visuales de esa skill (paleta
// estructural + tipografía + hero + efecto firma propios), con GSAP/ScrollTrigger vía CDN
// para el sistema de reveals y el efecto firma de cada arquetipo.
//
// Fotos: business.photos (array de data URLs, tal como las guarda step-2) se embeben
// directo en el HTML sin reprocesar — decisión explícita: sin dependencia nueva (sharp),
// el trade-off es que el HTML final pesa lo que pesen las fotos originales.
//
// GSAP: se referencia por CDN (<script src="https://cdn.jsdelivr.net/...">), no inline —
// decisión explícita: HTML final liviano, a costa de necesitar internet la primera carga.

const NAV_BY_NICHE = {
  cafe: { links: ['Menú', 'Nosotros', 'Ubicación'], cta: 'Reservar' },
  restaurant: { links: ['Carta', 'Reservas', 'Nosotros'], cta: 'Reservar' },
  burger: { links: ['Menu', 'Locales', 'Sobre Nosotros'], cta: 'Reservar' },
  beauty: { links: ['Servicios', 'Galería', 'Reservar'], cta: 'Turno online' },
  dental: { links: ['Servicios', 'Equipo', 'Turnos'], cta: 'Turno online' },
};
const NAV_DEFAULT = { links: ['Servicios', 'Nosotros', 'Contacto'], cta: 'Contactar' };

const GALLERY_TITLE_BY_NICHE = {
  cafe: 'Nuestros cafés',
  restaurant: 'Nuestra carta',
  burger: 'Nuestras hamburguesas',
  beauty: 'Nuestros servicios',
};
const GALLERY_TITLE_DEFAULT = 'Lo que hacemos';

const MENU_TITLE_BY_NICHE = {
  cafe: 'Carta',
  restaurant: 'Menú',
  burger: 'Menú',
  beauty: 'Servicios',
  dental: 'Tratamientos',
};
const MENU_TITLE_DEFAULT = 'Carta';

const CTA_SUB_BY_NICHE = {
  cafe: 'Vení a probar tu próximo café favorito.',
  restaurant: 'Reservá tu mesa y viví la experiencia.',
  burger: 'Pedí el tuyo, sin vueltas.',
  beauty: 'Reservá tu turno y date un gusto.',
  dental: 'Pedí tu turno hoy mismo.',
};
const CTA_SUB_DEFAULT = 'Escribinos y te contamos todo.';

const CTA_HEADLINE_BY_NICHE = {
  cafe: 'Te esperamos con la mesa lista',
  restaurant: 'Reservá tu mesa',
  burger: 'Pedí la tuya',
  beauty: 'Reservá tu turno',
  dental: 'Pedí tu turno',
};
const CTA_HEADLINE_DEFAULT = '¿Querés conocernos?';

// Fotos provisorias de Unsplash cuando el negocio no subió las propias — verificadas (200 OK)
// antes de integrarlas. Se reemplazan por las reales del negocio en cuanto las suba.
const UNSPLASH = {
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80',
    'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800&q=80',
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=80',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&q=80',
    'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&q=80',
  ],
  dental: [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80',
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80',
  ],
  agency: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  ],
  hotel: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c4fe1da0?w=800&q=80',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  ],
  realestate: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
  ],
  saas: [
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  ],
};

const HEADLINES = {
  'cafe|artesanal': 'Cada taza, una historia.',
  'cafe|moderno': 'Coffee that moves you.',
  'cafe|minimalista': null, // usa business.name
  'restaurant|elegante': 'Una experiencia gastronómica.',
  'restaurant|moderno': 'Sabores que inspiran.',
  'burger|moderno': 'Craft burgers. Sin compromisos.',
  'burger|playful': '¿Con todo?',
  'beauty|premium': 'Tu mejor versión.',
  'dental|elegante': 'Tu sonrisa, nuestra pasión.',
};

// ── Mapeo: 38 arquetipos Weave (niche-mood, archetypes.json) → 10 arquetipos visuales
// de la skill (reference/02-archetypes.md). Cada uno de los 10 fija estructura (brillo,
// tipografía, radios, efecto firma); el color de acento se personaliza por negocio.
const ARCHETYPE_SKILL_MAP = {
  'cafe-minimalista': 'cream', 'cafe-premium': 'magazine',
  'restaurant-minimalista': 'newspaper', 'restaurant-premium': 'darkWarm',
  'burger-minimalista': 'brutalist', 'burger-premium': 'darkWarm',
  'beauty-minimalista': 'glass', 'beauty-premium': 'cream',
  'dental-minimalista': 'glass', 'dental-premium': 'newspaper',
  'agency-minimalista': 'mouseGradient', 'agency-premium': 'cinematic3d',
  'studio-minimalista': 'brutalist', 'studio-premium': 'cinematic3d',
  'portfolio-minimalista': 'mouseGradient', 'portfolio-premium': 'spline',
  'ecommerce-minimalista': 'magazine', 'ecommerce-premium': 'spline',
  'realestate-minimalista': 'cream', 'realestate-premium': 'cinematic3d',
  'fitness-minimalista': 'glass', 'fitness-premium': 'liquidWave',
  'bar-minimalista': 'glass', 'bar-premium': 'darkWarm',
  'hotel-minimalista': 'magazine', 'hotel-premium': 'cream',
  'saas-minimalista': 'mouseGradient', 'saas-premium': 'spline',
  'education-minimalista': 'magazine', 'education-premium': 'cinematic3d',
  'fashion-minimalista': 'mouseGradient', 'fashion-premium': 'spline',
  'music-minimalista': 'brutalist', 'music-premium': 'darkWarm',
  'architecture-minimalista': 'brutalist', 'architecture-premium': 'newspaper',
  'food-minimalista': 'liquidWave', 'food-premium': 'cream',
};

// Estructura fija por arquetipo (bg/ink/tipografía/radios/efecto firma). El accent SIEMPRE
// se personaliza con analysis.colors.accent (fallback al accent de referencia del arquetipo).
const SKILL_ARCHETYPES = {
  cream: {
    label: 'Editorial Light Cream', brightness: 'light', signature: 'tilt-halo',
    bg: '#f4efe6', bg2: '#e8dfd0', paper: '#ffffff', ink: '#1a1a1a', inkMute: '#6b6b6b',
    line: 'rgba(26,26,26,0.12)', defaultAccent: '#b85c3a',
    font: { display: 'Fraunces', body: 'Inter', fallback: 'serif' }, radius: 22, italic: true,
  },
  darkWarm: {
    label: 'Editorial Dark Warm', brightness: 'dark', signature: 'mesh-gradient',
    bg: '#0E0B09', bg2: '#15110E', paper: '#1E1813', ink: '#F2EBDA', inkMute: '#8B7E68',
    line: 'rgba(242,235,218,.12)', defaultAccent: '#C5301E',
    font: { display: 'Fraunces', body: 'Inter', fallback: 'serif' }, radius: 18, italic: true,
  },
  cinematic3d: {
    label: 'Cinematic 3D Storytelling', brightness: 'dark', signature: 'floating-shapes',
    bg: '#050302', bg2: '#0f0904', paper: 'rgba(5,3,2,0.92)', ink: '#f4ead5', inkMute: 'rgba(244,234,213,0.6)',
    line: 'rgba(244,234,213,.14)', defaultAccent: '#d4af37',
    font: { display: 'Playfair Display', body: 'Inter', fallback: 'serif' }, radius: 16, italic: true,
  },
  glass: {
    label: 'Glassmorphism Modern', brightness: 'light', signature: 'magnetic',
    bg: '#f5f0ea', bg2: '#ffe0cc', paper: 'rgba(255,255,255,0.45)', ink: '#1f2937', inkMute: '#4b5563',
    line: 'rgba(31,41,55,0.12)', defaultAccent: '#ff7a59',
    font: { display: 'Manrope', body: 'Inter', fallback: 'sans-serif' }, radius: 24, italic: false,
  },
  mouseGradient: {
    label: 'Mouse-Reactive Gradient', brightness: 'dark', signature: 'mouse-gradient',
    bg: '#0a0a0a', bg2: '#1a1a1a', paper: '#141414', ink: '#fafafa', inkMute: '#a3a3a3',
    line: 'rgba(250,250,250,.12)', defaultAccent: '#00ff88',
    font: { display: 'Space Grotesk', body: 'Inter', fallback: 'sans-serif' }, radius: 12, italic: false,
  },
  magazine: {
    label: 'Magazine Multi-Page', brightness: 'light', signature: 'marquee',
    bg: '#f8f5f0', bg2: '#efe9dd', paper: '#ffffff', ink: '#1a1714', inkMute: '#6e6760',
    line: '#1a1714', defaultAccent: '#a02824',
    font: { display: 'Bodoni Moda', body: 'Source Serif 4', fallback: 'serif' }, radius: 4, italic: false,
  },
  brutalist: {
    label: 'Brutalist Grid', brightness: 'light', signature: 'hover-invert',
    bg: '#ffffff', bg2: '#f2f2f2', paper: '#ffffff', ink: '#000000', inkMute: '#4a4a4a',
    line: '#000000', defaultAccent: '#ff0000',
    font: { display: 'IBM Plex Mono', body: 'IBM Plex Mono', fallback: 'monospace' }, radius: 0, italic: false,
  },
  liquidWave: {
    label: 'Liquid Wave', brightness: 'light', signature: 'wave',
    bg: '#e0f7fa', bg2: '#b2ebf2', paper: '#ffffff', ink: '#001f25', inkMute: '#3a5c60',
    line: 'rgba(0,31,37,0.12)', defaultAccent: '#00bfa5',
    font: { display: 'Poppins', body: 'Inter', fallback: 'sans-serif' }, radius: 28, italic: false,
  },
  newspaper: {
    label: 'Newspaper Editorial', brightness: 'light', signature: 'dropcap',
    bg: '#faf7f0', bg2: '#efe9dc', paper: '#ffffff', ink: '#16140e', inkMute: '#6e6760',
    line: '#16140e', defaultAccent: '#960018',
    font: { display: 'Playfair Display', body: 'Source Serif 4', fallback: 'serif' }, radius: 2, italic: false,
  },
  spline: {
    label: 'Spline Embed Premium', brightness: 'dark', signature: 'fake-3d',
    bg: '#0a0a14', bg2: '#1e1b3a', paper: '#12122a', ink: '#f0f0f5', inkMute: 'rgba(240,240,245,0.7)',
    line: 'rgba(240,240,245,.12)', defaultAccent: '#00d9ff',
    font: { display: 'Space Grotesk', body: 'Inter', fallback: 'sans-serif' }, radius: 20, italic: false,
  },
};

const VARIANT_POOLS = {
  cafe: ['cream', 'magazine', 'newspaper', 'darkWarm', 'glass'],
  restaurant: ['darkWarm', 'newspaper', 'cream', 'magazine', 'cinematic3d'],
  burger: ['brutalist', 'darkWarm', 'magazine', 'mouseGradient'],
  beauty: ['cream', 'glass', 'magazine', 'liquidWave'],
  dental: ['glass', 'newspaper', 'cream', 'brutalist'],
  agency: ['mouseGradient', 'cinematic3d', 'brutalist', 'spline'],
  food: ['liquidWave', 'cream', 'magazine', 'glass'],
  default: ['cream', 'magazine', 'glass', 'mouseGradient'],
};

const FONT_PAIRINGS = {
  cream: [{ display: 'Fraunces' }, { display: 'Cormorant Garamond' }, { display: 'Playfair Display' }, { display: 'Spectral' }],
  magazine: [{ display: 'Bodoni Moda' }, { display: 'Playfair Display' }, { display: 'Lora' }],
  newspaper: [{ display: 'Playfair Display' }, { display: 'Bodoni Moda' }, { display: 'Lora' }],
  darkWarm: [{ display: 'Fraunces' }, { display: 'Playfair Display' }, { display: 'Cormorant Garamond' }],
  glass: [{ display: 'Manrope' }, { display: 'Sora' }, { display: 'Poppins' }],
  brutalist: [{ display: 'IBM Plex Mono', body: 'IBM Plex Mono' }, { display: 'Fira Code', body: 'Fira Code' }, { display: 'JetBrains Mono', body: 'JetBrains Mono' }],
  mouseGradient: [{ display: 'Space Grotesk' }, { display: 'Sora' }, { display: 'Syne' }],
  liquidWave: [{ display: 'Poppins' }, { display: 'Quicksand' }, { display: 'Nunito' }],
  cinematic3d: [{ display: 'Playfair Display' }, { display: 'Cormorant Garamond' }, { display: 'Fraunces' }],
};

function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSeeded(arr, rng) {
  return arr[Math.floor(rng() * arr.length)] || arr[0];
}

// Semilla estable: SOLO nombre + niche. description/prompt/mood NO entran (son
// modificadores de contenido, no de cara visual). Si el usuario fijo colorMode, se
// respeta ese brillo. La rotacion solo decide lo que Weave elige por el usuario.
export function selectVisualVariant(data, archetype) {
  const niche = (data && data.niche) || (archetype && archetype.niche) || 'default';
  const defaultSkKey = ARCHETYPE_SKILL_MAP[archetype && archetype.id] || 'cream';

  const seedStr = slugify(data && data.name) + '|' + niche;
  const rng = mulberry32(hashSeed(seedStr));

  const userBrightness = (data && data.colorMode === 'dark') ? 'dark'
    : (data && data.colorMode === 'light') ? 'light' : null;

  let pool = (VARIANT_POOLS[niche] || VARIANT_POOLS.default).slice();
  if (!pool.includes(defaultSkKey)) pool.unshift(defaultSkKey);
  if (userBrightness) {
    const filtered = pool.filter((k) => SKILL_ARCHETYPES[k] && SKILL_ARCHETYPES[k].brightness === userBrightness);
    pool = filtered.length ? filtered
      : Object.keys(SKILL_ARCHETYPES).filter((k) => SKILL_ARCHETYPES[k].brightness === userBrightness);
  }

  const skKey = pickSeeded(pool, rng);

  const pairings = FONT_PAIRINGS[skKey] || [{ display: SKILL_ARCHETYPES[skKey].font.display }];
  const pairing = pickSeeded(pairings, rng);
  const displayFont = pairing.display;
  const bodyFont = pairing.body || SKILL_ARCHETYPES[skKey].font.body;

  const density = pickSeeded(['compact', 'regular', 'regular', 'airy'], rng);
  const cardStyle = pickSeeded(['soft', 'sharp', 'framed'], rng);
  const ctaShape = pickSeeded(['pill', 'rounded', 'sharp'], rng);
  const bgTreatment = pickSeeded(['plain', 'grain', 'glow'], rng);

  const alignable = ['cream', 'darkWarm', 'cinematic3d', 'glass', 'mouseGradient', 'liquidWave', 'spline'];
  const heroAlign = alignable.includes(skKey) ? pickSeeded(['center', 'left'], rng) : 'center';

  const galleryVariant = pickSeeded(['grid', 'grid', 'masonry'], rng);
  const featuresFirst = rng() < 0.5;

  const paletteByUser = (data && (data.colorMode === 'dark' || data.colorMode === 'light'))
    && !!(data.colors && data.colors.primary && data.colors.accent);

  return {
    skKey: skKey,
    displayFont: displayFont,
    bodyFont: bodyFont,
    density: density,
    cardStyle: cardStyle,
    ctaShape: ctaShape,
    bgTreatment: bgTreatment,
    heroAlign: heroAlign,
    galleryVariant: galleryVariant,
    featuresFirst: featuresFirst,
    seed: seedStr,
    brightnessLockedByUser: !!userBrightness,
    paletteByUser: paletteByUser,
  };
}

function navFor(niche) {
  return NAV_BY_NICHE[niche] || NAV_DEFAULT;
}

function slugify(str) {
  return String(str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'negocio';
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function darken(hexColor, factor) {
  const hex = String(hexColor || '#111111').replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.padEnd(6, '0');
  const r = clamp(Math.round(parseInt(full.slice(0, 2), 16) * (1 - factor)), 0, 255);
  const g = clamp(Math.round(parseInt(full.slice(2, 4), 16) * (1 - factor)), 0, 255);
  const b = clamp(Math.round(parseInt(full.slice(4, 6), 16) * (1 - factor)), 0, 255);
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ── Copy generado (headline / subheadline / features) desde datos reales del negocio.
// Nunca inventa datos concretos (platos, premios, años, métricas): se apoya en description,
// analysis.keywords, niche y prompt. Cuando no alcanza, cae en un fallback por nicho —
// jamás en el nombre pelado como único titular.
const HEADLINE_FALLBACK_BY_NICHE = {
  cafe: 'Café de especialidad y cocina honesta',
  restaurant: 'Cocina con identidad, mesa por mesa',
  burger: 'Hamburguesas de verdad, sin vueltas',
  beauty: 'Tu mejor versión, en cada detalle',
  dental: 'Tu sonrisa, en las mejores manos',
};
const HEADLINE_FALLBACK_DEFAULT = 'Hecho con oficio, pensado para vos';

const HEADLINE_TAIL_BY_NICHE = {
  cafe: ', todos los días',
  restaurant: ', en cada plato',
  burger: ', sin vueltas',
  beauty: ', con dedicación',
  dental: ', con confianza',
};
const HEADLINE_TAIL_DEFAULT = ', con oficio';

const NICHE_STOPWORDS = {
  cafe: ['cafe', 'cafeteria', 'coffee'],
  restaurant: ['restaurante', 'restaurant', 'resto'],
  burger: ['hamburgueseria', 'hamburguesas', 'burger', 'burgers'],
  beauty: ['peluqueria', 'estetica', 'beauty', 'salon'],
  dental: ['odontologia', 'dental', 'dentista', 'consultorio'],
};

function escapeRegExp(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capFirst(str) {
  const t = String(str || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Primera oración de un texto (hasta el primer . ! ?), o el texto entero si no hay cierre.
function firstSentenceOf(text) {
  const t = String(text || '').trim();
  const m = t.match(/[^.!?]*[.!?]/);
  return (m ? m[0] : t).trim();
}

function naturalList(items) {
  const a = (items || []).filter(Boolean);
  if (a.length <= 1) return a[0] || '';
  if (a.length === 2) return `${a[0]} y ${a[1]}`;
  return `${a.slice(0, -1).join(', ')} y ${a[a.length - 1]}`;
}

// Keywords de la IA, limpias: sin vacíos ni duplicados y descartando las que sólo repiten el
// nombre del negocio o la palabra del nicho (no aportan como titular/feature).
function cleanKeywords(keywords, business) {
  if (!Array.isArray(keywords)) return [];
  const stop = new Set([
    ...slugify(business && business.name).split('-'),
    ...((business && NICHE_STOPWORDS[business.niche]) || []),
  ]);
  const seen = new Set();
  const out = [];
  for (const raw of keywords) {
    const kw = String(raw == null ? '' : raw).trim();
    if (!kw) continue;
    const norm = slugify(kw);
    if (!norm || seen.has(norm) || stop.has(norm)) continue;
    seen.add(norm);
    out.push(kw);
  }
  return out;
}

// Titular desde la descripción real: primera oración, sin arranques débiles ("{nombre} es
// un…", "somos", "bienvenidos a"), recortada a una cláusula si queda larga.
function headlineFromDescription(business) {
  const desc = ((business && business.description) || '').trim();
  if (!desc) return null;
  let s = firstSentenceOf(desc).replace(/[.!?]+$/, '').trim();
  const nameEsc = escapeRegExp(business.name || '');
  if (nameEsc) {
    s = s.replace(new RegExp('^' + nameEsc + '\\s+(es|somos)\\s+(un[oa]?\\s+|el\\s+|la\\s+)?', 'i'), '');
  }
  s = s.replace(/^(somos|bienvenid[oa]s?\s+a|conoc[eé]|descubr[ií])\s+(un[oa]?\s+|el\s+|la\s+)?/i, '');
  s = s.replace(/^(un[oa]?\s+|el\s+|la\s+)/i, '').trim();
  if (s.length > 72) {
    const comma = s.indexOf(',');
    if (comma > 15) s = s.slice(0, comma).trim();
  }
  s = capFirst(s);
  const words = s.split(/\s+/).filter(Boolean).length;
  return (s.length >= 16 && s.length <= 72 && words >= 3) ? s : null;
}

// Titular desde las keywords reales + una cola por nicho.
function headlineFromKeywords(business, keywords) {
  const kws = cleanKeywords(keywords, business).slice(0, 3).map((k) => k.toLowerCase());
  if (kws.length < 2) return null;
  const tail = HEADLINE_TAIL_BY_NICHE[business.niche] || HEADLINE_TAIL_DEFAULT;
  return capFirst(naturalList(kws)) + tail;
}

function generarHeadline(business, analysis) {
  const key = `${business.niche}|${analysis.mood}`;
  // Slogan curado por (nicho, mood) si existe y no es null (los null piden síntesis).
  if (Object.prototype.hasOwnProperty.call(HEADLINES, key) && HEADLINES[key]) {
    return HEADLINES[key];
  }
  // Sin slogan curado: sintetizamos algo específico. El nombre queda como marca (nav/kicker),
  // nunca como único titular.
  return headlineFromDescription(business)
    || headlineFromKeywords(business, analysis.keywords)
    || HEADLINE_FALLBACK_BY_NICHE[business.niche]
    || HEADLINE_FALLBACK_DEFAULT;
}

function generarSubheadline(business) {
  const desc = (business.description || '').trim();
  if (!desc) return SUBHEAD_FALLBACK_BY_NICHE[business.niche] || SUBHEAD_FALLBACK_DEFAULT;
  const sentence = firstSentenceOf(desc);
  // Preferimos la primera oración completa (mantiene su puntuación, no queda cortada).
  if (sentence.length <= 160) return sentence;
  // Muy larga: cortamos en una cláusula natural (coma / ; / raya), nunca a mitad de palabra.
  const slice = sentence.slice(0, 160);
  const boundary = Math.max(slice.lastIndexOf(','), slice.lastIndexOf(';'), slice.lastIndexOf(' — '));
  if (boundary >= 60) return slice.slice(0, boundary).replace(/[\s,;—]+$/, '').trim() + '.';
  return SUBHEAD_FALLBACK_BY_NICHE[business.niche] || SUBHEAD_FALLBACK_DEFAULT;
}

const SUBHEAD_FALLBACK_BY_NICHE = {
  cafe: 'Un café para quedarse, con todo hecho como corresponde.',
  restaurant: 'Cocina con identidad y una mesa esperándote.',
  burger: 'Hamburguesas que valen cada mordida.',
  beauty: 'Un espacio pensado para que te sientas bien.',
  dental: 'Atención cercana y profesional para toda la familia.',
};
const SUBHEAD_FALLBACK_DEFAULT = 'Conocé lo que hacemos y por qué nos elegís.';

function buildSections(business, pattern, archetype, variant) {
  const nav = navFor(business.niche);
  const sections = [];

  sections.push({
    type: 'navbar',
    variant: 'transparent',
    logo: business.name,
    links: nav.links,
    cta: nav.cta,
  });

  sections.push({
    type: 'hero',
    brand: business.name,
    headline: generarHeadline(business, { mood: archetype.mood, keywords: archetype.__keywords }),
    subheadline: generarSubheadline(business),
    cta: nav.cta,
  });

  const elements = archetype.elements || [];
  const galleryVariant = (variant && variant.galleryVariant)
    || (elements.includes('masonry') ? 'masonry' : 'grid');
  const gallerySection = {
    type: 'gallery',
    variant: galleryVariant,
    title: GALLERY_TITLE_BY_NICHE[business.niche] || GALLERY_TITLE_DEFAULT,
  };
  const featuresSection = elements.includes('parallax')
    ? { type: 'features', title: 'Por qué elegirnos', items: buildFeatureItems(business, archetype) }
    : null;

  // Ritmo de secciones: la variante puede anteponer "por qué elegirnos" a la galería.
  if (featuresSection && variant && variant.featuresFirst) {
    sections.push(featuresSection, gallerySection);
  } else {
    sections.push(gallerySection);
    if (featuresSection) sections.push(featuresSection);
  }

  sections.push(...buildPromptSections(business));

  sections.push({
    type: 'cta',
    headline: CTA_HEADLINE_BY_NICHE[business.niche] || CTA_HEADLINE_DEFAULT,
    sub: CTA_SUB_BY_NICHE[business.niche] || CTA_SUB_DEFAULT,
    cta: nav.cta,
    whatsapp: waLink(business.whatsapp),
  });

  sections.push({
    type: 'footer',
    logo: business.name,
    instagram: business.instagram || null,
    whatsapp: waLink(business.whatsapp),
    year: new Date().getFullYear(),
  });

  return sections;
}

const FEATURE_TITLES_BY_NICHE = {
  cafe: ['Café de especialidad', 'Ambiente', 'Hecho en casa'],
  restaurant: ['Cocina de autor', 'Producto fresco', 'Buena mesa'],
  burger: ['Carne de verdad', 'Punto justo', 'Sin vueltas'],
  beauty: ['Detalle', 'Cuidado', 'Buen trato'],
  dental: ['Profesionalismo', 'Confianza', 'Cercanía'],
};
const FEATURE_TITLES_DEFAULT = ['Calidad', 'Atención', 'Experiencia'];

const FEATURE_BODY_BY_NICHE = {
  cafe: [
    'Grano seleccionado y método cuidado en cada taza.',
    'Un lugar tranquilo para trabajar, leer o encontrarse.',
    'Pastelería y cocina hechas en casa, todos los días.',
  ],
  restaurant: [
    'Cocina con identidad, pensada plato por plato.',
    'Producto fresco y de estación como punto de partida.',
    'Un servicio atento que da ganas de volver.',
  ],
  burger: [
    'Carne fresca y pan del día, nada congelado.',
    'El punto justo, cada vez que venís.',
    'Sabor directo, sin poses ni vueltas.',
  ],
  beauty: [
    'Cada detalle pensado para que te sientas bien.',
    'Profesionales que escuchan lo que buscás.',
    'Un espacio para cortar con la rutina.',
  ],
  dental: [
    'Atención profesional con tecnología al día.',
    'Un trato cercano que baja los nervios.',
    'Cuidamos tu sonrisa a largo plazo.',
  ],
};
const FEATURE_BODY_DEFAULT = [
  'Trabajo hecho con oficio y atención al detalle.',
  'Cerca tuyo, con la atención que esperás.',
  'La experiencia importa tanto como el resultado.',
];

// Títulos: keywords reales primero, completando con los del nicho. Sin duplicados.
function pickFeatureTitles(keywords, business) {
  const fromKw = cleanKeywords(keywords, business).map(capFirst);
  const fallback = FEATURE_TITLES_BY_NICHE[business.niche] || FEATURE_TITLES_DEFAULT;
  const out = [];
  const seen = new Set();
  for (const t of fromKw.concat(fallback)) {
    const norm = slugify(t);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(t);
    if (out.length === 3) break;
  }
  return out;
}

// Cuerpos: 3 frases distintas. Suma señales reales (menú, testimonios, prompt) y completa con
// el pool del nicho. Nunca inventa platos, métricas ni premios.
function pickFeatureBodies(business) {
  const prompt = (business.prompt || '').toLowerCase();
  const hasMenu = Array.isArray(business.menu) && business.menu.some((it) => it && it.name);
  const hasTestimonials = Array.isArray(business.testimonials) && business.testimonials.some((t) => t && t.quote);
  const dynamic = [];
  if (hasMenu) dynamic.push('Una carta corta y bien pensada, sin relleno.');
  if (hasTestimonials) dynamic.push('Lo que dicen quienes ya vinieron habla por nosotros.');
  if (/delivery|pedidos? ya|take ?away|para llevar|env[ií]o/.test(prompt)) {
    dynamic.push('Pedí y llevá, con la misma calidad de siempre.');
  }
  if (/reservas?|reservar/.test(prompt)) {
    dynamic.push('Reservá con tiempo y asegurate tu lugar.');
  }
  const pool = FEATURE_BODY_BY_NICHE[business.niche] || FEATURE_BODY_DEFAULT;
  const out = [];
  const seen = new Set();
  for (const b of dynamic.concat(pool, FEATURE_BODY_DEFAULT)) {
    if (!b || seen.has(b)) continue;
    seen.add(b);
    out.push(b);
    if (out.length === 3) break;
  }
  return out;
}

function buildFeatureItems(business, archetype) {
  const titles = pickFeatureTitles(archetype.__keywords, business);
  const bodies = pickFeatureBodies(business);
  return titles.map((title, i) => ({ title, body: bodies[i] }));
}

// WhatsApp → link wa.me con solo dígitos (evita inyección y links basura). '' si no alcanza.
function waLink(raw) {
  const digits = String(raw == null ? '' : raw).replace(/\D/g, '');
  return digits.length >= 6 ? 'https://wa.me/' + digits : '';
}

// Link externo seguro: solo http/https. Bloquea esquemas peligrosos (javascript:, data:, etc.).
// '' si no es una URL http(s) válida — el caller decide no renderizar el link.
function safeHttpUrl(raw) {
  const u = String(raw == null ? '' : raw).trim();
  return /^https?:\/\//i.test(u) ? u : '';
}

// Secciones opcionales: se activan por prompt, por feature elegida, o porque el usuario cargó
// el dato real (menú/dirección/testimonios). Sin dato real, cada render muestra su nota discreta.
function buildPromptSections(business) {
  const p = (business.prompt || '').toLowerCase();
  const feat = Array.isArray(business.features) ? business.features : [];
  const menu = Array.isArray(business.menu) ? business.menu : null;
  const testimonials = Array.isArray(business.testimonials) ? business.testimonials : null;
  const address = (typeof business.address === 'string' && business.address.trim()) ? business.address.trim() : null;
  const whatsapp = waLink(business.whatsapp);
  const sections = [];
  if (/reservas?|reservar/.test(p)) {
    sections.push({ type: 'reservations', title: 'Reservá tu lugar' });
  }
  if (/men[uú]|carta/.test(p) || feat.includes('menu') || feat.includes('pricing') || (menu && menu.length)) {
    sections.push({
      type: 'menu',
      title: MENU_TITLE_BY_NICHE[business.niche] || MENU_TITLE_DEFAULT,
      items: menu,
    });
  }
  if (/ubicaci[oó]n|mapa/.test(p) || feat.includes('map') || address) {
    sections.push({
      type: 'map',
      title: 'Dónde encontrarnos',
      address,
      whatsapp,
    });
  }
  if (/testimonios?|reviews?|opiniones/.test(p) || feat.includes('testimonials') || (testimonials && testimonials.length)) {
    sections.push({
      type: 'testimonials',
      title: 'Lo que dicen de nosotros',
      items: testimonials,
    });
  }
  return sections;
}

// ── Render de secciones a HTML ───────────────────────────────────────────────

function renderNavbar(s) {
  return `
  <header class="wv-nav reveal">
    <a class="wv-nav__logo" href="#">${escapeHtml(s.logo)}</a>
    <nav class="wv-nav__links">
      ${s.links.map((l) => `<a href="#">${escapeHtml(l)}</a>`).join('')}
    </nav>
    <a class="wv-btn wv-btn--accent wv-btn--sm" href="#cta">${escapeHtml(s.cta)}</a>
  </header>`;
}

// ── Hero: un patrón HTML distinto por arquetipo visual (skill 02-archetypes.md) ──────
function renderHero(s, skKey, sk, photos) {
  const heroPhoto = photos[0] || null;
  const heroPhotoSrc = heroPhoto ? escapeHtml(heroPhoto) : '';
  const title = escapeHtml(s.headline);
  const sub = escapeHtml(s.subheadline);
  const cta = escapeHtml(s.cta);
  const bgImg = heroPhoto ? `<img src="${heroPhotoSrc}" class="wv-hero__photo" alt="" />` : '';

  if (skKey === 'darkWarm') {
    return `
  <section class="wv-hero wv-hero--darkWarm${heroPhoto ? ' wv-hero--photo' : ''}">
    ${bgImg}
    <div class="wv-hero__mesh" aria-hidden="true"></div>
    <div class="wv-hero__scrim" aria-hidden="true"></div>
    <div class="wv-hero__inner reveal">
      <p class="wv-hero__kicker"><span class="wv-dot"></span> ${escapeHtml(s.brand)}</p>
      <h1 class="wv-hero__title" data-anime-text>${escapeHtml(s.headline)}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <div class="wv-hero__actions">
        <a class="wv-btn wv-btn--accent wv-btn--lg" href="#cta">${cta} →</a>
        <a class="wv-btn wv-btn--ghost wv-btn--lg" href="#gallery">Ver más</a>
      </div>
    </div>
  </section>`;
  }

  if (skKey === 'cinematic3d') {
    return `
  <section class="wv-hero wv-hero--cinematic3d">
    <div id="wv-particles" class="wv-hero__particles" aria-hidden="true"></div>
    <div class="wv-hero__shapes" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="wv-hero__vignette" aria-hidden="true"></div>
    <div class="wv-hero__inner reveal">
      <p class="wv-hero__kicker">${escapeHtml(s.cta)} · ${new Date().getFullYear()}</p>
      <h1 class="wv-hero__title">${title}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <a class="wv-btn wv-btn--accent wv-btn--lg" href="#cta">${cta} →</a>
    </div>
  </section>`;
  }

  if (skKey === 'glass') {
    return `
  <section class="wv-hero wv-hero--glass">
    <div class="wv-hero__mesh-soft" aria-hidden="true"></div>
    <div class="wv-hero__inner reveal">
      <h1 class="wv-hero__title">${title}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <a class="wv-btn wv-btn--glass wv-btn--lg" data-magnetic href="#cta">${cta} →</a>
    </div>
    ${heroPhoto ? `<img src="${heroPhotoSrc}" class="wv-hero__floating" alt="" />` : ''}
  </section>`;
  }

  if (skKey === 'mouseGradient') {
    return `
  <section class="wv-hero wv-hero--mouseGradient">
    <div class="wv-hero__gradient" data-mouse-gradient aria-hidden="true"></div>
    <div class="wv-hero__inner reveal">
      <h1 class="wv-hero__title wv-hero__title--massive">${title}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <a class="wv-btn wv-btn--accent wv-btn--lg" href="#cta">${cta} →</a>
    </div>
  </section>`;
  }

  if (skKey === 'magazine') {
    return `
  <section class="wv-hero wv-hero--magazine">
    <div class="wv-masthead reveal">
      <span class="wv-masthead__brand">${escapeHtml(s.brand)}</span>
      <span class="wv-masthead__issue">Edición · ${new Date().getFullYear()}</span>
    </div>
    <div class="wv-hero__inner reveal">
      <p class="wv-hero__kicker">Nota de portada</p>
      <h1 class="wv-hero__title" data-split-text>${title}</h1>
      <p class="wv-hero__lede">${sub}</p>
      <a class="wv-btn wv-btn--accent wv-btn--lg" href="#cta">${cta} →</a>
    </div>
    ${heroPhoto ? `<img src="${heroPhotoSrc}" class="wv-hero__featured" alt="" />` : ''}
  </section>`;
  }

  if (skKey === 'brutalist') {
    return `
  <section class="wv-hero wv-hero--brutalist">
    <div class="wv-grid12 reveal">
      <div class="wv-grid12__main">
        <p class="wv-hero__kicker">01. ${escapeHtml(s.cta)}</p>
        <h1 class="wv-hero__title">${title}</h1>
      </div>
      <div class="wv-grid12__side">
        <p class="wv-hero__sub">${sub}</p>
        <a class="wv-btn wv-btn--brutalist wv-btn--lg" href="#cta">${cta} →</a>
      </div>
    </div>
  </section>`;
  }

  if (skKey === 'liquidWave') {
    return `
  <section class="wv-hero wv-hero--liquidWave">
    <svg class="wv-hero__wave" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,160 C 320,260 720,60 1440,160 L1440,320 L0,320 Z" fill="var(--color-accent)" opacity="0.18"></path>
      <path d="M0,200 C 380,80 900,280 1440,120 L1440,320 L0,320 Z" fill="var(--color-accent)" opacity="0.32"></path>
    </svg>
    <div class="wv-hero__inner reveal">
      <h1 class="wv-hero__title">${title}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <a class="wv-btn wv-btn--accent wv-btn--lg" href="#cta">${cta} →</a>
    </div>
    ${heroPhoto ? `<img src="${heroPhotoSrc}" class="wv-hero__floating wv-hero__floating--bob" alt="" />` : ''}
  </section>`;
  }

  if (skKey === 'newspaper') {
    return `
  <section class="wv-hero wv-hero--newspaper">
    <header class="wv-masthead reveal">
      <div class="wv-hairline"></div>
      <h2 class="wv-masthead__brand">${escapeHtml(s.brand)}</h2>
      <p class="wv-masthead__issue">Año I · No. 1 · ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div class="wv-hairline"></div>
    </header>
    <article class="wv-hero__inner reveal">
      <p class="wv-hero__kicker">Editorial</p>
      <h1 class="wv-hero__title">${title}</h1>
      <p class="wv-hero__dropcap"><span class="wv-dropcap">${sub.charAt(0)}</span>${sub.slice(1)}</p>
      <a class="wv-btn wv-btn--newspaper wv-btn--lg" href="#cta">${cta} →</a>
    </article>
  </section>`;
  }

  if (skKey === 'spline') {
    return `
  <section class="wv-hero wv-hero--spline">
    <div class="wv-hero__glow" data-mouse-gradient aria-hidden="true"></div>
    <div class="wv-fake3d" aria-hidden="true">
      <div class="wv-fake3d__card">${heroPhoto ? `<img src="${heroPhotoSrc}" alt="" />` : ''}</div>
    </div>
    <div class="wv-hero__inner reveal">
      <span class="wv-hero__brand">${escapeHtml(s.brand)}</span>
      <h1 class="wv-hero__title">${title}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <a class="wv-btn wv-btn--iridescent wv-btn--lg" href="#cta">${cta} →</a>
    </div>
  </section>`;
  }

  // cream (default editorial light)
  return `
  <section class="wv-hero wv-hero--cream${heroPhoto ? ' wv-hero--photo' : ''}">
    ${bgImg}
    <div class="wv-hero__overlay" aria-hidden="true"></div>
    <div class="wv-hero__inner reveal">
      <p class="wv-hero__kicker">${escapeHtml(s.cta)} · ${new Date().getFullYear()}</p>
      <h1 class="wv-hero__title">${title}</h1>
      <p class="wv-hero__sub">${sub}</p>
      <a class="wv-btn wv-btn--accent wv-btn--lg" href="#cta">${cta} →</a>
    </div>
  </section>`;
}

function renderGallery(s, photos) {
  const usable = (photos || []).slice(0, s.variant === 'masonry' ? 5 : 4);
  const placeholdersNeeded = Math.max((s.variant === 'masonry' ? 5 : 4) - usable.length, 0);
  const photoTiles = usable.map((src, i) => `<div class="wv-gallery__tile swiper-slide reveal" style="animation-delay:${i * 80}ms"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></div>`);
  const placeholderTiles = Array.from({ length: placeholdersNeeded }, (_, i) =>
    `<div class="wv-gallery__tile wv-gallery__tile--placeholder swiper-slide reveal" style="animation-delay:${(usable.length + i) * 80}ms"></div>`);
  return `
  <section id="gallery" class="wv-gallery wv-gallery--${s.variant}">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <div class="wv-gallery__grid swiper" data-gallery-swiper>
      <div class="swiper-wrapper">
        ${[...photoTiles, ...placeholderTiles].join('')}
      </div>
    </div>
  </section>`;
}

function renderFeatures(s) {
  return `
  <section class="wv-features">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <div class="wv-features__grid">
      ${s.items.map((it, i) => `
        <article class="wv-features__item reveal">
          <span class="wv-features__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(it.title)}</h3>
          <p>${escapeHtml(it.body)}</p>
        </article>`).join('')}
    </div>
  </section>`;
}

function renderCta(s) {
  // Si hay WhatsApp real, el CTA final lleva ahí (target blank). Si no, ancla al propio bloque.
  const wa = typeof s.whatsapp === 'string' ? s.whatsapp : '';
  const href = wa ? escapeHtml(wa) : '#cta';
  const attrs = wa ? ' target="_blank" rel="noopener noreferrer"' : '';
  const label = wa ? `${escapeHtml(s.cta)} por WhatsApp` : escapeHtml(s.cta);
  return `
  <section id="cta" class="wv-cta">
    <div class="reveal">
      <h2>${escapeHtml(s.headline)}</h2>
      <p>${escapeHtml(s.sub)}</p>
      <a class="wv-btn wv-btn--light wv-btn--lg" href="${href}"${attrs}>${label} →</a>
    </div>
  </section>`;
}

function renderFooter(s) {
  // Solo se renderizan links con esquema http(s) real: bloquea javascript:/data: en instagram.
  const ig = safeHttpUrl(s.instagram);
  const wa = safeHttpUrl(s.whatsapp);
  return `
  <footer class="wv-foot">
    <span>${escapeHtml(s.logo)}</span>
    ${ig ? `<a href="${escapeHtml(ig)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
    ${wa ? `<a href="${escapeHtml(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}
    <span>© ${s.year}</span>
  </footer>`;
}

function renderReservations(s) {
  return `
  <section id="reservas" class="wv-reservations">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <form class="wv-form reveal" data-simulated-submit>
      <div class="wv-form__row">
        <input type="text" name="name" placeholder="Tu nombre" required />
        <input type="tel" name="phone" placeholder="Teléfono" required />
      </div>
      <div class="wv-form__row">
        <input type="date" name="date" required />
        <input type="time" name="time" required />
        <input type="number" name="people" placeholder="Personas" min="1" max="20" required />
      </div>
      <button type="submit" class="wv-btn wv-btn--accent wv-btn--lg">Reservar</button>
      <p class="wv-form__sent">¡Gracias! Te vamos a confirmar la reserva a la brevedad.</p>
      <p class="wv-form__note">Plantilla de reserva — conectala a tu sistema real antes de publicar.</p>
    </form>
  </section>`;
}

// Sin carta real no inventamos platos ni precios: nota discreta editable.
function renderMenu(s) {
  const items = Array.isArray(s.items) ? s.items.filter((it) => it && it.name) : [];
  if (!items.length) {
    return `
  <section class="wv-menu">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <p class="wv-empty reveal">Agregá tus platos y precios reales para activar esta sección.</p>
  </section>`;
  }
  return `
  <section class="wv-menu">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <div class="wv-menu__grid">
      ${items.map((it) => `
        <div class="wv-menu__item reveal">
          <span class="wv-menu__name">${escapeHtml(it.name)}</span>
          ${it.price ? `<span class="wv-menu__price">${escapeHtml(it.price)}</span>` : ''}
        </div>`).join('')}
    </div>
  </section>`;
}

// Sin dirección real no renderizamos mapa (evita ubicación simulada): nota + CTA de contacto.
// Si hay WhatsApp, el CTA lleva a wa.me sanitizado; si no, ancla al bloque de contacto.
function renderMap(s) {
  const address = (typeof s.address === 'string' && s.address.trim()) ? s.address.trim() : '';
  if (!address) {
    const wa = typeof s.whatsapp === 'string' ? s.whatsapp : '';
    const href = wa ? escapeHtml(wa) : '#cta';
    const target = wa ? ' target="_blank" rel="noopener noreferrer"' : '';
    const label = wa ? 'Escribinos por WhatsApp →' : 'Escribinos y te pasamos la ubicación →';
    return `
  <section class="wv-map">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <p class="wv-empty reveal">Cargá tu dirección real para mostrar el mapa acá.</p>
    <a class="wv-btn wv-btn--accent wv-btn--lg reveal" href="${href}"${target}>${label}</a>
  </section>`;
  }
  const q = encodeURIComponent(address);
  return `
  <section class="wv-map">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <div class="wv-map__frame reveal">
      <iframe src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ubicación"></iframe>
    </div>
  </section>`;
}

// Sin reseñas reales no inventamos testimonios ni nombres: nota discreta editable.
function renderTestimonials(s) {
  const items = Array.isArray(s.items) ? s.items.filter((t) => t && t.quote) : [];
  if (!items.length) {
    return `
  <section class="wv-testimonials">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <p class="wv-empty reveal">Sumá reseñas reales de tus clientes para mostrarlas acá.</p>
  </section>`;
  }
  return `
  <section class="wv-testimonials">
    <h2 class="wv-section-title reveal">${escapeHtml(s.title)}</h2>
    <div class="wv-testimonials__grid">
      ${items.map((t) => `
        <blockquote class="wv-testimonials__item reveal">
          <p>&ldquo;${escapeHtml(t.quote)}&rdquo;</p>
          ${t.who ? `<cite>${escapeHtml(t.who)}</cite>` : ''}
        </blockquote>`).join('')}
    </div>
  </section>`;
}

function renderSections(sections, skKey, sk, photos) {
  return sections.map((s) => {
    if (s.type === 'navbar') return renderNavbar(s);
    if (s.type === 'hero') return renderHero(s, skKey, sk, photos);
    if (s.type === 'gallery') return renderGallery(s, photos.slice(1)); // la 1ra foto ya se usó en el hero
    if (s.type === 'features') return renderFeatures(s);
    if (s.type === 'reservations') return renderReservations(s);
    if (s.type === 'menu') return renderMenu(s);
    if (s.type === 'map') return renderMap(s);
    if (s.type === 'testimonials') return renderTestimonials(s);
    if (s.type === 'cta') return renderCta(s);
    if (s.type === 'footer') return renderFooter(s);
    return '';
  }).join('\n');
}

function fontFamilyParam(name, weights) {
  return `family=${String(name).replace(/\s+/g, '+')}:${weights}`;
}

// ── CSS base (compartida) + bloque específico por efecto firma del arquetipo ─────────
function buildCss(colors, fonts, sk, radius, variant) {
  const v = variant || {};
  const spaceScale = v.density === 'compact' ? 0.8 : v.density === 'airy' ? 1.28 : 1;
  const btnRadius = v.ctaShape === 'pill' ? '999px' : v.ctaShape === 'sharp' ? '0' : 'var(--radius)';
  return `
    :root {
      --color-primary: ${colors.primary};
      --color-accent: ${colors.accent};
      --color-bg: ${colors.bg};
      --color-bg-2: ${colors.bg2};
      --color-surface: ${colors.surface};
      --color-fg: ${colors.ink};
      --color-fg-mute: ${colors.inkMute};
      --color-line: ${colors.line};
      --radius: ${radius}px;
      --space-scale: ${spaceScale};
      --btn-radius: ${btnRadius};
      --font-display: '${fonts.display}', ${sk.font.fallback || 'serif'};
      --font-body: '${fonts.body}', sans-serif;
      --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; overflow-x: clip; }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
    body {
      margin: 0; background: var(--color-bg); color: var(--color-fg);
      font-family: var(--font-body); line-height: 1.6; overflow-x: clip;
    }
    a { color: inherit; }
    h1, h2, h3 { font-family: var(--font-display); margin: 0; ${sk.italic ? '' : ''} }
    ::selection { background: var(--color-accent); color: #fff; }
    :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
    img { max-width: 100%; display: block; }

    .wv-btn {
      display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;
      font-weight: 600; border-radius: var(--btn-radius, var(--radius)); padding: 0.9rem 1.7rem;
      transition: transform 220ms var(--ease-out), filter 220ms var(--ease-out), box-shadow 220ms var(--ease-out);
    }
    .wv-btn--sm { padding: 0.55rem 1.1rem; font-size: 0.9rem; }
    .wv-btn--lg { padding: 1rem 2rem; font-size: 1.05rem; }
    .wv-btn--accent { background: linear-gradient(135deg, var(--color-accent), var(--color-primary)); color: #fff; }
    .wv-btn--accent:hover { filter: brightness(1.12); transform: translateY(-2px); }
    .wv-btn--ghost { border: 1px solid var(--color-line); color: var(--color-fg); }
    .wv-btn--ghost:hover { background: rgba(128,128,128,0.08); }
    .wv-btn--light { background: #fff; color: color-mix(in srgb, var(--color-primary) 40%, #111); }
    .wv-btn--light:hover { transform: scale(1.03); }
    .wv-btn--glass { background: rgba(255,255,255,0.5); backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255,255,255,0.6); color: var(--color-fg); }
    .wv-btn--brutalist { background: var(--color-fg); color: var(--color-bg); border-radius: 0; }
    .wv-btn--brutalist:hover { background: var(--color-accent); }
    .wv-btn--newspaper { border: 1px solid var(--color-fg); border-radius: 0; background: none; }
    .wv-btn--iridescent { background: linear-gradient(90deg, var(--color-accent), var(--color-primary), var(--color-accent)); background-size: 200% auto; color: #fff; animation: wv-iri 4s linear infinite; }
    @keyframes wv-iri { to { background-position: 200% center; } }

    .wv-nav {
      position: fixed; inset: 0 0 auto 0; z-index: 100; height: 72px;
      display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
      padding: 0 clamp(1.5rem, 5vw, 4rem);
      background: color-mix(in srgb, var(--color-bg) 70%, transparent); backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--color-line);
    }
    .wv-nav__logo { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; text-decoration: none; }
    .wv-nav__links { display: flex; gap: 2rem; }
    .wv-nav__links a { text-decoration: none; font-size: 0.92rem; opacity: 0.85; }
    .wv-nav__links a:hover { opacity: 1; }
    @media (max-width: 720px) { .wv-nav__links { display: none; } }

    .wv-hero { position: relative; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; padding: calc(4rem * var(--space-scale)) clamp(1.5rem, 5vw, 4rem); }
    .wv-hero__inner { position: relative; z-index: 2; max-width: 48rem; }
    .wv-hero__kicker { font-family: var(--font-body); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.75; margin: 0 0 1.2rem; display: inline-flex; align-items: center; gap: 0.5rem; }
    .wv-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); display: inline-block; }
    .wv-hero__title {
      font-size: clamp(2.4rem, 6.5vw, 5rem); font-weight: 700; line-height: 1.05;
      text-wrap: balance; max-width: 18ch; margin-inline: auto;
      ${sk.italic ? 'font-style: italic;' : ''}
    }
    .wv-hero__sub, .wv-hero__lede { margin: 1.5rem auto 2.5rem; font-size: clamp(1rem, 1.6vw, 1.2rem); opacity: 0.82; max-width: 42ch; }
    .wv-hero__actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .wv-hero__photo, .wv-hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .wv-hero__overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 55%, transparent), var(--color-bg) 92%); }
    .wv-hero__scrim { position: absolute; inset: 0; z-index: 1; background: radial-gradient(ellipse at center, transparent 30%, var(--color-bg) 95%); }

    /* Hero con foto real como protagonista (cream/darkWarm): la imagen se ve viva, y el texto
       queda legible con un scrim elegante + sombra de texto en vez de lavar toda la foto. */
    .wv-hero--photo .wv-hero__photo { filter: saturate(1.06) contrast(1.02); }
    .wv-hero--photo .wv-hero__overlay,
    .wv-hero--photo .wv-hero__scrim {
      background:
        linear-gradient(180deg, rgba(8,6,4,0.30) 0%, rgba(8,6,4,0.12) 42%, rgba(8,6,4,0.78) 100%),
        radial-gradient(120% 85% at 50% 32%, transparent 42%, rgba(8,6,4,0.42) 100%);
    }
    .wv-hero--photo .wv-hero__inner,
    .wv-hero--photo .wv-hero__title,
    .wv-hero--photo .wv-hero__sub,
    .wv-hero--photo .wv-hero__kicker { color: #fff; }
    .wv-hero--photo .wv-hero__title { text-shadow: 0 2px 24px rgba(0,0,0,0.45); }
    .wv-hero--photo .wv-hero__sub { opacity: 0.94; text-shadow: 0 1px 16px rgba(0,0,0,0.4); }
    .wv-hero--photo .wv-hero__kicker { opacity: 0.9; }

    .wv-section-title { text-align: center; font-size: clamp(1.8rem, 3.5vw, 2.6rem); margin-bottom: 2rem; }
    .wv-gallery, .wv-features, .wv-cta { padding: calc(3.75rem * var(--space-scale)) clamp(1.5rem, 5vw, 4rem); max-width: 1200px; margin: 0 auto; }
    .wv-gallery__grid .swiper-wrapper { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .wv-gallery--masonry .wv-gallery__grid .swiper-wrapper { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 720px) { .wv-gallery__grid .swiper-wrapper { grid-template-columns: repeat(2, 1fr); } }
    /* Swiper (JS) sólo se activa en mobile — swiper-initialized pisa el grid con flex inline */
    .wv-gallery__grid.swiper-initialized .swiper-wrapper { display: flex; }
    .wv-gallery__grid .swiper-slide { height: auto; }
    .wv-gallery__tile { aspect-ratio: 1; border-radius: var(--radius); overflow: hidden; background: linear-gradient(135deg, var(--color-surface), var(--color-accent)); }
    .wv-gallery__tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 400ms var(--ease-out); }
    .wv-gallery__tile:hover img { transform: scale(1.06); }
    .wv-gallery__tile--placeholder { opacity: 0.85; }

    .wv-features__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    @media (max-width: 720px) { .wv-features__grid { grid-template-columns: 1fr; } }
    .wv-features__item { padding: 1.9rem 1.7rem; border-radius: var(--radius); background: var(--color-surface); border-top: 2px solid var(--color-accent); transition: transform 260ms var(--ease-out), box-shadow 260ms var(--ease-out); }
    .wv-features__item:hover { transform: translateY(-4px); box-shadow: 0 18px 40px color-mix(in srgb, var(--color-fg) 9%, transparent); }
    .wv-features__num { display: block; font-family: var(--font-display); font-size: 1.4rem; line-height: 1; color: var(--color-accent); margin-bottom: 0.9rem; font-variant-numeric: tabular-nums; }
    .wv-features__item h3 { font-size: 1.25rem; margin-bottom: 0.45rem; }
    .wv-features__item p { margin: 0; opacity: 0.78; font-size: 0.95rem; line-height: 1.55; }

    /* Banda premium: se oscurecen los stops (mezcla con casi-negro) y se suma un overlay oscuro
       uniforme, para garantizar el texto blanco incluso con acentos luminosos o paletas claras. */
    .wv-cta {
      text-align: center; color: #fff; border-radius: var(--radius);
      padding-block: calc(4.5rem * var(--space-scale));
      background:
        linear-gradient(135deg, rgba(8,6,4,0.30), rgba(8,6,4,0.45)),
        linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 60%, #100c08), color-mix(in srgb, var(--color-accent) 58%, #100c08));
      box-shadow: 0 24px 60px color-mix(in srgb, var(--color-accent) 30%, transparent);
    }
    .wv-cta h2 { color: #fff; font-size: clamp(2rem, 4.4vw, 3rem); margin-bottom: 0.9rem; text-shadow: 0 1px 12px rgba(0,0,0,0.3); }
    .wv-cta p { color: #fff; opacity: 0.92; margin-bottom: 2rem; font-size: clamp(1rem, 1.6vw, 1.15rem); text-shadow: 0 1px 10px rgba(0,0,0,0.26); }

    /* ── Secciones opcionales por prompt: reservas / menú / mapa / testimonios ────── */
    .wv-reservations, .wv-menu, .wv-map, .wv-testimonials { padding: calc(3.75rem * var(--space-scale)) clamp(1.5rem, 5vw, 4rem); max-width: 900px; margin: 0 auto; text-align: center; }
    .wv-form { display: flex; flex-direction: column; gap: 1rem; max-width: 480px; margin: 0 auto; }
    .wv-form__row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .wv-form__row input {
      flex: 1 1 140px; padding: 0.85rem 1rem; border-radius: calc(var(--radius) * 0.4 + 4px);
      border: 1px solid var(--color-line); background: var(--color-surface); color: var(--color-fg);
      font-family: var(--font-body); font-size: 0.95rem;
    }
    .wv-form__note { margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.55; }
    .wv-form.is-sent .wv-form__row, .wv-form.is-sent button { display: none; }
    .wv-form__sent { display: none; font-size: 1.05rem; }
    .wv-form.is-sent .wv-form__sent { display: block; }

    .wv-menu__note, .wv-testimonials__note, .wv-map__note { font-size: 0.85rem; opacity: 0.6; margin: -1.5rem 0 2rem; }
    .wv-empty { text-align: center; opacity: 0.7; font-size: 0.98rem; max-width: 46ch; margin: 0 auto 1.5rem; }
    .wv-menu__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; text-align: left; }
    @media (max-width: 640px) { .wv-menu__grid { grid-template-columns: 1fr; } }
    .wv-menu__item { display: flex; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.4rem; border-radius: var(--radius); background: var(--color-surface); }
    .wv-menu__price { opacity: 0.7; font-family: var(--font-body); }

    .wv-map__frame { border-radius: var(--radius); overflow: hidden; aspect-ratio: 16/9; border: 1px solid var(--color-line); }
    .wv-map__frame iframe { width: 100%; height: 100%; border: 0; }

    .wv-testimonials__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; text-align: left; }
    @media (max-width: 640px) { .wv-testimonials__grid { grid-template-columns: 1fr; } }
    .wv-testimonials__item { margin: 0; padding: 1.75rem; border-radius: var(--radius); background: var(--color-surface); }
    .wv-testimonials__item p { margin: 0 0 0.75rem; font-size: 1rem; }
    .wv-testimonials__item cite { font-style: normal; opacity: 0.65; font-size: 0.85rem; }

    .wv-foot { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 2rem clamp(1.5rem, 5vw, 4rem); opacity: 0.7; font-size: 0.9rem; }
    .wv-foot a { text-decoration: none; }
    .wv-foot a:hover { text-decoration: underline; }

    ${archetypeSignatureCss(sk.signature)}

    ${variantKnobCss()}

    @media (prefers-reduced-motion: reduce) {
      .wv-hero__mesh, .wv-hero__shapes span, .wv-hero__wave path { animation: none !important; }
    }
  `;
}

function variantKnobCss() {
  const noise = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E";
  return `
    body[data-card="sharp"] .wv-gallery__tile { border-radius: 0; }
    body[data-card="framed"] .wv-gallery__tile,
    body[data-card="framed"] .wv-features__item,
    body[data-card="framed"] .wv-menu__item { border: 1px solid var(--color-line); }
    body[data-card="soft"] .wv-gallery__tile { box-shadow: 0 18px 40px color-mix(in srgb, var(--color-fg) 8%, transparent); }

    body[data-bg="grain"]::before {
      content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      opacity: 0.05; background-image: url("${noise}"); background-size: 180px 180px;
    }
    body[data-bg="glow"]::before {
      content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 70%);
    }

    body[data-hero-align="left"] .wv-hero { align-items: flex-start; text-align: left; }
    body[data-hero-align="left"] .wv-hero__inner { margin-inline: 0; }
    body[data-hero-align="left"] .wv-hero__title { margin-inline: 0; }
    body[data-hero-align="left"] .wv-hero__sub,
    body[data-hero-align="left"] .wv-hero__lede { margin-inline: 0; }
    body[data-hero-align="left"] .wv-hero__actions { justify-content: flex-start; }
  `;
}

function archetypeSignatureCss(signature) {
  switch (signature) {
    case 'mesh-gradient':
      return `
    .wv-hero--darkWarm .wv-hero__mesh {
      position: absolute; inset: -20%; z-index: 0;
      background: conic-gradient(from 0deg at 50% 40%, var(--color-accent), transparent 30%, var(--color-bg-2) 60%, var(--color-accent) 100%);
      filter: blur(90px); opacity: 0.55; animation: wv-mesh-spin 18s linear infinite;
    }
    @keyframes wv-mesh-spin { to { transform: rotate(360deg); } }`;
    case 'floating-shapes':
      return `
    .wv-hero--cinematic3d .wv-hero__particles { position: absolute; inset: 0; z-index: 0; }
    .wv-hero--cinematic3d .wv-hero__shapes { position: absolute; inset: 0; z-index: 0; }
    .wv-hero--cinematic3d .wv-hero__shapes span {
      position: absolute; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--color-accent) 60%, transparent);
      opacity: 0.5; animation: wv-float 9s ease-in-out infinite;
    }
    .wv-hero--cinematic3d .wv-hero__shapes span:nth-child(1) { width: 120px; height: 120px; top: 15%; left: 12%; animation-delay: 0s; }
    .wv-hero--cinematic3d .wv-hero__shapes span:nth-child(2) { width: 70px; height: 70px; top: 65%; left: 20%; animation-delay: 2s; }
    .wv-hero--cinematic3d .wv-hero__shapes span:nth-child(3) { width: 160px; height: 160px; top: 20%; right: 10%; animation-delay: 4s; }
    .wv-hero--cinematic3d .wv-hero__shapes span:nth-child(4) { width: 90px; height: 90px; bottom: 12%; right: 18%; animation-delay: 6s; }
    @keyframes wv-float { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(12px,-18px); } }
    .wv-hero--cinematic3d .wv-hero__vignette { position: absolute; inset: 0; z-index: 1; background: radial-gradient(ellipse at center, transparent 35%, var(--color-bg) 90%); }`;
    case 'magnetic':
      return `
    .wv-hero--glass .wv-hero__mesh-soft {
      position: absolute; inset: 0; z-index: 0;
      background: radial-gradient(at 20% 30%, var(--color-bg-2) 0%, transparent 55%), radial-gradient(at 80% 70%, var(--color-accent) 0%, transparent 50%);
      filter: blur(60px) saturate(140%); opacity: 0.5; animation: wv-mesh-drift 24s ease-in-out infinite;
    }
    @keyframes wv-mesh-drift { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.15) rotate(8deg); } }
    .wv-hero__floating { width: 100%; max-width: min(380px, 82vw); margin: 2.25rem auto 0; border-radius: var(--radius); aspect-ratio: 4/5; object-fit: cover; filter: drop-shadow(0 44px 70px rgba(0,0,0,0.3)); }
    [data-magnetic] { will-change: transform; }`;
    case 'mouse-gradient':
      return `
    .wv-hero--mouseGradient .wv-hero__gradient {
      position: absolute; inset: 0; z-index: 0;
      background: radial-gradient(circle 500px at var(--mx, 50%) var(--my, 50%), var(--color-accent) 0%, transparent 60%), var(--color-bg);
      filter: blur(40px) saturate(150%); opacity: 0.65;
    }
    .wv-hero__title--massive { font-size: clamp(2.6rem, 9vw, 6.5rem); max-width: 16ch; }`;
    case 'marquee':
      return `
    .wv-masthead { text-align: center; padding: 2rem 1.5rem 0; }
    .wv-hero--magazine .wv-masthead { display: flex; align-items: baseline; justify-content: center; gap: 0.75rem; }
    .wv-hero--magazine .wv-masthead__brand { font-family: var(--font-display); font-weight: 700; }
    .wv-masthead__issue { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.14em; opacity: 0.6; }
    .wv-hero--magazine .wv-hero__featured { width: 100%; max-width: 1000px; margin: 2.25rem auto 0; border-radius: var(--radius); aspect-ratio: 3/2; object-fit: cover; box-shadow: 0 30px 70px color-mix(in srgb, var(--color-fg) 16%, transparent); }
    [data-split-text].splitting .char { display: inline-block; opacity: 0; transform: translateY(0.4em); animation: wv-char-in 500ms var(--ease-out) forwards; animation-delay: calc(var(--char-index) * 22ms); }
    @keyframes wv-char-in { to { opacity: 1; transform: translateY(0); } }`;
    case 'hover-invert':
      return `
    .wv-hero--brutalist { text-align: left; }
    .wv-grid12 { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1px; background: var(--color-fg); max-width: 1100px; width: 100%; }
    .wv-grid12__main, .wv-grid12__side { background: var(--color-bg); padding: 2.5rem; }
    .wv-grid12__main { grid-column: span 7; }
    .wv-grid12__side { grid-column: span 5; display: flex; flex-direction: column; justify-content: center; gap: 1.5rem; }
    @media (max-width: 720px) { .wv-grid12__main, .wv-grid12__side { grid-column: span 12; } }
    .wv-hero--brutalist .wv-hero__title { text-align: left; margin-inline: 0; max-width: none; text-wrap: balance; }
    .wv-nav__links a:hover { background: var(--color-fg); color: var(--color-bg); }`;
    case 'wave':
      return `
    .wv-hero--liquidWave .wv-hero__wave { position: absolute; bottom: 0; left: 0; width: 100%; height: 45%; z-index: 0; animation: wv-wave-shift 10s ease-in-out infinite alternate; }
    @keyframes wv-wave-shift { to { transform: translateX(-2%) scaleY(1.05); } }
    .wv-hero__floating--bob { animation: wv-bob 5s ease-in-out infinite; max-width: 260px; margin: 1.5rem auto 0; border-radius: 38% 62% 63% 37% / 41% 44% 56% 59%; }
    @keyframes wv-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }`;
    case 'dropcap':
      return `
    .wv-hairline { border-top: 1px solid var(--color-fg); margin: 0.6rem 0; }
    .wv-masthead__brand { font-size: clamp(1.6rem, 4vw, 2.4rem); margin: 0.3rem 0; }
    .wv-masthead__issue { font-size: 0.8rem; opacity: 0.7; }
    .wv-hero--newspaper .wv-hero__dropcap { text-align: left; max-width: 60ch; margin-inline: auto; }
    .wv-dropcap { float: left; font-family: var(--font-display); font-size: 4.2rem; line-height: 0.8; padding: 0.1rem 0.5rem 0 0; color: var(--color-accent); }`;
    case 'fake-3d':
      return `
    .wv-hero--spline .wv-hero__glow { position: absolute; inset: 0; z-index: 0; background: radial-gradient(circle 420px at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--color-accent) 40%, transparent), transparent 65%); }
    .wv-fake3d { position: absolute; right: 6%; top: 50%; transform: translateY(-50%); z-index: 1; perspective: 1000px; }
    .wv-fake3d__card {
      width: clamp(160px, 22vw, 280px); aspect-ratio: 3/4; border-radius: var(--radius); overflow: hidden;
      background: linear-gradient(135deg, var(--color-surface), var(--color-accent));
      animation: wv-rotate3d 10s linear infinite; box-shadow: 0 40px 90px rgba(0,0,0,0.4);
    }
    .wv-fake3d__card img { width: 100%; height: 100%; object-fit: cover; }
    @keyframes wv-rotate3d { 0%, 100% { transform: rotateY(-12deg); } 50% { transform: rotateY(12deg); } }
    .wv-hero--spline .wv-hero__brand { display: block; font-family: var(--font-body); font-size: 0.85rem; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.8rem; }
    @media (max-width: 860px) { .wv-fake3d { display: none; } }`;
    case 'tilt-halo':
    default:
      return `
    .wv-hero--cream .wv-hero__photo { filter: saturate(1.1); }
    .wv-gallery__tile[data-tilt] { transition: transform 260ms var(--ease-out), box-shadow 260ms var(--ease-out); }
    .wv-gallery__tile[data-tilt]:hover { box-shadow: 0 20px 50px color-mix(in srgb, var(--color-accent) 35%, transparent); }`;
  }
}

// ── Motion: GSAP + ScrollTrigger vía CDN, reveals + efecto firma por arquetipo ────────
// + librerías premium por arquetipo (PARTE 4): Lenis, Vanilla-Tilt, Particles.js,
// Splitting.js, Anime.js, Swiper. Cada init chequea que su librería haya cargado antes de
// tocar el DOM — si el CDN falla, esa mejora se omite y el resto de la página sigue intacta.
function buildMotionScript(skKey, signature) {
  return `
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length || reduced || !window.gsap) return; // sin GSAP el contenido ya es visible por CSS normal
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    els.forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 24 });
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    });
    setTimeout(function () {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.style.opacity = 1; el.style.transform = "none";
      });
    }, 6000);
  }

  function initMouseGradient() {
    var targets = document.querySelectorAll("[data-mouse-gradient]");
    if (!targets.length || matchMedia("(hover: none)").matches) return;
    window.addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth) * 100;
      var y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mx", x + "%");
      document.documentElement.style.setProperty("--my", y + "%");
    });
  }

  function initMagnetic() {
    if (matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.25;
        var my = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = "translate(" + mx + "px," + my + "px)";
      });
      btn.addEventListener("mouseout", function (e) {
        if (btn.contains(e.relatedTarget)) return;
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  function initTilt() {
    if (matchMedia("(hover: none)").matches) return;
    document.querySelectorAll(".wv-gallery__tile").forEach(function (tile) {
      tile.setAttribute("data-tilt", "1");
      tile.addEventListener("mousemove", function (e) {
        var r = tile.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -9;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
        tile.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      tile.addEventListener("mouseout", function (e) {
        if (tile.contains(e.relatedTarget)) return;
        tile.style.transform = "none";
      });
    });
  }

  function setupSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 80, behavior: reduced ? "auto" : "smooth" });
    });
  }

  function initSimulatedForms() {
    document.querySelectorAll("[data-simulated-submit]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        form.classList.add("is-sent");
      });
    });
  }

  // Swiper: sólo se activa como carrusel en mobile (todas las galerías). En desktop el
  // grid CSS ya resuelve el layout, así que ahí ni se instancia.
  function initSwiperGallery() {
    var el = document.querySelector("[data-gallery-swiper]");
    if (!el || !window.Swiper) return;
    var mq = matchMedia("(max-width: 720px)");
    var instance = null;
    function sync() {
      if (mq.matches && !instance) {
        instance = new Swiper(el, { slidesPerView: 1.15, spaceBetween: 12, grabCursor: true });
      } else if (!mq.matches && instance) {
        instance.destroy(true, true);
        instance = null;
      }
    }
    sync();
    mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync);
  }

  // Lenis: smooth scroll premium (arquetipo Glassmorphism).
  function initLenis() {
    if (!window.Lenis || reduced) return;
    var lenis = new Lenis();
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // Vanilla-Tilt: tilt 3D real en las cards de la galería (arquetipo Mouse-Reactive).
  function initVanillaTiltCards() {
    if (!window.VanillaTilt || matchMedia("(hover: none)").matches) return;
    VanillaTilt.init(document.querySelectorAll(".wv-gallery__tile"), { max: 12, speed: 400, glare: true, "max-glare": 0.25 });
  }

  // Rellax: parallax de scroll en fotos/elementos flotantes (Glassmorphism + Liquid Wave).
  function initRellax() {
    if (!window.Rellax || reduced || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".wv-hero__floating").forEach((el) => {
      el.setAttribute("data-rellax-speed", "1.5");
    });
    if (document.querySelector("[data-rellax-speed]")) {
      new Rellax("[data-rellax-speed]");
    }
  }

  // Splitting.js: reveal letra por letra en los titulares (arquetipo Magazine).
  function initSplittingHeadline() {
    if (!window.Splitting) return;
    Splitting({ target: "[data-split-text]", by: "chars" });
  }

  // Anime.js: reveal letra por letra con timeline (arquetipos Editorial cream/darkWarm).
  // Se agrupa por PALABRA (span nowrap) con espacios reales entre palabras, para que el título
  // nunca corte a mitad de palabra. Bajo reduced-motion se deja el texto tal cual.
  function initAnimeText() {
    if (!window.anime || reduced) return;
    document.querySelectorAll("[data-anime-text]").forEach(function (el) {
      var words = el.textContent.split(" ");
      el.textContent = "";
      var chars = [];
      words.forEach(function (word, wi) {
        var wspan = document.createElement("span");
        wspan.style.display = "inline-block";
        wspan.style.whiteSpace = "nowrap";
        word.split("").forEach(function (ch) {
          var c = document.createElement("span");
          c.style.display = "inline-block";
          c.textContent = ch;
          wspan.appendChild(c);
          chars.push(c);
        });
        el.appendChild(wspan);
        if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      anime.set(chars, { opacity: 0, translateY: 20 });
      anime({ targets: chars, opacity: [0, 1], translateY: [20, 0], duration: 600, delay: anime.stagger(18), easing: "easeOutCubic" });
    });
  }

  function boot() {
    safe(setupSmoothScroll, "smoothScroll");
    safe(initSimulatedForms, "simulatedForms");
    safe(initReveals, "reveals");
    safe(initSwiperGallery, "swiperGallery");
    ${signature === 'mouse-gradient' || signature === 'fake-3d' ? 'safe(initMouseGradient, "mouseGradient");' : ''}
    ${signature === 'magnetic' ? 'safe(initMagnetic, "magnetic");' : ''}
    ${signature === 'tilt-halo' ? 'safe(initTilt, "tilt");' : ''}
    ${skKey === 'glass' || skKey === 'spline' ? 'safe(initLenis, "lenis");' : ''}
    ${skKey === 'mouseGradient' ? 'safe(initVanillaTiltCards, "vanillaTilt");' : ''}
    ${skKey === 'glass' || skKey === 'liquidWave' ? 'safe(initRellax, "rellax");' : ''}
    ${skKey === 'magazine' ? 'safe(initSplittingHeadline, "splitting");' : ''}
    ${skKey === 'cream' || skKey === 'darkWarm' ? 'safe(initAnimeText, "animeText");' : ''}
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
  `;
}

function buildPage(business, pattern, analysis, archetype) {
  const variant = selectVisualVariant(business, archetype);
  const skKey = variant.skKey;
  const base = SKILL_ARCHETYPES[skKey] || SKILL_ARCHETYPES.cream;
  const sk = {
    ...base,
    font: {
      ...base.font,
      display: variant.displayFont,
      body: variant.bodyFont,
    },
  };

  // El usuario elige explícitamente "oscuro"/"claro" en step-1 → sus colores mandan.
  // "auto" (o sin elección) → el color lo decide el análisis de la IA, como antes.
  const userChoseColors = (business.colorMode === 'dark' || business.colorMode === 'light')
    && business.colors?.primary && business.colors?.accent;
  const primary = userChoseColors
    ? business.colors.primary
    : (analysis.colors?.primary || archetype.palette?.primary || pattern.color_hints?.primary || darken(sk.defaultAccent, 0.6));
  const accent = userChoseColors
    ? business.colors.accent
    : (analysis.colors?.accent || archetype.palette?.accent || pattern.color_hints?.accent || sk.defaultAccent);
  const colors = {
    primary,
    accent,
    bg: sk.bg,
    bg2: sk.bg2,
    surface: sk.paper,
    ink: sk.ink,
    inkMute: sk.inkMute,
    line: sk.line,
  };
  const fonts = { display: sk.font.display, body: sk.font.body };

  const ownPhotos = Array.isArray(business.photos) ? business.photos.filter(Boolean) : [];
  const usingUnsplash = ownPhotos.length === 0;
  const photos = usingUnsplash ? (UNSPLASH[business.niche] || UNSPLASH.default) : ownPhotos;

  return {
    meta: {
      title: business.name,
      description: business.description || '',
      colors,
      fonts,
      skKey,
      sk,
      variant,
      usingUnsplash,
    },
    sections: buildSections(business, pattern, { ...archetype, __keywords: analysis.keywords }, variant),
    photos,
  };
}

// Librerías premium de GitHub integradas por arquetipo (ver PARTE 4): cada una carga sólo
// donde suma — nunca las 6 en todos los HTML — más Swiper, que sí va siempre (galerías mobile).
const LIB_CDN = {
  anime: 'https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js',
  splittingJs: 'https://cdn.jsdelivr.net/npm/splitting@1.1.0/dist/splitting.min.js',
  splittingCss: 'https://cdn.jsdelivr.net/npm/splitting@1.1.0/dist/splitting.css',
  splittingCellsCss: 'https://cdn.jsdelivr.net/npm/splitting@1.1.0/dist/splitting-cells.css',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js',
  swiperJs: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
  swiperCss: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  vanillaTilt: 'https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/dist/vanilla-tilt.min.js',
  three: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  rellax: 'https://cdn.jsdelivr.net/npm/rellax@1.12.1/rellax.min.js',
};

function libraryHeadTags(skKey) {
  const tags = [`<link href="${LIB_CDN.swiperCss}" rel="stylesheet">`];
  if (skKey === 'magazine') {
    tags.push(`<link href="${LIB_CDN.splittingCss}" rel="stylesheet">`, `<link href="${LIB_CDN.splittingCellsCss}" rel="stylesheet">`);
  }
  if (skKey === 'cinematic3d') {
    tags.push(`<script type="importmap">${JSON.stringify({ imports: { three: LIB_CDN.three } })}</script>`);
  }
  return tags.join('\n  ');
}

function libraryScriptTags(skKey) {
  const tags = [`<script src="${LIB_CDN.swiperJs}" defer></script>`];
  if (skKey === 'cream' || skKey === 'darkWarm') tags.push(`<script src="${LIB_CDN.anime}" defer></script>`);
  if (skKey === 'magazine') tags.push(`<script src="${LIB_CDN.splittingJs}" defer></script>`);
  if (skKey === 'glass' || skKey === 'spline') tags.push(`<script src="${LIB_CDN.lenis}" defer></script>`);
  if (skKey === 'glass' || skKey === 'liquidWave') tags.push(`<script src="${LIB_CDN.rellax}" defer></script>`);
  if (skKey === 'mouseGradient') tags.push(`<script src="${LIB_CDN.vanillaTilt}" defer></script>`);
  return tags.join('\n  ');
}

// Three.js: escena WebGL real de partículas de fondo (arquetipo Cinematic 3D). Va aparte del
// IIFE de motion porque necesita `type="module"` — el import dinámico deja que el catch
// contenga fallos de red del CDN sin romper el resto del script.
function threeParticlesModule() {
  return `<script type="module">
(async function () {
  try {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = document.getElementById("wv-particles");
    if (!container) return;
    const THREE = await import("${LIB_CDN.three}");
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#d4af37";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 12;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: accent, size: 0.035, transparent: true, opacity: 0.75 });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    let mx = 0, my = 0;
    addEventListener("mousemove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 0.6;
      my = (e.clientY / innerHeight - 0.5) * 0.6;
    });
    (function animate() {
      points.rotation.y += 0.0009;
      points.rotation.x += (my - points.rotation.x) * 0.02;
      points.rotation.y += (mx - points.rotation.y) * 0.02;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    })();
    addEventListener("resize", () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  } catch (e) { console.warn("[three-particles]", e); }
})();
</script>`;
}

function renderHtml(page) {
  const { meta, sections, photos } = page;
  const fontsHref = `https://fonts.googleapis.com/css2?${fontFamilyParam(meta.fonts.display, meta.sk.italic ? '400;700;1,500' : '400;600;700')}&${fontFamilyParam(meta.fonts.body, '400;500;600')}&display=swap`;
  return `<!DOCTYPE html>
${meta.usingUnsplash ? '<!-- 📸 IMÁGENES PROVISORIAS DE UNSPLASH — Reemplazalas con fotos reales de tu negocio para que tu web sea única. -->\n' : ''}<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsHref}" rel="stylesheet">
  ${libraryHeadTags(meta.skKey)}
  <style>${buildCss(meta.colors, meta.fonts, meta.sk, meta.sk.radius, meta.variant)}</style>
</head>
<body data-archetype="${meta.skKey}" data-card="${meta.variant.cardStyle}" data-bg="${meta.variant.bgTreatment}" data-hero-align="${meta.variant.heroAlign}" data-density="${meta.variant.density}">
${renderSections(sections, meta.skKey, meta.sk, photos)}
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13/dist/gsap.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13/dist/ScrollTrigger.min.js" defer></script>
  ${libraryScriptTags(meta.skKey)}
  <script defer>${buildMotionScript(meta.skKey, meta.sk.signature)}</script>
  ${meta.skKey === 'cinematic3d' ? threeParticlesModule() : ''}
</body>
</html>`;
}

export async function generateLanding({ business, pattern, analysis, archetype }) {
  if (!business?.name || !business?.niche) {
    throw new Error('missing_fields');
  }
  const page = buildPage(business, pattern, analysis, archetype);
  const html = renderHtml(page);
  const sizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  const filename = `weave-${slugify(business.name)}-${Date.now()}.html`;

  return {
    html,
    filename,
    size: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)}mb` : `${sizeKb}kb`,
    meta: {
      pattern: pattern?.id ?? null,
      archetype: archetype?.id ?? null,
      skill_archetype: page.meta.skKey,
      generated_at: new Date().toISOString(),
    },
  };
}
