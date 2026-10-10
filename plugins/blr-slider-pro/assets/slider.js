/* BLR Slider Pro — vanilla, ~3KB gz. Swipe, keyboard, smart autoplay, a11y. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Slider(root) {
    var cfg = {};
    try { cfg = JSON.parse(root.getAttribute('data-cfg')) || {}; } catch (e) {}
    var track = root.querySelector('.blrs__track');
    var slides = [].slice.call(root.querySelectorAll('.blrs__slide'));
    var dots = [].slice.call(root.querySelectorAll('.blrs__dots button'));
    var bar = root.querySelector('.blrs__bar i');
    var rtl = getComputedStyle(root).direction === 'rtl';
    var isSlide = cfg.effect === 'slide';
    var n = slides.length, cur = 0, timer = null, paused = false, visible = true, startT = 0, remain = cfg.delay || 5500;
    var auto = !!cfg.autoplay && n > 1 && !reduce;

    function go(i, user) {
      if (n < 2) return;
      if (cfg.loop) { i = (i + n) % n; } else { i = Math.max(0, Math.min(n - 1, i)); }
      cur = i;
      if (isSlide) { track.style.transform = 'translateX(' + (rtl ? 1 : -1) * 100 * i + '%)'; }
      slides.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        var v = s.querySelector('video');
        if (v) { if (on) { v.play && v.play().catch(function () {}); } else { v.pause(); } }
      });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); d.setAttribute('aria-selected', k === i); });
      restart(true);
    }

    function runBar() {
      if (!bar) return;
      bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
      void bar.offsetWidth;
      bar.style.transition = 'transform ' + remain + 'ms linear'; bar.style.transform = 'scaleX(1)';
    }
    function stop() {
      clearTimeout(timer); timer = null;
      if (bar) { var w = getComputedStyle(bar).transform; bar.style.transition = 'none'; bar.style.transform = w; }
    }
    function restart(full) {
      clearTimeout(timer);
      if (full !== false) { remain = cfg.delay || 5500; }
      if (!auto || paused || !visible) { if (bar && full !== false) { bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; } return; }
      startT = Date.now(); runBar();
      timer = setTimeout(function () { go(cur + 1, false); }, remain);
    }
    function pause() { if (paused) return; paused = true; if (timer) { remain = Math.max(300, remain - (Date.now() - startT)); } stop(); }
    function resume() { if (!paused) return; paused = false; restart(false); }

    // Controls.
    var prev = root.querySelector('.blrs__prev'), next = root.querySelector('.blrs__next');
    if (prev) prev.addEventListener('click', function () { go(cur - 1, true); });
    if (next) next.addEventListener('click', function () { go(cur + 1, true); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k, true); }); });

    // Keyboard (when slider has focus inside).
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(cur + (rtl ? 1 : -1), true); }
      else if (e.key === 'ArrowRight') { go(cur + (rtl ? -1 : 1), true); }
    });

    // Pause on hover / focus / hidden tab / off-screen.
    if (cfg.hover) {
      root.addEventListener('mouseenter', pause); root.addEventListener('mouseleave', resume);
    }
    root.addEventListener('focusin', pause); root.addEventListener('focusout', resume);
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : resume(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) { restart(false); } else { stop(); }
      }, { threshold: .25 }).observe(root);
    }

    // Swipe / drag (pointer events).
    var x0 = 0, dx = 0, drag = false, vp = root.querySelector('.blrs__viewport');
    vp.addEventListener('pointerdown', function (e) {
      if (n < 2 || e.target.closest('a,button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = true; x0 = e.clientX; dx = 0; pause();
      if (isSlide) track.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      dx = e.clientX - x0;
      if (isSlide) {
        var pct = dx / vp.clientWidth * 100;
        track.style.transform = 'translateX(' + ((rtl ? 1 : -1) * 100 * cur + pct) + '%)';
      }
    });
    function end() {
      if (!drag) return;
      drag = false; track.classList.remove('is-drag');
      var th = Math.min(80, vp.clientWidth * .15);
      if (Math.abs(dx) > th) { var dir = dx < 0 ? 1 : -1; go(cur + (rtl ? -dir : dir), true); } else { go(cur, true); }
      paused = false;
    }
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    vp.addEventListener('click', function (e) { if (Math.abs(dx) > 8) { e.preventDefault(); e.stopPropagation(); dx = 0; } }, true);

    // Countdowns.
    var cds = [].slice.call(root.querySelectorAll('.blrs__cd'));
    if (cds.length) {
      var L = document.documentElement.lang && document.documentElement.lang.indexOf('ar') === 0 ? ['يوم', 'ساعة', 'دقيقة', 'ثانية'] : ['d', 'h', 'm', 's'];
      var t = function () {
        var now = Date.now() / 1000;
        cds.forEach(function (el) {
          var s = Math.max(0, +el.dataset.end - now);
          var p = [s / 86400, s % 86400 / 3600, s % 3600 / 60, s % 60].map(Math.floor);
          el.innerHTML = p.map(function (v, i) { return '<b>' + (v < 10 ? '0' : '') + v + '<small>' + L[i] + '</small></b>'; }).join('');
        });
      };
      t(); setInterval(t, 1000);
    }

    slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k ? 'true' : 'false'); });
    root.tabIndex = root.tabIndex < 0 ? 0 : root.tabIndex;
    go(0, true);
  }

  function init() { [].forEach.call(document.querySelectorAll('.blrs'), function (r) { if (!r._blrs) { r._blrs = 1; Slider(r); } }); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
