/* BLR Landing — client-side language switcher (no libraries) */
(function () {
  "use strict";
  var KEY = "blr-lang";

  function init(root) {
    var holder = root.querySelector(".blr-dict");
    if (!holder) return;
    var dict;
    try { dict = JSON.parse(holder.textContent); } catch (e) { return; }
    var dirs = { ar: "rtl", en: "ltr", fr: "ltr" };

    function apply(lang) {
      var d = dict[lang];
      if (!d) return;
      root.setAttribute("lang", lang);
      root.setAttribute("dir", dirs[lang] || "ltr");
      root.setAttribute("data-lang", lang);
      root.querySelectorAll("[data-i]").forEach(function (el) {
        var k = el.getAttribute("data-i");
        if (Object.prototype.hasOwnProperty.call(d, k)) el.textContent = d[k];
      });
      root.querySelectorAll("[data-set-lang]").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-set-lang") === lang);
      });
    }

    root.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = b.getAttribute("data-set-lang");
        try { localStorage.setItem(KEY, l); } catch (e) { /* private mode */ }
        apply(l);
      });
    });

    // a language the visitor chose earlier wins over the server default
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (saved && dict[saved] && saved !== root.getAttribute("data-lang")) apply(saved);
  }

  function start() {
    document.querySelectorAll(".blr").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
