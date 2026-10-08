log('Loaded script router.js v12', '#0066ff', '📜 Script');

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

  if (isLocal) {
    if (location.hash && location.hash !== '#/') {
      route = location.hash.replace(/^#/, '');
    }
  } else {
    if (location.hash && location.hash !== '#/') {
      const newPath = location.hash.replace(/^#/, '');
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

  const leaving = !firstLoad && content.childElementCount
    ? (content.classList.add('is-leaving'), wait(220))
    : Promise.resolve();

  let [html] = await Promise.all([fetchFragment(`pages/${name}.html`), leaving]);
  if (html == null) {
    log(`Page not found: ${name}`, '#ff0000', '🚫 Error');
    html = await fetchFragment('pages/notfound.html') || '<main class="page wrap"><h1 class="display">Not found.</h1></main>';
  }
  if (token !== navToken) return; // a newer navigation won

  window.currentRoute = name;
  content.innerHTML = html;
  content.classList.remove('is-leaving', 'is-entering');
  void content.offsetWidth;
  content.classList.add('is-entering');

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
  log(`Page loaded: ${name}`, 'darkgreen', '✅ Loaded');
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
