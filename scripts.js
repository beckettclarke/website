log('Loaded scripts.js v12', '#0066ff', '📜 Script');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

// ===[ Fragments ]============================================
// fetch() is blocked on file://, so fall back to the fragments.js bundle
async function loadFragment(id, url) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw r;
    get.id(id).innerHTML = await r.text();
  } catch (e) {
    get.id(id).innerHTML = (window.BC_FRAGMENTS && window.BC_FRAGMENTS[url]) || '';
  }
}
loadFragment('header', 'header.html').then(() => { initNav(); markActiveNav(window.currentRoute); });
loadFragment('footer', 'footer.html').then(initFooter);

// ===[ Nav ]==================================================
function setNavOpen(open) {
  const toggle = get.id('navtoggle');
  document.body.classList.toggle('nav-open', open);
  if (toggle) toggle.setAttribute('aria-expanded', String(open));
}

function initNav() {
  const toggle = get.id('navtoggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => setNavOpen(!document.body.classList.contains('nav-open')));
  // Tapping a link or pressing Escape closes the drawer.
  document.addEventListener('click', e => { if (e.target.closest('#nav a')) setNavOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setNavOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) setNavOpen(false); });
}

function markActiveNav(route) {
  if (!route) return;
  const section =
    route === 'home' ? 'home' :
    route.startsWith('clients_northmount') ? 'photography' :
    route.startsWith('clients') ? 'clients' :
    route.startsWith('photography') ? 'photography' :
    route.startsWith('macicons') ? 'macicons' : '';
  get.queryAll('#header [data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === section);
  });
}

// ===[ Footer ]===============================================
function initFooter() {
  get.queryAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  onScroll();
}

// ===[ Scroll state ]=========================================
let scrollTick = false;
function onScroll() {
  const y = window.scrollY;
  document.body.classList.toggle('scrolled', y > 24);
  document.body.classList.toggle('deep', y > window.innerHeight * 1.5);

  // The footer mark rises as it comes into view
  const mark = get.query('.foot-mark img');
  if (mark) {
    const r = mark.parentElement.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (r.height + 120)));
    mark.style.setProperty('--rise', `${(1 - p) * 70 + 6}%`);
  }
  scrollTick = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll); }
}, { passive: true });

// ===[ Page init ]============================================
// Called by the router every time a page is swapped in.
function initPage(root, route) {
  const page = root.querySelector('[data-title]');
  const title = page && page.dataset.title;
  document.title = title ? `${title} · Beckett Clarke` : 'Beckett Clarke';

  const tint = page && page.dataset.tint;
  document.body.classList.toggle('has-tint', !!tint);
  if (tint) document.body.style.setProperty('--tint', tint);

  setNavOpen(false);
  // A dropdown link keeps focus after it's clicked, which would hold the menu open
  const focused = document.activeElement;
  if (focused && focused.closest && focused.closest('#header .dropdown')) focused.blur();
  markActiveNav(route);
  hidePeek();

  initMasonry(root);
  initImages(root);
  initReveal(root);
  initStrip(root);
  initPeek(root);
  initJump(root);
  initVideos(root);
  onScroll();
}

// Gallery markup stays a plain list of <img largeview> tags; wrap each one in a
// figure with its frame number so the hover caption and hairline work.
function initMasonry(root) {
  root.querySelectorAll('.masonry > img').forEach(img => {
    const fig = document.createElement('figure');
    fig.className = 'shot';
    img.replaceWith(fig);
    fig.appendChild(img);
    const cap = document.createElement('figcaption');
    cap.className = 'mono';
    cap.textContent = frameName(img.getAttribute('src'));
    fig.appendChild(cap);
  });
}

// Images fade up when they arrive
function initImages(root) {
  root.querySelectorAll('img').forEach(img => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('is-loading');
    const done = () => { img.classList.remove('is-loading'); img.classList.add('is-loaded'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

// ===[ Reveal on scroll ]=====================================
let revealIO;
function initReveal(root) {
  const els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  if (revealIO) revealIO.disconnect();
  revealIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealIO.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .08 });
  els.forEach(el => revealIO.observe(el));
}

// ===[ Filmstrip ]============================================
// Duplicate the strip once so translateX(-50%) loops seamlessly.
function initStrip(root) {
  root.querySelectorAll('.strip-track').forEach(track => {
    if (track.dataset.looped) return;
    track.dataset.looped = '1';
    [...track.children].forEach(fig => {
      const clone = fig.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach(img => { img.dataset.clone = '1'; img.alt = ''; });
      track.appendChild(clone);
    });
    // Constant speed regardless of how wide the strip turns out
    const setSpeed = () => {
      const half = track.scrollWidth / 2;
      track.style.setProperty('--dur', `${Math.max(30, half / 38)}s`);
    };
    setSpeed();
    window.addEventListener('resize', setSpeed, { passive: true });
  });
}

// ===[ Work list: preview that trails the cursor ]============
const peek = { el: null, img: null, x: 0, y: 0, tx: 0, ty: 0, on: false, raf: 0 };

function hidePeek() {
  if (!peek.el) return;
  peek.on = false;
  peek.el.classList.remove('on');
}

function initPeek(root) {
  const list = root.querySelector('.work-list');
  if (!list || !finePointer.matches) return;
  peek.el = get.id('peek');
  peek.img = peek.el.querySelector('img');

  // Warm the cache so the first hover isn't blank
  list.querySelectorAll('[data-peek]').forEach(a => { new Image().src = a.dataset.peek; });

  const loop = () => {
    peek.x += (peek.tx - peek.x) * .14;
    peek.y += (peek.ty - peek.y) * .14;
    const dx = peek.tx - peek.x;
    const rot = Math.max(-10, Math.min(10, dx * .06));
    const h = peek.el.offsetHeight;
    peek.el.style.transform = `translate3d(${peek.x + 28}px, ${peek.y - h / 2}px, 0) rotate(${rot}deg)`;
    if (peek.on || Math.abs(dx) > .4) peek.raf = requestAnimationFrame(loop);
    else peek.raf = 0;
  };

  list.addEventListener('mousemove', e => {
    peek.tx = e.clientX;
    peek.ty = e.clientY;
    if (!peek.raf) peek.raf = requestAnimationFrame(loop);
  });
  list.querySelectorAll('[data-peek]').forEach(row => {
    row.addEventListener('mouseenter', e => {
      if (!peek.on) { peek.x = peek.tx = e.clientX; peek.y = peek.ty = e.clientY; }
      peek.img.src = row.dataset.peek;
      peek.on = true;
      peek.el.classList.add('on');
      if (!peek.raf) peek.raf = requestAnimationFrame(loop);
    });
  });
  list.addEventListener('mouseleave', hidePeek);
  window.addEventListener('scroll', hidePeek, { passive: true });
}

// ===[ Sticky jump nav with scroll-spy ]======================
let jumpIO;
function initJump(root) {
  const nav = root.querySelector('.jump');
  if (jumpIO) jumpIO.disconnect();
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const byId = new Map(links.map(a => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
  const rail = nav.querySelector('.jump-rail') || nav;

  jumpIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const a = byId.get(entry.target.id);
      if (!a) return;
      links.forEach(l => l.classList.toggle('active', l === a));
      rail.scrollTo({ left: a.offsetLeft - rail.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  byId.forEach((a, id) => { const s = document.getElementById(id); if (s) jumpIO.observe(s); });
}

// ===[ Videos only play while on screen ]=====================
let videoIO;
function initVideos(root) {
  if (videoIO) videoIO.disconnect();
  const vids = root.querySelectorAll('video[autoplay]');
  if (!vids.length || !('IntersectionObserver' in window)) return;
  videoIO = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  });
  vids.forEach(v => { v.muted = true; videoIO.observe(v); });
}

// ===[ Lightbox ]=============================================
const lb = {
  el: null, img: null, list: [], i: 0, lastFocus: null,
  get open() { return this.el && this.el.classList.contains('open'); }
};

function fullSrc(img) {
  return img.dataset.full || img.getAttribute('src').replace('-preview', '');
}

function frameName(src) {
  let n = decodeURIComponent(src.split('/').pop()).replace(/\.[a-z0-9]+$/i, '').replace('-preview', '');
  // Photos-app exports are long UUIDs; keep them readable
  if (/^[0-9A-F]{8}-/i.test(n)) n = 'IMG ' + n.slice(0, 8);
  return n.replace(/_/g, ' ');
}

function lbShow(i) {
  const n = lb.list.length;
  lb.i = (i + n) % n;
  const thumb = lb.list[lb.i];
  const full = fullSrc(thumb);
  const pad = String(n).length < 2 ? 2 : String(n).length;

  lb.el.querySelector('.lb-count').textContent = `${String(lb.i + 1).padStart(pad, '0')} / ${String(n).padStart(pad, '0')}`;
  const section = thumb.closest('[data-name]');
  lb.el.querySelector('.lb-name').textContent = (section ? section.dataset.name + ' · ' : '') + frameName(full);
  lb.img.alt = thumb.alt || '';

  // Show the cached preview straight away, then swap in the full-size file
  lb.img.classList.remove('ready');
  lb.img.classList.add('soft');
  lb.el.classList.add('loading');
  lb.img.src = thumb.currentSrc || thumb.src;
  requestAnimationFrame(() => lb.img.classList.add('ready'));

  const hi = new Image();
  hi.onload = () => {
    if (lb.list[lb.i] !== thumb) return;
    lb.img.src = full;
    lb.img.classList.remove('soft');
    lb.el.classList.remove('loading');
  };
  hi.onerror = () => { lb.img.classList.remove('soft'); lb.el.classList.remove('loading'); };
  hi.src = full;

  // Preload neighbours
  [1, -1].forEach(d => { const t = lb.list[(lb.i + d + n) % n]; if (t) new Image().src = fullSrc(t); });
}

function lbOpen(list, i) {
  lb.list = list;
  lb.lastFocus = document.activeElement;
  lb.el.classList.toggle('single', list.length < 2);
  lb.el.classList.add('open');
  lb.el.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';
  lbShow(i);
  lb.el.querySelector('.lb-close').focus({ preventScroll: true });
}

function lbClose() {
  if (!lb.open) return;
  lb.el.classList.remove('open', 'loading');
  lb.el.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  if (lb.lastFocus) lb.lastFocus.focus({ preventScroll: true });
}

function initLightbox() {
  lb.el = get.id('lightbox');
  lb.img = lb.el.querySelector('.lb-img');

  document.addEventListener('click', e => {
    const img = e.target.closest('img[largeview]');
    if (!img) return;
    e.preventDefault();
    // Group: the nearest gallery, otherwise the whole page. Filmstrip clones map back to originals.
    const scope = img.closest('[data-gallery]') || get.tag('content')[0];
    const list = [...scope.querySelectorAll('img[largeview]:not([data-clone])')];
    let i = list.indexOf(img);
    if (i < 0) i = Math.max(0, list.findIndex(t => t.getAttribute('src') === img.getAttribute('src')));
    lbOpen(list, i);
  });

  lb.el.querySelector('.lb-close').addEventListener('click', lbClose);
  lb.el.querySelector('.lb-prev').addEventListener('click', () => lbShow(lb.i - 1));
  lb.el.querySelector('.lb-next').addEventListener('click', () => lbShow(lb.i + 1));
  lb.el.querySelector('.lb-stage').addEventListener('click', e => { if (e.target !== lb.img) lbClose(); });

  document.addEventListener('keydown', e => {
    if (!lb.open) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow(lb.i + 1);
    else if (e.key === 'ArrowLeft') lbShow(lb.i - 1);
    else if (e.key === 'Tab') {
      // Keep focus inside the viewer
      const f = [...lb.el.querySelectorAll('button')].filter(b => b.offsetParent);
      const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // Swipe between photos on touch screens
  let sx = null, sy = null;
  lb.el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.el.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lb.i + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) lbClose();
    sx = sy = null;
  });
}
initLightbox();

// ===[ Toast ]================================================
let toastTimer;
function toast(html) {
  const t = get.id('toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ===[ Brand swatches: click to copy the hex ]===============
document.addEventListener('click', e => {
  const sw = e.target.closest('.swatch[data-hex]');
  if (!sw) return;
  const hex = sw.dataset.hex;
  const chip = `<span style="width:18px;height:18px;border-radius:5px;background:${hex};box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)"></span>`;
  const done = () => toast(`${chip} Copied ${hex}`);
  const fail = () => toast(`${chip} ${hex}`);
  if (navigator.clipboard) navigator.clipboard.writeText(hex).then(done, fail);
  else fail();
});

// ===[ macOS icons: select like Finder, then download ]=======
function mi(e) {
  const img = e.querySelector('img');
  if (!img) return;
  get.queryAll('.macicon.sel').forEach(el => el !== e && el.classList.remove('sel'));
  e.classList.add('sel');

  const a = document.createElement('a');
  a.href = img.src;
  const filename = decodeURIComponent(img.src.split('/').pop());
  a.download = filename || 'image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const label = e.textContent.trim();
  toast(`<img src="${img.getAttribute('src')}" alt=""> Downloading ${label.replace(/[<>&]/g, '')}`);
}
