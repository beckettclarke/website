log('Loaded script router.js v13', '#0066ff', '📜 Script');

// file:// has an opaque "null" origin, which URL() rejects as a base
const ORIGIN = location.origin === 'null' ? 'http://local.invalid' : location.origin;
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';

log(`Routing mode: ${isLocal ? 'Hash' : 'Clean'}`, '#00cc88', '🔁 Mode');

// Section to scroll to once the next page has loaded (for links like "/#work")
let pendingScroll = null;
// Scroll position to restore when going back/forward
let pendingY = null;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let navToken = 0;
let firstLoad = true;

// === ROUTER ===
function checkpage(){
  let route = 'home';
  let hash = location.hash.replace(/^#/, '');

  // A hash without a slash, like "/#work", is a section on the page, not a route
  if (hash && !hash.includes('/')) {
    if (pendingY == null) pendingScroll = decodeURIComponent(hash);
    hash = '';
  }

  if (isLocal) {
    if (hash && hash !== '/') {
      route = hash;
    }
  } else {
    if (hash && hash !== '/') {
      const newPath = hash;
      route = newPath;
      history.replaceState(null, '', newPath.startsWith('/') ? newPath : '/' + newPath);
    } else if (location.pathname !== '/' && location.pathname !== '/index.html') {
      route = location.pathname;
    }
  }

  loadpage(route);
}

// Normalize a route: strip slashes, inner slashes become underscores, empty is home
function routeName(page){
  return String(page || '').replace(/^\/+/g, '').replace(/\/+$/g, '').replace(/\//g, '_') || 'home';
}

async function fetchFragment(url){
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  } catch (e) {
    // fetch() is blocked on file://, fall back to the fragments.js bundle
    return (window.BC_FRAGMENTS && window.BC_FRAGMENTS[url]) ?? null;
  }
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function loadpage(page){
  const token = ++navToken;
  const name = routeName(page);
  log(`Loading page: ${name}`, '#00cc88', '🔁 Page');

  const content = document.getElementsByTagName('content')[0];
  if (!content) return log('No <content> element found in the document.', '#ff0000', '🚫 Error');

  // Where the browser can do it, the pages cross-fade as a view transition and
  // the old page stays up while the new one is fetched. Otherwise: fade out,
  // swap, fade in.
  const still = typeof reduceMotion !== 'undefined' && reduceMotion.matches;
  const canVT = !firstLoad && !still && !!content.childElementCount && typeof document.startViewTransition === 'function';
  const leaving = !canVT && !firstLoad && content.childElementCount
    ? (content.classList.add('is-leaving'), wait(220))
    : Promise.resolve();

  let [html] = await Promise.all([fetchFragment(`pages/${name}.html`), leaving]);
  if (html == null) {
    log(`Page not found: ${name}`, '#ff0000', '🚫 Error');
    html = await fetchFragment('pages/notfound.html') || '<main class="page wrap"><h1 class="display">Not found.</h1></main>';
  }
  if (token !== navToken) return; // a newer navigation won

  const prev = window.currentRoute;
  const swap = () => {
    window.currentRoute = name;
    content.innerHTML = html;
    content.classList.remove('is-leaving', 'is-entering');
    if (!canVT) {
      void content.offsetWidth;
      content.classList.add('is-entering');
    }

    if (pendingScroll && document.getElementById(pendingScroll)) {
      scrollToId(pendingScroll, firstLoad ? 'auto' : 'smooth');
    } else if (pendingY != null) {
      window.scrollTo(0, pendingY);
    } else {
      window.scrollTo(0, 0);
    }
    pendingScroll = null;
    pendingY = null;
    firstLoad = false;

    if (typeof initPage === 'function') initPage(content, name);
    // Coming back: the card for the page we just left catches its logo
    if (canVT) nameLogo(content, prev, true);
    log(`Page loaded: ${name}`, 'darkgreen', '✅ Loaded');
  };

  if (!canVT) return swap();

  // Going in: a card that leads to this page hands its logo to the page title
  clearLogo();
  nameLogo(content, name, false);
  const root = document.documentElement;
  root.classList.add('vt');
  let vt;
  try { vt = document.startViewTransition(swap); } catch (e) { root.classList.remove('vt'); return swap(); }
  vt.finished.catch(() => {}).then(() => {
    if (token !== navToken) return;
    root.classList.remove('vt');
    clearLogo();
  });
}

// ===[ Logo hand-off ]===
// Cards mark their logo with data-morph. For the length of a page transition
// it shares a view-transition-name with the page title's logo (.p-logo in
// motion.css), so the browser moves one into the other.
function nameLogo(scope, route, arriving){
  for (const img of scope.querySelectorAll('a[href] [data-morph]')) {
    const href = img.closest('a').getAttribute('href');
    if (routeName(new URL(href, ORIGIN).pathname) !== route) continue;
    const r = img.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    img.style.viewTransitionName = 'bc-logo';
    // Its card is still waiting to be revealed; show it now so the logo lands on something
    const card = arriving && img.closest('[data-reveal]');
    if (card) card.removeAttribute('data-reveal');
    return;
  }
}
function clearLogo(){
  document.querySelectorAll('[data-morph]').forEach(el => { el.style.viewTransitionName = ''; });
}

setTimeout(checkpage, 0);
// Back/forward navigation, landing where you left off
window.addEventListener('popstate', e => {
  pendingY = e.state && typeof e.state.y === 'number' ? e.state.y : null;
  checkpage();
});

function scrollToId(id, behavior = 'smooth'){
  const el = document.getElementById(id);
  if (!el) return false;
  // Clear the header, plus the sticky jump bar on collection pages
  // offsetTop ignores the page-enter transform, so the target doesn't drift
  let y = 0;
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
  const jump = document.querySelector('.jump');
  const top = y - 96 - (jump ? jump.offsetHeight : 0);
  window.scrollTo({ top, behavior });
  return true;
}

function linkClick(e){
  const hrefValue = e.getAttribute('href') || '';
  const dest = new URL(hrefValue, ORIGIN);
  const destPath = dest.pathname || '/';
  // Remember where we were on this page for the back button
  history.replaceState({ y: window.scrollY }, '');
  if (isLocal){
    history.pushState(null, null, (location.protocol === 'file:' ? location.pathname : location.origin) + '#' + destPath);
  } else {
    history.pushState(null, null, destPath + (dest.search || ''));
  }
  checkpage();
}

document.addEventListener('click', function(e) {
  const anchor = e.target.closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || anchor.target === '_blank') return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;

  // In-page anchor, e.g. href="#work"
  if (href.startsWith('#') && !href.includes('/')) {
    e.preventDefault();
    const id = decodeURIComponent(href.substring(1));
    scrollToId(id);
    // Move focus too when the target takes it, so "Skip to content" actually skips
    const target = document.getElementById(id);
    if (target && target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    return;
  }

  const url = new URL(href, ORIGIN);
  if (url.origin !== ORIGIN) return;
  e.preventDefault();

  // "/#section" means: go home, then scroll to that section
  if (url.pathname === '/' && url.hash && !url.hash.includes('/')) {
    const id = url.hash.slice(1);
    if (window.currentRoute === 'home' && scrollToId(id)) return;
    pendingScroll = id;
  }

  // Clicking the page you're already on just scrolls to the top
  if (routeName(url.pathname) === window.currentRoute && !pendingScroll) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  linkClick(anchor);
});
