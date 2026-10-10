/* BLR Landing Pro — محرّر الأقسام مع معاينة حيّة (Vanilla JS). */
(function () {
  'use strict';
  var ED = window.BLRLP_ED, app = document.getElementById('blrlp-app'), out = document.getElementById('blrlp-data');
  if (!ED || !app || !out) return;

  var REG = ED.sections, S = ED.data;
  S.sections = S.sections || [];
  var tab = 'sections', open = {}, device = 'desktop', pvTimer = null, pvSeq = 0;

  /* ---------- أدوات ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function uid() { return 's' + Math.random().toString(16).slice(2, 10).padEnd(8, '0'); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function save() { out.value = JSON.stringify(S); schedulePreview(); }
  function defaultsOf(id) { var d = {}; Object.keys(REG[id].fields).forEach(function (k) { d[k] = clone(REG[id].fields[k].d); }); return d; }
  function post(action, data) {
    data = data || {}; data.action = action; data.nonce = ED.nonce;
    return fetch(ED.ajax, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(flat(data)).toString() })
      .then(function (r) { return r.json(); });
  }
  function flat(o) { var r = {}; Object.keys(o).forEach(function (k) { var v = o[k]; if (Array.isArray(v) && v.every(function (x) { return typeof x === 'string'; })) { v.forEach(function (x, i) { r[k + '[' + i + ']'] = x; }); } else { r[k] = typeof v === 'object' ? JSON.stringify(v) : v; } }); return r; }
  function toast(msg, bad) {
    var t = h('div', { class: 'blrlp-toast' + (bad ? ' is-bad' : ''), text: msg }); document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-on'); }, 10); setTimeout(function () { t.remove(); }, 3600);
  }
  function proGate() { toast('هذه الميزة ضمن Pro — فعّل الترخيص من الإعدادات.', true); }

  /* ---------- حقول ---------- */
  function fieldInput(def, val, onChange) {
    var t = def.t, el;
    if (t === 'textarea' || t === 'html') { el = h('textarea', { rows: t === 'html' ? 8 : 3 }); el.value = val == null ? '' : val; el.addEventListener('input', function () { onChange(el.value); }); return el; }
    if (t === 'select') { el = h('select', {}, Object.keys(def.o).map(function (k) { return h('option', { value: k, text: def.o[k] }); })); el.value = val; el.addEventListener('change', function () { onChange(el.value); }); return el; }
    if (t === 'toggle') { el = h('input', { type: 'checkbox' }); el.checked = !!val; el.addEventListener('change', function () { onChange(el.checked); }); return h('label', { class: 'blrlp-sw' }, [el, h('i')]); }
    if (t === 'number') { el = h('input', { type: 'number', step: 'any' }); el.value = val; el.addEventListener('input', function () { onChange(el.value === '' ? 0 : +el.value); }); return el; }
    if (t === 'color') { el = h('input', { type: 'color' }); el.value = val || '#2F5BFF'; el.addEventListener('input', function () { onChange(el.value); }); return el; }
    if (t === 'image') return imageField(val, onChange);
    if (t === 'repeater') return repeaterField(def, val, onChange);
    el = h('input', { type: t === 'url' ? 'url' : 'text', dir: t === 'url' ? 'ltr' : null });
    el.value = val == null ? '' : val; el.addEventListener('input', function () { onChange(el.value); }); return el;
  }
  function imageField(val, onChange) {
    var thumb = h('span', { class: 'blrlp-thumb' }), inp = h('input', { type: 'url', dir: 'ltr', placeholder: 'https://…' });
    inp.value = val || '';
    var paint = function () { thumb.style.backgroundImage = inp.value ? 'url("' + inp.value.replace(/"/g, '') + '")' : ''; };
    paint();
    inp.addEventListener('input', function () { paint(); onChange(inp.value); });
    var pick = h('button', { type: 'button', class: 'button', text: 'اختيار', onclick: function () {
      var f = wp.media({ title: 'اختر صورة', library: { type: 'image' }, multiple: false });
      f.on('select', function () { var a = f.state().get('selection').first().toJSON(); inp.value = a.url; paint(); onChange(a.url); });
      f.open();
    } });
    return h('div', { class: 'blrlp-img' }, [thumb, inp, pick]);
  }
  function repeaterField(def, rows, onChange) {
    rows = rows || [];
    var box = h('div', { class: 'blrlp-rep' });
    function draw() {
      box.innerHTML = '';
      rows.forEach(function (row, i) {
        var first = Object.keys(def.f).filter(function (k) { return ['text', 'textarea'].indexOf(def.f[k].t) > -1 && row[k]; })[0];
        var body = h('div', { class: 'blrlp-rep__body' });
        Object.keys(def.f).forEach(function (k) {
          body.appendChild(h(def.f[k].t === 'toggle' ? 'div' : 'label', { class: 'blrlp-fld' + (def.f[k].t === 'toggle' ? ' is-inline' : '') }, [h('span', { text: def.f[k].l }), fieldInput(def.f[k], row[k], function (v) { row[k] = v; onChange(rows); })]));
        });
        var isOpen = !!box['_o' + i];
        var head = h('div', { class: 'blrlp-rep__head' }, [
          h('span', { class: 'blrlp-rep__t', text: (i + 1) + '. ' + (first ? String(row[first]).slice(0, 38) : '…'), onclick: function () { box['_o' + i] = !box['_o' + i]; draw(); } }),
          h('button', { type: 'button', class: 'blrlp-ib', title: 'أعلى', text: '↑', onclick: function () { if (i) { rows.splice(i - 1, 0, rows.splice(i, 1)[0]); onChange(rows); draw(); } } }),
          h('button', { type: 'button', class: 'blrlp-ib', title: 'أسفل', text: '↓', onclick: function () { if (i < rows.length - 1) { rows.splice(i + 1, 0, rows.splice(i, 1)[0]); onChange(rows); draw(); } } }),
          h('button', { type: 'button', class: 'blrlp-ib is-del', title: 'حذف', text: '×', onclick: function () { rows.splice(i, 1); onChange(rows); draw(); } })
        ]);
        box.appendChild(h('div', { class: 'blrlp-rep__row' + (isOpen ? ' is-open' : '') }, [head, isOpen ? body : null]));
      });
      box.appendChild(h('button', { type: 'button', class: 'button blrlp-rep__add', text: '+ إضافة عنصر', onclick: function () {
        var r = {}; Object.keys(def.f).forEach(function (k) { r[k] = clone(def.f[k].d); });
        rows.push(r); box['_o' + (rows.length - 1)] = true; onChange(rows); draw();
      } }));
    }
    draw(); return box;
  }
  function labeled(def, val, onChange) {
    return h(def.t === 'toggle' ? 'div' : 'label', { class: 'blrlp-fld' + (def.t === 'toggle' ? ' is-inline' : '') }, [h('span', { text: def.l }), fieldInput(def, val, onChange)]);
  }

  /* ---------- لوحة الأقسام ---------- */
  var dragIdx = null;
  function sectionCard(sec, i) {
    var def = REG[sec.id], isOpen = !!open[sec.uid];
    var title = sec.data.title || sec.data.name || sec.data.badge || '';
    var head = h('div', { class: 'blrlp-sec__head', draggable: 'true' }, [
      h('span', { class: 'blrlp-grip', text: '⋮⋮', title: 'اسحب لإعادة الترتيب' }),
      h('span', { class: 'blrlp-sec__ic', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ED.icons && ED.icons[def.icon] || '') + '</svg>' }),
      h('span', { class: 'blrlp-sec__name', onclick: function () { open[sec.uid] = !open[sec.uid]; if (open[sec.uid]) scrollPreview(sec.uid); render(); } }, [h('b', { text: def.label }), h('small', { text: String(title).slice(0, 44) })]),
      h('label', { class: 'blrlp-sw', title: 'إظهار/إخفاء' }, [(function () { var c = h('input', { type: 'checkbox' }); c.checked = sec.on !== false; c.addEventListener('change', function () { sec.on = c.checked; save(); }); return c; })(), h('i')]),
      h('button', { type: 'button', class: 'blrlp-ib', title: 'نسخ', text: '⧉', onclick: function () { var c = clone(sec); c.uid = uid(); S.sections.splice(i + 1, 0, c); save(); render(); } }),
      h('button', { type: 'button', class: 'blrlp-ib', title: 'أعلى', text: '↑', onclick: function () { if (i) { S.sections.splice(i - 1, 0, S.sections.splice(i, 1)[0]); save(); render(); } } }),
      h('button', { type: 'button', class: 'blrlp-ib', title: 'أسفل', text: '↓', onclick: function () { if (i < S.sections.length - 1) { S.sections.splice(i + 1, 0, S.sections.splice(i, 1)[0]); save(); render(); } } }),
      h('button', { type: 'button', class: 'blrlp-ib is-del', title: 'حذف', text: '×', onclick: function () { if (confirm('حذف هذا القسم؟')) { S.sections.splice(i, 1); save(); render(); } } })
    ]);
    var card = h('div', { class: 'blrlp-sec' + (isOpen ? ' is-open' : '') + (sec.on === false ? ' is-off' : ''), 'data-i': i }, [head]);
    head.addEventListener('dragstart', function (e) { dragIdx = i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (er) {} card.classList.add('is-drag'); });
    head.addEventListener('dragend', function () { card.classList.remove('is-drag'); $all('.blrlp-sec').forEach(function (c) { c.classList.remove('is-over'); }); });
    card.addEventListener('dragover', function (e) { if (dragIdx === null) return; e.preventDefault(); card.classList.add('is-over'); });
    card.addEventListener('dragleave', function () { card.classList.remove('is-over'); });
    card.addEventListener('drop', function (e) { e.preventDefault(); if (dragIdx === null || dragIdx === i) return; S.sections.splice(i, 0, S.sections.splice(dragIdx, 1)[0]); dragIdx = null; save(); render(); });

    if (isOpen) {
      var body = h('div', { class: 'blrlp-sec__body' });
      Object.keys(def.fields).forEach(function (k) {
        body.appendChild(labeled(def.fields[k], sec.data[k], function (v) { sec.data[k] = v; save(); }));
      });
      // أسلوب القسم
      var st = sec.style = Object.assign({}, ED.styleDefaults, sec.style || {});
      var sty = h('details', { class: 'blrlp-adv' }, [h('summary', { text: 'أسلوب القسم' })]);
      [['bg', 'الخلفية', { default: 'افتراضي', alt: 'فاتح', accent: 'مميّز', dark: 'داكن' }], ['pad', 'المسافات', { s: 'صغيرة', m: 'متوسطة', l: 'كبيرة' }], ['align', 'المحاذاة', { auto: 'تلقائي', start: 'بداية', center: 'وسط' }], ['hide', 'إخفاء على', { '': 'لا شيء', mobile: 'الجوال', desktop: 'الحاسوب' }]].forEach(function (o) {
        sty.appendChild(labeled({ t: 'select', l: o[1], o: o[2], d: '' }, st[o[0]], function (v) { st[o[0]] = v; save(); }));
      });
      sty.appendChild(labeled({ t: 'text', l: 'المُعرّف (anchor) للروابط #', d: '' }, st.anchor, function (v) { st.anchor = v.replace(/[^A-Za-z0-9_-]/g, ''); save(); }));
      body.appendChild(sty);
      // ذكاء اصطناعي للقسم
      var ai = h('div', { class: 'blrlp-ai-row' }, [
        (function () { var s = h('select', {}, [['', '✨ حسّن الصياغة'], ['اجعله أكثر إقناعاً', 'أكثر إقناعاً'], ['اختصر النص', 'اختصر'], ['اجعله أكثر ودّية', 'أكثر ودّية'], ['Translate to English', 'ترجم للإنجليزية'], ['ترجم إلى العربية', 'ترجم للعربية']].map(function (o) { return h('option', { value: o[0], text: o[1] }); })); s.className = 'blrlp-ai-sel'; return s; })(),
        h('button', { type: 'button', class: 'button blrlp-ai-btn', text: 'نفّذ', onclick: function (e) {
          if (!ED.pro) return proGate();
          if (!ED.ai) return toast('أضف مفتاح API من الإعدادات.', true);
          var btn = e.currentTarget, sel = btn.previousSibling;
          btn.disabled = true; btn.textContent = '…';
          post('blrlp_ai_section', { section: sec.id, data: sec.data, instruction: sel.value, context: ctxText() }).then(function (r) {
            btn.disabled = false; btn.textContent = 'نفّذ';
            if (r.success) { sec.data = Object.assign(sec.data, r.data.data); save(); render(); toast('تم تحديث القسم ✓'); } else toast(r.data && r.data.message || 'خطأ', true);
          }).catch(function () { btn.disabled = false; btn.textContent = 'نفّذ'; toast('خطأ في الاتصال', true); });
        } })
      ]);
      body.appendChild(h('div', { class: 'blrlp-ai-box' }, [h('b', { text: '✨ الذكاء الاصطناعي ' + (ED.pro ? '' : '(Pro)') }), ai]));
      card.appendChild(body);
    }
    return card;
  }
  function $all(s) { return Array.prototype.slice.call(app.querySelectorAll(s)); }
  function ctxText() { var t = []; S.sections.slice(0, 4).forEach(function (s) { if (s.data.title) t.push(s.data.title); if (s.data.subtitle) t.push(s.data.subtitle); }); return t.join(' — ').slice(0, 500); }

  function picker() {
    var modal = h('div', { class: 'blrlp-modal' }, [h('div', { class: 'blrlp-modal__box' }, [
      h('div', { class: 'blrlp-modal__h' }, [h('b', { text: 'اختر قسماً' }), h('button', { type: 'button', class: 'blrlp-ib', text: '×', onclick: function () { modal.remove(); } })]),
      h('div', { class: 'blrlp-pick' }, Object.keys(REG).map(function (id) {
        return h('button', { type: 'button', onclick: function () {
          var sec = { uid: uid(), id: id, on: true, style: clone(ED.styleDefaults), data: defaultsOf(id) };
          S.sections.push(sec); open[sec.uid] = true; save(); modal.remove(); render();
        } }, [h('span', { html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ED.icons && ED.icons[REG[id].icon] || '') + '</svg>' }), REG[id].label]);
      }))
    ])]);
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  function sectionsPanel() {
    var wrap = h('div', { class: 'blrlp-pane' });
    if (!S.sections.length) wrap.appendChild(h('p', { class: 'blrlp-empty', text: 'لا توجد أقسام بعد. أضف قسماً أو ولّد الصفحة بالذكاء الاصطناعي.' }));
    S.sections.forEach(function (s, i) { if (REG[s.id]) wrap.appendChild(sectionCard(s, i)); });
    wrap.appendChild(h('button', { type: 'button', class: 'button button-primary blrlp-add', text: '+ إضافة قسم', onclick: picker }));
    return wrap;
  }

  /* ---------- التصميم ---------- */
  function designPanel() {
    var D = S.design, wrap = h('div', { class: 'blrlp-pane' });
    var pals = h('div', { class: 'blrlp-pals' }, Object.keys(ED.palettes).map(function (k) {
      var p = ED.palettes[k];
      return h('button', { type: 'button', class: D.preset === k ? 'is-on' : '', title: p.label, onclick: function () { D.preset = k; D.primary = ''; D.primary2 = ''; save(); render(); } }, [h('i', { style: 'background:linear-gradient(135deg,' + p.primary2 + ',' + p.primary + ')' }), p.label]);
    }));
    wrap.appendChild(h('div', { class: 'blrlp-fld' }, [h('span', { text: 'الألوان الجاهزة (أنماط BaderLR)' }), pals]));
    wrap.appendChild(labeled({ t: 'color', l: 'لون أساسي مخصّص', d: '' }, D.primary, function (v) { D.primary = v; save(); }));
    wrap.appendChild(labeled({ t: 'color', l: 'لون ثانوي مخصّص', d: '' }, D.primary2, function (v) { D.primary2 = v; save(); }));
    wrap.appendChild(h('button', { type: 'button', class: 'button', text: 'مسح الألوان المخصّصة', onclick: function () { D.primary = ''; D.primary2 = ''; save(); render(); } }));
    wrap.appendChild(labeled({ t: 'select', l: 'الوضع', o: { preset: 'حسب النمط', light: 'نهاري', dark: 'ليلي' }, d: 'preset' }, D.mode, function (v) { D.mode = v; save(); }));
    wrap.appendChild(labeled({ t: 'select', l: 'الخط', o: { elmessiri: 'المصيري (El Messiri)', system: 'خط النظام (الأسرع)' }, d: 'elmessiri' }, D.font, function (v) { D.font = v; save(); }));
    wrap.appendChild(labeled({ t: 'number', l: 'استدارة الزوايا (0–36)', d: 18 }, D.radius, function (v) { D.radius = v; save(); }));
    wrap.appendChild(labeled({ t: 'toggle', l: 'حركات الظهور', d: true }, D.anim, function (v) { D.anim = v; save(); }));
    function group(title, key, fields) {
      var g = D[key] = Object.assign({ on: false }, D[key] || {});
      var d = h('details', { class: 'blrlp-adv', open: g.on ? '' : null }, [h('summary', { text: title })]);
      d.appendChild(labeled({ t: 'toggle', l: 'تفعيل', d: false }, g.on, function (v) { g.on = v; save(); }));
      fields.forEach(function (f) { d.appendChild(labeled({ t: f[2] || 'text', l: f[1], d: '' }, g[f[0]], function (v) { g[f[0]] = v; save(); })); });
      wrap.appendChild(d);
    }
    group('شريط إعلان علوي', 'announce', [['text', 'النص'], ['url', 'الرابط', 'url']]);
    group('شريط CTA ثابت عند التمرير', 'sticky', [['text', 'النص'], ['btn', 'نص الزر'], ['url', 'الرابط', 'url']]);
    group('نافذة نية الخروج (Exit-intent)', 'exit', [['title', 'العنوان'], ['text', 'النص', 'textarea'], ['btn', 'نص الزر'], ['url', 'الرابط', 'url']]);
    wrap.appendChild(labeled({ t: 'text', l: 'رقم واتساب العائم (دولي بدون +)', d: '' }, D.wa, function (v) { D.wa = v.replace(/\D/g, ''); save(); }));
    return wrap;
  }

  /* ---------- SEO والإعدادات ---------- */
  function seoPanel() {
    var wrap = h('div', { class: 'blrlp-pane' }), se = S.seo = Object.assign({ title: '', desc: '', og: '', noindex: false }, S.seo || {}), st = S.settings = Object.assign({ notify: '', webhook: '', redirect: '', ab_partner: 0 }, S.settings || {});
    var t = labeled({ t: 'text', l: 'عنوان SEO (≤ 60)', d: '' }, se.title, function (v) { se.title = v; save(); });
    var d = labeled({ t: 'textarea', l: 'وصف SEO (≤ 155)', d: '' }, se.desc, function (v) { se.desc = v; save(); });
    wrap.appendChild(t); wrap.appendChild(d);
    wrap.appendChild(h('button', { type: 'button', class: 'button', text: '✨ اقترح العنوان والوصف' + (ED.pro ? '' : ' (Pro)'), onclick: function (e) {
      if (!ED.pro) return proGate();
      var b = e.currentTarget; b.disabled = true;
      post('blrlp_ai_seo', { context: ctxText() + ' ' + S.sections.map(function (s) { return s.data.text || s.data.subtitle || ''; }).join(' ').slice(0, 1500) }).then(function (r) {
        b.disabled = false;
        if (r.success) { se.title = r.data.title; se.desc = r.data.desc; save(); render(); toast('تم ✓'); } else toast(r.data && r.data.message || 'خطأ', true);
      }).catch(function () { b.disabled = false; });
    } }));
    wrap.appendChild(labeled({ t: 'image', l: 'صورة المشاركة (OG)', d: '' }, se.og, function (v) { se.og = v; save(); }));
    wrap.appendChild(labeled({ t: 'toggle', l: 'منع الأرشفة (noindex)', d: false }, se.noindex, function (v) { se.noindex = v; save(); }));
    wrap.appendChild(h('hr'));
    wrap.appendChild(labeled({ t: 'text', l: 'بريد إشعار العملاء لهذه الصفحة', d: '' }, st.notify, function (v) { st.notify = v; save(); }));
    wrap.appendChild(labeled({ t: 'url', l: 'رابط التحويل بعد الإرسال (اختياري)', d: '' }, st.redirect, function (v) { st.redirect = v; save(); }));
    var wh = labeled({ t: 'url', l: 'Webhook (https) — Pro', d: '' }, st.webhook, function (v) { if (!ED.pro) { proGate(); return; } st.webhook = v; save(); });
    wrap.appendChild(wh);
    var ab = h('select', {}, [h('option', { value: 0, text: '— بدون اختبار —' })].concat(ED.landings.map(function (l) { return h('option', { value: l.id, text: l.title }); })));
    ab.value = st.ab_partner || 0;
    ab.addEventListener('change', function () { if (!ED.pro) { ab.value = 0; return proGate(); } st.ab_partner = +ab.value; save(); });
    wrap.appendChild(h('label', { class: 'blrlp-fld' }, [h('span', { text: 'اختبار A/B مع صفحة أخرى — Pro' }), ab, h('small', { text: 'يُوزَّع الزوار عشوائياً بين الصفحتين ويُثبَّت اختيار كل زائر. قارن التحويل من لوحة التحكم. (قد تتعارض كاشات الصفحات الكاملة مع التوجيه.)' })]));
    return wrap;
  }

  /* ---------- الذكاء الاصطناعي ---------- */
  function aiPanel() {
    var wrap = h('div', { class: 'blrlp-pane' });
    if (!ED.pro) {
      wrap.appendChild(h('div', { class: 'blrlp-lock' }, [h('b', { text: '✨ مولّد الصفحات بالذكاء الاصطناعي — Pro' }), h('p', { text: 'اكتب وصف عملك فتُنشأ صفحة هبوط كاملة بنصوص إعلانية: بطل، مزايا، أسعار، أسئلة وآراء — مع عناوين بديلة وإعادة كتابة لكل قسم.' }), h('a', { class: 'button button-primary', href: ED.settingsUrl, text: 'تفعيل الترخيص' })]));
      return wrap;
    }
    if (!ED.ai) wrap.appendChild(h('div', { class: 'notice notice-warning inline' }, [h('p', {}, [h('span', { text: 'لم يُضبط مفتاح API. ' }), h('a', { href: ED.settingsUrl, text: 'أضفه من الإعدادات' })])]));
    var brief = h('textarea', { rows: 5, placeholder: 'مثال: متجر عطور عربية فاخرة، شحن لكل الخليج، دفع عند الاستلام، أسعار من 99 ريال، نريد زيادة الطلبات.' });
    var tone = h('select', {}, ['احترافية', 'ودّية', 'تسويقية حماسية', 'فخمة', 'بسيطة ومباشرة'].map(function (x) { return h('option', { value: x, text: x }); }));
    var goal = h('select', {}, ['مبيعات', 'جمع عملاء محتملين', 'تسجيل في حدث', 'تحميل تطبيق/ملف', 'حجز استشارة'].map(function (x) { return h('option', { value: x, text: x }); }));
    var lang = h('select', {}, ['العربية', 'English', 'Français'].map(function (x) { return h('option', { value: x, text: x }); }));
    var chosen = { hero: 1, logos: 1, features: 1, steps: 1, stats: 1, pricing: 1, testimonials: 1, faq: 1, form: 1, cta: 1 };
    var chk = h('div', { class: 'blrlp-chk' }, Object.keys(REG).map(function (id) {
      var c = h('input', { type: 'checkbox' }); c.checked = !!chosen[id];
      c.addEventListener('change', function () { chosen[id] = c.checked ? 1 : 0; });
      return h('label', {}, [c, REG[id].label]);
    }));
    wrap.appendChild(h('label', { class: 'blrlp-fld' }, [h('span', { text: 'صف منتجك أو خدمتك وجمهورك' }), brief]));
    wrap.appendChild(h('div', { class: 'blrlp-row3' }, [h('label', { class: 'blrlp-fld' }, [h('span', { text: 'النبرة' }), tone]), h('label', { class: 'blrlp-fld' }, [h('span', { text: 'الهدف' }), goal]), h('label', { class: 'blrlp-fld' }, [h('span', { text: 'اللغة' }), lang])]));
    wrap.appendChild(h('div', { class: 'blrlp-fld' }, [h('span', { text: 'الأقسام المطلوبة' }), chk]));
    var msg = h('p', { class: 'description' });
    wrap.appendChild(h('button', { type: 'button', class: 'button button-primary button-hero blrlp-gen', text: '✨ ولّد صفحة كاملة', onclick: function (e) {
      if (S.sections.length && !confirm('سيستبدل التوليد الأقسام الحالية. متابعة؟')) return;
      var b = e.currentTarget; b.disabled = true; msg.textContent = 'جارٍ التوليد… قد يستغرق حتى دقيقة.';
      post('blrlp_ai_generate', { brief: brief.value, tone: tone.value, goal: goal.value, lang: lang.value, sections: Object.keys(chosen).filter(function (k) { return chosen[k]; }) }).then(function (r) {
        b.disabled = false;
        if (r.success) {
          S.sections = r.data.sections; open = {};
          if (r.data.seo) { S.seo.title = S.seo.title || r.data.seo.title; S.seo.desc = S.seo.desc || r.data.seo.desc; }
          save(); tab = 'sections'; render(); toast('تم توليد الصفحة ✓ — راجعها ثم اضغط «تحديث».');
        } else { msg.textContent = r.data && r.data.message || 'خطأ'; }
      }).catch(function () { b.disabled = false; msg.textContent = 'خطأ في الاتصال'; });
    } }));
    wrap.appendChild(msg);
    wrap.appendChild(h('hr'));
    // عناوين بديلة للهيرو
    var hl = h('div', { class: 'blrlp-hl' });
    wrap.appendChild(h('button', { type: 'button', class: 'button', text: '💡 اقترح عناوين بديلة للبطل', onclick: function (e) {
      var hero = S.sections.filter(function (s) { return s.id === 'hero'; })[0];
      if (!hero) return toast('أضف قسم البطل أولاً.', true);
      var b = e.currentTarget; b.disabled = true;
      post('blrlp_ai_headlines', { current: hero.data.title, context: ctxText() }).then(function (r) {
        b.disabled = false; hl.innerHTML = '';
        if (!r.success) return toast(r.data && r.data.message || 'خطأ', true);
        r.data.headlines.forEach(function (x) { hl.appendChild(h('button', { type: 'button', class: 'blrlp-hlbtn', text: x, onclick: function () { hero.data.title = x; save(); render(); toast('طُبّق العنوان ✓'); } })); });
      }).catch(function () { b.disabled = false; });
    } }));
    wrap.appendChild(hl);
    return wrap;
  }

  /* ---------- المعاينة ---------- */
  var frame, frameWrap;
  function schedulePreview() { clearTimeout(pvTimer); pvTimer = setTimeout(refreshPreview, 650); }
  function refreshPreview() {
    if (!frame) return;
    var seq = ++pvSeq, y = 0;
    try { y = frame.contentWindow.scrollY || 0; } catch (e) {}
    post('blrlp_preview', { id: ED.postId, data: S }).then(function (r) {
      if (seq !== pvSeq || !r.success) return;
      frame.onload = function () { try { frame.contentWindow.scrollTo(0, y); } catch (e) {} };
      frame.srcdoc = r.data.html;
    });
  }
  function scrollPreview(u) { try { frame.contentWindow.postMessage({ type: 'blrlp-scroll', uid: u }, '*'); } catch (e) {} }

  /* ---------- الهيكل ---------- */
  var paneHost, tabsEl;
  function render() {
    paneHost.innerHTML = '';
    var p = tab === 'sections' ? sectionsPanel() : tab === 'design' ? designPanel() : tab === 'seo' ? seoPanel() : aiPanel();
    paneHost.appendChild(p);
    $all('.blrlp-tabs button').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-t') === tab); });
  }
  function build() {
    app.innerHTML = '';
    tabsEl = h('div', { class: 'blrlp-tabs' }, [['sections', 'الأقسام'], ['design', 'التصميم'], ['seo', 'SEO والإعدادات'], ['ai', '✨ الذكاء الاصطناعي']].map(function (t) {
      return h('button', { type: 'button', 'data-t': t[0], text: t[1], onclick: function () { tab = t[0]; render(); } });
    }));
    paneHost = h('div', { class: 'blrlp-panes' });
    var left = h('div', { class: 'blrlp-left' }, [tabsEl, paneHost]);
    frame = h('iframe', { class: 'blrlp-frame', title: 'preview', sandbox: 'allow-scripts allow-same-origin allow-popups' });
    frameWrap = h('div', { class: 'blrlp-frame-wrap is-desktop' }, [frame]);
    var devs = h('div', { class: 'blrlp-dev' }, [['desktop', '🖥'], ['tablet', '▭'], ['mobile', '📱']].map(function (d) {
      return h('button', { type: 'button', title: d[0], class: d[0] === device ? 'is-on' : '', text: d[1], onclick: function (e) {
        device = d[0]; frameWrap.className = 'blrlp-frame-wrap is-' + device;
        $all('.blrlp-dev button').forEach(function (b) { b.classList.remove('is-on'); }); e.currentTarget.classList.add('is-on');
      } });
    }));
    var right = h('div', { class: 'blrlp-right' }, [h('div', { class: 'blrlp-pvbar' }, [h('b', { text: 'معاينة حيّة' }), devs, h('button', { type: 'button', class: 'button', text: '↻', title: 'تحديث', onclick: refreshPreview })]), frameWrap]);
    app.appendChild(h('div', { class: 'blrlp-shell' }, [left, right]));
    render(); save();
  }
  build();

  // قبل إرسال النموذج نضمن مزامنة البيانات.
  var form = document.getElementById('post');
  if (form) form.addEventListener('submit', function () { out.value = JSON.stringify(S); });
})();
