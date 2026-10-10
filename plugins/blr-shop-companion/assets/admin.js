(function(){
  'use strict';
  var C = window.BaderLRC || {};
  function post(path, body){
    return fetch(C.root + path, {
      method:'POST',
      headers:{'Content-Type':'application/json','X-WP-Nonce':C.nonce},
      body: JSON.stringify(body)
    }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok, data:j}; }); });
  }

  /* ---- AI generate ---- */
  var form = document.getElementById('blrc-ai-form');
  if (form){
    var result = document.getElementById('blrc-ai-result');
    var copyBtn = document.getElementById('blrc-ai-copy');
    var goBtn = document.getElementById('blrc-ai-go');
    var draftBtn = document.getElementById('blrc-ai-draft');
    if(draftBtn){
      draftBtn.addEventListener('click', function(){
        var topic = (new FormData(form).get('topic')||'').toString().slice(0,80);
        draftBtn.disabled = true;
        post('draft', {text:result.textContent, title:topic}).then(function(res){
          if(res.ok && res.data.edit){ window.open(res.data.edit, '_blank'); }
          else { alert((res.data && res.data.error) || C.i18n.error); }
        }).finally(function(){ draftBtn.disabled=false; });
      });
    }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(form);
      var topic = (fd.get('topic')||'').toString().trim();
      if(!topic){ return; }
      goBtn.disabled = true; var oldTxt = goBtn.textContent; goBtn.textContent = C.i18n.generating;
      result.classList.add('is-loading'); result.textContent = C.i18n.generating;
      post('generate', {type:fd.get('type'), topic:topic, lang:fd.get('lang'), tone:fd.get('tone')})
        .then(function(res){
          result.classList.remove('is-loading');
          if(res.ok && res.data && res.data.text){
            result.textContent = res.data.text;
            copyBtn.hidden = false; if(draftBtn) draftBtn.hidden = false;
          } else {
            result.innerHTML = '<span style="color:#b91c1c">'+ ((res.data && res.data.error) || C.i18n.error) +'</span>';
            copyBtn.hidden = true; if(draftBtn) draftBtn.hidden = true;
          }
        })
        .catch(function(){ result.classList.remove('is-loading'); result.innerHTML='<span style="color:#b91c1c">'+C.i18n.error+'</span>'; })
        .finally(function(){ goBtn.disabled=false; goBtn.textContent=oldTxt; });
    });
    if(copyBtn){
      copyBtn.addEventListener('click', function(){
        navigator.clipboard.writeText(result.textContent).then(function(){
          var o=copyBtn.textContent; copyBtn.textContent=C.i18n.copied; setTimeout(function(){copyBtn.textContent=o;},1500);
        });
      });
    }
  }

  /* ---- Starter import ---- */
  document.querySelectorAll('.blrc-import').forEach(function(btn){
    btn.addEventListener('click', function(){
      var slug = btn.getAttribute('data-demo');
      var msg = btn.parentNode.querySelector('.blrc-import-msg');
      if(!window.confirm('سيتم إنشاء صفحات الموقع الجاهز. متابعة؟')) return;
      btn.disabled = true; var o=btn.textContent; btn.textContent = C.i18n.importing;
      post('import', {demo:slug}).then(function(res){
        if(res.ok && res.data && res.data.ok){
          msg.style.color='#166534';
          msg.textContent = '✓ تم الاستيراد ('+res.data.pages+' صفحات). ';
          var a=document.createElement('a'); a.href=res.data.url; a.target='_blank'; a.textContent='معاينة الموقع'; msg.appendChild(a);
        } else {
          msg.style.color='#b91c1c'; msg.textContent = (res.data && res.data.error) || 'تعذّر الاستيراد.';
        }
      }).catch(function(){ msg.style.color='#b91c1c'; msg.textContent='تعذّر الاستيراد.'; })
      .finally(function(){ btn.disabled=false; btn.textContent=o; });
    });
  });
})();
