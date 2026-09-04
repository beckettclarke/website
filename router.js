/* ============================================================
   BC STUDIOS — v11 router
   Small SPA router for a static GitHub Pages site.

   - Route table gives every page a real <title> + meta description
   - Pages are fetched once, then cached in memory
   - Hovering a link prefetches its page (near-instant nav)
   - Unknown / missing routes render pages/404.html, not a blank screen
   - Navigations are tokenised so a slow fetch can't overwrite a newer page
   - Clean URLs in production, hash URLs locally (no server rewrite needed)
   ============================================================ */

(() => {
  'use strict';

  const IS_LOCAL =
    location.protocol === 'file:' ||
    ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname);

  /* ---- Route table --------------------------------------- */
  /* `file` is the name under /pages/. Anything not listed here
     still resolves by turning the path into an underscore name
     (/clients/foo -> clients_foo), so new pages work with no
     edits — they just fall back to the default title.          */

  const SITE = 'Beckett Clarke';
  const DEFAULT_DESC = "Front-end developer, designer and photographer.";

  const ROUTES = {
    '/':                          { file: 'home',                   title: SITE,                            desc: DEFAULT_DESC },
    '/photography':               { file: 'photography',            title: `Photography — ${SITE}` },
    '/photography/drone':         { file: 'photography_drone',      title: `Drone — ${SITE}` },
    '/photography/cias/2025':     { file: 'photography_cias_2025',  title: `CIAS 2025 — ${SITE}` },
    '/macicons':                  { file: 'macicons',               title: `macOS Icons — ${SITE}` },
    '/clients/team610':           { file: 'clients_team610',        title: `Team 610 Robotics — ${SITE}` },
    '/clients/team610/yearbook':  { file: 'clients_team610_yearbook', title: `Team 610 Yearbook — ${SITE}` },
    '/clients/opportunitynorth':  { file: 'clients_opportunitynorth', title: `Opportunity North — ${SITE}` },
    '/clients/csoutreach':        { file: 'clients_csoutreach',     title: `Crescent Outreach — ${SITE}` },
    '/clients/apollozhang':       { file: 'clients_apollozhang',    title: `AZ Scenes — ${SITE}` },
    '/clients/northmount':        { file: 'clients_northmount',     title: `Northmount — ${SITE}` },
    '/manpreet':                  { file: 'manpreet',               title: `Manpreet — ${SITE}` },
  };

  const ALIASES = {
    '/home': '/',
    '/index': '/',
    '/index.html': '/',
    '/clients': '/#work',
    '/apps': '/#projects',
    '/projects': '/#projects',
    '/work': '/#work',
  };

  const NOT_FOUND = { file: '404', title: `Page not found — ${SITE}` };

  /* ---- State --------------------------------------------- */

  const cache = new Map();     // file -> html string (null = missing)
  const pending = new Map();   // file -> in-flight promise
  let token = 0;               // navigation token, guards against races
  let current = null;          // current canonical path

  const contentEl = () => document.getElementsByTagName('content')[0];

  /* ---- Path helpers -------------------------------------- */

  function normalize(input) {
    let p = String(input || '/');
    p = p.split('?')[0];
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\/{2,}/g, '/');
    if (p.length > 1) p = p.replace(/\/+$/, '');
    p = p.toLowerCase();
    return p || '/';
  }

  function resolveAlias(path) {
    const target = ALIASES[path];
    if (!target) return { path, anchor: '' };
    const [p, a = ''] = target.split('#');
    return { path: normalize(p || '/'), anchor: a };
  }

  function fileFor(path) {
    if (ROUTES[path]) return ROUTES[path].file;
    return path.replace(/^\//, '').replace(/\//g, '_') || 'home';
  }

  /* Read the route the browser is currently pointing at.
     A hash beginning with "#/" is a route (that's what 404.html and
     local mode produce); any other hash is an in-page anchor.        */
  function readLocation() {
    const raw = location.hash.slice(1);          // "/clients/x#anchor" or "work"
    if (raw.startsWith('/')) {
      const cut = raw.indexOf('#');
      return {
        path: normalize(cut === -1 ? raw : raw.slice(0, cut)),
        anchor: cut === -1 ? '' : raw.slice(cut + 1),
        fromHash: true,
      };
    }
    return { path: normalize(location.pathname), anchor: raw, fromHash: false };
  }

  function writeLocation(path, anchor, replace) {
    const method = replace ? 'replaceState' : 'pushState';
    let url;
    if (IS_LOCAL) {
      url = location.pathname + '#' + path + (anchor ? '#' + anchor : '');
    } else {
      url = path + (anchor ? '#' + anchor : '');
    }
    history[method](null, '', url);
  }

  /* ---- Fetching ------------------------------------------ */

  function fetchPage(file) {
    if (cache.has(file)) return Promise.resolve(cache.get(file));
    if (pending.has(file)) return pending.get(file);

    const req = fetch(`/pages/${file}.html`, { cache: 'no-cache' })
      .then(r => (r.ok ? r.text() : null))
      .catch(() => null)
      .then(html => {
        cache.set(file, html);
        pending.delete(file);
        return html;
      });

    pending.set(file, req);
    return req;
  }

  function prefetch(path) {
    const p = normalize(path);
    if (!ROUTES[p] && p.includes('.')) return;   // looks like a file, skip
    fetchPage(fileFor(p));
  }

  /* ---- Rendering ----------------------------------------- */

  function applyMeta(route, path) {
    document.title = route.title || SITE;
    const desc = route.desc || DEFAULT_DESC;
    let tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute('content', desc);
    tag = document.querySelector('meta[property="og:description"]');
    if (tag) tag.setAttribute('content', desc);
    tag = document.querySelector('meta[property="og:url"]');
    if (tag) tag.setAttribute('content', location.origin + path);
    document.body.dataset.route = path;
  }

  function markActiveNav(path) {
    document.querySelectorAll('.navitem[data-route]').forEach(el => {
      el.classList.toggle('active', normalize(el.dataset.route) === path);
    });
  }

  function scrollTo(anchor) {
    if (!anchor) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const target = document.getElementById(anchor);
    if (!target) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const y = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  async function render(path, anchor) {
    const el = contentEl();
    if (!el) return;

    const mine = ++token;
    const route = ROUTES[path] || { file: fileFor(path) };

    el.classList.add('leaving');

    let html = await fetchPage(route.file);
    if (mine !== token) return;                   // a newer nav won

    let resolved = route;
    if (html === null) {
      resolved = NOT_FOUND;
      html = await fetchPage(NOT_FOUND.file);
      if (mine !== token) return;
      if (html === null) html = fallback404(path);
    }

    el.classList.remove('leaving', 'anim');
    el.innerHTML = html;
    void el.offsetWidth;                          // restart the entry animation
    el.classList.add('anim');

    applyMeta(resolved, path);
    markActiveNav(path);
    current = path;

    document.dispatchEvent(new CustomEvent('bc:pageload', {
      detail: { path, file: resolved.file, notFound: resolved === NOT_FOUND },
    }));

    // Let the new markup lay out before scrolling to an anchor.
    requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(anchor)));
  }

  function fallback404(path) {
    return `<section class="nf"><div class="nf-code">404</div>
      <h1>This page doesn't exist</h1>
      <p>The link may be old, or the page moved.</p>
      <div class="nf-path">${path.replace(/[<>&]/g, '')}</div>
      <div class="nf-actions"><a class="btn btn-primary" href="/">Back home</a></div></section>`;
  }

  /* ---- Navigation ---------------------------------------- */

  function go(rawPath, anchor = '', { replace = false, push = true } = {}) {
    const aliased = resolveAlias(normalize(rawPath));
    const path = aliased.path;
    const hash = anchor || aliased.anchor;

    if (path === current) {
      if (push) writeLocation(path, hash, replace);
      scrollTo(hash);
      return;
    }
    if (push) writeLocation(path, hash, replace);
    render(path, hash);
  }

  function syncFromLocation() {
    const { path, anchor, fromHash } = readLocation();
    const aliased = resolveAlias(path);
    const finalPath = aliased.path;
    const finalAnchor = anchor || aliased.anchor;

    // Arrived through 404.html (or an alias): rewrite to the canonical URL.
    const needsRewrite =
      (!IS_LOCAL && fromHash) || finalPath !== path;
    if (needsRewrite) writeLocation(finalPath, finalAnchor, true);

    if (finalPath === current) { scrollTo(finalAnchor); return; }
    render(finalPath, finalAnchor);
  }

  /* ---- Link interception --------------------------------- */

  function isInternal(a) {
    const href = a.getAttribute('href');
    if (!href) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    if (/^(https?:|mailto:|tel:|sms:)/i.test(href) && !href.startsWith(location.origin)) return false;
    try {
      return new URL(href, location.origin).origin === location.origin;
    } catch { return false; }
  }

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!a || !isInternal(a)) return;

    const href = a.getAttribute('href');

    // Plain in-page anchor
    if (href.startsWith('#') && !href.startsWith('#/')) {
      e.preventDefault();
      const anchor = href.slice(1);
      writeLocation(current || '/', anchor, false);
      scrollTo(anchor);
      return;
    }

    const url = new URL(href, location.origin);
    e.preventDefault();
    go(url.pathname, url.hash.replace(/^#/, ''));
  });

  /* Prefetch on intent (hover / touch / focus) */
  let prefetched = new Set();
  function maybePrefetch(e) {
    const a = e.target.closest && e.target.closest('a');
    if (!a || !isInternal(a)) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const path = normalize(new URL(href, location.origin).pathname);
    if (prefetched.has(path)) return;
    prefetched.add(path);
    prefetch(path);
  }
  document.addEventListener('pointerover', maybePrefetch, { passive: true });
  document.addEventListener('focusin', maybePrefetch, { passive: true });

  window.addEventListener('popstate', syncFromLocation);
  window.addEventListener('hashchange', () => { if (IS_LOCAL) syncFromLocation(); });

  /* ---- Boot ---------------------------------------------- */

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  document.addEventListener('DOMContentLoaded', syncFromLocation);
  if (document.readyState !== 'loading') syncFromLocation();

  /* Public surface (used by scripts.js / console) */
  window.router = { go, prefetch, normalize, get current() { return current; }, ROUTES };
})();
