(function(){
  'use strict';
  var C = window.BaderLRChat; if(!C) return;
  var hist = [];
  var root = document.createElement('div'); root.className = 'blrchat';
  root.innerHTML = '<button class="blrchat__fab" type="button" aria-label=""></button>'+
    '<div class="blrchat__panel" hidden role="dialog"><div class="blrchat__head"><span></span><button type="button" class="blrchat__x"></button></div>'+
    '<div class="blrchat__log" aria-live="polite"></div><form class="blrchat__form"><input type="text" maxlength="600" required><button type="submit"></button></form></div>';
  document.body.appendChild(root);
  var fab = root.querySelector('.blrchat__fab'), panel = root.querySelector('.blrchat__panel'),
      log = root.querySelector('.blrchat__log'), form = root.querySelector('form'), input = form.querySelector('input');
  fab.textContent = '✦'; fab.setAttribute('aria-label', C.i18n.open);
  root.querySelector('.blrchat__head span').textContent = C.title;
  var x = root.querySelector('.blrchat__x'); x.textContent = '×'; x.setAttribute('aria-label', C.i18n.close);
  input.placeholder = C.i18n.placeholder; form.querySelector('button').textContent = C.i18n.send;
  function add(role, text){ var d = document.createElement('div'); d.className = 'blrchat__m blrchat__m--'+role; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  add('bot', C.greeting);
  function toggle(){ panel.hidden = !panel.hidden; if(!panel.hidden) input.focus(); }
  fab.addEventListener('click', toggle); x.addEventListener('click', toggle);
  form.addEventListener('submit', function(e){
    e.preventDefault(); var t = input.value.trim(); if(!t) return;
    input.value = ''; add('user', t); var w = add('bot', '…'); input.disabled = true;
    fetch(C.endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:t, history:hist})})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); })
      .then(function(r){
        if(r.ok && r.j.text){ w.textContent = r.j.text; hist.push({role:'user',content:t},{role:'assistant',content:r.j.text}); hist = hist.slice(-8); }
        else { w.textContent = (r.j && r.j.error) || C.i18n.error; }
      }).catch(function(){ w.textContent = C.i18n.error; })
      .finally(function(){ input.disabled = false; input.focus(); });
  });
})();
