#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""مولّد صفحات موقع Baderinfo (ar / en / fr).
المخرجات (في out/):
  pages/<lang>/<path>.html   كود كل صفحة للنسخ واللصق (Custom HTML)
  preview/<lang>/...html     معاينة مستقلة لكل صفحة
  baderinfo-pages.xml        ملف استيراد ووردبريس (صفحات + قوائم)
  link-map.csv               خريطة الروابط والأزرار
  index.html                 فهرس تفاعلي للنسخ صفحة صفحة
  + plugins/blr-service-requests/data/catalog.json
الاستعمال:  python3 build_site.py [--base https://baderinfo.com]
"""
import os, re, sys, json, csv, html, argparse, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import catalog as C, forms_catalog as FC
import data_common as DC, data_web as DW, data_pos as DP, data_other as DO, data_static as DS

ROOT = os.path.dirname(os.path.abspath(__file__))
LANGS = ['ar', 'en', 'fr']
DIRS = {'ar': 'rtl', 'en': 'ltr', 'fr': 'ltr'}
LNAME = {'ar': 'العربية', 'en': 'English', 'fr': 'Français'}
ARROW = {'ar': '←', 'en': '→', 'fr': '→'}
SHOP_SLUG = 'online-shop'   # لتجنب تعارض صفحة "shop" الخاصة بووكومرس

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='', help='عنوان الموقع بدون / في النهاية، مثال: https://baderinfo.com')
ap.add_argument('--out', default=os.path.join(ROOT, 'out'))
A = ap.parse_args()
BASE = A.base.rstrip('/')
OUT = A.out
PLUGIN_DATA = os.path.join(ROOT, '..', 'plugins', 'blr-service-requests', 'data')

esc = lambda s: html.escape(s, quote=True)
def tx(d, lang):
    return d[lang] if isinstance(d, dict) else d
def U(lang, path, query=''):
    pre = '' if lang == 'ar' else '/' + lang
    p = pre + '/' + '/'.join(path) + ('/' if path else '')
    if p == '//':
        p = '/'
    return BASE + p + query
def home_url(lang):
    return BASE + ('/' if lang == 'ar' else '/' + lang + '/')
def short(s, n=150):
    s = s.strip()
    if len(s) <= n:
        return s
    cut = s[:n]
    m = max(cut.rfind('.'), cut.rfind('،'), cut.rfind(' '))
    return cut[:m if m > 60 else n].rstrip(' ,.،') + '…'

# ------------------------------------------------------------------ بيانات الخدمة
def l1_of(path):
    return C.find(path[:1])['node']

def leaf_data(path):
    """يعيد dict: intro, feats, who, tier(scope,pts) لصفحة ورقة"""
    leaf = C.find(path)['node']
    l1 = l1_of(path)
    if l1['group'] == 'web':
        l2 = C.find(path[:2])['node']
        nd = DW.NICHES[l2['niche']]
        t = DW.TIERS[leaf['tier']]
        return {'intro': nd['intro'], 'feats': nd['feats'], 'who': nd.get('who'), 'tier': t, 'niche': l2['niche']}
    nd = DP.POS.get(leaf['niche']) or DO.OTHER[leaf['niche']]
    return {'intro': nd['intro'], 'feats': nd['feats'], 'who': nd.get('who'), 'tier': None, 'niche': leaf['niche']}

def intro_of(path, lang):
    it = C.find(path)
    nd = it['node']
    if it['leaf']:
        return leaf_data(path)['intro'][lang]
    if it['depth'] == 1:
        return DC.L1_INTRO[nd['slug']][lang]
    if nd['slug'] in DC.L2_INTRO:
        return DC.L2_INTRO[nd['slug']][lang]
    return DW.NICHES[nd['niche']]['intro'][lang]

COMPOSE = {'store', 'shops-management'}   # أسماء الأوراق فيها ملتبسة بدون اسم الأب
def full_name(path, lang):
    nd = C.find(path)['node']
    if len(path) == 3 and path[1] in COMPOSE:
        return C.find(path[:2])['node']['n'][lang] + ' — ' + nd['n'][lang]
    return nd['n'][lang]

def icon_of(path):
    return C.find(path[:1])['node'].get('icon', '◆')

# ------------------------------------------------------------------ مكونات HTML
def wrap(lang, body, cls=''):
    return f'<div class="bi {cls}" dir="{DIRS[lang]}" lang="{lang}">\n{body}\n</div>'

def btn(href, label, kind=''):
    return f'<a class="bi-btn{(" bi-btn--" + kind) if kind else ""}" href="{esc(href)}">{esc(label)}</a>'

def crumbs(lang, items):
    """items: [(label, href|None)]"""
    out = []
    for lab, href in items:
        out.append(f'<a href="{esc(href)}">{esc(lab)}</a>' if href else f'<span>{esc(lab)}</span>')
    return '<nav class="bi-crumbs" aria-label="breadcrumb">' + ' <i>/</i> '.join(out) + '</nav>'

def langbar(lang, path_tail):
    """مبدّل اللغة: path_tail = المسار داخل شجرة اللغة (قائمة slugs، فارغة = الرئيسية)"""
    a = []
    for l in LANGS:
        href = home_url(l) if not path_tail else U(l, path_tail)
        a.append(f'<a href="{esc(href)}" hreflang="{l}"{" class=\"on\"" if l == lang else ""}>{LNAME[l]}</a>')
    return '<div class="bi-lang">' + ''.join(a) + '</div>'

def hero(lang, icon, title, intro, tail, buttons, crumb_items=None, tag=None):
    h = ['<header class="bi-hero">']
    h.append(langbar(lang, tail))
    if crumb_items:
        h.append(crumbs(lang, crumb_items))
    if tag:
        h.append(f'<span class="bi-tag">{esc(tag)}</span>')
    h.append(f'<div class="bi-hero-main"><span class="bi-icon">{icon}</span><div><h1>{esc(title)}</h1><p class="bi-lead">{esc(intro)}</p></div></div>')
    if buttons:
        h.append('<div class="bi-actions">' + ''.join(buttons) + '</div>')
    h.append('</header>')
    return '\n'.join(h)

def sec(title, inner, cls=''):
    return f'<section class="bi-sec {cls}"><h2>{esc(title)}</h2>\n{inner}\n</section>'

def ul(items, cls='bi-list'):
    return f'<ul class="{cls}">' + ''.join(f'<li>{esc(i)}</li>' for i in items) + '</ul>'

def card(href, icon, title, text, more):
    return (f'<a class="bi-card" href="{esc(href)}"><span class="bi-icon">{icon}</span>'
            f'<h3>{esc(title)}</h3><p>{esc(text)}</p><span class="bi-more">{esc(more)} {ARROW_CUR[0]}</span></a>')
ARROW_CUR = ['→']

def steps(lang, items):
    li = ''.join(f'<li><b>{i+1}</b><span>{esc(s)}</span></li>' for i, s in enumerate(items))
    return f'<ol class="bi-steps">{li}</ol>'

def faq(items):
    return '<div class="bi-faq">' + ''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in items) + '</div>'

def cta(lang, req_href, title=None, text=None):
    ui = DC.UI
    t = title or ui['cta_title'][lang]
    x = text or ui['cta_text'][lang]
    return (f'<section class="bi-cta"><h2>{esc(t)}</h2><p>{esc(x)}</p><div class="bi-actions">'
            f'{btn(req_href, ui["request_btn"][lang])}{btn(U(lang, ["contact"]), ui["contact_btn"][lang], "ghost")}</div></section>')

def pairs(lst, lang):
    """قائمة مسطحة [عنوان، نص، عنوان، نص…] -> [(عنوان، نص)]"""
    return [(lst[i][lang], lst[i + 1][lang]) for i in range(0, len(lst), 2)]

def grid_pairs(prs):
    return '<div class="bi-grid">' + ''.join(f'<div class="bi-card bi-card--plain"><h3>{esc(a)}</h3><p>{esc(b)}</p></div>' for a, b in prs) + '</div>'

# ------------------------------------------------------------------ بناء الصفحات
PAGES = []   # dict: lang, tail(list), title, html, excerpt, kind, parent(tail|None), order, links[]
def add(lang, tail, title, body, excerpt, kind, order=0, links=None, menu_parent=None):
    PAGES.append(dict(lang=lang, tail=tail, title=title, html=body, excerpt=excerpt, kind=kind, order=order, links=links or []))

def req_link(lang, sid=None, group=None):
    q = ''
    if sid:
        q = '?service=' + sid
    elif group:
        q = '?group=' + group
    return U(lang, ['request']) + q

def build_all():
    UI = DC.UI
    for lang in LANGS:
        ARROW_CUR[0] = ARROW[lang]
        ui = lambda k: UI[k][lang]
        # ----- الرئيسية
        H = DS.HOME
        svc_cards = ''.join(card(U(lang, ['services', n['slug']]), n['icon'], n['n'][lang], short(DC.L1_INTRO[n['slug']][lang], 130), ui('details')) for n in C.TREE)
        quick = [('services', '🧭'), ('online-shop', '🛒'), ('blog', '📝'), ('portfolio', '🖼️'), ('about', 'ℹ️'), ('contact', '✉️')]
        qnames = {'services': DS.SERVICES['title'], 'online-shop': DS.SHOP['title'], 'blog': DS.BLOG['title'], 'portfolio': DS.PORTFOLIO['title'], 'about': DS.ABOUT['title'], 'contact': DS.CONTACT['title']}
        qtext = {'services': DS.SERVICES['intro'], 'online-shop': DS.SHOP['intro'], 'blog': DS.BLOG['intro'], 'portfolio': DS.PORTFOLIO['intro'], 'about': DS.ABOUT['lead'], 'contact': DS.CONTACT['intro']}
        qcards = ''.join(card(U(lang, [s]), ic, qnames[s][lang], short(qtext[s][lang], 110), ui('browse') if s == 'services' else ui('details')) for s, ic in quick)
        body = hero(lang, '✨', H['hero_title'][lang], H['hero_sub'][lang], [],
                    [btn(U(lang, ['services']), ui('browse')), btn(req_link(lang), DS.REQUEST['title'][lang], 'ghost')])
        body += sec(H['services_title'][lang], f'<p class="bi-sub">{esc(H["services_sub"][lang])}</p><div class="bi-grid">{svc_cards}</div>', 'bi-sec--services')
        body += sec(H['why_title'][lang], grid_pairs(pairs(H['why'], lang)))
        body += sec(H['steps_title'][lang], '<div class="bi-grid">' + ''.join(f'<div class="bi-card bi-card--plain"><h3>{esc(a)}</h3><p>{esc(b)}</p></div>' for a, b in pairs(H['steps'], lang)) + '</div>')
        body += sec(H['quick_title'][lang], f'<div class="bi-grid">{qcards}</div>')
        body += sec(H['faq_title'][lang], faq([(q[lang], a[lang]) for q, a in H['faq']]))
        body += cta(lang, req_link(lang), H['cta_title'][lang], H['cta_text'][lang])
        add(lang, [], ui('home'), wrap(lang, body, 'bi-home'), H['hero_sub'][lang][:155], 'home', 0,
            [('hero', ui('browse'), U(lang, ['services'])), ('hero', DS.REQUEST['title'][lang], req_link(lang))] +
            [('service card', n['n'][lang], U(lang, ['services', n['slug']])) for n in C.TREE])

        # ----- الخدمات (مركز)
        S = DS.SERVICES
        cards = ''.join(card(U(lang, ['services', n['slug']]), n['icon'], n['n'][lang], short(DC.L1_INTRO[n['slug']][lang], 140), ui('details')) for n in C.TREE)
        body = hero(lang, '🧭', S['title'][lang], S['intro'][lang], ['services'],
                    [btn(req_link(lang), ui('request_btn'))], [(ui('home'), home_url(lang)), (S['title'][lang], None)])
        body += f'<section class="bi-sec"><div class="bi-grid">{cards}</div></section>' + cta(lang, req_link(lang))
        add(lang, ['services'], S['title'][lang], wrap(lang, body), S['intro'][lang][:155], 'hub', 1,
            [('card', n['n'][lang], U(lang, ['services', n['slug']])) for n in C.TREE])

        # ----- عقد الخدمات (L1 / L2 / ورقات)
        for it in C.walk():
            path = it['path']; nd = it['node']; tail = ['services'] + path
            name = full_name(path, lang); icon = icon_of(path)
            l1 = C.find(path[:1])['node']
            crumb = [(ui('home'), home_url(lang)), (S['title'][lang], U(lang, ['services']))]
            for i in range(1, len(path)):
                crumb.append((C.find(path[:i])['node']['n'][lang], U(lang, ['services'] + path[:i])))
            crumb.append((name, None))
            if not it['leaf']:
                depth = it['depth']
                kids = nd['children']
                cards = []
                for k in kids:
                    kp = path + [k['slug']]
                    kit = C.find(kp)
                    cards.append(card(U(lang, ['services'] + kp), icon, k['n'][lang], short(intro_of(kp, lang), 140), ui('details')))
                sid_group = path[0]
                body = hero(lang, icon, name, intro_of(path, lang), tail, [btn(req_link(lang, group=sid_group), ui('request_btn')), btn(U(lang, ['contact']), ui('contact_btn'), 'ghost')], crumb)
                body += sec(ui('sub_services'), f'<p class="bi-sub">{len(kids)} {esc(ui("sub_count"))}</p><div class="bi-grid">{"".join(cards)}</div>')
                body += sec(ui('process'), steps(lang, DC.PROCESS[l1['group']][lang]))
                body += sec(ui('faq'), faq(DC.FAQ[l1['group']][lang]))
                body += cta(lang, req_link(lang, group=sid_group))
                add(lang, tail, name, wrap(lang, body), intro_of(path, lang)[:155], 'L%d' % depth, it['order'],
                    [('card', k['n'][lang], U(lang, ['services'] + path + [k['slug']])) for k in kids] + [('hero', ui('request_btn'), req_link(lang, group=sid_group))])
                continue
            # ---- ورقة
            d = leaf_data(path); g = l1['group']
            sid = C.service_id(path)
            intro = d['intro'][lang]
            req = req_link(lang, sid)
            body = hero(lang, icon, name, intro, tail, [btn(req, ui('request_btn')), btn(U(lang, ['contact']), ui('contact_btn'), 'ghost')], crumb, l1['n'][lang])
            body += sec(ui('features'), ul(d['feats'][lang], 'bi-list bi-list--check'))
            if d['tier']:
                t = d['tier']
                body += sec(ui('specs'), f'<p class="bi-sub">{esc(ui("scope"))}: {esc(t["scope"][lang])}</p>' + ul(t['pts'][lang], 'bi-list bi-list--check'))
            if d.get('who'):
                body += sec(ui('for_whom'), ul(d['who'][lang]))
            body += sec(ui('process'), steps(lang, DC.PROCESS[g][lang]))
            body += sec(ui('deliver'), ul(DC.DELIVER[g][lang], 'bi-list bi-list--check'))
            body += f'<section class="bi-price"><h2>{esc(ui("price_title"))}</h2><p>{esc(ui("price_text"))}</p>{btn(req, ui("request_btn"))}</section>'
            body += sec(ui('faq'), faq(DC.FAQ[g][lang]))
            # خدمات ذات صلة: الأشقاء
            parent = path[:-1]
            sibs = []
            if len(parent) >= 1 and C.find(parent) and not C.find(parent)['leaf']:
                sibs = [k for k in C.find(parent)['node']['children'] if k['slug'] != path[-1]]
            links = [('hero', ui('request_btn'), req), ('hero', ui('contact_btn'), U(lang, ['contact']))]
            if sibs:
                rc = ''.join(card(U(lang, ['services'] + parent + [k['slug']]), icon, full_name(parent + [k['slug']], lang), short(intro_of(parent + [k['slug']], lang), 110), ui('details')) if C.find(parent + [k['slug']])['leaf']
                             else card(U(lang, ['services'] + parent + [k['slug']]), icon, full_name(parent + [k['slug']], lang), short(intro_of(parent + [k['slug']], lang), 110), ui('details')) for k in sibs[:6])
                body += sec(ui('related'), f'<div class="bi-grid">{rc}</div>')
                links += [('related', k['n'][lang], U(lang, ['services'] + parent + [k['slug']])) for k in sibs[:6]]
            if parent:
                pn = C.find(parent)['node']['n'][lang]
                body += f'<p class="bi-back"><a href="{esc(U(lang, ["services"] + parent))}">{ARROW_BACK[lang]} {esc(ui("back_to"))} {esc(pn)}</a></p>'
                links.append(('back', pn, U(lang, ['services'] + parent)))
            body += cta(lang, req)
            add(lang, tail, name, wrap(lang, body), intro[:155], 'service', it['order'], links)

        # ----- المتجر
        Sh = DS.SHOP
        cards = card(U(lang, [SHOP_SLUG, 'physical-products']), '📦', C.SHOP_CHILDREN[0][1][lang], Sh['physical'][lang], ui('browse')) + \
                card(U(lang, [SHOP_SLUG, 'digital-products']), '💾', C.SHOP_CHILDREN[1][1][lang], Sh['digital'][lang], ui('browse'))
        body = hero(lang, '🛒', Sh['title'][lang], Sh['intro'][lang], [SHOP_SLUG], [], [(ui('home'), home_url(lang)), (Sh['title'][lang], None)])
        body += f'<section class="bi-sec"><div class="bi-grid">{cards}</div></section>'
        add(lang, [SHOP_SLUG], Sh['title'][lang], wrap(lang, body), Sh['intro'][lang][:155], 'hub', 2,
            [('card', C.SHOP_CHILDREN[i][1][lang], U(lang, [SHOP_SLUG, C.SHOP_CHILDREN[i][0]])) for i in (0, 1)])
        for i, (slug, nm) in enumerate(C.SHOP_CHILDREN):
            kind = 'physical' if i == 0 else 'digital'
            other = C.SHOP_CHILDREN[1 - i]
            body = hero(lang, '📦' if i == 0 else '💾', nm[lang], Sh[kind][lang], [SHOP_SLUG, slug], [btn(U(lang, [SHOP_SLUG, other[0]]), other[1][lang], 'ghost')],
                        [(ui('home'), home_url(lang)), (Sh['title'][lang], U(lang, [SHOP_SLUG])), (nm[lang], None)])
            body += f'<section class="bi-sec">[bi_products kind="{kind}" limit="12" lang="{lang}"]</section>'
            body += cta(lang, req_link(lang))
            add(lang, [SHOP_SLUG, slug], nm[lang], wrap(lang, body), Sh[kind][lang][:155], 'shop', i,
                [('hero', other[1][lang], U(lang, [SHOP_SLUG, other[0]]))])

        # ----- المدونة
        B = DS.BLOG
        body = hero(lang, '📝', B['title'][lang], B['intro'][lang], ['blog'], [], [(ui('home'), home_url(lang)), (B['title'][lang], None)])
        body += f'<section class="bi-sec">[bi_posts limit="9" lang="{lang}"]</section>' + cta(lang, req_link(lang))
        add(lang, ['blog'], B['title'][lang], wrap(lang, body), B['intro'][lang][:155], 'static', 3)

        # ----- أعمالنا
        P = DS.PORTFOLIO
        body = hero(lang, '🖼️', P['title'][lang], P['intro'][lang], ['portfolio'], [], [(ui('home'), home_url(lang)), (P['title'][lang], None)])
        body += f'<section class="bi-sec">[bi_portfolio lang="{lang}"]</section>' + cta(lang, req_link(lang))
        add(lang, ['portfolio'], P['title'][lang], wrap(lang, body), P['intro'][lang][:155], 'static', 4)

        # ----- من نحن
        Ab = DS.ABOUT
        what = ''.join(card(U(lang, ['services', n['slug']]), n['icon'], n['n'][lang], short(DC.L1_INTRO[n['slug']][lang], 100), ui('details')) for n in C.TREE)
        body = hero(lang, 'ℹ️', Ab['title'][lang], Ab['lead'][lang], ['about'], [btn(req_link(lang), ui('request_btn')), btn(U(lang, ['contact']), ui('contact_btn'), 'ghost')], [(ui('home'), home_url(lang)), (Ab['title'][lang], None)])
        body += sec(Ab['vals_title'][lang], grid_pairs(pairs(Ab['vals'], lang)))
        body += sec(Ab['what_title'][lang], f'<div class="bi-grid">{what}</div>') + cta(lang, req_link(lang))
        add(lang, ['about'], Ab['title'][lang], wrap(lang, body), Ab['lead'][lang][:155], 'static', 5)

        # ----- اتصل بنا
        Co = DS.CONTACT
        body = hero(lang, '✉️', Co['title'][lang], Co['intro'][lang], ['contact'], [], [(ui('home'), home_url(lang)), (Co['title'][lang], None)])
        body += (f'<section class="bi-sec bi-two"><div><h2>{esc(Co["info_title"][lang])}</h2>[bi_contact_info lang="{lang}"]'
                 f'<p class="bi-sub">{esc(Co["to_request"][lang])}</p>{btn(req_link(lang), ui("request_btn"), "ghost")}</div>'
                 f'<div><h2>{esc(Co["form_title"][lang])}</h2>[bi_contact lang="{lang}"]</div></section>')
        add(lang, ['contact'], Co['title'][lang], wrap(lang, body), Co['intro'][lang][:155], 'static', 6,
            [('side', ui('request_btn'), req_link(lang))])

        # ----- طلب خدمة
        R = DS.REQUEST
        body = hero(lang, '📝', R['title'][lang], R['intro'][lang], ['request'], [], [(ui('home'), home_url(lang)), (R['title'][lang], None)], R['steps'][lang])
        body += f'<section class="bi-sec">[bi_request lang="{lang}"]</section>'
        add(lang, ['request'], R['title'][lang], wrap(lang, body), R['intro'][lang][:155], 'static', 7)

ARROW_BACK = {'ar': '→', 'en': '←', 'fr': '←'}

# ------------------------------------------------------------------ كتالوج النماذج
def catalog_json():
    groups = []
    for n in C.TREE:
        svcs = []
        for it in C.walk():
            if it['path'][0] != n['slug'] or not it['leaf']:
                continue
            leaf = it['node']
            if it['depth'] == 3:
                l2 = C.find(it['path'][:2])['node']
                label = {l: full_name(it['path'], l) for l in LANGS}
                niche = l2['niche'] if n['group'] == 'web' else leaf['niche']
            else:
                label = leaf['n']; niche = leaf['niche']
            svcs.append({'id': C.service_id(it['path']), 'n': label, 'f': niche})
        groups.append({'id': n['slug'], 'icon': n['icon'], 'n': n['n'], 'services': svcs})
    need = {s['f'] for g in groups for s in g['services']}
    fields = {k: FC.fields_for(k) for k in sorted(need)}
    return {'version': 1, 'common': FC.COMMON, 'foot': FC.FOOT, 'groups': groups, 'fields': fields}

# ------------------------------------------------------------------ XML
def cdata(s):
    return '<![CDATA[' + s.replace(']]>', ']]]]><![CDATA[>') + ']]>'

def php_ser_classes(cls):
    return 'a:1:{i:0;s:%d:"%s";}' % (len(cls.encode()), cls)

def wxr(pages_by_lang):
    now = datetime.datetime(2025, 1, 1, 12, 0, 0).strftime('%Y-%m-%d %H:%M:%S')
    nid = [1000]
    def new_id():
        nid[0] += 1
        return nid[0]
    items = []; terms = []; menu_term = {}
    pid = {}  # (lang, tuple tail) -> id
    # الصفحات: جذور اللغات أولاً
    def page_item(pid_, title, slug, parent, content, excerpt, order):
        return f"""<item>
<title>{cdata(title)}</title><link>{BASE or 'https://example.com'}/{slug}/</link><pubDate>Wed, 01 Jan 2025 12:00:00 +0000</pubDate><dc:creator>{cdata('admin')}</dc:creator>
<guid isPermaLink="false">{BASE or 'https://example.com'}/?page_id={pid_}</guid><description></description>
<content:encoded>{cdata('<!-- wp:html -->' + content + '<!-- /wp:html -->')}</content:encoded><excerpt:encoded>{cdata(excerpt)}</excerpt:encoded>
<wp:post_id>{pid_}</wp:post_id><wp:post_date>{cdata(now)}</wp:post_date><wp:post_date_gmt>{cdata(now)}</wp:post_date_gmt><wp:post_modified>{cdata(now)}</wp:post_modified><wp:post_modified_gmt>{cdata(now)}</wp:post_modified_gmt>
<wp:comment_status>{cdata('closed')}</wp:comment_status><wp:ping_status>{cdata('closed')}</wp:ping_status><wp:post_name>{cdata(slug)}</wp:post_name><wp:status>{cdata('publish')}</wp:status>
<wp:post_parent>{parent}</wp:post_parent><wp:menu_order>{order}</wp:menu_order><wp:post_type>{cdata('page')}</wp:post_type><wp:post_password>{cdata('')}</wp:post_password><wp:is_sticky>0</wp:is_sticky>
<wp:postmeta><wp:meta_key>{cdata('_wp_page_template')}</wp:meta_key><wp:meta_value>{cdata('default')}</wp:meta_value></wp:postmeta>
</item>"""
    for lang in LANGS:
        pgs = pages_by_lang[lang]
        if lang == 'ar':
            parent_of_tree = 0
        else:
            rid = new_id(); pid[(lang, ())] = rid
            home = [p for p in pgs if p['tail'] == []][0]
            items.append(page_item(rid, home['title'] + ' (' + LNAME[lang] + ')', lang, 0, home['html'], home['excerpt'], 0))
        # ترتيب: الأقل عمقاً أولاً
        for p in sorted(pgs, key=lambda x: (len(x['tail']), x['order'])):
            if p['tail'] == []:
                if lang == 'ar':
                    i = new_id(); pid[(lang, ())] = i
                    items.append(page_item(i, p['title'], 'home', 0, p['html'], p['excerpt'], 0))
                continue
            i = new_id(); pid[(lang, tuple(p['tail']))] = i
            par = pid[(lang, tuple(p['tail'][:-1]))] if len(p['tail']) > 1 else (pid[(lang, ())] if lang != 'ar' else 0)
            items.append(page_item(i, p['title'], p['tail'][-1], par, p['html'], p['excerpt'], p['order']))
    # قوائم التنقل
    mid = 5000
    for lang in LANGS:
        mid += 1
        slug = 'baderinfo-menu-' + lang
        terms.append(f'<wp:term><wp:term_id>{mid}</wp:term_id><wp:term_taxonomy>{cdata("nav_menu")}</wp:term_taxonomy><wp:term_slug>{cdata(slug)}</wp:term_slug><wp:term_name>{cdata("Baderinfo " + LNAME[lang])}</wp:term_name></wp:term>')
        cur = [0]
        def mitem(label, obj=None, url=None, parent=0, order=0, cls=''):
            i = new_id()
            meta = [('_menu_item_type', 'post_type' if obj else 'custom'), ('_menu_item_menu_item_parent', str(parent)),
                    ('_menu_item_object_id', str(obj) if obj else str(i)), ('_menu_item_object', 'page' if obj else 'custom'),
                    ('_menu_item_target', ''), ('_menu_item_classes', php_ser_classes(cls)), ('_menu_item_xfn', ''), ('_menu_item_url', url or '')]
            m = ''.join(f'<wp:postmeta><wp:meta_key>{cdata(k)}</wp:meta_key><wp:meta_value>{cdata(v)}</wp:meta_value></wp:postmeta>' for k, v in meta)
            items.append(f"""<item><title>{cdata(label)}</title><link>{BASE or 'https://example.com'}/?p={i}</link><pubDate>Wed, 01 Jan 2025 12:00:00 +0000</pubDate><dc:creator>{cdata('admin')}</dc:creator><guid isPermaLink="false">{BASE or 'https://example.com'}/?p={i}</guid><description></description><content:encoded>{cdata('')}</content:encoded><excerpt:encoded>{cdata('')}</excerpt:encoded><wp:post_id>{i}</wp:post_id><wp:post_date>{cdata(now)}</wp:post_date><wp:post_date_gmt>{cdata(now)}</wp:post_date_gmt><wp:post_modified>{cdata(now)}</wp:post_modified><wp:post_modified_gmt>{cdata(now)}</wp:post_modified_gmt><wp:comment_status>{cdata('closed')}</wp:comment_status><wp:ping_status>{cdata('closed')}</wp:ping_status><wp:post_name>{cdata(str(i))}</wp:post_name><wp:status>{cdata('publish')}</wp:status><wp:post_parent>0</wp:post_parent><wp:menu_order>{order}</wp:menu_order><wp:post_type>{cdata('nav_menu_item')}</wp:post_type><wp:post_password>{cdata('')}</wp:post_password><wp:is_sticky>0</wp:is_sticky><category domain="nav_menu" nicename="{slug}">{cdata("Baderinfo " + LNAME[lang])}</category>{m}</item>""")
            return i
        P = lambda *t: pid[(lang, tuple(t))]
        ui = lambda k: DC.UI[k][lang]
        o = 0
        mitem(ui('home'), P(), order=(o := o + 1))
        sv = mitem(DS.SERVICES['title'][lang], P('services'), order=(o := o + 1))
        for n in C.TREE:
            mitem(n['n'][lang], P('services', n['slug']), parent=sv, order=(o := o + 1))
        mitem(DS.SHOP['title'][lang], P(SHOP_SLUG), order=(o := o + 1))
        mitem(DS.BLOG['title'][lang], P('blog'), order=(o := o + 1))
        mitem(DS.PORTFOLIO['title'][lang], P('portfolio'), order=(o := o + 1))
        mitem(DS.ABOUT['title'][lang], P('about'), order=(o := o + 1))
        mitem(DS.CONTACT['title'][lang], P('contact'), order=(o := o + 1))
        mitem(DS.REQUEST['title'][lang], P('request'), order=(o := o + 1), cls='bi-menu-cta')
        for l2 in LANGS:
            if l2 != lang:
                mitem(LNAME[l2], url=home_url(l2), order=(o := o + 1), cls='bi-menu-lang')
    head = f"""<?xml version="1.0" encoding="UTF-8" ?>
<!-- Baderinfo pages — generated by build_site.py -->
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
<title>Baderinfo</title><link>{BASE or 'https://example.com'}</link><description></description><pubDate>Wed, 01 Jan 2025 12:00:00 +0000</pubDate><language>ar</language>
<wp:wxr_version>1.2</wp:wxr_version><wp:base_site_url>{BASE or 'https://example.com'}</wp:base_site_url><wp:base_blog_url>{BASE or 'https://example.com'}</wp:base_blog_url>
<generator>https://wordpress.org/?v=6.5</generator>
"""
    return head + '\n'.join(terms) + '\n' + '\n'.join(items) + '\n</channel>\n</rss>\n'

# ------------------------------------------------------------------ مخرجات
def fname(p):
    return '__'.join(p['tail']) if p['tail'] else 'home'

CSS_PATH = os.path.join(ROOT, '..', 'plugins', 'blr-service-requests', 'assets', 'bi-pages.css')

def preview_doc(p):
    lang = p['lang']
    note = {'ar': '(سيظهر هنا المحتوى/النموذج بعد تفعيل إضافة نماذج الخدمات)', 'en': '(This block renders once the service-requests plugin is active)', 'fr': '(Ce bloc s’affiche une fois le plugin activé)'}[lang]
    body = re.sub(r'\[bi_[a-z_]+[^\]]*\]', f'<div class="bi-placeholder">{note}</div>', p['html'])
    css = open(CSS_PATH, encoding='utf-8').read() if os.path.exists(CSS_PATH) else ''
    return (f'<!doctype html><html lang="{lang}" dir="{DIRS[lang]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{esc(p["title"])}</title><style>body{{margin:0;background:#f5f7fb}}{css}</style></head><body>{body}</body></html>')

def main():
    build_all()
    by = {l: [p for p in PAGES if p['lang'] == l] for l in LANGS}
    os.makedirs(OUT, exist_ok=True)
    for sub in ('pages', 'preview'):
        for l in LANGS:
            os.makedirs(os.path.join(OUT, sub, l), exist_ok=True)
    for p in PAGES:
        with open(os.path.join(OUT, 'pages', p['lang'], fname(p) + '.html'), 'w', encoding='utf-8') as f:
            f.write(p['html'])
        with open(os.path.join(OUT, 'preview', p['lang'], fname(p) + '.html'), 'w', encoding='utf-8') as f:
            f.write(preview_doc(p))
    with open(os.path.join(OUT, 'baderinfo-pages.xml'), 'w', encoding='utf-8') as f:
        f.write(wxr(by))
    # خريطة الروابط
    with open(os.path.join(OUT, 'link-map.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['lang', 'page_title', 'page_url', 'parent_url', 'button_or_link_type', 'link_label', 'target_url'])
        for p in PAGES:
            pu = home_url(p['lang']) if not p['tail'] else U(p['lang'], (['services'] if False else []) + p['tail'])
            par = '' if len(p['tail']) <= 0 else (U(p['lang'], p['tail'][:-1]) if len(p['tail']) > 1 else home_url(p['lang']))
            for typ, lab, tgt in p['links']:
                w.writerow([p['lang'], p['title'], pu, par, typ, lab, tgt])
    # كتالوج النماذج
    os.makedirs(PLUGIN_DATA, exist_ok=True)
    cj = catalog_json()
    with open(os.path.join(PLUGIN_DATA, 'catalog.json'), 'w', encoding='utf-8') as f:
        json.dump(cj, f, ensure_ascii=False, separators=(',', ':'))
    # فهرس تفاعلي
    write_index(by)
    print('pages:', len(PAGES), {l: len(by[l]) for l in LANGS}, '| services in form:', sum(len(g['services']) for g in cj['groups']))

def write_index(by):
    rows = {l: [] for l in LANGS}
    for l in LANGS:
        for p in sorted(by[l], key=lambda x: (x['tail'][:1] != ['services'] and 0, x['tail'])) if False else by[l]:
            pass
    data = []
    for p in PAGES:
        data.append({'l': p['lang'], 't': p['title'], 'u': (home_url(p['lang']) if not p['tail'] else U(p['lang'], p['tail'])), 'd': len(p['tail']), 'f': fname(p), 'k': p['kind'], 'h': p['html']})
    js = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
    tpl = open(os.path.join(ROOT, 'index_template.html'), encoding='utf-8').read()
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(tpl.replace('/*DATA*/[]', js))

if __name__ == '__main__':
    main()
