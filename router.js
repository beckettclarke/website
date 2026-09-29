log('Loaded script router.js v4', '#0066ff', '📜 Script');

// file:// has an opaque "null" origin, which URL() rejects as a base
const ORIGIN = location.origin === 'null' ? 'http://local.invalid' : location.origin;
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';
// const isLocal = true;
// const useHashRouting = !isLiveSite; // clean urls only on real domain but not real right now

log(`Routing mode: ${isLocal ? 'Hash' : 'Clean'}`, '#00cc88', '🔁 Mode');

// === ROUTER ===
function checkpage(){
  let route = 'home';

  if (isLocal) {
    if (location.hash && location.hash !== '#/') {
      console.log('Hash detected in local mode:', location.hash);
      route = location.hash.replace(/^#/, '');
    }
  } else {
    if (location.hash && location.hash !== '#/') {
      console.log('Hash detected:', location.hash);
      const newPath = location.hash.replace(/^#/, '');
      route = newPath;
      history.replaceState(null, '', newPath.startsWith('/') ? newPath : '/' + newPath);
    } else if (location.pathname !== '/' && location.pathname !== '/index.html') {
      route = location.pathname;
    }
  }

  loadpage(route);
}

function parsePage(){
  log('Parsing page...', 'darkblue', '🔍 Parse');
  get.queryAll('img[largeview]').forEach(e => {
    e.addEventListener('click', function() {largeview(e.getAttribute('src'));});
  });
  log('Page parsed successfully', 'darkgreen', '🔍 Parse');
}

async function loadpage(page){
  log(`Requested page: ${page}`, '#00cc88', '🔁 Page');
  // Normalize page: remove leading/trailing slashes, convert inner slashes to underscores
  // If the result is empty, default to 'home' to avoid fetching `/pages/.html`.
  const pageStr = String(page || '');
  const normalizedPage = pageStr.replace(/^\/+/g, '').replace(/\/+$/g, '').replace(/\//g, '_') || 'home';
  log(`Loading page: ${normalizedPage}`, '#00cc88', '🔁 Page');
  const contentElement = document.getElementsByTagName('content')[0];
  contentElement.classList.remove('anim');
  if (contentElement) {
    // Relative path: index.html sets <base href="/"> on the live site, and on file:// it resolves next to index.html
    const pageUrl = `pages/${normalizedPage}.html`;
    contentElement.innerHTML = await fetch(pageUrl).catch(() => {
      // fetch() is blocked on file://, fall back to the fragments.js bundle
      const bundled = window.BC_FRAGMENTS && window.BC_FRAGMENTS[pageUrl];
      return bundled == null ? Promise.reject() : { ok: true, text: () => bundled };
    }).then(response => {
      if (!response.ok) {
        log(`Page not found: ${normalizedPage}`, '#ff0000', '🚫 Error');
      }
      contentElement.classList.add('anim');
      window.scrollTo(0,0);
      log(`Page loaded: ${normalizedPage}`, 'darkgreen', '✅ Loaded');
      setTimeout(() => {
        parsePage();
      }, 100);
      return response.text();
    });
  } else {
    log('No <content> element found in the document.', '#ff0000', '🚫 Error');
  }
}

setTimeout(() => {
  console.log('Loadtime check');
  checkpage();
},100);
// Listen for history changes (back/forward navigation)
window.addEventListener('popstate', () => {
  checkpage();
});

function linkClick(e){
  const hrefValue = e.getAttribute('href') || '';
  const dest = new URL(hrefValue, ORIGIN);
  const destPath = dest.pathname || '/';
  if (isLocal){
    // Use hash routing for local mode
    history.pushState(null, null, (location.protocol === 'file:' ? location.pathname : location.origin) + '#' + hrefValue);
    log(`Routing ${location.origin}#${hrefValue}`, '#00cc88', '🔁 Hash');
  } else {
    // Push only the pathname (browser will resolve with the same origin)
    history.pushState(null, null, destPath + (dest.search || '') + (dest.hash || ''));
    log(`Routing ${location.origin}${destPath}`, '#00cc88', '🔁 Clean');
  }
  checkpage();
}

document.addEventListener('click', function(e) {
  const anchor = e.target.closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || anchor.target === '_blank') return;
  
  // Handle anchor links (e.g., href="#info")
  if (href.startsWith('#') && !href.includes('/')) {
    // It's a simple anchor link, not a route
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      e.preventDefault();
      const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 100;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      log(`Scrolled to anchor: #${targetId}`, '#00cc88', '⚓ Anchor');
    }
    return; // Don't process as a route
  }
  
  // Only intercept links that are on the same origin
  const url = new URL(href, ORIGIN);
  if (url.origin === ORIGIN) {
    e.preventDefault();
    linkClick(anchor); // Run this instead of normal href behavior
  }
});

