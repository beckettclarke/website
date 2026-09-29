log('Loaded scripts.js','#0066ff','📜 Script');  
// fetch() is blocked on file://, so fall back to the fragments.js bundle
async function loadFragment(id, url) {
	try {
		get.id(id).innerHTML = await fetch(url).then(response => response.text());
	} catch (e) {
		get.id(id).innerHTML = (window.BC_FRAGMENTS && window.BC_FRAGMENTS[url]) || '';
	}
}
loadFragment('header', 'header.html').then(initNav);
loadFragment('footer', 'footer.html');

function initNav() {
  const toggle = get.id('navtoggle');
  if (!toggle) return;
  const setOpen = open => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  // Tapping a link or pressing Escape closes the drawer.
  document.addEventListener('click', e => {
    if (e.target.closest('#nav a')) setOpen(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) setOpen(false); });
}


/// TEMP CODE

// setTimeout(() => {
//   window.scrollTo(0, document.body.scrollHeight);
// }, 300);

/// END TEMP CODE

window.addEventListener('scroll', () => {
  if (window.scrollY > 24) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
});

function largeview(url){
  log(`Opening large view for: ${url}`, '#00cc88', '🔍 Large View');
  var lv = get.id('largeview');
  var lvi = get.id('largeviewimg');
  
  // Remove "-preview" from the URL if it exists
  if (url.includes('-preview')) {
    url = url.replace('-preview', '');
  }
  
  lvi.src = url;
  lv.classList.add('active');
  lvi.classList.remove('loaded');
  lvi.onload = function() {
    setTimeout(() => {
      lvi.classList.add('loaded');
      log(`Image loaded: ${url}`, '#00cc88', '🖼️ Image');
    }, 300);
  };
  
}

function closelargeview(){
  get.id('largeview').classList.remove('active');
  get.id('largeviewimg').classList.remove('loaded');
}

function mi(e){
  const img = e.querySelector('img');
  if (!img) return;
  var imgSrc = img.src;
  var a = document.createElement('a');
  a.href = imgSrc;
  const filename = imgSrc.split('/').pop();
  a.download = filename || 'image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}