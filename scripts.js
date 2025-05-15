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