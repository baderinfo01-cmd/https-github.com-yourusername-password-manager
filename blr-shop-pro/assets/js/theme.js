/* BLR Shop Pro — front-end interactions (no dependencies) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;

  /* ---- Sticky header shadow ---- */
  var header = doc.getElementById('blr-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 10); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Dark mode toggle (remembered per browser) ---- */
  var KEY = 'baderlr_dark';
  try { if (localStorage.getItem(KEY) === '1') doc.body.classList.add('blr-dark'); } catch (e) {}
  var darkBtn = doc.getElementById('blr-dark');
  if (darkBtn) {
    darkBtn.addEventListener('click', function () {
      var on = doc.body.classList.toggle('blr-dark');
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    });
  }

  /* ---- Mobile drawer ---- */
  var burger = doc.getElementById('blr-burger'), drawer = doc.getElementById('blr-drawer');
  if (burger && drawer) {
    var open = function () { drawer.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); doc.body.style.overflow = 'hidden'; };
    var close = function () { drawer.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); doc.body.style.overflow = ''; };
    burger.addEventListener('click', open);
    drawer.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
    drawer.addEventListener('click', function (e) { if (e.target.tagName === 'A' && e.target.closest('.blr-drawer__panel')) close(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---- Back to top ---- */
  var top = doc.getElementById('blr-top');
  if (top) {
    var onS2 = function () { top.classList.toggle('is-show', window.scrollY > 500); };
    onS2();
    window.addEventListener('scroll', onS2, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = doc.querySelectorAll('.blr-reveal:not(.is-in)');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
