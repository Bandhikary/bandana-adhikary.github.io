// Footer year
document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Reveal sections, cards and paintings as they scroll into view ----------
const items = document.querySelectorAll('.reveal, .cards > *, .posts li, .featured, .paintings > *, [data-reveal]');
if (calm || !('IntersectionObserver' in window)) {
  items.forEach(el => el.classList.add('is-in'));
} else {
  items.forEach(el => el.classList.add('will-reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
}

// ---------- Scroll-driven effects: nav, progress bar, parallax ----------
const nav = document.querySelector('.nav');
const progress = document.querySelector('.scroll-progress');
const layers = document.querySelectorAll('.parallax');
const heroText = document.querySelector('.hero-text, .page-hero-text');
let lastY = scrollY;
let ticking = false;

function onScroll() {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;

  if (progress) progress.style.setProperty('--progress', max > 0 ? y / max : 0);

  if (nav) {
    nav.classList.toggle('is-scrolled', y > 10);
    // hide while scrolling down, bring back on the way up
    const down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 160 && !document.querySelector('.lightbox[open]')) nav.classList.add('is-hidden');
    if (up || y < 160) nav.classList.remove('is-hidden');
  }

  if (!calm) {
    const h = Math.min(y, 700);
    layers.forEach(l => l.style.transform = `translateY(${h * l.dataset.speed}px)`);
    if (heroText) {
      heroText.style.transform = `translateY(${h * 0.18}px)`;
      heroText.style.opacity = Math.max(0, 1 - h / 300);
    }
  }
  lastY = y;
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

// ---------- Painting viewer ----------
const lightbox = document.querySelector('.lightbox');
const paintings = [...document.querySelectorAll('.painting')];
if (lightbox && paintings.length) {
  let index = 0;
  const art = lightbox.querySelector('.lb-art');
  const show = i => {
    index = (i + paintings.length) % paintings.length;
    const p = paintings[index];
    const visual = p.querySelector('img, .paint-ph').cloneNode(true);
    // keep the placeholder's colours, which come from the tile's position
    if (visual.classList.contains('paint-ph')) {
      const cs = getComputedStyle(p.querySelector('.paint-ph'));
      ['--p1', '--p2', '--p3'].forEach(v => visual.style.setProperty(v, cs.getPropertyValue(v)));
    }
    art.replaceChildren(visual);
    lightbox.querySelector('.lb-title').textContent = p.dataset.title || '';
    lightbox.querySelector('.lb-meta').textContent = p.dataset.meta || '';
    lightbox.querySelector('.lb-desc').textContent = p.dataset.desc || '';
  };
  paintings.forEach((p, i) => p.addEventListener('click', () => { show(i); lightbox.showModal(); }));
  lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  lightbox.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}

// ---------- Business card: tilt and shine follow the pointer ----------
const card = document.querySelector('.bcard');
if (card && !calm && matchMedia('(hover: hover)').matches) {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.classList.add('is-tilting');
    card.style.setProperty('--ry', `${(x - .5) * 14}deg`);
    card.style.setProperty('--rx', `${(.5 - y) * 12}deg`);
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-tilting');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
}

// ---------- "Save contact" builds a vCard from the business card ----------
const save = document.getElementById('save-contact');
if (save && card) {
  const text = sel => (card.querySelector(sel)?.textContent || '').trim();
  const link = part => card.querySelector(`.bcard-links a[href*="${part}"]`)?.href || '';
  const vcf = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${text('.bcard-name')}`,
    `TITLE:${text('.bcard-role')}`,
    `EMAIL:${link('mailto:').replace('mailto:', '')}`,
    `URL:https://bandanaadhikary.com.np`,
    `X-SOCIALPROFILE;TYPE=linkedin:${link('linkedin')}`,
    `X-SOCIALPROFILE;TYPE=instagram:${link('instagram')}`,
    'ADR:;;;Kathmandu;;;Nepal',
    'END:VCARD'
  ].join('\r\n');
  save.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcf);
}
