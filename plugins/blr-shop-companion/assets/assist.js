(function(){
  'use strict';
  var A = window.BaderLRA || {};
  var box = document.querySelector('.blrc-box');
  if(!box) return;
  var out = box.querySelector('.blrc-box-out'), msg = box.querySelector('.blrc-box-msg');
  function getContent(){
    try{
      if(window.wp && wp.data && wp.data.select('core/editor')) return wp.data.select('core/editor').getEditedPostContent();
    }catch(e){}
    var t = document.getElementById('content'); return t ? t.value : '';
  }
  function apply(task, text){
    try{
      if(task==='excerpt' && wp.data.dispatch('core/editor')){ wp.data.dispatch('core/editor').editPost({excerpt:text}); msg.textContent=A.applied; }
    }catch(e){}
  }
  box.addEventListener('click', function(e){
    var b = e.target.closest('.blrc-assist'); if(!b) return;
    var task = b.getAttribute('data-task'); b.disabled = true; msg.textContent = A.busy;
    fetch(A.root+'assist', {method:'POST', headers:{'Content-Type':'application/json','X-WP-Nonce':A.nonce},
      body: JSON.stringify({task:task, post_id:box.getAttribute('data-post'), content:getContent()})})
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
    .then(function(r){
      if(r.ok && r.j.text){ out.style.display='block'; out.value=r.j.text; msg.textContent=''; apply(task, r.j.text); }
      else { msg.textContent = (r.j && r.j.error) || A.err; }
    }).catch(function(){ msg.textContent = A.err; })
    .finally(function(){ b.disabled=false; });
  });
})();
