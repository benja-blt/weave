// motion/lib/behaviors/carousel.js
// Resuelve el hook data-gallery-controls del gallery/carousel. El componente NO renderiza
// controles (no deja botones muertos): acá se INYECTAN flechas y/o dots como progressive
// enhancement sobre el scroll-snap nativo. Su estilo vive en motion.css (token-only).
// A11y: botones reales con aria-label/aria-controls; el track ya es navegable por teclado.
// Respeta reduced-motion: el scroll programático usa behavior 'auto' en vez de 'smooth'.
// Sin side effects al importar: exporta una función; crea DOM/listeners al llamarla.

let uid = 0;

/**
 * @param {HTMLElement} section  la sección .plg-gallery--carousel
 * @param {{reducedMotion?: boolean}} [ctx]
 * @returns {() => void} cleanup (quita controles y listeners)
 */
export function initCarousel(section, ctx = {}) {
  if (typeof window === 'undefined' || !section) return () => {};
  const track = section.querySelector('.plg-gallery__track');
  if (!track) return () => {};

  const slides = Array.from(track.querySelectorAll('.plg-gallery__slide'));
  if (!slides.length) return () => {};

  const wanted = (section.getAttribute('data-gallery-controls') || '').split(/\s+/).filter(Boolean);
  const behavior = ctx.reducedMotion ? 'auto' : 'smooth';
  if (!track.id) track.id = `plg-carousel-${++uid}`;

  const cleanups = [];

  const step = () => {
    // ancho de un slide + gap (para avanzar de a uno).
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    const w = slides[0] ? slides[0].getBoundingClientRect().width : track.clientWidth;
    return w + gap;
  };

  // ── Flechas ────────────────────────────────────────────────────────────
  if (wanted.includes('arrows')) {
    const nav = document.createElement('div');
    nav.className = 'plg-gallery__nav';

    const mk = (label, dir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'plg-gallery__navbtn';
      b.setAttribute('aria-label', label);
      b.setAttribute('aria-controls', track.id);
      b.textContent = dir < 0 ? '←' : '→'; // ← →
      const onClick = () => track.scrollBy({ left: dir * step(), behavior });
      b.addEventListener('click', onClick);
      cleanups.push(() => b.removeEventListener('click', onClick));
      return b;
    };

    nav.append(mk('Anterior', -1), mk('Siguiente', 1));
    section.querySelector('.plg-gallery__inner')?.appendChild(nav);
    cleanups.push(() => nav.remove());
  }

  // ── Dots ───────────────────────────────────────────────────────────────
  if (wanted.includes('dots')) {
    const dots = document.createElement('div');
    dots.className = 'plg-gallery__dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Ir a un ítem');

    const btns = slides.map((slide, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'plg-gallery__dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Ir al ítem ${i + 1}`);
      const onClick = () => slide.scrollIntoView({ inline: 'start', block: 'nearest', behavior });
      d.addEventListener('click', onClick);
      cleanups.push(() => d.removeEventListener('click', onClick));
      dots.appendChild(d);
      return d;
    });

    section.querySelector('.plg-gallery__inner')?.appendChild(dots);
    cleanups.push(() => dots.remove());

    // Marca el dot activo según qué slide está visible.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = slides.indexOf(e.target);
          btns.forEach((b, i) => b.setAttribute('aria-current', i === idx ? 'true' : 'false'));
        }
      }, { root: track, threshold: 0.6 });
      slides.forEach((s) => io.observe(s));
      btns[0]?.setAttribute('aria-current', 'true');
      cleanups.push(() => io.disconnect());
    }
  }

  return () => { for (const fn of cleanups) fn(); };
}
