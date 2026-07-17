// qa/run.mjs — QA automático local de los flujos críticos de Weave. No toca producción.
// Corre con: npm run qa:weave  (el script buildea dist/ antes de correr este archivo)
//
// Cubre: (1) generator con datos reales + overflow/screenshots, (2) photos vs referencePhotos,
// (3) sanitización de seguridad, (4) pegado inteligente de step-3-review (página real vía
// Playwright sobre dist/), (5) screenshots en qa-output/.
// Sale con exit code != 0 si algún check crítico falla.

import { chromium } from 'playwright';
import { generateLanding } from '../src/lib/generator.js';
import http from 'node:http';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'qa-output');
fs.mkdirSync(OUT, { recursive: true });

// ── Mini framework de asserts ────────────────────────────────────────────────
let failures = 0;
const groups = [];
function group(title) { const g = { title, items: [] }; groups.push(g); return g; }
function check(g, name, cond) { const ok = !!cond; g.items.push([ok, name]); if (!ok) failures++; return ok; }

// ── Datos de prueba ──────────────────────────────────────────────────────────
const PHOTOS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1000&q=80',
];
const LONG_QUOTE_1 = 'Fuimos por primera vez y superó todas las expectativas: la atencion fue impecable, las porciones muy generosas y cada plato llegaba caliente y bien presentado. Volvemos seguro y ya lo recomendamos a toda la familia.';
const LONG_QUOTE_2 = 'Un lugar para volver una y otra vez. Probamos las entradas, los principales y el postre, y todo estuvo a la altura. El servicio conoce la carta y recomienda muy bien segun lo que buscas.';

function restaurantBusiness(extra = {}) {
  return {
    name: 'La Barra del Bosque',
    niche: 'restaurant',
    description: 'Cocina de autor con producto de estacion, en un espacio calido para compartir mesa.',
    prompt: 'Quiero mostrar la carta, tomar reservas y ofrecer delivery.',
    photos: PHOTOS,
    menu: [
      { name: 'Rabas', price: '$8.500' },
      { name: 'Cazuela de Mariscos', price: '$12.000' },
      { name: 'Ceviche de autor', price: '$9.800' },
    ],
    testimonials: [
      { quote: LONG_QUOTE_1, who: 'Agustina' },
      { quote: LONG_QUOTE_2, who: 'Nicky' },
    ],
    address: 'Las Camelias 123, Costa del Este, Buenos Aires',
    whatsapp: '+54 9 11 2345-6789',
    instagram: 'https://www.instagram.com/labarra/',
    ...extra,
  };
}

const commonPattern = { id: 'stumptown-coffee-roasters', color_hints: {} };
function commonArchetype() { return { id: 'restaurant-premium', niche: 'restaurant', mood: 'premium', elements: ['parallax', 'masonry'] }; }
function commonAnalysis(extra = {}) { return { mood: 'premium', keywords: ['mariscos', 'autor'], colors: { primary: '#2b1a12', accent: '#c56a3a' }, ...extra }; }

// ── Static server para dist/ ─────────────────────────────────────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
function startServer(root) {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      let fp = path.join(root, p);
      if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
      if (!fs.existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
      const buf = await readFile(fp);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      res.end(buf);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

const LA_BARRA = `Restaurante la Barra del Bosque
4.5
(1,403)·$40,000–50,000
Restaurant

ACJ Costa del Este Buenos Aires AR, Las Camelias, B7104

Closed · Opens 8 PM
$40,000–50,000 per person

Menu
Popular
Rabas
Popular
Cazuela de Mariscos

Review summary
4.5
1,403 reviews

Agustina Zapponi
Local Guide · 31 reviews · 37 photos
5 months ago
A mi parecer, el único restaurante en Costa del Este, y el mejor. Excelente atención, mozos y mozas atentos; conocían la carta y realizaban recomendaciones a pedido. Las porciones están muy bien. Pedí el trago de la casa, riquísimo. Las … More
See translation (English)

Antonella R. P.
Local Guide · 22 reviews · 28 photos
5 months ago
Pedimos 3 entradas porque fuimos a tomar vino y comer postre y eran tan abundantes que al final terminamos llenisimos. Unas rabas qué se desarman en tu boca, un ceviche de autor y una ensalada de portobello qué se lleva el premio a la mejor … More
See translation (English)

Nicky Blasco
Local Guide · 60 reviews · 61 photos
7 months ago
10/10, todo excelente. Comimos de entrada unas rabas espectaculares que venian con una salsita aleoli y pesto y croquetas de morzilla que tambien estaban ricas. De plato principal comimos matambrito con puré, osobuco con puré, ñoquis con … More
See translation (English)`;

async function main() {
  // El script npm ya buildea; esto es red de seguridad si se corre `node qa/run.mjs` directo.
  const step3Html = path.join(DIST, 'onboarding', 'step-3-review', 'index.html');
  if (!fs.existsSync(step3Html)) {
    console.log('· dist/ incompleto → corriendo build una vez…');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  }

  const browser = await chromium.launch();

  // ══ 1) Generator con datos reales ══
  const g1 = group('1) Generator con datos reales');
  const real = await generateLanding({ business: restaurantBusiness(), pattern: commonPattern, analysis: commonAnalysis(), archetype: commonArchetype() });
  const h = real.html;
  check(g1, 'menú aparece (Rabas + Cazuela de Mariscos)', h.includes('Rabas') && h.includes('Cazuela de Mariscos'));
  check(g1, 'reseñas completas (quotes largas íntegras)', h.includes(LONG_QUOTE_1) && h.includes(LONG_QUOTE_2));
  check(g1, 'mapa aparece con address (iframe + maps?q=)', /wv-map__frame/.test(h) && h.includes('maps?q='));
  check(g1, 'CTA apunta a wa.me', /href="https:\/\/wa\.me\/5491123456789"/.test(h));
  check(g1, 'hero tiene imagen real', /<img src="https:\/\/images\.unsplash\.com\/photo-1517248135467[^"]*"/.test(h));
  check(g1, 'sin contenido falso (sin notas de vacío)', !h.includes('Agregá tus platos') && !h.includes('Sumá reseñas') && !h.includes('Cargá tu dirección'));

  fs.writeFileSync(path.join(OUT, 'restaurant.html'), h);
  const rUrl = pathToFileURL(path.join(OUT, 'restaurant.html')).href;
  for (const [tag, vp, full] of [['desktop', { width: 1440, height: 900 }, true], ['mobile', { width: 390, height: 844 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(rUrl, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(OUT, `restaurant-${tag}.png`), fullPage: full });
    check(g1, `sin overflow horizontal (${tag})`, overflow === 0);
    await ctx.close();
  }

  // ══ 2) Photos vs referencePhotos ══
  const g2 = group('2) Photos vs referencePhotos');
  const split = await generateLanding({
    business: restaurantBusiness({ photos: ['https://weave.test/SHOW_A.jpg', 'https://weave.test/SHOW_B.jpg'], referencePhotos: ['https://weave.test/REF_A.jpg', 'https://weave.test/REF_B.jpg'] }),
    pattern: commonPattern, analysis: commonAnalysis(), archetype: commonArchetype(),
  });
  const hs = split.html;
  check(g2, 'HTML contiene SHOW_A', hs.includes('SHOW_A'));
  check(g2, 'HTML contiene SHOW_B', hs.includes('SHOW_B'));
  check(g2, 'HTML NO contiene REF_A', !hs.includes('REF_A'));
  check(g2, 'HTML NO contiene REF_B', !hs.includes('REF_B'));

  // ══ 3) Seguridad básica ══
  const g3 = group('3) Seguridad (sanitización)');
  const XSS = '<script>alert(1)</script>';
  const mal = await generateLanding({
    business: restaurantBusiness({
      name: XSS, description: '"><img src=x onerror=alert(1)>', instagram: 'javascript:alert(1)',
      whatsapp: '"><script>alert(1)</script>', photos: ['x" onerror="alert(1)', 'data:text/html,<script>alert(1)</script>'],
      menu: [{ name: XSS, price: '"><img src=x onerror=alert(1)>' }],
      testimonials: [{ quote: XSS, who: '"><svg onload=alert(1)>' }],
    }),
    pattern: commonPattern, analysis: commonAnalysis({ keywords: [XSS] }), archetype: commonArchetype(),
  });
  const hm = mal.html;
  check(g3, 'no onerror="alert(1) ejecutable', !hm.includes('onerror="alert(1)'));
  check(g3, 'no href="javascript:', !hm.includes('href="javascript:'));
  check(g3, 'no <script>alert(1)</script> crudo', !hm.includes('<script>alert(1)</script>'));
  check(g3, 'texto escapado (&lt;script&gt;)', hm.includes('&lt;script&gt;'));

  // ══ 4) Onboarding: pegado inteligente (step-3-review real) ══
  const g4 = group('4) Onboarding — pegado inteligente');
  const { server, port } = await startServer(DIST);
  const BASE = `http://localhost:${port}`;
  try {
    const ctx = await browser.newContext({ viewport: { width: 960, height: 1200 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/onboarding/step-2/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('weave:onboarding', JSON.stringify({ name: 'La Barra del Bosque', niche: 'restaurant', nicheLabel: 'Restaurante', patternId: 'stumptown-coffee-roasters', analysis: { mood: 'premium', keywords: ['mariscos'], colors: { primary: '#1a1a1a', accent: '#c56a3a' } }, colors: { primary: '#1a1a1a', accent: '#c56a3a' }, colorMode: 'auto' }));
      localStorage.setItem('weave:onboarding:photos', JSON.stringify([{ src: 'https://weave.test/foto.jpg', name: 'foto.jpg', role: 'show' }]));
    });
    await page.goto(`${BASE}/onboarding/step-3-review/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#rd-detect', { timeout: 10000 });
    await page.fill('#rd-paste', LA_BARRA);
    await page.click('#rd-detect');
    await page.waitForTimeout(300);

    const address = await page.inputValue('#rd-address');
    const whatsapp = await page.inputValue('#rd-whatsapp');
    const menuNames = await page.$$eval('[data-menu-name]', (els) => els.map((e) => e.value).filter(Boolean));
    const quotes = await page.$$eval('[data-testi-quote]', (els) => els.map((e) => e.value).filter(Boolean));
    const whos = await page.$$eval('[data-testi-who]', (els) => els.map((e) => e.value).filter(Boolean));

    check(g4, 'detecta address', address === 'ACJ Costa del Este Buenos Aires AR, Las Camelias, B7104');
    check(g4, 'no inventa teléfono (whatsapp vacío)', whatsapp === '');
    check(g4, 'detecta Rabas y Cazuela de Mariscos', menuNames.length === 2 && menuNames.includes('Rabas') && menuNames.includes('Cazuela de Mariscos'));
    check(g4, 'detecta 3 reseñas con nombre', whos.length === 3);
    check(g4, 'limpia More / See translation', quotes.length === 3 && quotes.every((q) => !/\bMore\b/i.test(q) && !/see translation/i.test(q)));

    const det = await page.$('#rd-detected');
    if (det) { await det.scrollIntoViewIfNeeded(); await det.screenshot({ path: path.join(OUT, 'step3-detect.png') }); }
    await ctx.close();
  } finally {
    server.close();
  }

  await browser.close();

  console.log('\n══════════ QA WEAVE ══════════');
  for (const g of groups) {
    console.log('\n' + g.title);
    for (const [ok, name] of g.items) console.log('  ' + (ok ? '✅' : '❌') + ' ' + name);
  }
  console.log('\nScreenshots en qa-output/: restaurant-desktop.png, restaurant-mobile.png, step3-detect.png');
  console.log('\n══════════ RESULTADO: ' + (failures === 0 ? 'TODO OK ✅' : (failures + ' CHECK(S) FALLARON ❌')) + ' ══════════');
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error('QA crash:', err); process.exit(1); });
