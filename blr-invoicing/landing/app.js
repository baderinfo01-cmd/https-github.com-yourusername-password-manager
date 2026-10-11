(function () {
  "use strict";
  var C = window.SITE_CONFIG, I = window.SITE_I18N;
  var LANGS = ["ar", "en", "fr"];
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, props, children) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") n.textContent = props[k];
      else if (k === "class") n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  // only http(s)/mailto/tel links from the config are ever used
  function safe(url) { return /^(https?:|mailto:|tel:)/i.test(url) ? url : ""; }
  function getLang() {
    var q = new URLSearchParams(location.search).get("lang");
    var s = ""; try { s = localStorage.getItem("lp-lang") || ""; } catch (e) {}
    var n = (navigator.language || "").slice(0, 2);
    var l = [q, s, n, C.defaultLang].filter(function (x) { return LANGS.indexOf(x) > -1; })[0];
    return l || "ar";
  }

  function money(lang) {
    var p = C.price, loc = lang === "fr" ? "fr-FR" : "en-US";
    var f = function (v) {
      try { return new Intl.NumberFormat(loc, { style: "currency", currency: p.currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 2 }).format(v); }
      catch (e) { return v + " " + p.currency; }
    };
    return { now: f(p.amount), old: p.oldAmount > p.amount ? f(p.oldAmount) : "" };
  }

  function render(lang) {
    var T = I[lang];
    document.documentElement.lang = lang; document.documentElement.dir = T.dir;
    document.documentElement.style.setProperty("--p", C.brand.primaryColor || "#0284c7");
    document.title = C.brand.name + " — " + T.heroTitle;
    $("brandName").textContent = C.brand.name;

    var langBox = $("lang"); clear(langBox);
    LANGS.forEach(function (l) {
      var b = el("button", { text: I[l].name, class: l === lang ? "on" : "", type: "button" });
      b.onclick = function () { try { localStorage.setItem("lp-lang", l); } catch (e) {} render(l); };
      langBox.appendChild(b);
    });

    var nav = $("nav"); clear(nav);
    [["features", "navFeatures"], ["security", "navSecurity"], ["ai", "navAI"], ["pricing", "navPricing"], ["faq", "navFaq"], ["contact", "navContact"]]
      .forEach(function (x) { nav.appendChild(el("a", { href: "#" + x[0], text: T[x[1]] })); });

    $("heroTitle").textContent = T.heroTitle; $("heroText").textContent = T.heroText;
    var cta = $("heroCta"); clear(cta);
    if (safe(C.links.buy)) cta.appendChild(el("a", { class: "btn", href: C.links.buy, text: T.ctaBuy, rel: "noopener" }));
    if (safe(C.links.download)) cta.appendChild(el("a", { class: "btn ghost", href: C.links.download, text: T.ctaDownload, rel: "noopener" }));
    cta.appendChild(el("a", { class: "btn ghost", href: "#features", text: T.ctaMore }));
    var tr = $("trust"); clear(tr);
    ["trust1", "trust2", "trust3", "trust4"].forEach(function (k) { tr.appendChild(el("span", { text: "✓ " + T[k] })); });

    $("featuresTitle").textContent = T.featuresTitle; $("featuresSub").textContent = T.featuresSub;
    var fg = $("featuresGrid"); clear(fg);
    T.features.forEach(function (f) {
      fg.appendChild(el("div", { class: "card" }, [el("div", { class: "ic", text: f[0] }), el("h3", { text: f[1] }), el("p", { text: f[2] })]));
    });

    $("securityTitle").textContent = T.securityTitle;
    var sg = $("securityGrid"); clear(sg);
    T.securityItems.forEach(function (s) {
      sg.appendChild(el("div", { class: "card" }, [el("h3", { text: "🔒 " + s[0] }), el("p", { text: s[1] })]));
    });

    $("aiTitle").textContent = T.aiTitle; $("aiCard").textContent = T.aiCard; $("aiText").textContent = T.aiText;
    var al = $("aiList"); clear(al); T.aiItems.forEach(function (t) { al.appendChild(el("li", { text: t })); });

    $("pricingTitle").textContent = T.pricingTitle; $("pricingSub").textContent = T.pricingSub;
    var pc = $("priceCard"); clear(pc);
    var b = C.price.badge && C.price.badge[lang];
    if (b) pc.appendChild(el("div", { class: "badge", text: b }));
    var m = money(lang);
    var line = el("div", {}, []);
    if (m.old) line.appendChild(el("span", { class: "old", text: m.old }));
    line.appendChild(el("span", { class: "amount", text: m.now }));
    pc.appendChild(line);
    pc.appendChild(el("div", { class: "per", text: C.price.period === "year" ? T.priceYear : C.price.period === "month" ? T.priceMonth : T.priceOnce }));
    var ul = el("ul", {}, T.pricingList.map(function (t) { return el("li", { text: t }); }));
    pc.appendChild(ul);
    if (safe(C.links.buy)) pc.appendChild(el("a", { class: "btn", href: C.links.buy, text: T.ctaBuy, rel: "noopener" }));

    $("faqTitle").textContent = T.faqTitle;
    var fl = $("faqList"); clear(fl);
    T.faq.forEach(function (q) { fl.appendChild(el("details", {}, [el("summary", { text: q[0] }), el("p", { text: q[1] })])); });

    $("contactTitle").textContent = T.contactTitle; $("contactSub").textContent = T.contactSub;
    var rows = $("contactRows"); clear(rows);
    var k = C.contact;
    function row(label, text, href) {
      var v = href && safe(href) ? el("a", { href: href, text: text, rel: "noopener" }) : el("span", { text: text });
      rows.appendChild(el("div", { class: "crow" }, [el("span", { text: label }), v]));
    }
    if (k.email) row(T.cEmail, k.email, "mailto:" + k.email);
    if (k.phone) row(T.cPhone, k.phone, "tel:" + k.phone.replace(/[^+\d]/g, ""));
    if (k.whatsapp) row(T.cWhatsapp, "+" + k.whatsapp.replace(/\D/g, ""), "https://wa.me/" + k.whatsapp.replace(/\D/g, ""));
    if (k.telegram) row(T.cTelegram, "@" + k.telegram.replace(/^@/, ""), "https://t.me/" + k.telegram.replace(/^@/, ""));
    if (k.website) row(T.cWebsite, k.website.replace(/^https?:\/\//, ""), k.website);
    if (k.address && k.address[lang]) row(T.cAddress, k.address[lang]);

    $("formTitle").textContent = T.formTitle; $("fSend").textContent = T.fSend;
    $("fName").placeholder = T.fName; $("fEmail").placeholder = T.fEmail; $("fMsg").placeholder = T.fMsg;
    $("form").onsubmit = function (e) {
      e.preventDefault();
      if (!k.email) return;
      var body = $("fMsg").value + "\n\n— " + $("fName").value + " <" + $("fEmail").value + ">";
      location.href = "mailto:" + k.email + "?subject=" + encodeURIComponent(C.brand.name) + "&body=" + encodeURIComponent(body);
    };

    $("foot").textContent = "© " + new Date().getFullYear() + " " + C.brand.name + " — " + T.footer;
    var pv = $("privacy");
    if (safe(C.links.privacy)) { pv.hidden = false; pv.href = C.links.privacy; pv.textContent = " · " + T.privacy; } else pv.hidden = true;
  }

  render(getLang());
})();
