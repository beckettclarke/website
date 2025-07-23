log('Loaded scripts.js','#0066ff','📜 Script');  
(async function() {
	get.id('header').innerHTML = await fetch('header.html').then(response => response.text());
})();


window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
});

function largeview(url){
  log(`Opening large view for: ${url}`, '#00cc88', '🔍 Large View');
  var lv = get.id('largeview');
  var lvi = get.id('largeviewimg');
  lvi.src = url;
  lv.classList.add('active');
  lvi.onload = function() {
    lvi.classList.add('loaded');
  };
  lvi.classList.remove('loaded');
}

function closelargeview(){
  get.id('largeview').classList.remove('active');
}