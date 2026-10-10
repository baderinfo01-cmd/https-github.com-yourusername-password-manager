/* BLR Shop Pro — landing builder: AI generate button. */
(function () {
  'use strict';
  var btn = document.getElementById('bshop-gen');
  if (!btn || !window.BShopLP) return;
  var msg = document.getElementById('bshop-gen-msg'), out = document.getElementById('bshop-json');
  btn.addEventListener('click', function () {
    var brief = document.getElementById('bshop-brief').value.trim();
    if (brief.length < 10) { msg.textContent = BShopLP.err; return; }
    if (!window.confirm(BShopLP.sure)) return;
    btn.disabled = true; msg.textContent = BShopLP.busy;
    fetch(BShopLP.root + 'landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': BShopLP.nonce },
      body: JSON.stringify({ brief: brief })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok && r.j.json) { out.value = r.j.json; msg.textContent = BShopLP.ok; }
        else { msg.textContent = (r.j && r.j.error) || BShopLP.err; }
      }).catch(function () { msg.textContent = BShopLP.err; })
      .finally(function () { btn.disabled = false; });
  });
})();
