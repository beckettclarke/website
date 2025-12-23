log('Loaded scripts.js','#0066ff','📜 Script');  
(async function() {
	get.id('header').innerHTML = await fetch('header.html').then(response => response.text());
})();
(async function() {
	get.id('footer').innerHTML = await fetch('footer.html').then(response => response.text());
})();


/// TEMP CODE

// setTimeout(() => {
//   window.scrollTo(0, document.body.scrollHeight);
// }, 300);

/// END TEMP CODE

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