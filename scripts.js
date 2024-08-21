clog('Loaded script scripts.js','#0066ff','Script');  
ace('header > button', switchtab);
// switchtab(document.getElementById('homebutton'));
ace('#csemail',sendEmail)
ace('#csubmit',sendHook)
ace('#btb',projtab);
ace('#newmsg',newmsg);
clog('Applied Clickevents','orange','Document');
switch (document.readyState) {
  case "loading":
    clog('Page is now loading','green','Page');
    break;
  case "interactive": {
    // Can interact
   clog('Page reached interactive state','green','Page');
    break;
  }
  case "complete":{
   // Fully loaded
   clog('Page fully loaded','green','Page');
  break;
  }
}

onload = (event) => {
  clog('Page fully loaded','green','Page');
  // switchtab(document.getElementById('homebutton'));
};