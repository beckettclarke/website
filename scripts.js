/* ============================================================
   BC STUDIOS — v11
   Chrome (header/footer), motion, and page effects
   ============================================================ */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- Shell ---------------------------------------------- */

  async function inject(id, url) {
    const host = document.getElementById(id);
    if (!host) return;
    try {
      host.innerHTML = await fetch(url, { cache: 'no-cache' }).then(r => r.text());
    } catch (e) {
      console.warn(`[bc] could not load ${url}`, e);
    }
  }

  Promise.all([
    inject('header', '/header.html'),
    inject('footer', '/footer.html'),
  ]).then(() => {
    initNav();
    const year = document.getElementById('footeryear');
    if (year) year.textContent = new Date().getFullYear();
  });

  /* ---- Scroll state --------------------------------------- */

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.body.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Header nav ----------------------------------------- */

  function initNav() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navtoggle');

    if (toggle) {
      const setOpen = open => {
        document.body.classList.toggle('nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.innerHTML = `<i class="fas fa-${open ? 'xmark' : 'bars'}"></i>`;
      };

      toggle.addEventListener('click', () =>
        setOpen(!document.body.classList.contains('nav-open')));

      // Tapping a link, the scrim, or Escape closes the sheet.
      document.addEventListener('click', e => {
        if (!document.body.classList.contains('nav-open')) return;
        if (e.target.closest('#navtoggle')) return;
        if (e.target.closest('#nav') && !e.target.closest('a')) return;
        setOpen(false);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') setOpen(false);
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 860) setOpen(false);
      });
    }

    // Pill that slides behind whichever nav item is hovered.
    if (!nav || !fine) return;
    const pill = nav.querySelector('.navpill');
    if (!pill) return;

    nav.addEventListener('pointermove', e => {
      const item = e.target.closest('.navitem');
      if (!item) return;
      const a = item.getBoundingClientRect();
      const b = nav.getBoundingClientRect();
      pill.style.width = `${a.width}px`;
      pill.style.transform = `translate(${a.left - b.left}px, -50%)`;
      nav.classList.add('pill-on');
    });
    nav.addEventListener('pointerleave', () => nav.classList.remove('pill-on'));
  }

  /* ---- Split the hero title into animated words ----------- */

  function splitTitle(root) {
    root.querySelectorAll('[data-split]').forEach(el => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = '1';
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words
        .map((w, i) => `<span class="w" style="--d:${0.06 + i * 0.075}s">${w}</span>`)
        .join(' ');
    });
  }

  /* ---- Scroll reveal -------------------------------------- */

  let revealObserver = null;
  function initReveal(root) {
    const items = root.querySelectorAll('[data-reveal]:not(.in)');
    if (!items.length) return;

    if (reduced) { items.forEach(el => el.classList.add('in')); return; }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px 6% 0px', threshold: 0 });
    }

    const vh = window.innerHeight;
    const groups = new Map();

    items.forEach(el => {
      // Already in view on first paint: show it outright. Animating these
      // is what made things flash as the page settled.
      if (el.getBoundingClientRect().top < vh * 0.9) {
        el.classList.add('shown', 'in');
        return;
      }
      const key = el.parentElement;
      const n = groups.get(key) || 0;
      groups.set(key, n + 1);
      el.style.setProperty('--reveal-delay', `${Math.min(n, 3) * 0.06}s`);
      revealObserver.observe(el);
    });
  }

  /* ---- Card sheen + tilt ---------------------------------- */

  function initCards(root) {
    if (!fine || reduced) return;

    root.querySelectorAll('.card').forEach(card => {
      if (card.dataset.fx) return;
      card.dataset.fx = '1';

      const tilt = card.hasAttribute('data-tilt');
      let frame = null;

      card.addEventListener('pointermove', e => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', `${px * 100}%`);
          card.style.setProperty('--my', `${py * 100}%`);
          if (tilt) {
            card.style.setProperty('--ry', `${(px - 0.5) * 4}deg`);
            card.style.setProperty('--rx', `${(0.5 - py) * 3}deg`);
          }
        });
      });

      card.addEventListener('pointerenter', () => card.classList.add('tilting'));
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  }

  /* ---- Marquees ------------------------------------------- */

  /* The photo wall is ~16 images. Hold them back until the card is close
     to the viewport, then load and duplicate each column so the vertical
     scroll loops seamlessly at -50%. */
  function initPhotoWall(root) {
    const wall = root.querySelector('.photowall');
    if (!wall || wall.dataset.ready) return;

    const build = () => {
      if (wall.dataset.ready) return;
      wall.dataset.ready = '1';
      wall.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      wall.querySelectorAll('[data-loop]').forEach(col => {
        [...col.children].forEach(node => {
          const copy = node.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          col.appendChild(copy);
        });
      });
    };

    if (!('IntersectionObserver' in window)) { build(); return; }
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      build();
    }, { rootMargin: '400px 0px' });
    io.observe(wall.closest('.card') || wall);
  }

  function initMarquees(root) {
    root.querySelectorAll('[data-marquee]').forEach(track => {
      if (track.dataset.cloned) return;
      track.dataset.cloned = '1';
      track.innerHTML += track.innerHTML;   // exact 2x for a seamless -50% loop
    });
  }

  /* ---- Imagesnap card ------------------------------------- */

  let isnapTimer = null;
  function initImagesnap(root) {
    clearInterval(isnapTimer);
    const stack = root.querySelector('[data-isnap-chips]');
    if (!stack || reduced) return;

    const chips = [...stack.querySelectorAll('.isnap-chip')];
    if (!chips.length) return;
    const cursor = root.querySelector('[data-isnap-cursor]');
    let i = 0;

    const step = () => {
      chips.forEach((c, n) => c.classList.toggle('on', n === i));
      if (cursor) cursor.style.top = `${chips[i].offsetTop + chips[i].offsetHeight * 0.45}px`;
      i = (i + 1) % chips.length;
    };

    step();
    isnapTimer = setInterval(step, 1600);
  }

  /* ---- Lightbox ------------------------------------------- */

  window.largeview = function (url) {
    const lv = document.getElementById('largeview');
    const img = document.getElementById('largeviewimg');
    if (!lv || !img) return;
    img.src = url.replace('-preview', '');
    lv.classList.add('active');
    img.classList.remove('loaded');
    img.onload = () => setTimeout(() => img.classList.add('loaded'), 120);
  };

  window.closelargeview = function () {
    document.getElementById('largeview')?.classList.remove('active');
    document.getElementById('largeviewimg')?.classList.remove('loaded');
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closelargeview();
  });

  /* Download helper used by the macOS icons page */
  window.mi = function (el) {
    const img = el.querySelector('img');
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = img.src.split('/').pop() || 'image.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /* ---- Per-page wiring ------------------------------------ */

  function parsePage() {
    const root = document.getElementsByTagName('content')[0] || document;
    root.querySelectorAll('img[largeview]').forEach(img => {
      if (img.dataset.lv) return;
      img.dataset.lv = '1';
      img.addEventListener('click', () => window.largeview(img.getAttribute('src')));
    });
    const nfPath = root.querySelector('#nf-path');
    if (nfPath) nfPath.textContent = document.body.dataset.route || location.pathname || '/';

    splitTitle(root);
    initPhotoWall(root);
    initMarquees(root);
    initReveal(root);
    initCards(root);
    initImagesnap(root);
  }

  document.addEventListener('bc:pageload', parsePage);
  window.parsePage = parsePage;
})();
