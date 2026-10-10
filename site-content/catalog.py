# -*- coding: utf-8 -*-
"""شجرة خدمات Baderinfo.com — مصدر واحد للصفحات والنماذج والقوائم.
كل عقدة: slug, names=(ar,en,fr), group (نوع المحتوى), children (اختياري)."""

LANGS = ['ar', 'en', 'fr']

def N(ar, en, fr):
    return {'ar': ar, 'en': en, 'fr': fr}

def leaf(slug, ar, en, fr, **kw):
    d = {'slug': slug, 'n': N(ar, en, fr)}
    d.update(kw)
    return d

def node(slug, ar, en, fr, children, **kw):
    d = {'slug': slug, 'n': N(ar, en, fr), 'children': children}
    d.update(kw)
    return d

TREE = [
 node('web-design', 'تصميم وتطوير المواقع', 'Website Design & Development', 'Conception et développement de sites web', icon='🌐', group='web', children=[
  node('store', 'تصميم متجر الكتروني', 'E-commerce Store Design', 'Création de boutique en ligne', niche='store', children=[
    leaf('large-store', 'متجر كبير', 'Large Store', 'Grande boutique', tier='store_l'),
    leaf('medium-store', 'متجر متوسط', 'Medium Store', 'Boutique moyenne', tier='store_m'),
    leaf('small-store', 'متجر صغير', 'Small Store', 'Petite boutique', tier='store_s')]),
  node('website', 'تصميم موقع الكتروني', 'Website Design', 'Création de site web', niche='website', children=[
    leaf('dynamic-website', 'موقع الكتروني ديناميكي', 'Dynamic Website', 'Site web dynamique', tier='dynamic'),
    leaf('informational-website', 'موقع الكتروني تعريفي', 'Informational Website', 'Site vitrine', tier='info'),
    leaf('specialized-website', 'موقع الكتروني متخصص', 'Specialized Website', 'Site web spécialisé', tier='spec')]),
  node('real-estate', 'تصميم موقع عقاري', 'Real-Estate Website Design', 'Site immobilier', niche='realestate', children=[
    leaf('specialized', 'موقع عقاري متخصص', 'Specialized Real-Estate Website', 'Site immobilier spécialisé', tier='spec'),
    leaf('informational', 'موقع عقاري تعريفي', 'Informational Real-Estate Website', 'Site immobilier vitrine', tier='info')]),
  node('company', 'تصميم موقع شركة', 'Company Website Design', 'Site d\'entreprise', niche='company', children=[
    leaf('specialized', 'موقع شركة متخصص', 'Specialized Company Website', 'Site d\'entreprise spécialisé', tier='spec'),
    leaf('informational', 'موقع شركة تعريفي', 'Informational Company Website', 'Site d\'entreprise vitrine', tier='info')]),
  node('newspaper', 'تصميم جريدة الكترونية', 'Online Newspaper Design', 'Journal en ligne', niche='newspaper', children=[
    leaf('specialized', 'جريدة الكترونية متخصصة', 'Specialized Online Newspaper', 'Journal en ligne spécialisé', tier='spec'),
    leaf('informational', 'جريدة الكترونية تعريفية', 'Informational Online Newspaper', 'Journal en ligne vitrine', tier='info')]),
  node('education', 'تصميم موقع تعليمي', 'Educational Website Design', 'Site éducatif', niche='education', children=[
    leaf('specialized', 'موقع تعليمي متخصص', 'Specialized Educational Website', 'Site éducatif spécialisé', tier='spec'),
    leaf('informational', 'موقع تعليمي تعريفي', 'Informational Educational Website', 'Site éducatif vitrine', tier='info')]),
  node('academy', 'تصميم موقع اكاديمية', 'Academy Website Design', 'Site d\'académie', niche='academy', children=[
    leaf('specialized', 'موقع اكاديمية متخصص', 'Specialized Academy Website', 'Site d\'académie spécialisé', tier='spec'),
    leaf('informational', 'موقع اكاديمية تعريفي', 'Informational Academy Website', 'Site d\'académie vitrine', tier='info')]),
  node('tourism', 'تصميم موقع سياحي', 'Tourism Website Design', 'Site touristique', niche='tourism', children=[
    leaf('specialized', 'موقع سياحي متخصص', 'Specialized Tourism Website', 'Site touristique spécialisé', tier='spec'),
    leaf('informational', 'موقع سياحي تعريفي', 'Informational Tourism Website', 'Site touristique vitrine', tier='info')]),
  node('medical', 'تصميم موقع طبي', 'Medical Website Design', 'Site médical', niche='medical', children=[
    leaf('specialized', 'موقع طبي متخصص', 'Specialized Medical Website', 'Site médical spécialisé', tier='spec'),
    leaf('informational', 'موقع طبي تعريفي', 'Informational Medical Website', 'Site médical vitrine', tier='info')]),
  node('personal-blog', 'تصميم موقع او مدونة شخصية', 'Personal Website or Blog Design', 'Site ou blog personnel', niche='blog', children=[
    leaf('specialized', 'موقع او مدونة شخصية متخصصة', 'Specialized Personal Website or Blog', 'Site ou blog personnel spécialisé', tier='spec'),
    leaf('informational', 'موقع او مدونة شخصية تعريفية', 'Informational Personal Website or Blog', 'Site ou blog personnel vitrine', tier='info')]),
 ]),
 node('apps', 'تصميم التطبيقات', 'App Design & Development', 'Conception d\'applications', icon='📱', group='apps', children=[
  node('website-apps', 'تطبيقات المواقع', 'Website Apps', 'Applications de sites web', children=[
    leaf('web-to-app', 'تحويل المواقع الى تطبيقات', 'Convert Websites to Apps', 'Convertir un site en application', niche='web2app'),
    leaf('android-apps', 'تطبيقات أندرويد', 'Android Apps', 'Applications Android', niche='android')]),
 ]),
 node('management-software', 'برامج التسيير', 'Management Software', 'Logiciels de gestion', icon='🧾', group='pos', children=[
  node('shops-management', 'تسيير محلات', 'Shop Management', 'Gestion de magasins', pos='shop', children=[
    leaf('all-shops', 'جميع المحلات', 'All Shop Types', 'Tous types de magasins', niche='shop_all'),
    leaf('grocery', 'مواد غذائية', 'Grocery & Food', 'Alimentation générale', niche='shop_grocery'),
    leaf('mobile-phones', 'الهواتف النقالة', 'Mobile Phones', 'Téléphonie mobile', niche='shop_phones'),
    leaf('computers-it', 'الاعلام الالي', 'Computers & IT', 'Informatique', niche='shop_it'),
    leaf('cosmetics', 'مواد التجميل', 'Cosmetics', 'Cosmétiques', niche='shop_cosmetics'),
    leaf('clothing', 'الملابس', 'Clothing', 'Vêtements', niche='shop_clothing'),
    leaf('building-materials', 'مواد البناء', 'Building Materials', 'Matériaux de construction', niche='shop_building'),
    leaf('sweets-bakery', 'الحلويات', 'Sweets & Pastry', 'Pâtisserie', niche='shop_sweets'),
    leaf('stationery', 'مواد مكتبية', 'Stationery', 'Papeterie', niche='shop_stationery')]),
  node('enterprise-management', 'برامج ادارة المؤسسات والشركات', 'Enterprise & Company Management', 'Gestion des entreprises et institutions', pos='ent', children=[
    leaf('government-institutions', 'ادارة المؤسسات الحكومية', 'Government Institutions', 'Institutions publiques', niche='ent_gov'),
    leaf('private-institutions', 'ادارة المؤسسات الخاصة', 'Private Institutions', 'Institutions privées', niche='ent_private'),
    leaf('small-businesses', 'ادارة المؤسسات الصغيرة', 'Small Businesses', 'Petites entreprises', niche='ent_small'),
    leaf('project-management', 'ادارة المشاريع', 'Project Management', 'Gestion de projets', niche='ent_projects'),
    leaf('print-shop', 'ادارة مطبعة', 'Print Shop Management', 'Gestion d\'imprimerie', niche='ent_print')]),
  node('health-management', 'برنامج ادارة المؤسسات الصحية', 'Healthcare Facility Management', 'Gestion des établissements de santé', pos='health', children=[
    leaf('hospitals', 'ادارة المستشفيات', 'Hospital Management', 'Gestion hospitalière', niche='h_hospital'),
    leaf('group-clinics', 'ادارة العيادات الجماعية', 'Group Clinics', 'Cabinets de groupe', niche='h_group'),
    leaf('private-clinics', 'ادارة العيادات الخاصة', 'Private Clinics', 'Cabinets privés', niche='h_private'),
    leaf('pharmacies', 'ادارة الصيدليات', 'Pharmacy Management', 'Gestion de pharmacies', niche='h_pharmacy'),
    leaf('treatment-rooms', 'ادارة قاعات العلاج', 'Treatment Rooms', 'Salles de soins', niche='h_rooms')]),
  node('billing-software', 'برامج الفوترة', 'Billing Software', 'Logiciels de facturation', pos='billing', children=[
    leaf('fatoorati', 'برنامج فاتورتي', 'Fatoorati Software', 'Logiciel Fatoorati', niche='b_fatoorati'),
    leaf('invoicing', 'برنامج فوترة', 'Invoicing Software', 'Logiciel de facturation', niche='b_invoicing'),
    leaf('online-accounts', 'برنامج ادارة الحسابات الالكترونية', 'Online Accounts Management', 'Gestion de comptes en ligne', niche='b_accounts')]),
 ]),
 node('graphic-design', 'خدمات التصميم والجرافيك', 'Design & Graphic Services', 'Services de design et graphisme', icon='🎨', group='graphic', children=[
  node('logo-design', 'تصميم الشعارات', 'Logo Design', 'Création de logos', children=[
    leaf('institution-logo', 'تصميم شعار مؤسسة', 'Institution Logo', 'Logo d\'institution', niche='g_logo_inst'),
    leaf('personal-logo', 'تصميم شعار خاص', 'Personal Logo', 'Logo personnel', niche='g_logo_personal'),
    leaf('company-logo', 'تصميم شعار شركة', 'Company Logo', 'Logo d\'entreprise', niche='g_logo_company')]),
  node('visual-identity', 'تصميم هوية بصرية', 'Visual Identity Design', 'Identité visuelle', children=[
    leaf('full-identity', 'تصميم هوية بصرية كاملة', 'Full Visual Identity', 'Identité visuelle complète', niche='g_identity'),
    leaf('promo-videos', 'تصميم فيديوهات ترويجية', 'Promotional Videos', 'Vidéos promotionnelles', niche='g_video'),
    leaf('ad-images', 'تصميم صور اعلانية', 'Advertising Images', 'Visuels publicitaires', niche='g_adimages')]),
 ]),
 node('digital-marketing', 'التسويق الرقمي', 'Digital Marketing', 'Marketing digital', icon='📣', group='marketing', children=[
  node('paid-ads', 'اعلانات ممولة', 'Paid Advertising', 'Publicité sponsorisée', children=[
    leaf('facebook-ads', 'اعلانات الفيس بوك', 'Facebook Ads', 'Publicités Facebook', niche='m_fb'),
    leaf('instagram-ads', 'اعلانات الانستغرام', 'Instagram Ads', 'Publicités Instagram', niche='m_ig'),
    leaf('tiktok-ads', 'اعلانات التيك توك', 'TikTok Ads', 'Publicités TikTok', niche='m_tt'),
    leaf('social-media-ads', 'اعلانات السوشل ميديا', 'Social Media Ads', 'Publicités réseaux sociaux', niche='m_social')]),
  node('social-pages', 'انشاء صفحات التواصل الاجتماعي', 'Social Media Page Setup', 'Création de pages réseaux sociaux', children=[
    leaf('facebook-page', 'انشاء صفحة فيس بوك', 'Create a Facebook Page', 'Créer une page Facebook', niche='m_fbpage'),
    leaf('instagram-page', 'انشاء صفحة انستغرام', 'Create an Instagram Page', 'Créer un compte Instagram', niche='m_igpage'),
    leaf('tiktok-page', 'انشاء صفحة تيك توك', 'Create a TikTok Page', 'Créer un compte TikTok', niche='m_ttpage')]),
  leaf('advertise-on-our-sites', 'الإعلان على مواقعنا', 'Advertise on Our Websites', 'Faire de la publicité sur nos sites', niche='m_adsites'),
 ]),
 node('wordpress-plugins', 'برمجة وتطوير إضافات الووردبريس', 'WordPress Plugin Development', 'Développement de plugins WordPress', icon='🧩', group='plugin', children=[
  leaf('cash-on-delivery', 'اضافة الدفع عند الاستلام', 'Cash on Delivery Plugin', 'Plugin paiement à la livraison', niche='p_cod'),
  leaf('sell-from-product-page', 'اضافة البيع من صفحة المنتج', 'Sell from Product Page Plugin', 'Plugin vente depuis la page produit', niche='p_quick'),
  leaf('certificate-verification', 'اضافة التاكد من الشهادات', 'Certificate Verification Plugin', 'Plugin de vérification des certificats', niche='p_cert'),
  leaf('diploma-verification', 'اضافة توثيق الدبلومات', 'Diploma Authentication Plugin', 'Plugin d\'authentification des diplômes', niche='p_diploma'),
 ]),
 leaf('landing-pages', 'تصميم صفحات الهبوط', 'Landing Page Design', 'Conception de pages de destination', icon='🚀', group='landing', niche='landing'),
]

# صفحات ثابتة
STATIC = [
 ('services', N('خدماتنا', 'Our Services', 'Nos services')),
 ('shop', N('المتجر', 'Shop', 'Boutique')),
 ('blog', N('المدونة', 'Blog', 'Blog')),
 ('portfolio', N('أعمالنا', 'Our Work', 'Nos réalisations')),
 ('about', N('من نحن', 'About Us', 'À propos')),
 ('contact', N('اتصل بنا', 'Contact Us', 'Contact')),
 ('request', N('طلب خدمة', 'Request a Service', 'Demande de service')),
]
SHOP_CHILDREN = [
 ('physical-products', N('متجر المنتجات المادية', 'Physical Products Store', 'Boutique de produits physiques')),
 ('digital-products', N('متجر المنتجات الرقمية', 'Digital Products Store', 'Boutique de produits numériques')),
]

def walk():
    """يُرجع قائمة مسطّحة: dict(path=[slugs], node, depth, parent_path)"""
    out = []
    def rec(nodes, path, depth):
        for i, nd in enumerate(nodes):
            p = path + [nd['slug']]
            out.append({'path': p, 'node': nd, 'depth': depth, 'order': i, 'leaf': 'children' not in nd})
            if 'children' in nd:
                rec(nd['children'], p, depth + 1)
    rec(TREE, [], 1)
    return out

def find(path):
    for it in walk():
        if it['path'] == path:
            return it
    return None

def service_id(path):
    return '/'.join(path)

if __name__ == '__main__':
    w = walk()
    print(len(w), 'service nodes;', sum(1 for x in w if x['leaf']), 'leaves')
