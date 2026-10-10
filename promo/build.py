# -*- coding: utf-8 -*-
"""يولّد الصفحات الإعلانية: promo/<product>/<lang>.html + فهرس لكل لغة. التشغيل: python3 build.py"""
import html, os
from content import LANGS, UI, PRODUCTS

E = html.escape
FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap">'

CSS = """
:root{--p:#2F5BFF;--p2:#22C3F0;--ink:#0B1220;--body:#39465C;--mut:#6B7A92;--line:#E3E9F4;--bg:#fff;--bg2:#F4F7FD;--card:#fff;--g:linear-gradient(135deg,#22C3F0,#2F5BFF)}
@media(prefers-color-scheme:dark){:root{--ink:#EAF0FB;--body:#C3CFE2;--mut:#93A1BA;--line:#223049;--bg:#0B1220;--bg2:#0F1829;--card:#121D31}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font:400 17px/1.8 'El Messiri',system-ui,'Segoe UI',Tahoma,sans-serif;color:var(--body);background:var(--bg)}
a{color:var(--p)}.w{max-width:1160px;margin-inline:auto;padding-inline:22px}
h1,h2,h3{color:var(--ink);line-height:1.2;margin:0 0 .5em}h1{font-size:clamp(2.2rem,1.4rem+3.6vw,4rem)}h2{font-size:clamp(1.7rem,1.2rem+2vw,2.6rem);text-align:center}
nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
nav .w{display:flex;align-items:center;gap:18px;min-height:66px}nav b{font-size:1.25rem;color:var(--ink);flex:1;display:flex;align-items:center;gap:10px}nav a{color:var(--ink);text-decoration:none;font-weight:600}
.mk{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--g);color:#fff;font-weight:800}
.lang{display:flex;gap:4px;border:1px solid var(--line);border-radius:99px;padding:3px}.lang a{padding:2px 12px;border-radius:99px;font-size:.85rem}.lang a.on{background:var(--g);color:#fff}
.btn{display:inline-block;padding:.8em 1.7em;border-radius:14px;background:var(--g);color:#fff!important;font-weight:700;text-decoration:none;border:1.5px solid transparent;transition:.2s;box-shadow:0 14px 30px -14px rgba(47,91,255,.8)}.btn:hover{transform:translateY(-2px)}
.btn.g{background:transparent;color:var(--ink)!important;border-color:var(--line);box-shadow:none}.btn.lg{padding:1em 2.1em;font-size:1.08rem}.btn.sm{padding:.45em 1.3em}
.hero{padding:76px 0 56px;background:radial-gradient(900px 480px at 85% -10%,rgba(34,195,240,.22),transparent 62%),radial-gradient(700px 420px at -5% 110%,rgba(47,91,255,.16),transparent 60%)}
.hero .w{display:grid;grid-template-columns:1fr 1.05fr;gap:44px;align-items:center}
@media(max-width:900px){.hero .w{grid-template-columns:1fr;text-align:center}.acts{justify-content:center}nav .h{display:none}}
.tag{display:inline-block;padding:.3em 1em;border-radius:99px;background:rgba(47,91,255,.12);color:var(--p);font-weight:700;font-size:.85rem;margin-bottom:1em}
.sub{font-size:1.22rem;max-width:52ch}.acts{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.note{color:var(--mut);font-size:.95rem;margin-top:14px}
.ui{border:1px solid var(--line);border-radius:20px;background:var(--card);box-shadow:0 40px 80px -40px rgba(11,18,32,.5);overflow:hidden}.ui i.bar{display:block;height:32px;background:var(--bg2);border-bottom:1px solid var(--line)}
.m{padding:16px;display:grid;gap:10px;min-height:290px;align-content:start}.m .x{height:14px;border-radius:7px;background:var(--bg2)}.m .h{height:28px;width:75%;background:var(--g);opacity:.85}.m .bt{height:34px;width:32%;border-radius:10px;background:var(--g)}
.m.store{grid-template-columns:repeat(3,1fr)}.m.store div{border:1px solid var(--line);border-radius:14px;padding:8px;display:grid;gap:6px}.m.store div b{aspect-ratio:1;border-radius:10px;background:var(--bg2)}.m.store div b.a{background:linear-gradient(135deg,#22C3F0,#2F5BFF)}.m.store div b.c{background:linear-gradient(135deg,#f59e0b,#ef4444)}.m.store div em{height:10px;border-radius:5px;background:var(--bg2)}
.m.builder{grid-template-columns:.8fr 1.2fr}.m.builder .l{display:grid;gap:7px;align-content:start}.m.builder .l span{display:block;height:30px;border:1px solid var(--line);border-radius:9px}.m.builder .l span.on{border-color:var(--p);background:rgba(47,91,255,.08)}
.m.slider{padding:0}.m.slider .s{position:relative;min-height:290px;background:linear-gradient(135deg,#0B1220,#1d2a52 55%,#2F5BFF);display:grid;align-content:center;gap:12px;padding:30px}.m.slider .s .h{width:60%;background:#fff;opacity:.9}.m.slider .s .x{width:45%;background:rgba(255,255,255,.35)}.m.slider .d{position:absolute;bottom:14px;inset-inline:0;display:flex;gap:6px;justify-content:center}.m.slider .d i{width:9px;height:9px;border-radius:9px;background:rgba(255,255,255,.5)}.m.slider .d i.on{width:26px;background:#fff}.m.slider .a{position:absolute;top:50%;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2)}.m.slider .a.p{inset-inline-start:12px}.m.slider .a.n{inset-inline-end:12px}
.m.ai{align-content:end}.m.ai .q{justify-self:start;width:60%;height:34px;border-radius:14px 14px 14px 4px;background:var(--bg2)}.m.ai .r{justify-self:end;width:72%;height:54px;border-radius:14px 14px 4px 14px;background:var(--g);opacity:.9}.m.ai .in{height:38px;border:1px solid var(--line);border-radius:99px}
section{padding:72px 0}.alt{background:var(--bg2)}.lead{max-width:680px;margin:0 auto 42px;text-align:center;color:var(--mut);font-size:1.12rem}
.g{display:grid;gap:18px}.g3{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.c{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px;transition:.25s}.c:hover{transform:translateY(-5px);box-shadow:0 18px 40px -22px rgba(11,18,32,.45)}
.c p{margin:0;color:var(--mut)}.c h3{font-size:1.18rem}.e{display:grid;place-items:center;width:50px;height:50px;border-radius:15px;background:rgba(47,91,255,.1);font-size:25px;margin-bottom:12px}
.st{counter-reset:s;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;padding:0;list-style:none;margin:0}.st li{counter-increment:s;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px}.st li::before{content:counter(s);display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--g);color:#fff;font-weight:800;margin-bottom:12px}.st p{margin:0;color:var(--mut)}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:18px;overflow:hidden;border:1px solid var(--line)}th,td{padding:13px 18px;border-bottom:1px solid var(--line);text-align:center}th:first-child,td:first-child{text-align:start}thead th{background:var(--bg2);color:var(--ink)}td.y{color:#16a34a;font-weight:700}td.n{color:var(--mut)}
.pr{text-align:center;display:flex;flex-direction:column;gap:6px}.pr .n{font-size:2.7rem;font-weight:800;color:var(--ink);line-height:1.1}.pr ul{list-style:none;padding:0;margin:8px 0 14px;text-align:start;flex:1}.pr li{padding:6px 0;border-bottom:1px dashed var(--line)}.pr li::before{content:"✓ ";color:#16a34a;font-weight:700}
.pr.hot{border:2px solid var(--p);transform:translateY(-8px);box-shadow:0 24px 50px -26px rgba(47,91,255,.6);position:relative}.pr.hot .pp{position:absolute;top:-14px;inset-inline-start:50%;translate:-50% 0;background:var(--g);color:#fff;padding:.15em 1em;border-radius:99px;font-size:.8rem;font-weight:700;white-space:nowrap}[dir=rtl] .pr.hot .pp{translate:50% 0}
.one{max-width:520px;margin-inline:auto}
details{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:15px 22px;margin:0 auto 10px;max-width:820px}summary{cursor:pointer;font-weight:700;color:var(--ink)}details p{margin:.7em 0 0;color:var(--mut)}
.cta{background:var(--g);color:#fff;text-align:center}.cta h2{color:#fff}.cta .btn{background:#fff;color:#0B1220!important;box-shadow:none}
.small{text-align:center;color:var(--mut);font-size:.9rem;margin-top:18px}
footer{padding:26px 0;text-align:center;color:var(--mut);font-size:.9rem}
.cat{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}.cat .c{display:flex;flex-direction:column;gap:6px}.cat .c p{flex:1}
@media(max-width:700px){th,td{padding:10px 8px;font-size:.9rem}.pr.hot{transform:none}}
"""

MOCKS = {
 'store': '<div class="m store">' + ''.join('<div><b class="%s"></b><em></em><em style="width:60%%"></em></div>' % c for c in ['a', '', 'c', '', 'a', '']) + '</div>',
 'builder': '<div class="m builder"><div class="l"><span class="on"></span><span></span><span></span><span></span><span></span></div><div style="display:grid;gap:10px;align-content:start"><div class="x h"></div><div class="x"></div><div class="x" style="width:70%"></div><div class="x bt"></div></div></div>',
 'slider': '<div class="m slider"><div class="s"><div class="x h"></div><div class="x"></div><div class="x bt" style="background:#fff"></div><span class="a p"></span><span class="a n"></span><div class="d"><i></i><i class="on"></i><i></i><i></i></div></div></div>',
 'ai': '<div class="m ai"><div class="q"></div><div class="r"></div><div class="q" style="width:48%"></div><div class="in"></div></div>',
}

def switcher(prefix_by_lang, cur):
    return '<div class="lang">' + ''.join('<a href="%s"%s hreflang="%s" lang="%s">%s</a>' % (prefix_by_lang[l], ' class="on"' if l == cur else '', l, l, l.upper()) for l in LANGS) + '</div>'

def page(title, desc, lang, body, alt_links, path_note=''):
    d = LANGS[lang]['dir']
    alts = ''.join('<link rel="alternate" hreflang="%s" href="%s">' % (l, h) for l, h in alt_links.items())
    return '<!doctype html>\n<html lang="%s" dir="%s">\n<head>\n<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<title>%s</title>\n<meta name="description" content="%s">\n<meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:type" content="website">\n%s\n%s\n<style>%s</style>\n</head>\n<body>\n%s\n</body>\n</html>\n' % (lang, d, E(title), E(desc, True), E(title, True), E(desc, True), alts, FONT, CSS, body)

def product_page(slug, p, lang):
    c = p['content'][lang]; u = UI[lang]
    links = {l: ('%s.html' % l) for l in LANGS}
    hub = {'ar': '../index.html', 'en': '../index-en.html', 'fr': '../index-fr.html'}[lang]
    feats = ''.join('<div class="c"><div class="e">%s</div><h3>%s</h3><p>%s</p></div>' % (e, E(t), E(x)) for e, t, x in c['features'])
    s_items = ''.join('<div class="c"><div class="e">%s</div><h3>%s</h3><p>%s</p></div>' % (e, E(t), E(x)) for e, t, x in c['s_items'])
    steps = ''.join('<li><h3>%s</h3><p>%s</p></li>' % (E(t), E(x)) for t, x in c['steps'])
    rows = ''.join('<tr><td>%s</td><td class="%s">%s</td><td class="%s">%s</td></tr>' % (E(l), 'y' if a == '✓' else 'n', E(a), 'y' if b in ('✓', '7+') else 'n', E(b)) for l, a, b in c['cmp_rows'])
    if p['plans_on']:
        plans = ''
        for i in range(3):
            hot = i == 1
            plans += '<div class="c pr%s">%s<h3>%s</h3><div class="n">$%d</div><small>%s</small><ul>%s</ul><a class="btn%s" href="#">%s</a></div>' % (' hot' if hot else '', '<span class="pp">%s</span>' % E(u['popular']) if hot else '', E(u['plans'][i]), p['prices'][i], E(u['per']), ''.join('<li>%s</li>' % E(f) for f in u['plan_feats'][i]), '' if hot else ' g', E(u['plan_btn'][i]))
        pricing = '<div class="g g3">%s</div><p class="small">%s</p>' % (plans, E(u['note']))
    else:
        pricing = '<div class="c pr one hot"><span class="pp">★</span><h3>%s</h3><div class="n">$0</div><small>%s</small><ul>%s</ul><a class="btn" href="#">%s</a></div>' % (E(c['included']), E(c['included_sub']), ''.join('<li>%s</li>' % E(f) for f in u['plan_feats'][0][1:]), E(u['buy']))
    faq = ''.join('<details><summary>%s</summary><p>%s</p></details>' % (E(q), E(a)) for q, a in c['faq'])
    body = f'''<nav><div class="w"><b><span class="mk">B</span>{E(p['name'])}</b><a class="h" href="#features">{E(u['nav'][0])}</a><a class="h" href="#pricing">{E(u['nav'][1])}</a><a class="h" href="#faq">{E(u['nav'][2])}</a>{switcher(links, lang)}<a class="btn sm" href="#pricing">{E(u['buy'])}</a></div></nav>
<header class="hero"><div class="w"><div><span class="tag">{E(c['tag'])}</span><h1>{E(c['h1'])}</h1><p class="sub">{E(c['sub'])}</p><div class="acts"><a class="btn lg" href="#pricing">{E(c['cta1'])}</a><a class="btn g lg" href="#features">{E(c['cta2'])}</a></div><p class="note">{E(c['note'])}</p></div><div class="ui" aria-hidden="true"><i class="bar"></i>{MOCKS[p['mock']]}</div></div></header>
<section id="features"><div class="w"><h2>{E(c['f_title'])}</h2><p class="lead">{E(c['f_lead'])}</p><div class="g g3">{feats}</div></div></section>
<section class="alt"><div class="w"><h2>{E(c['s_title'])}</h2><p class="lead">{E(c['s_lead'])}</p><div class="g g3">{s_items}</div></div></section>
<section><div class="w"><h2>{E(u['steps'])}</h2><br><ol class="st">{steps}</ol></div></section>
<section class="alt"><div class="w"><h2>{E(c['cmp_title'])}</h2><br><table><thead><tr><th></th><th>{E(c['cmp_cols'][0])}</th><th>{E(c['cmp_cols'][1])}</th></tr></thead><tbody>{rows}</tbody></table></div></section>
<section id="pricing"><div class="w"><h2>{E(c['pr_title'])}</h2><br>{pricing}</div></section>
<section id="faq" class="alt"><div class="w">{faq}</div></section>
<section class="cta"><div class="w"><h2>{E(c['cta_title'])}</h2><p>{E(c['cta_text'])}</p><a class="btn lg" href="#pricing">{E(u['buy'])}</a><p class="small" style="color:#fff;opacity:.85"><a href="{hub}" style="color:#fff">{E(u['back'])}</a></p></div></section>
<footer><div class="w">© {E(p['name'])} · {E(u['rights'])}</div></footer>'''
    schema = ''
    return page(c['meta_title'], c['meta_desc'], lang, body, links)

def hub_page(lang):
    u = UI[lang]
    names = {'ar': 'index.html', 'en': 'index-en.html', 'fr': 'index-fr.html'}
    links = {l: names[l] for l in LANGS}
    cards = ''
    for slug, p in PRODUCTS.items():
        c = p['content'][lang]
        cards += '<div class="c"><div class="e">%s</div><span class="tag" style="align-self:flex-start;margin:0">%s</span><h3>%s</h3><p>%s</p><a class="btn sm" style="align-self:flex-start" href="%s/%s.html">%s</a></div>' % (p['emoji'], E(p['kind'][lang]), E(p['name']), E(c['meta_desc']), slug, lang, E(u['open']))
    body = f'''<nav><div class="w"><b><span class="mk">B</span>BLR</b>{switcher(links, lang)}</div></nav>
<header class="hero"><div class="w" style="grid-template-columns:1fr;text-align:center"><div><h1>{E(u['hub_title'])}</h1><p class="sub" style="margin-inline:auto">{E(u['hub_sub'])}</p></div></div></header>
<section><div class="w"><h2>{E(u['catalog'])}</h2><br><div class="cat">{cards}</div></div></section>
<footer><div class="w">© BLR · {E(u['rights'])}</div></footer>'''
    return page(u['hub_title'], u['hub_sub'], lang, body, links), names[lang]

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    n = 0
    for slug, p in PRODUCTS.items():
        os.makedirs(os.path.join(here, slug), exist_ok=True)
        for lang in LANGS:
            open(os.path.join(here, slug, lang + '.html'), 'w', encoding='utf8').write(product_page(slug, p, lang)); n += 1
    for lang in LANGS:
        h, name = hub_page(lang)
        open(os.path.join(here, name), 'w', encoding='utf8').write(h); n += 1
    print('generated', n, 'pages')
