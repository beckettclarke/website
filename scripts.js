log('Loaded scripts.js v13', '#0066ff', '📜 Script');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

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
  decodeEmails(get.id(id));
}

// Cloudflare rewrites mailto links into /cdn-cgi/l/email-protection#<hex> and
// appends a decoder script, which never runs in innerHTML, so decode them here
function cfDecode(hex) {
  const key = parseInt(hex.slice(0, 2), 16);
  let s = '';
  for (let i = 2; i < hex.length; i += 2) s += '%' + ('0' + (parseInt(hex.slice(i, i + 2), 16) ^ key).toString(16)).slice(-2);
  try { return decodeURIComponent(s); } catch (e) { return ''; }
}
function decodeEmails(root) {
  root.querySelectorAll('a[href*="/cdn-cgi/l/email-protection#"]').forEach(a => {
    const href = a.getAttribute('href');
    a.setAttribute('href', 'mailto:' + cfDecode(href.slice(href.indexOf('#') + 1)));
  });
  root.querySelectorAll('[data-cfemail]').forEach(el => el.replaceWith(cfDecode(el.dataset.cfemail)));
  root.querySelectorAll('script[src*="/cdn-cgi/"]').forEach(s => s.remove());
}
loadFragment('header', 'header.html').then(() => { initNav(); markActiveNav(window.currentRoute); });
loadFragment('footer', 'footer.html').then(initFooter);

// ===[ Nav ]==================================================
function setNavOpen(open) {
  const toggle = get.id('navtoggle');
  document.body.classList.toggle('nav-open', open);
  if (toggle) toggle.setAttribute('aria-expanded', String(open));
}

// One marker that glides to whichever item it's sent to, used by the nav on
// hover and by the jump bar for the section being read. The first time it
// shows it lands in place; after that it slides.
function glider(container, cls) {
  const pill = document.createElement('span');
  pill.className = cls;
  pill.setAttribute('aria-hidden', 'true');
  container.prepend(pill);
  container.classList.add('has-pill');
  return {
    to(el) {
      if (!el) return this.hide();
      const c = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const fresh = !pill.classList.contains('on');
      pill.classList.toggle('snap', fresh);
      pill.style.width = `${r.width}px`;
      pill.style.transform = `translateX(${r.left - c.left + container.scrollLeft}px)`;
      if (fresh) void pill.offsetWidth;
      pill.classList.remove('snap');
      pill.classList.add('on');
    },
    hide() { pill.classList.remove('on'); }
  };
}

function initNav() {
  const nav = get.id('nav');
  if (nav) {
    const pill = glider(nav, 'nav-pill');
    nav.querySelectorAll('.navsection').forEach(sec => {
      const btn = sec.querySelector('.ddbutton');
      sec.addEventListener('mouseenter', () => pill.to(btn));
      sec.addEventListener('focusin', () => pill.to(btn));
    });
    nav.addEventListener('mouseleave', () => pill.hide());
    nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget) && !nav.matches(':hover')) pill.hide(); });
  }

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

  // Hold the client tint back until a video hero has mostly scrolled away,
  // otherwise it glows through below the hero's dark fade
  const hero = get.query('.v-hero');
  document.body.classList.toggle('tint-held', !!hero && hero.getBoundingClientRect().bottom > window.innerHeight * .25);

  // The footer mark rises as it comes into view
  const mark = get.query('.foot-mark img');
  if (mark) {
    const r = mark.parentElement.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (r.height + 120)));
    mark.style.setProperty('--rise', `${(1 - p) * 70 + 6}%`);
  }
  updateToc();
  scrollTick = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll); }
}, { passive: true });

// ===[ Page init ]============================================
// Called by the router every time a page is swapped in.
function initPage(root, route) {
  decodeEmails(root);
  const page = root.querySelector('[data-title]');
  const title = page && page.dataset.title;
  document.title = title ? `${title} · Beckett Clarke` : 'Beckett Clarke';

  const tint = page && page.dataset.tint;
  document.body.classList.toggle('has-tint', !!tint);
  if (tint) document.body.style.setProperty('--tint', tint);
  onScroll();

  setNavOpen(false);
  // A dropdown link keeps focus after it's clicked, which would hold the menu open
  const focused = document.activeElement;
  if (focused && focused.closest && focused.closest('#header .dropdown')) focused.blur();
  markActiveNav(route);

  initSplit(root);
  initChips(root);
  initMasonry(root);
  initShots(root);
  // Before initImages, so the filmstrip's clones get their own load handlers
  // instead of copying an is-loading class that nothing would ever remove
  initStrip(root);
  initImages(root);
  initReveal(root);
  initJump(root);
  initToc(root);
  initVideos(root);
  onScroll();
}

// Page headlines arrive a word at a time. Each word of the h1 is wrapped and
// numbered; the chips sitting in the hero sentence take a number in the same
// sequence, so they pop in right after the word they belong to.
function initSplit(root) {
  root.querySelectorAll('h1.hero-title, h1.display').forEach(h => {
    if (h.hasAttribute('data-split')) return;
    h.setAttribute('data-split', '');
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('chip')) n.style.setProperty('--i', i++);
          else walk(n);
        }
      });
    };
    walk(h);

    // The words carry the entrance now, so the block-level fade steps aside
    h.removeAttribute('data-reveal');
    const wrap = h.closest('[data-reveal]');
    if (wrap) wrap.setAttribute('data-reveal', 'off');

    // Next frame, so the hidden state is painted first. The timer is a backstop
    // for a tab that isn't drawing frames yet (opened in the background).
    const go = () => h.classList.add('in');
    if (reduceMotion.matches) go();
    else {
      requestAnimationFrame(() => requestAnimationFrame(go));
      setTimeout(go, 120);
    }
  });
}

// Hero chips: work out how far each one may spread before it would push its
// word onto the next line, and hand that to the CSS as --k.
function initChips(root) {
  root.querySelectorAll('.chip-stack, .chip-photos').forEach(chip => {
    chip.addEventListener('mouseenter', () => {
      const title = chip.closest('h1');
      const group = chip.closest('.nw') || chip;
      if (!title) return;
      const imgs = chip.querySelectorAll('img').length;
      const em = parseFloat(getComputedStyle(chip).fontSize);
      const perGap = chip.classList.contains('chip-photos') ? .61 : .36;
      const wanted = perGap * em * (imgs - 1);
      const room = title.getBoundingClientRect().right - group.getBoundingClientRect().right - 2;
      chip.style.setProperty('--k', Math.max(0, Math.min(1, room / wanted)).toFixed(3));
    });
  });
}

// Gallery markup stays a plain list of <img largeview> tags; wrap each one in a
// figure so the hairline works.
function initMasonry(root) {
  root.querySelectorAll('.masonry > img').forEach(img => {
    const fig = document.createElement('figure');
    fig.className = 'shot';
    img.replaceWith(fig);
    fig.appendChild(img);
  });
}

// Gallery photos rise as they scroll into view. Photos that arrive together
// follow each other in, a beat apart.
let shotIO;
function initShots(root) {
  if (shotIO) shotIO.disconnect();
  const grids = root.querySelectorAll('.masonry');
  if (!grids.length || !('IntersectionObserver' in window) || reduceMotion.matches) return;
  shotIO = new IntersectionObserver(entries => {
    let k = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.setProperty('--sd', `${Math.min(k++, 6) * 55}ms`);
      entry.target.classList.add('in');
      shotIO.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -4% 0px', threshold: .05 });
  grids.forEach(grid => {
    grid.classList.add('rv');
    grid.querySelectorAll('.shot').forEach(shot => shotIO.observe(shot));
  });
}

// CSS stops images being dragged everywhere but Firefox, which ignores
// -webkit-user-drag. Images inside links are left alone so the link drags.
document.addEventListener('dragstart', e => {
  if (e.target instanceof HTMLImageElement && !e.target.closest('a')) e.preventDefault();
});

// Images fade up when they arrive. The fade's transition would override the
// image's own (hover zooms etc.), so drop the class once it's done.
function initImages(root) {
  root.querySelectorAll('img').forEach(img => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('is-loading');
    const done = () => {
      img.classList.remove('is-loading');
      img.classList.add('is-loaded');
      setTimeout(() => img.classList.remove('is-loaded'), 800);
    };
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
      // A section's icon plays its hover animation once as the heading arrives
      const icon = entry.target.querySelector('.sec-t');
      if (icon) {
        setTimeout(() => icon.classList.add('play'), 380);
        setTimeout(() => icon.classList.remove('play'), 1500);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .08 });
  els.forEach(el => revealIO.observe(el));
}

// ===[ Filmstrip ]============================================
// The strip is doubled so it can loop, then driven from here rather than by a
// CSS animation: it drifts, eases to a stop under the pointer instead of
// freezing, and can be dragged or flicked like a real strip of film.
let stripStop = null;
function initStrip(root) {
  if (stripStop) { stripStop(); stripStop = null; }
  const track = root.querySelector('.strip-track');
  if (!track || track.dataset.looped) return;
  track.dataset.looped = '1';
  const strip = track.parentElement;
  [...track.children].forEach(fig => {
    const clone = fig.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach(img => { img.dataset.clone = '1'; img.alt = ''; });
    track.appendChild(clone);
  });
  // Reduced motion: the strip stays put and scrolls by hand (see home.css)
  if (reduceMotion.matches) return;

  const DRIFT = -38; // px per second, leftwards
  let x = 0, v = DRIFT, half = 0, last = 0, raf = 0;
  let visible = true, hover = false, drag = null, moved = false;
  const measure = () => { half = track.scrollWidth / 2; };
  measure();

  const frame = now => {
    raf = 0;
    if (!track.isConnected) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!drag) {
      // Ease towards the drift, or towards a stop while it's being looked at
      const target = hover || lb.open ? 0 : DRIFT;
      v += (target - v) * Math.min(1, dt * 3.2);
      x += v * dt;
    }
    if (half) x = ((x % half) - half) % half; // wrap into (-half, 0]
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  strip.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
  strip.addEventListener('pointerleave', () => { hover = false; });

  strip.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, x0: e.clientX, from: x, px: e.clientX, pt: performance.now(), vel: 0 };
    moved = false;
  });
  strip.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (!moved) {
      if (Math.abs(dx) < 5) return;
      moved = true;
      strip.classList.add('is-dragging');
      try { strip.setPointerCapture(drag.id); } catch (err) {}
    }
    const now = performance.now();
    drag.vel = .7 * drag.vel + .3 * ((e.clientX - drag.px) / Math.max(1, now - drag.pt) * 1000);
    drag.px = e.clientX;
    drag.pt = now;
    x = drag.from + dx;
  });
  const release = e => {
    if (!drag || e.pointerId !== drag.id) return;
    // Let go mid-flick and it carries on, then settles back into the drift
    if (moved) {
      v = performance.now() - drag.pt < 80 ? Math.max(-2600, Math.min(2600, drag.vel)) : 0;
      strip.classList.remove('is-dragging');
    }
    drag = null;
  };
  strip.addEventListener('pointerup', release);
  strip.addEventListener('pointercancel', release);
  // A drag shouldn't open the photo it started on
  strip.addEventListener('click', e => {
    if (!moved) return;
    moved = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  track.addEventListener('load', measure, true);
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', start);
  let io;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    io.observe(strip);
  }
  start();

  stripStop = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', measure);
    document.removeEventListener('visibilitychange', start);
    if (io) io.disconnect();
  };
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
  const pill = glider(rail, 'jump-pill');

  jumpIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const a = byId.get(entry.target.id);
      if (!a) return;
      links.forEach(l => l.classList.toggle('active', l === a));
      pill.to(a);
      rail.scrollTo({ left: a.offsetLeft - rail.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  byId.forEach((a, id) => { const s = document.getElementById(id); if (s) jumpIO.observe(s); });
}

// ===[ Section notches ]=====================================
// Pages marked data-toc get a ruler on the left: one long notch per
// section, short ones between that fill in as you read through it.
let toc = null;
const TOC_MINOR = 3;

function pageTop(el) {
  let y = 0;
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
  return y;
}

function initToc(root) {
  const old = get.query('body > .toc');
  if (old) old.remove();
  toc = null;

  const page = root.querySelector('[data-toc]');
  if (!page) return;
  const secs = [...page.querySelectorAll('section[data-toc-label]:not([hidden])')];
  if (secs.length < 2) return;

  const nav = document.createElement('nav');
  nav.className = 'toc';
  nav.setAttribute('aria-label', 'Sections');
  const majors = [], minors = [];
  secs.forEach((sec, i) => {
    const a = document.createElement('a');
    a.className = 'major';
    a.href = '#' + sec.id;
    a.innerHTML = '<i></i><span></span>';
    a.querySelector('span').textContent = sec.dataset.tocLabel;
    nav.appendChild(a);
    majors.push(a);
    const row = [];
    if (i < secs.length - 1) {
      for (let k = 0; k < TOC_MINOR; k++) {
        const m = document.createElement('span');
        m.className = 'minor';
        m.innerHTML = '<i></i>';
        nav.appendChild(m);
        row.push(m);
      }
    }
    minors.push(row);
  });
  document.body.appendChild(nav);
  toc = { nav, secs, majors, minors };
  updateToc();
}

function updateToc() {
  if (!toc) return;
  const { nav, secs, majors, minors } = toc;
  const y = window.scrollY + window.innerHeight * .4;
  const tops = secs.map(pageTop);
  const last = secs[secs.length - 1];
  const end = tops[tops.length - 1] + last.offsetHeight;

  let cur = -1;
  tops.forEach((t, i) => { if (y >= t) cur = i; });
  nav.classList.toggle('on', y >= tops[0] - window.innerHeight * .3 && y < end + window.innerHeight * .2);

  majors.forEach((a, i) => {
    a.classList.toggle('lit', i <= cur);
    a.classList.toggle('active', i === cur);
  });
  minors.forEach((row, i) => {
    if (!row.length) return;
    const p = (y - tops[i]) / (tops[i + 1] - tops[i]);
    row.forEach((m, k) => m.classList.toggle('lit', p > (k + 1) / (TOC_MINOR + 1)));
  });
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
  // These are backdrops, not players: no Picture-in-Picture toggle (Firefox
  // shows one on hover) and no cast button
  vids.forEach(v => {
    v.muted = true;
    v.disablePictureInPicture = true;
    v.disableRemotePlayback = true;
    videoIO.observe(v);
  });
}

// ===[ Lightbox ]=============================================
const lb = {
  el: null, img: null, list: [], i: 0, token: 0, lastFocus: null,
  // The thumbnail that was clicked, the photo it opened on, and whether the
  // opening flight from that thumbnail is still to come
  origin: null, openI: 0, from: null,
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

// Where the big photo has to sit to lie exactly over a thumbnail, cropped the
// way the thumbnail is cropped. Measured with no transform on the big photo.
function flyRect(img, thumb) {
  const a = thumb.getBoundingClientRect();
  if (a.width < 8 || a.bottom < 0 || a.top > window.innerHeight || a.right < 0 || a.left > window.innerWidth) return null;
  const b = img.getBoundingClientRect();
  if (!b.width || !b.height) return null;
  const s = Math.max(a.width / b.width, a.height / b.height);
  const cx = Math.max(0, (b.width - a.width / s) / 2);
  const cy = Math.max(0, (b.height - a.height / s) / 2);
  const r = parseFloat(getComputedStyle(thumb).borderTopLeftRadius) ||
            parseFloat(getComputedStyle(thumb.parentElement).borderTopLeftRadius) || 0;
  const dx = (a.left + a.width / 2) - (b.left + b.width / 2);
  const dy = (a.top + a.height / 2) - (b.top + b.height / 2);
  return {
    transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`,
    clip: `inset(${cy.toFixed(1)}px ${cx.toFixed(1)}px round ${(r / s).toFixed(1)}px)`
  };
}

// Opening: start the photo on top of its thumbnail and let it grow into place
function flyFrom(img, thumb) {
  if (reduceMotion.matches) return false;
  img.classList.remove('fly', 'fly-back');
  img.style.transition = 'none';
  img.classList.remove('pre');
  const f = flyRect(img, thumb);
  if (!f) {
    img.classList.add('pre');
    void img.offsetWidth;
    img.style.transition = '';
    return false;
  }
  img.style.transform = f.transform;
  img.style.clipPath = f.clip;
  void img.offsetWidth;
  img.style.transition = '';
  img.classList.add('fly');
  img.style.transform = '';
  img.style.clipPath = 'inset(0px 0px round 6px)';
  const token = lb.token;
  setTimeout(() => {
    if (lb.token !== token) return;
    img.classList.remove('fly');
    img.style.clipPath = '';
  }, 620);
  return true;
}

// dir: 1 = next, -1 = previous, 0 = just opened
function lbShow(i, dir = 0) {
  const n = lb.list.length;
  const token = ++lb.token;
  lb.i = (i + n) % n;
  const thumb = lb.list[lb.i];
  const full = fullSrc(thumb);
  const preview = thumb.currentSrc || thumb.getAttribute('src');
  const pad = String(n).length < 2 ? 2 : String(n).length;
  const img = lb.img;

  lb.el.querySelector('.lb-count').textContent = `${String(lb.i + 1).padStart(pad, '0')} / ${String(n).padStart(pad, '0')}`;
  const section = thumb.closest('[data-name]');
  lb.el.querySelector('.lb-name').textContent = (section ? section.dataset.name + ' · ' : '') + frameName(full);

  const live = () => token === lb.token;
  const decode = el => (el.decode ? el.decode().catch(() => {}) : Promise.resolve());
  const reveal = () => {
    if (!live()) return;
    if (lb.from) {
      const from = lb.from;
      lb.from = null;
      if (flyFrom(img, from)) return;
    }
    void img.offsetWidth;
    img.classList.remove('pre');
  };

  const enter = () => {
    if (!live()) return;
    // Park the image just off to the side, invisible, ready to slide in
    img.style.setProperty('--dir', dir);
    img.classList.remove('leave', 'fly', 'fly-back');
    img.style.transform = '';
    img.style.clipPath = '';
    img.classList.add('pre', 'soft');
    lb.el.classList.add('loading');
    img.alt = thumb.alt || '';

    // Size the photo's box from its shape up front, so the small preview and
    // the full file occupy exactly the same space and nothing jumps between them
    const tw = thumb.naturalWidth || +thumb.getAttribute('width') || 3;
    const th = thumb.naturalHeight || +thumb.getAttribute('height') || 2;
    img.style.setProperty('--ar', (tw / th).toFixed(4));
    img.style.setProperty('--mw', /-preview\./.test(preview) || thumb.dataset.full ? '100%' : `${tw}px`);

    let hiReady = false;

    // The gallery thumbnail is usually cached, so it can go up straight away
    const pv = new Image();
    const showPreview = () => {
      if (!live() || hiReady) return;
      img.src = preview;
      decode(img).then(reveal);
    };
    pv.onload = pv.onerror = showPreview;
    pv.src = preview;
    if (pv.complete && pv.naturalWidth) { pv.onload = pv.onerror = null; showPreview(); }

    // Then the full-size file replaces it once it has arrived
    const hi = new Image();
    hi.onload = () => decode(hi).then(() => {
      if (!live()) return;
      hiReady = true;
      img.src = full;
      img.classList.remove('soft');
      lb.el.classList.remove('loading');
      reveal();
    });
    hi.onerror = () => { if (live()) { img.classList.remove('soft'); lb.el.classList.remove('loading'); reveal(); } };
    hi.src = full;
  };

  // Slide the current photo a little way out first, then bring the next one in
  if (dir && img.getAttribute('src')) {
    img.style.setProperty('--dir', dir);
    img.classList.add('leave');
    setTimeout(enter, 170);
  } else {
    enter();
  }

  // Warm up the neighbours so paging feels instant
  [1, -1].forEach(d => {
    const t = lb.list[(lb.i + d + n) % n];
    if (t) { new Image().src = t.getAttribute('src'); new Image().src = fullSrc(t); }
  });
}

function lbOpen(list, i, origin) {
  lb.list = list;
  lb.origin = lb.from = origin || list[i];
  lb.openI = i;
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
  const token = ++lb.token;
  const img = lb.img;

  // Closing: the photo shrinks back onto its thumbnail, if that's on screen
  const thumb = lb.i === lb.openI && lb.origin && lb.origin.isConnected ? lb.origin : lb.list[lb.i];
  lb.from = null;
  if (thumb && !reduceMotion.matches && img.getAttribute('src') && !img.classList.contains('pre')) {
    img.classList.remove('fly', 'leave');
    img.style.transition = 'none';
    img.style.transform = '';
    const f = flyRect(img, thumb);
    if (f) {
      img.style.clipPath = 'inset(0px 0px round 6px)';
      void img.offsetWidth;
      img.style.transition = '';
      img.classList.add('fly-back');
      img.style.transform = f.transform;
      img.style.clipPath = f.clip;
    } else {
      img.style.transition = '';
    }
  }
  setTimeout(() => {
    if (lb.token !== token) return;
    // Put it back without animating; the viewer is hidden by now
    img.style.transition = 'none';
    img.classList.remove('fly-back');
    img.style.transform = '';
    img.style.clipPath = '';
    void img.offsetWidth;
    img.style.transition = '';
  }, 380);

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
    lbOpen(list, i, img);
  });

  lb.el.querySelector('.lb-close').addEventListener('click', lbClose);
  lb.el.querySelector('.lb-prev').addEventListener('click', () => lbShow(lb.i - 1, -1));
  lb.el.querySelector('.lb-next').addEventListener('click', () => lbShow(lb.i + 1, 1));
  lb.el.querySelector('.lb-stage').addEventListener('click', e => { if (e.target !== lb.img) lbClose(); });

  document.addEventListener('keydown', e => {
    if (!lb.open) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow(lb.i + 1, 1);
    else if (e.key === 'ArrowLeft') lbShow(lb.i - 1, -1);
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
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lb.i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
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

// ===[ macOS icons: select like Finder, then download ]=======
function mi(e) {
  const img = e.querySelector('img');
  if (!img) return;
  get.queryAll('.macicon.sel').forEach(el => el !== e && el.classList.remove('sel'));
  e.classList.add('sel');

  // The icons live on the CDN, and browsers ignore `download` on cross-origin
  // links, so fetch the file and save it from a local blob URL instead.
  // The grid shows small WebP previews; the download is the full-size original
  const full = img.dataset.full || img.src;
  const filename = decodeURIComponent(full.split('/').pop()) || 'icon.png';
  fetch(full)
    .then(r => { if (!r.ok) throw r; return r.blob(); })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    })
    .catch(() => window.open(full, '_blank', 'noopener'));

  const label = e.textContent.trim();
  toast(`<img src="${img.getAttribute('src')}" alt=""> Downloading ${label.replace(/[<>&]/g, '')}`);
}
