/* Baderinfo Service Requests — نموذج الطلب والاتصال */
(function () {
  'use strict';
  var B = window.BISR;
  if (!B) return;
  var catalogP = null;
  function getCatalog() {
    if (!catalogP) catalogP = fetch(B.catalog).then(function (r) { return r.json(); });
    return catalogP;
  }
  function getToken() {
    return fetch(B.rest + 'token', { cache: 'no-store' }).then(function (r) { return r.json(); });
  }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var uid = 0;

  function fieldEl(f, lang, S, vals) {
    var id = 'bi-f-' + (++uid);
    var wrap = h('div', { class: 'bi-field', 'data-k': f.k });
    var lab = h('label', { for: id }, [f.l[lang] + (f.r ? ' ' : ''), f.r ? h('span', { class: 'req', text: '*' }) : null]);
    var inp;
    if (f.t === 'checkbox') {
      lab = h('span', { class: 'bi-lab' }, [f.l[lang]]);
      inp = h('div', { class: 'bi-checks' });
      (f.o || []).forEach(function (o, i) {
        var c = h('input', { type: 'checkbox', value: o.v, name: f.k });
        if ((vals[f.k] || []).indexOf(o.v) > -1) c.checked = true;
        c.addEventListener('change', function () { vals[f.k] = Array.prototype.map.call(inp.querySelectorAll('input:checked'), function (x) { return x.value; }); });
        inp.appendChild(h('label', {}, [c, o.l[lang]]));
      });
    } else if (f.t === 'select') {
      inp = h('select', { id: id, name: f.k }, [h('option', { value: '', text: S.sel })]);
      (f.o || []).forEach(function (o) { var op = h('option', { value: o.v, text: o.l[lang] }); if (vals[f.k] === o.v) op.selected = true; inp.appendChild(op); });
      inp.addEventListener('change', function () { vals[f.k] = inp.value; });
    } else if (f.t === 'textarea') {
      inp = h('textarea', { id: id, name: f.k, placeholder: f.ph ? f.ph[lang] : false });
      inp.value = vals[f.k] || '';
      inp.addEventListener('input', function () { vals[f.k] = inp.value; });
    } else {
      inp = h('input', { id: id, name: f.k, type: f.t === 'text' ? 'text' : f.t, placeholder: f.ph ? f.ph[lang] : false, dir: (f.t === 'email' || f.t === 'tel' || f.t === 'url') ? 'ltr' : false });
      inp.value = vals[f.k] || '';
      inp.addEventListener('input', function () { vals[f.k] = inp.value; });
    }
    wrap.appendChild(lab); wrap.appendChild(inp);
    return wrap;
  }

  function fieldset(title, defs, lang, S, vals, cls) {
    var fs = h('fieldset', { class: cls || '' }, [h('legend', { text: title })]);
    var row = h('div', { class: 'bi-row' });
    defs.forEach(function (f) {
      var el = fieldEl(f, lang, S, vals);
      if (f.t === 'textarea' || f.t === 'checkbox') { fs.appendChild(row.childNodes.length ? row : document.createTextNode('')); row = h('div', { class: 'bi-row' }); fs.appendChild(el); }
      else row.appendChild(el);
    });
    if (row.childNodes.length) fs.appendChild(row);
    return fs;
  }

  function mark(form, bad) {
    form.querySelectorAll('.bi-field').forEach(function (f) {
      var on = bad.indexOf(f.getAttribute('data-k')) > -1;
      f.style.outline = on ? '2px solid #d63638' : ''; f.style.borderRadius = on ? '10px' : '';
    });
  }

  function post(form, S, lang, payload, okFn) {
    var btn = form.querySelector('button[type=submit]');
    var msg = form.querySelector('.bi-msg');
    if (!msg) { msg = h('div', { class: 'bi-msg', role: 'status' }); form.appendChild(msg); }
    msg.className = 'bi-msg'; msg.textContent = '';
    btn.disabled = true; var old = btn.textContent; btn.textContent = S.sending;
    getToken().then(function (t) {
      payload.ts = t.ts; payload.sig = t.sig; payload.lang = lang;
      var hp = form.querySelector('.bi-hp input'); payload.hp = hp ? hp.value : '';
      return fetch(B.rest + 'submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (o) {
        btn.disabled = false; btn.textContent = old;
        if (o.j && o.j.ok) { okFn(o.j, msg); return; }
        mark(form, (o.j && o.j.fields) || []);
        msg.className = 'bi-msg err'; msg.textContent = (o.j && o.j.message) || S.err;
      }).catch(function () { btn.disabled = false; btn.textContent = old; msg.className = 'bi-msg err'; msg.textContent = S.err; });
  }

  function validate(form, defs, vals, lang, S) {
    var bad = [];
    defs.forEach(function (f) {
      var v = vals[f.k];
      var empty = f.t === 'checkbox' ? !(v && v.length) : !(v && String(v).trim());
      if (f.r && empty) bad.push(f.k);
      if (f.t === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) bad.push(f.k);
    });
    mark(form, bad);
    return bad;
  }

  function honeypot() { return h('div', { class: 'bi-hp', 'aria-hidden': 'true' }, [h('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off' })]); }

  /* ---------- نموذج طلب خدمة ---------- */
  function initRequest(form, cat) {
    var lang = form.getAttribute('data-lang') || 'ar', S = B.strings[lang];
    var qs = new URLSearchParams(location.search);
    var wantSvc = qs.get('service') || '', wantGrp = qs.get('group') || '';
    var vals = {}, svc = null;
    form.innerHTML = '';
    var pick = h('select', { id: 'bi-svc', name: 'service' }, [h('option', { value: '', text: S.pick })]);
    cat.groups.forEach(function (g) {
      if (wantGrp && g.id !== wantGrp) return;
      var og = h('optgroup', { label: g.icon + ' ' + g.n[lang] });
      g.services.forEach(function (s) { og.appendChild(h('option', { value: s.id, text: s.n[lang] })); });
      pick.appendChild(og);
    });
    var head = h('fieldset', {}, [h('legend', { text: S.choose }), h('div', { class: 'bi-field' }, [pick])]);
    var info = h('div', { class: 'bi-svc-info', hidden: true });
    var dyn = h('div', { class: 'bi-dyn' });
    form.appendChild(head); form.appendChild(info); form.appendChild(dyn);

    function findSvc(id) { var r = null; cat.groups.forEach(function (g) { g.services.forEach(function (s) { if (s.id === id) r = s; }); }); return r; }
    function render() {
      dyn.innerHTML = ''; info.hidden = !svc;
      if (!svc) return;
      info.textContent = S.selected + ': ' + svc.n[lang];
      var defs = cat.common.concat(cat.fields[svc.f] || [], cat.foot);
      dyn.appendChild(fieldset(S.your, cat.common, lang, S, vals));
      dyn.appendChild(fieldset(S.svc, cat.fields[svc.f] || [], lang, S, vals));
      dyn.appendChild(fieldset(S.proj, cat.foot, lang, S, vals));
      dyn.appendChild(honeypot());
      dyn.appendChild(h('button', { type: 'submit', class: 'bi-btn', text: S.send }));
      form._defs = defs;
    }
    pick.addEventListener('change', function () {
      svc = findSvc(pick.value); render();
      try { var u = new URL(location.href); if (svc) u.searchParams.set('service', svc.id); else u.searchParams.delete('service'); history.replaceState(null, '', u); } catch (e) {}
    });
    if (wantSvc && findSvc(wantSvc)) { pick.value = wantSvc; svc = findSvc(wantSvc); render(); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!svc) { pick.focus(); return; }
      var bad = validate(form, form._defs, vals, lang, S);
      var msg = form.querySelector('.bi-msg');
      if (bad.length) { if (!msg) { msg = h('div', { class: 'bi-msg err' }); form.appendChild(msg); } msg.className = 'bi-msg err'; msg.textContent = S.fix; var first = form.querySelector('[data-k="' + bad[0] + '"]'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      post(form, S, lang, { kind: 'request', service: svc.id, fields: vals }, function (j, m) {
        form.innerHTML = ''; form.appendChild(h('div', { class: 'bi-msg ok' }, [S.ok + '#' + j.ref + ' — ' + S.ok2]));
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- نموذج الاتصال ---------- */
  function initContact(form) {
    var lang = form.getAttribute('data-lang') || 'ar', S = B.strings[lang], vals = {};
    var defs = [
      { k: 'name', t: 'text', r: 1, l: (function (o) { o[lang] = S.c_name; return o; })({}) },
      { k: 'email', t: 'email', r: 1, l: (function (o) { o[lang] = S.c_email; return o; })({}) },
      { k: 'phone', t: 'tel', l: (function (o) { o[lang] = S.c_phone; return o; })({}) },
      { k: 'subject', t: 'text', l: (function (o) { o[lang] = S.c_subject; return o; })({}) },
      { k: 'details', t: 'textarea', r: 1, l: (function (o) { o[lang] = S.c_msg; return o; })({}) }
    ];
    form.innerHTML = '';
    var fs = h('fieldset'); var row = h('div', { class: 'bi-row' });
    row.appendChild(fieldEl(defs[0], lang, S, vals)); row.appendChild(fieldEl(defs[1], lang, S, vals)); fs.appendChild(row);
    var row2 = h('div', { class: 'bi-row' }); row2.appendChild(fieldEl(defs[2], lang, S, vals)); row2.appendChild(fieldEl(defs[3], lang, S, vals)); fs.appendChild(row2);
    fs.appendChild(fieldEl(defs[4], lang, S, vals));
    form.appendChild(fs); form.appendChild(honeypot());
    form.appendChild(h('button', { type: 'submit', class: 'bi-btn', text: S.c_send }));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate(form, defs, vals, lang, S);
      if (bad.length) { var m = form.querySelector('.bi-msg'); if (!m) { m = h('div', { class: 'bi-msg err' }); form.appendChild(m); } m.className = 'bi-msg err'; m.textContent = S.fix; return; }
      post(form, S, lang, { kind: 'contact', fields: vals }, function () {
        form.innerHTML = ''; form.appendChild(h('div', { class: 'bi-msg ok', text: S.c_ok }));
      });
    });
  }

  function boot() {
    var forms = document.querySelectorAll('form[data-bisr]');
    if (!forms.length) return;
    getCatalog().then(function (cat) {
      forms.forEach(function (f) { if (f.getAttribute('data-bisr') === 'request') initRequest(f, cat); else initContact(f); });
    }).catch(function () { forms.forEach(function (f) { f.textContent = 'Error loading form.'; }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
