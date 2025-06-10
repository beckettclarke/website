log('Loaded script router.js', '#0066ff', '📜 Script');

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';
// const useHashRouting = !isLiveSite; // clean URLs only on real domain

log(`Routing mode: ${isLocal ? 'Hash' : 'Clean'}`, '#00cc88', '🔁 Mode');

// === ROUTER ===
function checkpage(){
  if (location.pathname=="/"){
    if (location.hash && isLocal && location.hash !== "#/") {
      loadpage(location.hash.replace('#', ''));
    } else if (location.hash && location.hash !== "#/") {
      loadpage(location.hash.replace('#', ''));
      // Remove the hash from the URL without reloading
      const newPath = location.hash.replace(/^#/, '');
      history.replaceState(null, '', newPath.startsWith('/') ? newPath : '/' + newPath);
    } else {
      loadpage('home');
    }
  }
}

async function loadpage(page){
  const normalizedPage = page.replace(/\//g, '_').replace(/^_+|_+$/g, '');
  log(`Loading page: ${normalizedPage}`, '#00cc88', '🔁 Page');
  const contentElement = document.getElementsByTagName('content')[0];
  contentElement.classList.remove('anim');
  setTimeout(function(){contentElement.classList.add('anim')},1);
  if (contentElement) {
    const html = await fetch(`pages/${normalizedPage}.html`).then(response => {
      if (!response.ok) {
        log(`Page not found: ${normalizedPage}`, '#ff0000', '🚫 Error');
      }
      return response.text();
    });
    contentElement.innerHTML = html;

    // Wait for all images in the new content to load
    const images = Array.from(contentElement.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = img.onerror = resolve;
        });
      }));
    }

    contentElement.classList.add('anim');
    contentElement.innerHTML = await fetch(`pages/${normalizedPage}.html`).then(response => {
      if (!response.ok) {
        log(`Page not found: ${normalizedPage}`, '#ff0000', '🚫 Error');
      }
      return response.text();
    });
  } else {
    log('No <content> element found in the document.', '#ff0000', '🚫 Error');
  }
}

setTimeout(() => {
  checkpage();
},10)

function linkClick(e){
  if (isLocal){
    history.pushState(null, null, location.origin+"#"+e.getAttribute('href'));
    log(`Routing ${location.origin}#${e.getAttribute('href')}`, '#00cc88', '🔁 Hash');
  } else {
    history.pushState(null, null, location.origin+e.getAttribute('href'));
    log(`Routing ${location.origin}${e.getAttribute('href')}`, '#00cc88', '🔁 Clean');
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