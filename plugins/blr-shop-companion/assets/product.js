/* BLR Shop Companion — كاتب المنتجات داخل شاشة المنتج. */
(function () {
  'use strict';
  var C = window.BaderLRP, btn = document.getElementById('blrc-p-run');
  if (!C || !btn) return;
  var msg = document.getElementById('blrc-p-msg');
  function setField(id, val) { var el = document.getElementById(id); if (el) { el.value = val; } }
  btn.addEventListener('click', function () {
    var t = document.getElementById('title');
    btn.disabled = true; msg.textContent = C.busy;
    fetch(C.root + 'product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': C.nonce },
      body: JSON.stringify({ title: t ? t.value : '', notes: document.getElementById('blrc-p-notes').value, tone: document.getElementById('blrc-p-tone').value, kind: C.kind })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (!r.ok) { msg.textContent = (r.j && r.j.error) || C.err; return; }
        var d = r.j;
        if (window.tinymce && tinymce.get('content') && !tinymce.get('content').isHidden()) { tinymce.get('content').setContent(d.description); } else { setField('content', d.description); }
        if (window.tinymce && tinymce.get('excerpt')) { tinymce.get('excerpt').setContent(d.short); } else { setField('excerpt', d.short); }
        setField('_bshop_seo_desc', d.seo_desc);
        var tags = document.getElementById('new-tag-product_tag');
        if (tags && d.tags && d.tags.length) { tags.value = d.tags.join(','); var add = document.querySelector('.tagadd'); if (add) add.click(); }
        msg.textContent = C.done;
      }).catch(function () { msg.textContent = C.err; })
      .finally(function () { btn.disabled = false; });
  });
})();
