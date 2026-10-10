/* BLR Shop Pro — طبقة المتجر (Vanilla JS). */
(function () {
  'use strict';
  if (!window.BShop) return;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var T = BShop.i18n;
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function ajax(params) {
    var q = new URLSearchParams(Object.assign({ nonce: BShop.nonce }, params)).toString();
    return fetch(BShop.ajax + '?' + q, { credentials: 'same-origin' }).then(function (r) { return r.json(); });
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function toast(msg) {
    var t = $('#bs-toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }

  /* ---------- بحث مباشر ---------- */
  var bar = $('#bs-searchbar'), sin = $('#bs-search-input'), live = $('#bs-live'), st;
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-bs-search-toggle]') && bar) { bar.hidden = !bar.hidden; if (!bar.hidden) sin.focus(); }
  });
  if (sin) sin.addEventListener('input', function () {
    clearTimeout(st);
    var q = sin.value.trim();
    if (q.length < 2) { live.hidden = true; return; }
    st = setTimeout(function () {
      ajax({ action: 'bshop_search', q: q }).then(function (r) {
        if (!r.success || !r.data.length) { live.hidden = true; return; }
        live.innerHTML = r.data.map(function (i) {
          return '<a href="' + esc(i.url) + '">' + (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy">' : '') + '<span>' + esc(i.title) + '<small>' + esc(i.sub) + '</small></span></a>';
        }).join('');
        live.hidden = false;
      });
    }, 220);
  });

  /* ---------- نافذة ودرج ---------- */
  var modal = $('#bs-modal'), mbody = $('#bs-modal-body'), drawer = $('#bs-drawer'), dbody = $('#bs-drawer-body');
  function openModal(h) { mbody.innerHTML = h; modal.hidden = false; }
  function closeModal() { if (modal) modal.hidden = true; }
  function closeDrawer() { if (drawer) drawer.hidden = true; }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (bar) bar.hidden = true; closeModal(); closeDrawer(); }
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-bs-modal-close]') || e.target === modal) closeModal();
    if (e.target.closest('[data-bs-drawer-close]')) closeDrawer();
  });

  /* ---------- معاينة سريعة ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bs-qv]'); if (!b) return;
    e.preventDefault(); openModal('…');
    ajax({ action: 'bshop_qv', id: b.dataset.bsQv }).then(function (r) { if (r.success) mbody.innerHTML = r.data.html; else closeModal(); });
  });

  /* ---------- مفضلة ومقارنة ---------- */
  function sync() {
    var w = store.get('bs-wish'), c = store.get('bs-cmp');
    $$('[data-bs-wish-count]').forEach(function (n) { n.textContent = w.length; n.setAttribute('data-bs-wish-count', w.length); });
    $$('[data-bs-wish]').forEach(function (b) { b.classList.toggle('is-on', w.indexOf(+b.dataset.bsWish) > -1); });
    $$('[data-bs-cmp]').forEach(function (b) { b.classList.toggle('is-on', c.indexOf(+b.dataset.bsCmp) > -1); });
    var cb = $('#bs-cmpbar');
    if (cb) { cb.hidden = c.length < 1; var n = $('[data-bs-cmp-count]', cb); if (n) n.textContent = c.length; }
  }
  function toggleList(key, id, max) {
    var l = store.get(key), i = l.indexOf(id);
    if (i > -1) l.splice(i, 1);
    else { if (max && l.length >= max) { toast(T.cmpMax); return; } l.push(id); }
    store.set(key, l); sync();
  }
  function openWish() {
    drawer.hidden = false;
    var ids = store.get('bs-wish');
    if (!ids.length) { dbody.innerHTML = '<p class="bs-empty">' + esc(T.emptyWish) + '</p>'; return; }
    ajax({ action: 'bshop_list', mode: 'wish', ids: ids.join(',') }).then(function (r) {
      dbody.innerHTML = (r.success && r.data.html) || '<p class="bs-empty">' + esc(T.emptyWish) + '</p>';
    });
  }
  function openCompare() {
    var ids = store.get('bs-cmp');
    if (ids.length < 2) { toast(T.emptyCmp); closeModal(); return; }
    ajax({ action: 'bshop_list', mode: 'compare', ids: ids.join(',') }).then(function (r) { if (r.success) openModal(r.data.html); });
  }
  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-bs-wish]'), c = e.target.closest('[data-bs-cmp]'), o = e.target.closest('[data-bs-open]');
    if (w) { e.preventDefault(); toggleList('bs-wish', +w.dataset.bsWish); if (w.closest('#bs-drawer')) openWish(); }
    else if (c) { e.preventDefault(); toggleList('bs-cmp', +c.dataset.bsCmp, 4); if (c.closest('#bs-modal')) openCompare(); }
    else if (o) { if (o.dataset.bsOpen === 'wish') openWish(); else openCompare(); }
    else if (e.target.closest('[data-bs-cmp-clear]')) { store.set('bs-cmp', []); sync(); }
  });
  sync();

  if (window.jQuery) jQuery(document.body).on('added_to_cart', function () { toast(T.added); });

  /* ---------- عدّاد تنازلي ---------- */
  var cds = $$('.bs-countdown');
  function tick() {
    var now = Math.floor(Date.now() / 1000), L = [T.days, T.hrs, T.min, T.sec];
    cds.forEach(function (el) {
      var s = Math.max(0, +el.dataset.end - now);
      var p = [s / 86400, s % 86400 / 3600, s % 3600 / 60, s % 60].map(Math.floor);
      el.innerHTML = p.map(function (v, i) { return '<b>' + (v < 10 ? '0' : '') + v + '<small>' + L[i] + '</small></b>'; }).join('');
    });
  }
  if (cds.length) { tick(); setInterval(tick, 1000); }

  /* ---------- تبويبات الرئيسية وأسهم الصفوف ---------- */
  $$('[data-bs-tabs]').forEach(function (box) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      $$('[data-tab]', box).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $$('[data-pane]', box).forEach(function (p) { p.hidden = p.dataset.pane !== b.dataset.tab; });
    });
  });
  document.addEventListener('click', function (e) {
    var n = e.target.closest('.bs-row-nav'); if (!n) return;
    var row = $('.bs-row', n.parentNode);
    row.scrollBy({ left: (+n.dataset.dir) * (document.documentElement.dir === 'rtl' ? -1 : 1) * row.clientWidth * .8, behavior: 'smooth' });
  });

  /* ---------- شريط الشراء الثابت ---------- */
  var sticky = $('#bs-sticky'), form = $('form.cart');
  if (sticky && form && 'IntersectionObserver' in window) {
    sticky.hidden = false;
    new IntersectionObserver(function (en) { sticky.classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0); }).observe(form);
    sticky.addEventListener('click', function (e) {
      if (!e.target.closest('[data-bs-sticky-buy]')) return;
      var btn = $('button.single_add_to_cart_button', form);
      if (btn && !btn.classList.contains('disabled')) btn.click(); else form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();
