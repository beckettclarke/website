clog('Loaded script globalfuncs.js','#0066ff','Script');  

String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function sendEmail(){
  console.log('send email')
  var name = document.getElementById('cname').value;
  var email = document.getElementById('cemail').value;
  var message = document.getElementById('ccontent').value;
  var subject = 'Request from ' + name + ' | #CF' + Math.floor(Math.random() * 1000000000);
  var body = '👤 Name: ' + name + '\n📧 Email: ' + email + '\n📄 Message:\n\n' + message;
  console.log(subject);
  var mte='mailto:beckettpublic@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  window.open(mte, '_blank').focus();

  
}
function sendHook(){
  document.querySelectorAll('.cprim').forEach(function(i){i.style.display='none';});
  document.querySelector('#csl').style.display='flex';
  var webhookUrl = 'https://discord.com/api/webhooks/1134128638829264906/Kv2FaV8Zzi6PYfVwyoDJqh24G192I-28ZfjmMQh-XE7jlfauj_EyEDR0WXjb-cgt6evd';
  var name = document.getElementById('cname').value;
  var email = document.getElementById('cemail').value;
  var message = document.getElementById('ccontent').value;
  var data = {
    content: null,
    embeds: [
      {
        title: '📬 New message from '+email,
        description: message,
        color: 5814783,
        fields: [
          {
            name: '👤 Name/Business',
            value: name,
          },
          {
            name: '📧 Email',
            value: email,
          },
        ],
        timestamp: new Date().toISOString(), // Sets the timestamp to the current time
      },
    ],
    attachments: [],
  };

  const xhr = new XMLHttpRequest();
  xhr.open('POST', webhookUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      console.log('Status:', xhr.status);
      console.log('Response:', xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('✅ Message sent successfully');
        document.querySelector('#formarea').style.display='none';
        document.querySelector('#sentpage').style.display='flex';
      } else if (xhr.status === 204) {
        console.log('Message sent successfully (No Content)');
      } else {
        document.querySelectorAll('.cprim').forEach(function(i){i.style.display='none';});
        document.querySelector('#cse').style.display='flex';
      }
    }
  };
  xhr.onerror = function() {
    console.error('Network Error');
  };
  xhr.send(JSON.stringify(data));

}
function projtab(){
  document.querySelector('#projectsbutton').click();
}
function newmsg(){
  document.getElementById('cname').value = '';
  document.getElementById('cemail').value = '';
  document.getElementById('ccontent').value = '';
  document.querySelectorAll('.cprim').forEach(function(i){i.style.display='none';});
  document.querySelector('#csubmit').style.display='flex';
  document.querySelector('#formarea').style.display='grid';
  document.querySelector('#sentpage').style.display='none';
}

function ace(o, e) {
  document.querySelectorAll(o).forEach(function(i) {
    // console.log(i);
    vlog('Adding clickevent to element',i);
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
  // console.log(document.getElementById('hsel'))
  clog('Switching tab to '+this.getAttribute('b').toProperCase(),'purple','Event');
  var hs = document.getElementById('hsel');
  hs.style.left=el+"px";
  var rw = re.width + 15
  hs.style.width=rw+"px";
  document.querySelectorAll('.active').forEach(function(i){i.classList.remove('active');});
  document.querySelectorAll('.animatepage').forEach(function(y){y.classList.remove('animatepage');});
  var b = this.getAttribute('b');
  var p = document.getElementById(b);
  p.classList.add('active');
  p.classList.add('animatepage');
  document.querySelectorAll('page').forEach(e => {vlog('Disable tabbing for element: ',e);disableTabbing(e);})
  vlog('Enable tabbing for element: ',p);
  enableTabbing(p);
  // let s = { id: "100" }; 
  // window.history.replaceState(s, this.getAttribute('b'),'/'+b);
  // document.title='Beckett Clarke - '+b.toProperCase();

}
function clog(m,c,t,a){
  if (document.body.classList.contains('verbose')){
    if (a) {
      console.log("%c"+t,"color: white; background: "+c+"; padding: 2px 6px; border-radius: 3px; margin-right: 5px;",m,a);
    } else {
      console.log("%c"+t,"color: white; background: "+c+"; padding: 2px 6px; border-radius: 3px; margin-right: 5px;",m);
    }
  }
}
function vlog(m,a){
  if (document.body.classList.contains('verbose')){
    clog(m,'green','Verbose',a);
  }
}
function disableTabbing(e) {
  e.setAttribute('tabindex', '-1');
  const f = e.querySelectorAll('button, a, input, textarea, select, [tabindex]');
  
  f.forEach(a => {
      a.setAttribute('tabindex', '-1');
  });
}
function enableTabbing(e) {
  e.removeAttribute('tabindex');
  const f = e.querySelectorAll('button, a, input, textarea, select, [tabindex]');
  f.forEach(a => {
      a.removeAttribute('tabindex');
  });
}


function err(e,a){
  clog(e,'red','Error',a);
}



vlog('Loaded all functions')