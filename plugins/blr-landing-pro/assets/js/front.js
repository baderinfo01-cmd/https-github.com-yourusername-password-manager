/* BLR Landing Pro — front-end (Vanilla JS، بلا jQuery). */
(function () {
  'use strict';
  var C = window.BLRLP || {};
  var T = C.i18n || {};
  var preview = !!C.preview;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function post(path, data) {
    if (!C.rest) return Promise.resolve({});
    return fetch(C.rest + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'omit',
      keepalive: true
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  function init(root) {
    if (root._blrlp) return;
    root._blrlp = 1;
    root.classList.add('blrlp-js');
    var id = +root.getAttribute('data-blrlp-id') || 0;
    var track = !preview && id && !document.body.classList.contains('logged-in');

    /* ---- ظهور تدريجي ---- */
    var rv = $$('.blrlp-rv', root);
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
      rv.forEach(function (el) { io.observe(el); });
    } else { rv.forEach(function (el) { el.classList.add('is-in'); }); }

    /* ---- عدّ الأرقام ---- */
    var counters = $$('[data-count]', root);
    if (counters.length && 'IntersectionObserver' in window && !reduce) {
      var cio = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target, txt = el.textContent, m = txt.match(/[\d.,]+/);
          if (!m) return;
          var num = parseFloat(m[0].replace(/,/g, '')), dec = (m[0].split('.')[1] || '').length, t0 = performance.now(), dur = 1200;
          if (!isFinite(num) || num <= 0) return;
          (function step(t) {
            var p = Math.min(1, (t - t0) / dur), v = num * (1 - Math.pow(1 - p, 3));
            el.textContent = txt.replace(m[0], (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')));
            if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
          })(t0);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }

    /* ---- عدّاد تنازلي ---- */
    var cds = $$('.blrlp-count', root);
    if (cds.length) {
      cds.forEach(function (el) {
        var end = +el.getAttribute('data-end') || 0, ev = parseFloat(el.getAttribute('data-evergreen')) || 0;
        if (ev > 0) {
          var key = 'blrlp_eg_' + id + '_' + ($$('.blrlp-count', root).indexOf(el));
          var saved = +store(key) || 0;
          if (!saved || saved < Date.now() / 1000 - 86400 * 365) { saved = Math.floor(Date.now() / 1000) + Math.round(ev * 3600); store(key, String(saved)); }
          if (saved < Date.now() / 1000) { saved = Math.floor(Date.now() / 1000) + Math.round(ev * 3600); store(key, String(saved)); }
          end = saved;
        }
        el._end = end;
      });
      var L = [T.d || 'd', T.h || 'h', T.m || 'm', T.s || 's'];
      var tick = function () {
        var now = Date.now() / 1000;
        cds.forEach(function (el) {
          var s = Math.max(0, (el._end || 0) - now);
          var p = [s / 86400, s % 86400 / 3600, s % 3600 / 60, s % 60].map(Math.floor);
          el.innerHTML = p.map(function (v, i) { return '<b>' + (v < 10 ? '0' : '') + v + '<small>' + L[i] + '</small></b>'; }).join('');
        });
      };
      tick(); setInterval(tick, 1000);
    }

    /* ---- فيديو بتحميل عند النقر ---- */
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.blrlp-video__play');
      if (!b) return;
      var f = document.createElement('iframe');
      f.src = b.getAttribute('data-embed');
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      f.title = 'video';
      b.replaceWith(f);
    });

    /* ---- تتبّع ---- */
    if (track) {
      var seen = 'blrlp_seen_' + id, first = !store(seen);
      store(seen, '1');
      post('track', { id: id, type: 'view', u: first ? 1 : 0 });
      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-blrlp-cta]')) post('track', { id: id, type: 'click' });
      });
    }

    /* ---- نموذج العملاء ---- */
    $$('[data-blrlp-form]', root).forEach(function (form) {
      var msg = $('.blrlp-form__msg', form), btn = $('button[type=submit]', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        $$('[required]', form).forEach(function (f) {
          var bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
          f.classList.toggle('is-bad', bad); if (bad) ok = false;
        });
        msg.className = 'blrlp-form__msg';
        if (!ok) { msg.textContent = T.invalid || ''; msg.classList.add('is-err'); return; }
        if (preview) { msg.textContent = '✓ ' + (form.getAttribute('data-success') || ''); msg.classList.add('is-ok'); return; }
        btn.disabled = true; msg.textContent = T.sending || '…';
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        post('lead', data).then(function (r) {
          btn.disabled = false;
          if (r && r.ok) {
            msg.textContent = form.getAttribute('data-success') || '✓'; msg.classList.add('is-ok'); form.reset();
            var wa = form.getAttribute('data-wa');
            if (wa) { window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent((data.name || '') + ' ' + (data.message || '')), '_blank', 'noopener'); }
            if (r.redirect) { setTimeout(function () { location.href = r.redirect; }, 900); }
          } else { msg.textContent = (r && r.error) || T.error || ''; msg.classList.add('is-err'); }
        }).catch(function () { btn.disabled = false; msg.textContent = T.error || ''; msg.classList.add('is-err'); });
      });
    });

    /* ---- شريط ثابت ---- */
    var sticky = $('.blrlp-sticky', root);
    if (sticky) {
      var onS = function () { sticky.classList.toggle('is-on', window.scrollY > 520); };
      window.addEventListener('scroll', onS, { passive: true }); onS();
    }

    /* ---- نافذة الخروج ---- */
    var ex = $('.blrlp-exit', root);
    if (ex && !preview) {
      var shown = store('blrlp_exit_' + id) === '1' || false;
      var open = function () { if (shown) return; shown = true; store('blrlp_exit_' + id, '1'); ex.hidden = false; };
      document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY < 8 && window.innerWidth > 800) open(); });
      if (window.innerWidth <= 800) setTimeout(open, 35000);
      ex.addEventListener('click', function (e) { if (e.target === ex || e.target.closest('.blrlp-exit__x')) ex.hidden = true; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ex.hidden = true; });
    }

    /* ---- تمرير سلس للروابط الداخلية ---- */
    root.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    });
  }

  function boot() { $$('.blrlp').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* ---- المعاينة: تمرير لقسم من المحرّر ---- */
  if (preview) {
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type !== 'blrlp-scroll') return;
      var el = document.querySelector('[data-uid="' + String(d.uid).replace(/[^a-z0-9]/gi, '') + '"]');
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('is-flash'); setTimeout(function () { el.classList.remove('is-flash'); }, 1200);
    });
  }
})();
