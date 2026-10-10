/* BLR Shop Pro — admin: license, AI product writer, AI landing builder. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };

  function post(data) {
    data.nonce = BLRA.nonce;
    return fetch(BLRA.ajax, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    }).then(function (r) { return r.json(); });
  }

  /* License */
  document.querySelectorAll('[data-blr-lic]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var msg = $('#blr-lic-msg');
      msg.textContent = BLRA.wait;
      post({ action: 'blr_license', do: btn.dataset.blrLic, key: $('#blr-lic-key').value }).then(function (r) {
        msg.textContent = (r.data && r.data.message) || '';
        msg.style.color = r.success ? '#065f46' : '#b91c1c';
        if (r.success) {
          var st = $('#blr-lic-status');
          st.textContent = r.data.label;
          st.className = 'blr-lic blr-lic-' + r.data.status;
        }
      }).catch(function () { msg.textContent = 'Network error'; });
    });
  });

  /* AI product writer */
  var run = $('[data-blr-ai-product]');
  if (run) {
    run.addEventListener('click', function () {
      var msg = $('#blr-ai-msg'), title = $('#title');
      msg.textContent = BLRA.wait; run.disabled = true;
      post({
        action: 'blr_ai_product',
        title: title ? title.value : '',
        notes: $('#blr-ai-notes').value,
        tone: $('#blr-ai-tone').value,
        kind: window.BLR_PRODUCT_KIND || 'physical'
      }).then(function (r) {
        run.disabled = false;
        if (!r.success) { msg.textContent = r.data.message; return; }
        var d = r.data, wp = window.wp;
        // الوصف الطويل
        if (window.tinymce && tinymce.get('content') && !tinymce.get('content').isHidden()) { tinymce.get('content').setContent(d.description); }
        else if ($('#content')) { $('#content').value = d.description; }
        // الوصف القصير
        if (window.tinymce && tinymce.get('excerpt')) { tinymce.get('excerpt').setContent(d.short); }
        else if ($('#excerpt')) { $('#excerpt').value = d.short; }
        if ($('#blr_seo_title')) { $('#blr_seo_title').value = d.seo_title; }
        if ($('#blr_seo_desc')) { $('#blr_seo_desc').value = d.seo_desc; }
        var tags = $('#new-tag-product_tag');
        if (tags && d.tags.length) { tags.value = d.tags.join(','); var b = $('.tagadd'); if (b) { b.click(); } }
        msg.textContent = '✓ تم. راجع النص قبل النشر.';
      }).catch(function () { run.disabled = false; msg.textContent = 'Network error'; });
    });
  }

  /* AI landing builder */
  var lp = $('[data-blr-landing-ai]');
  if (lp) {
    lp.addEventListener('click', function () {
      var msg = $('#blr-landing-msg');
      if (!confirm('سيستبدل هذا محتوى JSON الحالي. متابعة؟')) { return; }
      msg.textContent = BLRA.wait; lp.disabled = true;
      post({ action: 'blr_ai_landing', brief: $('#blr-landing-brief').value }).then(function (r) {
        lp.disabled = false;
        if (r.success) { $('#blr-landing-json').value = r.data.json; msg.textContent = '✓ تم التوليد — راجع ثم اضغط "حفظ".'; }
        else { msg.textContent = r.data.message; }
      }).catch(function () { lp.disabled = false; msg.textContent = 'Network error'; });
    });
  }
})();
