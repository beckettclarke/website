// Fancy console logging
function log(m,c,t,a){
  // m = message
  // c = color
  // t = title
  // a = attachment
  console.log("%c"+t,"color: white; background: "+c+"; padding: 2px 6px; border-radius: 3px; margin-right: 5px;",m,a ?? "");
}

log("Flexkit imported","darkblue","📥 Imports");

const get = {
  id: function(id) {
    return document.getElementById(id);
  },
  class: function(classname) {
    return document.getElementsByClassName(classname);
  },
  tag: function(tagname) {
    return document.getElementsByTagName(tagname);
  },
  query: function(query) {
    return document.querySelector(query);
  },
  queryAll: function(query) {
    return document.querySelectorAll(query);
  }
};

function ap(e,t){t.appendChild(e)}
function rm(e){e.parentNode.removeChild(e)}
function importCSS(c){
  let e = document.createElement('link');
  e.rel='stylesheet';
  e.href = c;
  document.head.appendChild(e);
  return e;
}
function importJS(c){
  let e = document.createElement('script');
  e.src = c;
  e.async = true;
  document.head.appendChild(e);
  return e;
}

importCSS('flexkit.css');

