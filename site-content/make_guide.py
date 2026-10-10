#!/usr/bin/env python3
# يحوّل GUIDE.md إلى GUIDE.html (محوّل بسيط بلا اعتمادات)
import re, html, os
R = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(R, 'GUIDE.md'), encoding='utf-8').read().split('\n')
def inl(t):
    t = html.escape(t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    return t
out = []; i = 0; ul = False; ol = False
def close():
    global ul, ol
    if ul: out.append('</ul>'); ul = False
    if ol: out.append('</ol>'); ol = False
while i < len(src):
    l = src[i]
    if l.startswith('|') and i + 1 < len(src) and re.match(r'^\|[-| ]+\|$', src[i + 1]):
        close()
        def cells(x):
            x = x.strip().strip('|'); return [c.strip().replace('\\|', '|') for c in re.split(r'(?<!\\)\|', x)]
        out.append('<div class="tw"><table><thead><tr>' + ''.join(f'<th>{inl(c)}</th>' for c in cells(l)) + '</tr></thead><tbody>')
        i += 2
        while i < len(src) and src[i].startswith('|'):
            out.append('<tr>' + ''.join(f'<td>{inl(c)}</td>' for c in cells(src[i])) + '</tr>'); i += 1
        out.append('</tbody></table></div>'); continue
    m = re.match(r'^(#{1,3}) (.*)', l)
    if m:
        close(); n = len(m.group(1)); out.append(f'<h{n} id="s{i}">{inl(m.group(2))}</h{n}>')
    elif re.match(r'^\s*- \[ \] ', l):
        if not ul: close(); out.append('<ul class="chk">'); ul = True
        out.append('<li><input type="checkbox"> ' + inl(re.sub(r'^\s*- \[ \] ', '', l)) + '</li>')
    elif re.match(r'^\s*- ', l):
        if not ul: close(); out.append('<ul>'); ul = True
        out.append('<li>' + inl(re.sub(r'^\s*- ', '', l)) + '</li>')
    elif re.match(r'^\d+\. ', l):
        if not ol: close(); out.append('<ol>'); ol = True
        out.append('<li>' + inl(re.sub(r'^\d+\. ', '', l)) + '</li>')
    elif l.startswith('> '):
        close(); out.append('<blockquote>' + inl(l[2:]) + '</blockquote>')
    elif l.strip() == '':
        close()
    else:
        close(); out.append('<p>' + inl(l) + '</p>')
    i += 1
close()
page = '''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>دليل بناء موقع Baderinfo</title>
<style>:root{--a:#2F5BFF;--b:#22C3F0;--ink:#0f1b3d;--mut:#5b6785;--line:#e3e8f3}body{margin:0;background:#f5f7fb;color:var(--ink);font:17px/1.9 'El Messiri','Segoe UI',Tahoma,sans-serif}
main{max-width:920px;margin:0 auto;padding:24px 16px 60px}h1{background:linear-gradient(135deg,#0f1b3d,#1d3a9e 55%,var(--a));color:#fff;padding:26px;border-radius:20px;font-size:28px}
h2{margin-top:38px;padding-inline-start:14px;border-inline-start:5px solid var(--a);font-size:24px}h3{font-size:19px;color:var(--a)}
code{background:#eaf0ff;border-radius:6px;padding:1px 7px;direction:ltr;unicode-bidi:embed;font-size:.9em}blockquote{margin:14px 0;background:#fff;border:1px dashed #9db4ff;border-radius:12px;padding:10px 16px;color:var(--mut)}
.tw{overflow:auto;margin:14px 0}table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden;font-size:15px}th,td{border:1px solid var(--line);padding:8px 12px;text-align:start;vertical-align:top}th{background:#eef2ff}
ul.chk{list-style:none;padding:0}li{margin:4px 0}</style></head><body><main>
''' + '\n'.join(out) + '\n</main></body></html>'
open(os.path.join(R, 'GUIDE.html'), 'w', encoding='utf-8').write(page)
print('GUIDE.html', len(page))
