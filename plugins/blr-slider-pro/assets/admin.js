/* BLR Slider Pro — slides repeater. */
(function () {
  'use strict';
  var data = document.getElementById('blrs-data'), list = document.getElementById('blrs-list'), add = document.getElementById('blrs-add');
  if (!data) return;
  var slides = [];
  try { slides = JSON.parse(data.value) || []; } catch (e) {}
  var thumbs = {};

  function save() { data.value = JSON.stringify(slides); }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function field(i, k, label, type, extra) {
    return '<div' + (extra === 'full' ? ' class="blrs-full"' : '') + '><label>' + label + '<input type="' + (type || 'text') + '" data-i="' + i + '" data-k="' + k + '" value="' + esc(slides[i][k]) + '"></label></div>';
  }
  function pick(i, k, label) {
    var id = slides[i][k] || 0;
    return '<div><label>' + label + '</label><div class="blrs-pick"><img data-thumb="' + i + k + '" src="' + esc(thumbs[id] || '') + '" alt=""><button type="button" class="button" data-pick="' + i + ':' + k + '">اختيار</button><button type="button" class="button-link" data-unpick="' + i + ':' + k + '">إزالة</button></div></div>';
  }

  function draw() {
    list.innerHTML = '';
    slides.forEach(function (s, i) {
      var h = '<div class="blrs-row"><header><strong>شريحة ' + (i + 1) + (s.title ? ' — ' + esc(s.title) : '') + '</strong>' +
        '<button type="button" class="button" data-mv="' + i + ':-1">↑</button><button type="button" class="button" data-mv="' + i + ':1">↓</button>' +
        '<button type="button" class="button-link-delete" data-del="' + i + '">حذف</button></header><div class="blrs-body">' +
        pick(i, 'img', 'صورة الحاسوب') + pick(i, 'mimg', 'صورة الجوال (اختياري)') +
        field(i, 'video', 'فيديو MP4 (يستبدل الصورة)', 'url', 'full') +
        field(i, 'badge', 'شارة') + field(i, 'title', 'العنوان') +
        '<div class="blrs-full"><label>النص<textarea rows="2" data-i="' + i + '" data-k="text">' + esc(s.text) + '</textarea></label></div>' +
        field(i, 'b1', 'زر 1 — نص') + field(i, 'u1', 'زر 1 — رابط', 'url') +
        field(i, 'b2', 'زر 2 — نص') + field(i, 'u2', 'زر 2 — رابط', 'url') +
        '<div><label>المحاذاة<select data-i="' + i + '" data-k="align"><option value="start"' + (s.align === 'start' ? ' selected' : '') + '>بداية</option><option value="center"' + (s.align === 'center' ? ' selected' : '') + '>وسط</option><option value="end"' + (s.align === 'end' ? ' selected' : '') + '>نهاية</option></select></label></div>' +
        field(i, 'overlay', 'عتامة الطبقة (0-90)', 'number') +
        field(i, 'end', 'عدّاد تنازلي حتى (YYYY-MM-DD HH:MM)') +
        '<div><label><input type="checkbox" data-i="' + i + '" data-k="dark"' + (s.dark ? ' checked' : '') + '> نص داكن على خلفية فاتحة</label></div>' +
        '</div></div>';
      list.appendChild(el(h));
    });
    save();
  }

  function normalize(s) { return Object.assign({ img: 0, mimg: 0, video: '', badge: '', title: '', text: '', b1: '', u1: '', b2: '', u2: '', align: 'start', overlay: 35, dark: 0, end: '' }, s); }
  slides = slides.map(normalize);

  // Load thumbnails for existing attachments.
  slides.forEach(function (s) { ['img', 'mimg'].forEach(function (k) { if (s[k] && wp.media) { wp.media.attachment(s[k]).fetch().then(function () { var a = wp.media.attachment(s[k]).attributes; thumbs[s[k]] = (a.sizes && a.sizes.thumbnail ? a.sizes.thumbnail.url : a.url); draw(); }); } }); });

  add.addEventListener('click', function () { slides.push(normalize({})); draw(); });

  list.addEventListener('input', function (e) {
    var t = e.target, i = t.dataset.i, k = t.dataset.k;
    if (i == null) return;
    slides[i][k] = t.type === 'checkbox' ? (t.checked ? 1 : 0) : (t.type === 'number' ? +t.value : t.value);
    save();
  });
  list.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT') { var t = e.target; slides[t.dataset.i][t.dataset.k] = t.value; save(); } });

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.del != null) { if (confirm('حذف الشريحة؟')) { slides.splice(+b.dataset.del, 1); draw(); } }
    else if (b.dataset.mv) { var p = b.dataset.mv.split(':'), i = +p[0], j = i + +p[1]; if (j >= 0 && j < slides.length) { var t = slides[i]; slides[i] = slides[j]; slides[j] = t; draw(); } }
    else if (b.dataset.unpick) { var q = b.dataset.unpick.split(':'); slides[+q[0]][q[1]] = 0; draw(); }
    else if (b.dataset.pick) {
      var r = b.dataset.pick.split(':'), idx = +r[0], key = r[1];
      var frame = wp.media({ title: 'اختر صورة', library: { type: 'image' }, multiple: false });
      frame.on('select', function () {
        var a = frame.state().get('selection').first().toJSON();
        slides[idx][key] = a.id; thumbs[a.id] = (a.sizes && a.sizes.thumbnail ? a.sizes.thumbnail.url : a.url); draw();
      });
      frame.open();
    }
  });
  draw();
})();
