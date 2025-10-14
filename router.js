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
  const normalizedPage = page.replace(/\//g, '_').replace(/^_+|_+$/g, '');
  log(`Loading page: ${normalizedPage}`, '#00cc88', '🔁 Page');
  const contentElement = document.getElementsByTagName('content')[0];
  contentElement.classList.remove('anim');
  if (contentElement) {
    contentElement.innerHTML = await fetch(`pages/${normalizedPage}.html`).then(response => {
      if (!response.ok) {
        log(`Page not found: ${normalizedPage}`, '#ff0000', '🚫 Error');
      }
      contentElement.classList.add('anim');
      window.scrollTo(0,0);
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
  if (isLocal){
    history.pushState(null, null, location.origin+"#"+e.getAttribute('href'));
    log(`Routing ${location.origin}#${e.getAttribute('href')}`, '#00cc88', '🔁 Hash');
  } else {
    history.pushState(null, null, location.origin+e.getAttribute('href'));
    log(`Routing ${location.origin}${e.getAttribute('href')}`, '#00cc88', '🔁 Clean');
    loadpage(e.getAttribute('href'));
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

