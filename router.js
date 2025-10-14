log('Loaded script router.js', '#0066ff', '📜 Script');

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';
// const isLocal = true;
// const useHashRouting = !isLiveSite; // clean urls only on real domain but not real right now

log(`Routing mode: ${isLocal ? 'Hash' : 'Clean'}`, '#00cc88', '🔁 Mode');

// === ROUTER ===
function checkpage(){
  if (location.pathname=="/" || location.pathname=="/index.html") {
    if (location.hash && isLocal && location.hash !== "#/") {
      console.log('Hash detected in local mode:', location.hash);
      loadpage(location.hash.replace('#', ''));
    } else if (location.hash && location.hash !== "#/") {
      console.log('Hash detected:', location.hash);
      loadpage(location.hash.replace('#', ''));
      // Remove the hash from the URL without reloading
      const newPath = location.hash.replace(/^#/, '');
      history.replaceState(null, '', newPath.startsWith('/') ? newPath : '/' + newPath);
    } else {
      // No hash path found, fallback to home page
      loadpage('home');
    }
  }
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
    // Use an absolute path so the request is always made to the site's /pages/ folder
    // (avoids resolving "pages/..." relative to a subpath like /clients/)
    contentElement.innerHTML = await fetch(`/pages/${normalizedPage}.html`).then(response => {
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
  const dest = new URL(hrefValue, location.origin);
  const destPath = dest.pathname || '/';
  if (isLocal){
    // Use hash routing for local mode
    history.pushState(null, null, location.origin + '#' + hrefValue);
    log(`Routing ${location.origin}#${hrefValue}`, '#00cc88', '🔁 Hash');
  } else {
    // Push only the pathname (browser will resolve with the same origin)
    history.pushState(null, null, destPath + (dest.search || '') + (dest.hash || ''));
    log(`Routing ${location.origin}${destPath}`, '#00cc88', '🔁 Clean');
    // Call loadpage with the pathname so it normalizes correctly
    loadpage(destPath);
  }
  checkpage();
}

document.addEventListener('click', function(e) {
  const anchor = e.target.closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || anchor.target === '_blank') return;
  // Only intercept links that are on the same origin
  const url = new URL(href, location.origin);
  if (url.origin === location.origin) {
    e.preventDefault();
    linkClick(anchor); // Run this instead of normal href behavior
  }
});

