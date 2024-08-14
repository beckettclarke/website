function ace(o, e) {
  document.querySelectorAll(o).forEach(function(i) {
    console.log(i);
    i.addEventListener('click', e);
  });
}
function switchtab(){
  var e = this;
  document.querySelectorAll('header > button.active').forEach(function(p){p.classList.remove('active');})
  e.classList.add('active');
  var re = e.getBoundingClientRect();
  var rh = document.querySelector('header').getBoundingClientRect();
  var el = re.left - rh.left - 7.5;
  console.log(document.getElementById('hsel'))
  console.log(el);
  var hs = document.getElementById('hsel');
  hs.style.left=el+"px";
  var rw = re.width + 15
  hs.style.width=rw+"px";
  document.querySelectorAll('.active').forEach(function(i){i.classList.remove('active');});
  document.querySelectorAll('.animatepage').forEach(function(y){y.classList.remove('animatepage');});
  var b = this.getAttribute('b');
  document.getElementById(b).classList.add('active');
  document.getElementById(b).classList.add('animatepage');
  let s = { id: "100" }; 
  // window.history.replaceState(s, this.getAttribute('b'),'/'+b);
  // document.title='Beckett Clarke - '+b.toProperCase();

}
ace('header > button', switchtab);
switchtab(document.getElementById('homebutton'));