/* BLR Fatourati Landing — language dropdown + switcher, screenshot gallery and lightbox (no libraries) */
(function () {
  "use strict";
  var KEY = "blr-lang";

  function init(root) {
    var holder = root.querySelector(".blr-dict");
    if (!holder) return;
    var dict;
    try { dict = JSON.parse(holder.textContent); } catch (e) { return; }

    /* ---------- language ---------- */
    var menu = root.querySelector("[data-lang-menu]");
    var btn = menu && menu.querySelector(".blr-lang__btn");
    var list = menu && menu.querySelector(".blr-lang__list");

    function setMenu(open) {
      if (!btn || !list) return;
      list.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function apply(lang) {
      var d = dict[lang];
      if (!d) return;
      root.setAttribute("lang", lang);
      root.setAttribute("dir", d.dir === "rtl" ? "rtl" : "ltr");
      root.setAttribute("data-lang", lang);
      root.querySelectorAll("[data-i]").forEach(function (el) {
        var k = el.getAttribute("data-i");
        if (Object.prototype.hasOwnProperty.call(d, k)) {
          el.textContent = d[k];
          if (k === "price.old" || k === "price.badge") el.hidden = !d[k];
        }
      });
      root.querySelectorAll("[data-ialt]").forEach(function (el) {
        var k = el.getAttribute("data-ialt");
        if (d[k]) el.setAttribute("alt", d[k]);
      });
      root.querySelectorAll("[data-iaria]").forEach(function (el) {
        var k = el.getAttribute("data-iaria");
        if (d[k]) el.setAttribute("aria-label", d[k]);
      });
      root.querySelectorAll("[data-set-lang]").forEach(function (b) {
        var on = b.getAttribute("data-set-lang") === lang;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var cur = root.querySelector(".blr-lang__cur");
      if (cur) cur.textContent = d.name;
      refreshCaption();
    }

    root.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = b.getAttribute("data-set-lang");
        try { localStorage.setItem(KEY, l); } catch (e) { /* private mode */ }
        apply(l);
        setMenu(false);
        if (btn) btn.focus();
      });
    });
    if (btn) {
      btn.addEventListener("click", function () { setMenu(list.hidden); });
      document.addEventListener("click", function (ev) {
        if (menu && !menu.contains(ev.target)) setMenu(false);
      });
      menu.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") { setMenu(false); btn.focus(); }
      });
    }

    // 1) a language the visitor chose earlier, 2) the browser language (only when the server default is "auto"), 3) the server language
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    var wanted = null;
    if (saved && dict[saved]) {
      wanted = saved;
    } else if (root.getAttribute("data-auto") === "1") {
      var prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
      for (var i = 0; i < prefs.length && !wanted; i++) {
        var c = String(prefs[i] || "").toLowerCase().split("-")[0];
        if (dict[c]) wanted = c;
      }
    }
    if (wanted && wanted !== root.getAttribute("data-lang")) apply(wanted);

    /* ---------- gallery ---------- */
    var section = root.querySelector("[data-blr-gallery]");
    var figs = section ? Array.prototype.slice.call(section.querySelectorAll(".blr-shot")) : [];

    function refreshSection() {
      var any = figs.some(function (f) { return !f.hidden; });
      if (section) section.hidden = !any;
    }
    function ok(f) { f.hidden = false; refreshSection(); }
    function bad(f) { f.hidden = true; refreshSection(); }

    figs.forEach(function (f) {
      var img = f.querySelector("img");
      img.addEventListener("error", function () { bad(f); });
      var url = img.getAttribute("src");
      if (window.fetch) {
        // cheap existence check, so the lazy images are not all downloaded up-front
        fetch(url, { method: "HEAD" }).then(function (r) { if (r.ok) ok(f); else bad(f); }, function () { bad(f); });
      } else {
        ok(f);
      }
    });

    /* ---------- lightbox ---------- */
    var lb = root.querySelector(".blr-lb");
    var lbImg = lb && lb.querySelector("img");
    var lbCap = lb && lb.querySelector("figcaption");
    var idx = -1, opener = null;

    function visible() { return figs.filter(function (f) { return !f.hidden; }); }
    function refreshCaption() {
      if (!lb || lb.hidden || idx < 0) return;
      var v = visible(), f = v[idx];
      if (!f) return;
      lbImg.alt = f.querySelector("img").alt;
      lbCap.textContent = f.querySelector("figcaption").textContent;
    }
    function show(i) {
      var v = visible();
      if (!v.length) return;
      idx = (i + v.length) % v.length;
      lbImg.src = v[idx].querySelector(".blr-shot__btn").getAttribute("data-full");
      refreshCaption();
    }
    function open(f) {
      if (!lb) return;
      opener = f.querySelector(".blr-shot__btn");
      lb.hidden = false;
      document.documentElement.style.overflow = "hidden";
      show(visible().indexOf(f));
      lb.querySelector(".blr-lb__x").focus();
    }
    function close() {
      if (!lb || lb.hidden) return;
      lb.hidden = true;
      lbImg.removeAttribute("src");
      document.documentElement.style.overflow = "";
      if (opener) opener.focus();
    }
    figs.forEach(function (f) {
      f.querySelector(".blr-shot__btn").addEventListener("click", function () { open(f); });
    });
    if (lb) {
      lb.addEventListener("click", function (ev) {
        var a = ev.target.getAttribute && ev.target.getAttribute("data-lb");
        if (a === "close" || ev.target === lb) close();
        else if (a === "next") show(idx + 1);
        else if (a === "prev") show(idx - 1);
      });
      document.addEventListener("keydown", function (ev) {
        if (lb.hidden) return;
        var rtl = root.getAttribute("dir") === "rtl";
        if (ev.key === "Escape") close();
        else if (ev.key === "ArrowRight") show(idx + (rtl ? -1 : 1));
        else if (ev.key === "ArrowLeft") show(idx + (rtl ? 1 : -1));
      });
    }
  }

  function start() {
    document.querySelectorAll(".blr").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
