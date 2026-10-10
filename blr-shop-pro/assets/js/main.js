/* BLR Shop Pro — front-end. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function ajax(params, method, body) {
    var url = BLR.ajax;
    var opts = { method: method || 'GET', credentials: 'same-origin' };
    if (opts.method === 'GET') {
      url += '?' + new URLSearchParams(Object.assign({ nonce: BLR.nonce }, params)).toString();
    } else {
      opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      opts.body = new URLSearchParams(Object.assign({ nonce: BLR.nonce }, params)).toString();
    }
    return fetch(url, opts).then(function (r) { return r.json(); });
  }
  function toast(msg) {
    var t = $('#blr-toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---------- Theme toggle ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-blr-theme]');
    if (!b) return;
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('blr-theme', next); } catch (er) {}
  });

  /* ---------- Mobile menu ---------- */
  var nav = $('#blr-nav'), overlay = $('[data-blr-overlay]');
  function menu(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    overlay.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-blr-menu-open]')) menu(true);
    else if (e.target.closest('[data-blr-menu-close]') || e.target === overlay) { menu(false); closeDrawer(); }
  });

  /* ---------- Announcement ---------- */
  var ann = $('#blr-announce');
  try { if (ann && sessionStorage.getItem('blr-ann')) ann.remove(); } catch (e) {}
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-blr-close-announce]')) {
      if (ann) ann.remove();
      try { sessionStorage.setItem('blr-ann', '1'); } catch (er) {}
    }
  });

  /* ---------- Search + live results ---------- */
  var sbar = $('#blr-searchbar'), sin = $('#blr-search-input'), live = $('#blr-live'), st;
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-blr-search-toggle]')) {
      sbar.hidden = !sbar.hidden;
      if (!sbar.hidden) sin.focus();
    }
  });
  if (sin) sin.addEventListener('input', function () {
    clearTimeout(st);
    var q = sin.value.trim();
    if (q.length < 2) { live.hidden = true; return; }
    st = setTimeout(function () {
      ajax({ action: 'blr_search', q: q }).then(function (r) {
        if (!r.success || !r.data.length) { live.hidden = true; return; }
        live.innerHTML = r.data.map(function (i) {
          return '<a href="' + esc(i.url) + '">' + (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy">' : '') +
            '<span>' + esc(i.title) + '<small>' + esc(i.price || i.type) + '</small></span></a>';
        }).join('');
        live.hidden = false;
      });
    }, 220);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (sbar) sbar.hidden = true; menu(false); closeDrawer(); closeModal(); }
  });

  /* ---------- Modal / drawer ---------- */
  var modal = $('#blr-modal'), mbody = $('#blr-modal-body');
  function openModal(html) { mbody.innerHTML = html; modal.hidden = false; }
  function closeModal() { if (modal) modal.hidden = true; }
  var drawer = $('#blr-drawer'), dbody = $('#blr-drawer-body');
  function closeDrawer() { if (drawer) drawer.hidden = true; if (overlay && !(nav && nav.classList.contains('is-open'))) overlay.hidden = true; }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-blr-modal-close]') || e.target === modal) closeModal();
    if (e.target.closest('[data-blr-drawer-close]')) closeDrawer();
  });

  /* ---------- Quick view ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-blr-qv]');
    if (!b) return;
    e.preventDefault();
    openModal('…');
    ajax({ action: 'blr_qv', id: b.dataset.blrQv }).then(function (r) {
      if (r.success) mbody.innerHTML = r.data.html; else closeModal();
    });
  });

  /* ---------- Wishlist & compare (localStorage) ---------- */
  function sync() {
    var w = store.get('blr-wish'), c = store.get('blr-cmp');
    $$('[data-blr-wish-count]').forEach(function (n) { n.textContent = w.length; n.setAttribute('data-blr-wish-count', w.length); });
    $$('[data-blr-wish]').forEach(function (b) { b.classList.toggle('is-on', w.indexOf(+b.dataset.blrWish) > -1); });
    $$('[data-blr-cmp]').forEach(function (b) { b.classList.toggle('is-on', c.indexOf(+b.dataset.blrCmp) > -1); });
    var bar = $('#blr-cmpbar');
    if (bar) { bar.hidden = c.length < 1; var n = $('[data-blr-cmp-count]', bar); if (n) n.textContent = c.length; }
  }
  function toggleList(key, id, max) {
    var l = store.get(key), i = l.indexOf(id);
    if (i > -1) l.splice(i, 1);
    else { if (max && l.length >= max) { toast(BLR.i18n.cmpMax); return false; } l.push(id); }
    store.set(key, l); sync(); return true;
  }
  function render(mode) {
    var key = mode === 'compare' ? 'blr-cmp' : 'blr-wish', ids = store.get(key);
    if (mode === 'compare' && ids.length < 2) { toast(BLR.i18n.emptyCmp); return; }
    if (mode === 'wish' && !ids.length) { dbody.innerHTML = '<p class="blr-empty">' + esc(BLR.i18n.emptyWish) + '</p>'; return; }
    return ajax({ action: 'blr_list', mode: mode, ids: ids.join(',') }).then(function (r) { return r.success ? r.data.html : ''; });
  }
  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-blr-wish]'), c = e.target.closest('[data-blr-cmp]'), o = e.target.closest('[data-blr-open]');
    if (w) {
      e.preventDefault();
      var inDrawer = !!w.closest('#blr-drawer');
      toggleList('blr-wish', +w.dataset.blrWish);
      if (inDrawer) openWish();
    } else if (c) {
      e.preventDefault();
      var inModal = !!c.closest('#blr-modal');
      toggleList('blr-cmp', +c.dataset.blrCmp, 4);
      if (inModal) openCompare();
    } else if (o) {
      if (o.dataset.blrOpen === 'wish') openWish(); else openCompare();
    } else if (e.target.closest('[data-blr-cmp-clear]')) { store.set('blr-cmp', []); sync(); }
  });
  function openWish() {
    $('#blr-drawer-title').textContent = '♥';
    drawer.hidden = false; overlay.hidden = false;
    var p = render('wish');
    if (p) p.then(function (h) { dbody.innerHTML = h || '<p class="blr-empty">' + esc(BLR.i18n.emptyWish) + '</p>'; });
  }
  function openCompare() {
    var p = render('compare');
    if (p) p.then(function (h) { openModal(h); }); else closeModal();
  }
  sync();

  /* ---------- Add to cart feedback ---------- */
  if (window.jQuery) {
    jQuery(document.body).on('added_to_cart', function () { toast(BLR.i18n.added); });
  }

  /* ---------- Countdown ---------- */
  var cds = $$('.blr-countdown');
  function tick() {
    var now = Math.floor(Date.now() / 1000);
    cds.forEach(function (el) {
      var left = Math.max(0, +el.dataset.end - now);
      var p = [Math.floor(left / 86400), Math.floor(left % 86400 / 3600), Math.floor(left % 3600 / 60), left % 60];
      var l = [BLR.i18n.days, BLR.i18n.hrs, BLR.i18n.min, BLR.i18n.sec];
      el.innerHTML = p.map(function (v, i) { return '<b>' + String(v).padStart(2, '0') + '<small>' + l[i] + '</small></b>'; }).join('');
    });
  }
  if (cds.length) { tick(); setInterval(tick, 1000); }

  /* ---------- Home tabs + product rows ---------- */
  $$('[data-blr-tabs]').forEach(function (box) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      $$('[data-tab]', box).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $$('[data-pane]', box).forEach(function (p) { p.hidden = p.dataset.pane !== b.dataset.tab; });
    });
  });
  document.addEventListener('click', function (e) {
    var n = e.target.closest('.blr-row-nav'); if (!n) return;
    var row = $('.blr-row', n.parentNode);
    var dir = (+n.dataset.dir) * (document.documentElement.dir === 'rtl' ? -1 : 1);
    row.scrollBy({ left: dir * row.clientWidth * .8, behavior: 'smooth' });
  });

  /* ---------- Sticky add to cart ---------- */
  var sticky = $('#blr-sticky-atc'), form = $('form.cart');
  if (sticky && form && 'IntersectionObserver' in window) {
    sticky.hidden = false;
    new IntersectionObserver(function (en) { sticky.classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0); }, { threshold: 0 }).observe(form);
    sticky.addEventListener('click', function (e) {
      if (!e.target.closest('[data-blr-sticky-buy]')) return;
      var btn = $('button.single_add_to_cart_button', form);
      if (btn && !btn.classList.contains('disabled')) btn.click();
      else form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------- AI chat ---------- */
  var chat = $('#blr-chat');
  if (chat && BLR.ai) {
    var log = $('.blr-chat__log', chat), cf = $('.blr-chat__form', chat), ci = $('input', cf), hist = [];
    function add(role, text) {
      var d = document.createElement('div');
      d.className = 'blr-msg blr-msg--' + (role === 'user' ? 'me' : 'bot');
      d.innerHTML = esc(text).replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-blr-chat-open]')) {
        chat.hidden = !chat.hidden;
        if (!log.children.length) add('assistant', BLR.i18n.chatHello);
        if (!chat.hidden) ci.focus();
      } else if (e.target.closest('[data-blr-chat-close]')) chat.hidden = true;
    });
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = ci.value.trim(); if (!m) return;
      ci.value = ''; add('user', m);
      var wait = add('assistant', BLR.i18n.typing);
      ajax({ action: 'blr_chat', message: m, history: JSON.stringify(hist) }, 'POST').then(function (r) {
        var t = r.success ? r.data.reply : ((r.data && r.data.message) || BLR.i18n.error);
        wait.remove(); add('assistant', t);
        hist.push({ role: 'user', content: m }, { role: 'assistant', content: t });
        hist = hist.slice(-8);
      }).catch(function () { wait.remove(); add('assistant', BLR.i18n.error); });
    });
  }
})();
