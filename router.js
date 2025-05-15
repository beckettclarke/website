log('Loaded script router.js','#0066ff','📜 Script');  
async function loadPage(url) {
  const res = await fetch(`/pages${url === '/' ? '/home.html' : url + '.html'}`);
  if (res.ok) {
    const html = await res.text();
    get.tag('content').innerHTML = html;
  } else {
    get.tag('content').innerHTML = "<h2>Page not found</h2>";
  }
}

function navigate(event) {
  event.preventDefault();
  const url = event.target.getAttribute('href');
  history.pushState(null, null, url);
  loadPage(url);
}

window.addEventListener('popstate', () => loadPage(location.pathname));

get.queryAll('[data-link]').forEach(link =>
  link.addEventListener('click', navigate)
);

// Initial load
loadPage(location.pathname);