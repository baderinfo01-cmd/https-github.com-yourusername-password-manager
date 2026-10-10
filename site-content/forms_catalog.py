# -*- coding: utf-8 -*-
"""حقول نموذج طلب الخدمة لكل خدمة (ثلاث لغات). الصيغة: 'عربي|English|Français'."""

LANGS = ('ar', 'en', 'fr')

def L(s):
    p = s.split('|')
    if len(p) == 1:
        p = p * 3
    assert len(p) == 3, s
    return dict(zip(LANGS, p))

def F(key, typ, label, opts=None, req=False, ph=None):
    d = {'k': key, 't': typ, 'l': L(label)}
    if opts:
        d['o'] = [{'v': L(o)['en'], 'l': L(o)} for o in opts.split(';')]
    if req:
        d['r'] = 1
    if ph:
        d['ph'] = L(ph)
    return d

YN = 'نعم|Yes|Oui;لا|No|Non'
YNL = 'نعم|Yes|Oui;لا|No|Non;لست متأكداً|Not sure|Pas sûr'
LANGOPT = 'العربية|Arabic|Arabe;الإنجليزية|English|Anglais;الفرنسية|French|Français;لغات أخرى|Other languages|Autres langues'
PAY = 'بطاقات بنكية|Bank cards|Cartes bancaires;PayPal|PayPal|PayPal;تحويل بنكي|Bank transfer|Virement bancaire;الدفع عند الاستلام|Cash on delivery|Paiement à la livraison;محافظ إلكترونية|E-wallets|Portefeuilles électroniques'
PLAT = 'ويندوز|Windows|Windows;متصفح (ويب)|Web browser|Navigateur web;الاثنان معاً|Both|Les deux'

# ---------- حقول مشتركة لجميع الخدمات ----------
COMMON = [
    F('name', 'text', 'الاسم الكامل|Full name|Nom complet', req=True),
    F('email', 'email', 'البريد الإلكتروني|Email|E-mail', req=True),
    F('phone', 'tel', 'رقم الهاتف / واتساب|Phone / WhatsApp|Téléphone / WhatsApp', req=True, ph='+000 000 000 000|+000 000 000 000|+000 000 000 000'),
    F('country', 'text', 'الدولة والمدينة|Country and city|Pays et ville'),
    F('company', 'text', 'اسم النشاط أو الشركة (إن وجد)|Business or company name (if any)|Nom de l’activité ou société (le cas échéant)'),
]
FOOT = [
    F('budget', 'select', 'الميزانية التقريبية|Approximate budget|Budget approximatif', 'أقل من 200$|Under $200|Moins de 200 $;200$ – 500$|$200 – $500|200 $ – 500 $;500$ – 1500$|$500 – $1,500|500 $ – 1 500 $;أكثر من 1500$|Over $1,500|Plus de 1 500 $;أحتاج عرض سعر|I need a quote|Je souhaite un devis'),
    F('deadline', 'select', 'المدة المطلوبة|Required timeline|Délai souhaité', 'عاجل (أقل من أسبوع)|Urgent (under a week)|Urgent (moins d’une semaine);خلال شهر|Within a month|Sous un mois;1 – 3 أشهر|1 – 3 months|1 à 3 mois;مرن|Flexible|Flexible'),
    F('contact_pref', 'select', 'طريقة التواصل المفضلة|Preferred contact method|Moyen de contact préféré', 'واتساب|WhatsApp|WhatsApp;البريد الإلكتروني|Email|E-mail;اتصال هاتفي|Phone call|Appel téléphonique'),
    F('details', 'textarea', 'تفاصيل إضافية وأي ملاحظات|Additional details and notes|Détails et remarques supplémentaires', req=True, ph='صف فكرتك ومتطلباتك بأكبر قدر من الوضوح|Describe your idea and requirements as clearly as possible|Décrivez votre idée et vos besoins le plus clairement possible'),
]

# ---------- المواقع ----------
def web_base():
    return [
        F('has_site', 'select', 'هل لديك موقع حالياً؟|Do you already have a website?|Avez-vous déjà un site ?', YN),
        F('site_url', 'url', 'رابط الموقع الحالي (إن وجد)|Current website URL (if any)|URL du site actuel (le cas échéant)', ph='https://'),
        F('domain', 'select', 'الدومين والاستضافة|Domain and hosting|Domaine et hébergement', 'لدي دومين واستضافة|I have both|J’ai les deux;لدي دومين فقط|Domain only|Domaine seulement;أحتاج الاثنين|I need both|J’ai besoin des deux'),
        F('langs', 'checkbox', 'لغات الموقع|Website languages|Langues du site', LANGOPT),
        F('content', 'select', 'جاهزية المحتوى (نصوص وصور)|Content readiness (texts & images)|Contenu prêt (textes et images)', 'جاهز|Ready|Prêt;جاهز جزئياً|Partly ready|Partiellement prêt;أحتاج المساعدة في كتابته|I need help writing it|J’ai besoin d’aide pour le rédiger'),
        F('logo', 'select', 'هل لديك شعار وهوية بصرية؟|Do you have a logo and brand identity?|Avez-vous un logo et une identité visuelle ?', YN),
        F('refs', 'textarea', 'مواقع تعجبك كمرجع للتصميم|Reference websites you like|Sites de référence qui vous plaisent', ph='روابط مواقع|Website links|Liens de sites'),
    ]

WEB = {
 'store': [
    F('products', 'select', 'عدد المنتجات المتوقع|Expected number of products|Nombre de produits prévu', 'أقل من 50|Under 50|Moins de 50;50 – 500|50 – 500|50 à 500;500 – 5000|500 – 5,000|500 à 5 000;أكثر من 5000|Over 5,000|Plus de 5 000'),
    F('ptype', 'checkbox', 'نوع المنتجات|Product types|Types de produits', 'منتجات مادية|Physical products|Produits physiques;منتجات رقمية|Digital products|Produits numériques;اشتراكات|Subscriptions|Abonnements;خدمات وحجوزات|Services and bookings|Services et réservations'),
    F('pay', 'checkbox', 'طرق الدفع المطلوبة|Required payment methods|Moyens de paiement souhaités', PAY),
    F('ship', 'checkbox', 'الشحن والتوصيل|Shipping and delivery|Expédition et livraison', 'شركات شحن|Shipping companies|Transporteurs;توصيل محلي|Local delivery|Livraison locale;استلام من المتجر|In-store pickup|Retrait en magasin;شحن دولي|International shipping|Expédition internationale'),
    F('feat', 'checkbox', 'ميزات إضافية|Extra features|Fonctions supplémentaires', 'كوبونات وعروض|Coupons and offers|Coupons et offres;تقييمات المنتجات|Product reviews|Avis produits;قائمة رغبات ومقارنة|Wishlist and compare|Favoris et comparaison;تعدد العملات|Multi-currency|Multi-devises;ربط مع المخزون/برنامج محاسبة|Stock/accounting integration|Intégration stock/comptabilité;تعدد البائعين|Multi-vendor marketplace|Marketplace multi-vendeurs'),
 ],
 'website': [
    F('pages', 'checkbox', 'الصفحات المطلوبة|Required pages|Pages souhaitées', 'الرئيسية|Home|Accueil;من نحن|About|À propos;الخدمات|Services|Services;المعرض|Gallery|Galerie;المدونة|Blog|Blog;اتصل بنا|Contact|Contact;الأسئلة الشائعة|FAQ|FAQ'),
    F('feat', 'checkbox', 'وظائف مطلوبة|Required functions|Fonctions souhaitées', 'نماذج اتصال|Contact forms|Formulaires de contact;تسجيل ودخول أعضاء|Member login|Espace membres;حجوزات|Bookings|Réservations;دفع إلكتروني|Online payments|Paiement en ligne;لوحة تحكم مخصصة|Custom dashboard|Tableau de bord sur mesure;تكامل مع أنظمة خارجية|Third-party integrations|Intégrations tierces'),
 ],
 'realestate': [
    F('listings', 'select', 'عدد العقارات المتوقع|Expected number of listings|Nombre de biens prévu', 'أقل من 50|Under 50|Moins de 50;50 – 500|50 – 500|50 à 500;أكثر من 500|Over 500|Plus de 500'),
    F('feat', 'checkbox', 'ميزات العقارات|Real-estate features|Fonctions immobilières', 'بحث متقدم وفلاتر|Advanced search and filters|Recherche avancée et filtres;خريطة تفاعلية|Interactive map|Carte interactive;إضافة العقارات من الملاك/الوكلاء|Owner/agent submissions|Dépôt d’annonces par propriétaires/agents;جولة 360 وفيديو|360° tours and video|Visites 360° et vidéo;حاسبة التمويل|Mortgage calculator|Simulateur de crédit;مقارنة العقارات|Property comparison|Comparateur de biens;حسابات ووكلاء|Accounts and agents|Comptes et agents'),
    F('deal', 'checkbox', 'نوع الصفقات|Deal types|Types de transactions', 'بيع|Sale|Vente;إيجار|Rent|Location;إيجار يومي|Short-term rental|Location courte durée'),
 ],
 'company': [
    F('sector', 'text', 'مجال الشركة|Company sector|Secteur de la société'),
    F('feat', 'checkbox', 'أقسام الموقع|Site sections|Rubriques du site', 'الخدمات والمنتجات|Services and products|Services et produits;فريق العمل|Team|Équipe;المشاريع والأعمال|Projects and portfolio|Projets et réalisations;العملاء والشركاء|Clients and partners|Clients et partenaires;الوظائف|Careers|Carrières;طلب عرض سعر|Quote request|Demande de devis;الأخبار|News|Actualités;تحميل الكتالوجات|Catalog downloads|Téléchargement de catalogues'),
 ],
 'newspaper': [
    F('feat', 'checkbox', 'ميزات الجريدة|Newspaper features|Fonctions du journal', 'أقسام وتصنيفات|Sections and categories|Rubriques et catégories;شريط الأخبار العاجلة|Breaking-news ticker|Bandeau d’actualités;كتّاب ومحررون وصلاحيات|Authors, editors and roles|Auteurs, rédacteurs et rôles;إعلانات ومساحات إعلانية|Ad spaces|Espaces publicitaires;نشرة بريدية|Newsletter|Newsletter;تعليقات|Comments|Commentaires;فيديو وبث|Video and live|Vidéo et direct;اشتراكات مدفوعة|Paid subscriptions|Abonnements payants'),
    F('posts', 'select', 'عدد الأخبار اليومية المتوقع|Expected daily posts|Articles quotidiens prévus', '1 – 10|1 – 10|1 à 10;10 – 50|10 – 50|10 à 50;أكثر من 50|Over 50|Plus de 50'),
 ],
 'education': [
    F('feat', 'checkbox', 'ميزات تعليمية|Education features|Fonctions éducatives', 'دروس ومواد|Lessons and materials|Cours et supports;اختبارات وتقييم|Quizzes and assessments|Quiz et évaluations;حسابات طلاب ومعلمين|Student and teacher accounts|Comptes élèves et enseignants;فيديو ومحتوى مدفوع|Video and paid content|Vidéo et contenu payant;شهادات إلكترونية|Online certificates|Certificats en ligne;منتدى ونقاش|Forum and discussion|Forum et discussion'),
    F('level', 'select', 'المستوى التعليمي|Education level|Niveau d’enseignement', 'مدرسة|School|École;جامعة|University|Université;تدريب مهني|Vocational|Formation professionnelle;دروس عامة|General courses|Cours généraux'),
 ],
 'academy': [
    F('feat', 'checkbox', 'ميزات الأكاديمية|Academy features|Fonctions de l’académie', 'عرض الدورات والتسجيل|Course listing and enrollment|Catalogue et inscription;دفع الرسوم|Fee payment|Paiement des frais;جداول ومواعيد|Schedules|Plannings;ملفات المدربين|Trainer profiles|Profils des formateurs;تعلّم عن بعد/بث مباشر|Online/live classes|Cours en ligne/direct;شهادات وتحقق منها|Certificates and verification|Certificats et vérification;شهادات الخريجين|Alumni testimonials|Témoignages d’anciens'),
    F('courses', 'select', 'عدد الدورات|Number of courses|Nombre de cours', 'أقل من 10|Under 10|Moins de 10;10 – 50|10 – 50|10 à 50;أكثر من 50|Over 50|Plus de 50'),
 ],
 'tourism': [
    F('feat', 'checkbox', 'ميزات السياحة|Tourism features|Fonctions touristiques', 'برامج ورحلات|Tour packages|Circuits et voyages;حجز إلكتروني|Online booking|Réservation en ligne;فنادق وإقامات|Hotels and stays|Hôtels et séjours;تأجير سيارات|Car rental|Location de voitures;معارض صور وفيديو|Photo/video galleries|Galeries photos/vidéos;خرائط ووجهات|Maps and destinations|Cartes et destinations;دفع مسبق|Advance payment|Paiement anticipé'),
    F('market', 'select', 'الفئة المستهدفة|Target market|Clientèle cible', 'سياحة داخلية|Domestic|Tourisme local;سياحة خارجية|Outbound|Voyages à l’étranger;مختلط|Both|Les deux'),
 ],
 'medical': [
    F('feat', 'checkbox', 'ميزات طبية|Medical features|Fonctions médicales', 'حجز مواعيد|Appointment booking|Prise de rendez-vous;ملفات الأطباء|Doctor profiles|Profils des médecins;الأقسام والخدمات|Departments and services|Services et départements;استشارات عن بعد|Teleconsultation|Téléconsultation;نتائج وتقارير للمرضى|Patient results portal|Portail de résultats;مقالات توعوية|Health articles|Articles de santé;طلب أدوية/منتجات|Product/medicine ordering|Commande de produits'),
    F('entity', 'select', 'نوع الجهة|Entity type|Type d’établissement', 'مستشفى|Hospital|Hôpital;مجمع عيادات|Clinics group|Groupe de cabinets;عيادة خاصة|Private clinic|Cabinet privé;صيدلية|Pharmacy|Pharmacie;مركز علاجي|Treatment center|Centre de soins'),
 ],
 'blog': [
    F('feat', 'checkbox', 'ميزات المدونة|Blog features|Fonctions du blog', 'سيرة ذاتية ومعرض أعمال|Bio and portfolio|Bio et portfolio;نشرة بريدية|Newsletter|Newsletter;منتجات أو دورات للبيع|Products or courses for sale|Produits ou cours à vendre;دعم/تبرعات|Support/donations|Soutien/dons;تعليقات وتفاعل|Comments|Commentaires;مشاركة على التواصل|Social sharing|Partage social'),
    F('purpose', 'select', 'الغرض الرئيسي|Main purpose|Objectif principal', 'مدونة|Blog|Blog;سيرة/سيرة مهنية|Personal/CV site|Site CV/personnel;مدونة تجارية|Business blog|Blog professionnel'),
 ],
}
WEB_TIER = F('size', 'select', 'حجم المشروع|Project size|Taille du projet', 'صغير وبسيط|Small and simple|Petit et simple;متوسط|Medium|Moyen;كبير ومتقدم|Large and advanced|Grand et avancé')

# ---------- برامج الإدارة ----------
POS_BASE = [
    F('biz', 'text', 'اسم النشاط|Business name|Nom de l’activité'),
    F('branches', 'select', 'عدد الفروع|Number of branches|Nombre de succursales', '1|1|1;2 – 5|2 – 5|2 à 5;أكثر من 5|More than 5|Plus de 5'),
    F('users', 'select', 'عدد المستخدمين (الكاشير/الموظفين)|Number of users|Nombre d’utilisateurs', '1 – 2|1 – 2|1 à 2;3 – 10|3 – 10|3 à 10;أكثر من 10|More than 10|Plus de 10'),
    F('platform', 'select', 'منصة التشغيل|Platform|Plateforme', PLAT),
    F('migrate', 'select', 'هل لديك بيانات قديمة لنقلها؟|Do you have existing data to import?|Avez-vous des données à importer ?', 'نعم (إكسل/برنامج آخر)|Yes (Excel/other software)|Oui (Excel/autre logiciel);لا، البداية من الصفر|No, starting fresh|Non, nouveau départ'),
]
POS_FEAT = 'نقطة بيع وباركود|POS and barcode|Caisse et code-barres;طباعة فواتير وإيصالات|Invoice/receipt printing|Impression factures/tickets;إدارة المخزون|Stock management|Gestion du stock;مشتريات وموردون|Purchases and suppliers|Achats et fournisseurs;ديون وأقساط|Debts and installments|Créances et échéances;تقارير الأرباح|Profit reports|Rapports de bénéfices;صلاحيات المستخدمين|User permissions|Droits utilisateurs;نسخ احتياطي|Backups|Sauvegardes;ربط بمتجر إلكتروني|Online store link|Lien avec boutique en ligne'
def pos(extra_label, extra_opts, more=None):
    out = list(POS_BASE)
    out.append(F('feat', 'checkbox', 'الوظائف المطلوبة|Required functions|Fonctions souhaitées', POS_FEAT))
    out.append(F('special', 'checkbox', extra_label, extra_opts))
    if more:
        out.extend(more)
    return out

POS = {
 'shop_all': pos('خصائص حسب نشاطك|Features for your activity|Fonctions selon votre activité', 'وحدات وأوزان|Units and weights|Unités et poids;تواريخ صلاحية|Expiry dates|Dates de péremption;تعدد المخازن|Multiple warehouses|Plusieurs entrepôts;برنامج ولاء|Loyalty program|Programme de fidélité'),
 'shop_grocery': pos('خصائص البقالة|Grocery features|Fonctions épicerie', 'بيع بالوزن (ميزان)|Weighing scale sales|Vente au poids;تواريخ صلاحية وتنبيهات|Expiry alerts|Alertes de péremption;عروض وخصومات|Offers and discounts|Offres et remises;بيع بالجملة والمفرق|Wholesale and retail|Gros et détail'),
 'shop_phones': pos('خصائص الجوالات|Phone-shop features|Fonctions téléphonie', 'تتبع IMEI/الأرقام التسلسلية|IMEI/serial tracking|Suivi IMEI/numéros de série;بيع بالتقسيط|Installment sales|Vente à crédit;صيانة وإصلاح|Repairs|Réparations;شحن رصيد وبطاقات|Top-up and cards|Recharges et cartes;استبدال/استرجاع|Trade-in/returns|Reprise/retours'),
 'shop_it': pos('خصائص الحاسوب والتقنية|Computer/IT features|Fonctions informatique', 'أرقام تسلسلية وضمان|Serials and warranty|Numéros de série et garantie;صيانة وتذاكر|Repair tickets|Tickets de réparation;تجميع أجهزة|Custom PC builds|Assemblage de PC;عروض أسعار|Quotations|Devis'),
 'shop_cosmetics': pos('خصائص التجميل|Cosmetics features|Fonctions cosmétiques', 'دفعات وتواريخ صلاحية|Batches and expiry|Lots et péremption;ماركات وأصناف|Brands and categories|Marques et catégories;كروت ولاء|Loyalty cards|Cartes de fidélité;عروض موسمية|Seasonal offers|Offres saisonnières'),
 'shop_clothing': pos('خصائص الملابس|Clothing features|Fonctions vêtements', 'مقاسات وألوان|Sizes and colors|Tailles et couleurs;مواسم وتخفيضات|Seasons and sales|Saisons et soldes;استبدال وإرجاع|Exchanges and returns|Échanges et retours;باركود للقطع|Item barcodes|Codes-barres articles'),
 'shop_building': pos('خصائص مواد البناء|Building-materials features|Fonctions matériaux', 'وحدات متعددة (طن/متر/كيس)|Multiple units (ton/meter/bag)|Unités multiples (tonne/mètre/sac);توصيل ومندوبون|Delivery and drivers|Livraison et chauffeurs;ديون العملاء الآجلة|Customer credit|Crédit clients;عروض أسعار|Quotations|Devis'),
 'shop_sweets': pos('خصائص الحلويات والمخابز|Sweets/bakery features|Fonctions pâtisserie', 'وصفات وتكلفة الإنتاج|Recipes and production cost|Recettes et coût de production;طلبات مسبقة وحجز|Pre-orders|Précommandes;تواريخ صلاحية قصيرة|Short shelf life|Courte durée de conservation;فروع وتوصيل|Branches and delivery|Succursales et livraison'),
 'shop_stationery': pos('خصائص المكتبات|Stationery features|Fonctions papeterie', 'خدمات طباعة وتصوير|Printing/copy services|Services d’impression/copie;أسعار جملة ومفرق|Wholesale/retail prices|Prix gros/détail;مخزون كبير الأصناف|Large item catalog|Grand catalogue;كتب ومناهج|Books and curricula|Livres et manuels'),
 'ent_gov': pos('نطاق المؤسسة الحكومية|Government scope|Périmètre institutionnel', 'محاسبة وميزانيات|Accounting and budgets|Comptabilité et budgets;موارد بشرية ورواتب|HR and payroll|RH et paie;أرشفة ومراسلات|Archiving and correspondence|Archivage et courrier;أصول وعهد|Assets and custody|Actifs et inventaire;تقارير ولوحات متابعة|Reports and dashboards|Rapports et tableaux de bord'),
 'ent_private': pos('نطاق المؤسسة الخاصة|Private-company scope|Périmètre entreprise', 'محاسبة وفواتير|Accounting and invoicing|Comptabilité et facturation;موارد بشرية ورواتب|HR and payroll|RH et paie;مبيعات وعملاء CRM|Sales and CRM|Ventes et CRM;مخازن ومشتريات|Warehouses and purchasing|Entrepôts et achats;تقارير إدارية|Management reports|Rapports de gestion'),
 'ent_small': pos('نطاق المنشأة الصغيرة|Small-business scope|Périmètre petite entreprise', 'فواتير وعروض أسعار|Invoices and quotes|Factures et devis;مصروفات وإيرادات|Expenses and income|Dépenses et recettes;عملاء وديون|Customers and debts|Clients et créances;مخزون بسيط|Simple stock|Stock simple'),
 'ent_projects': pos('إدارة المشاريع|Project management|Gestion de projets', 'مهام وجداول زمنية|Tasks and timelines|Tâches et calendriers;ميزانيات وتكاليف|Budgets and costs|Budgets et coûts;فرق ومقاولون|Teams and subcontractors|Équipes et sous-traitants;تقارير تقدم|Progress reports|Rapports d’avancement;مستندات ومرفقات|Documents and files|Documents et fichiers'),
 'ent_print': pos('خصائص المطابع|Print-shop features|Fonctions imprimerie', 'عروض أسعار حسب المواصفات|Spec-based quoting|Devis selon spécifications;أوامر تشغيل وإنتاج|Job orders and production|Ordres de fabrication;مواد خام ومخزون|Raw material stock|Stock de matières premières;ديون العملاء|Customer accounts|Comptes clients'),
 'h_hospital': pos('أقسام المستشفى|Hospital modules|Modules hôpital', 'استقبال وملفات المرضى|Reception and patient files|Accueil et dossiers patients;عيادات خارجية|Outpatient clinics|Consultations externes;أسرّة وتنويم|Beds and admissions|Lits et hospitalisation;مختبر|Laboratory|Laboratoire;أشعة|Radiology|Radiologie;صيدلية|Pharmacy|Pharmacie;تأمين صحي|Health insurance|Assurance santé;محاسبة وفواتير|Billing|Facturation', [F('beds', 'select', 'عدد الأسرّة|Number of beds|Nombre de lits', 'أقل من 20|Under 20|Moins de 20;20 – 100|20 – 100|20 à 100;أكثر من 100|Over 100|Plus de 100')]),
 'h_group': pos('مجمع العيادات|Clinics group|Groupe de cabinets', 'عدة عيادات وتخصصات|Multiple clinics/specialties|Plusieurs cabinets/spécialités;حجز مواعيد|Appointments|Rendez-vous;ملفات مرضى موحدة|Unified patient files|Dossiers patients unifiés;حسابات الأطباء والنسب|Doctor shares|Honoraires des médecins;تقارير مالية|Financial reports|Rapports financiers'),
 'h_private': pos('العيادة الخاصة|Private clinic|Cabinet privé', 'حجز مواعيد وتذكير|Appointments and reminders|Rendez-vous et rappels;ملف المريض والوصفات|Patient file and prescriptions|Dossier patient et ordonnances;الفواتير والمدفوعات|Invoices and payments|Factures et paiements;تقارير|Reports|Rapports;أشعة ومختبر|Imaging/lab results|Imagerie/résultats'),
 'h_pharmacy': pos('خصائص الصيدلية|Pharmacy features|Fonctions pharmacie', 'تواريخ صلاحية وتنبيهات|Expiry alerts|Alertes de péremption;أدوية بديلة|Alternative medicines|Médicaments équivalents;وصفات طبية|Prescriptions|Ordonnances;تأمين صحي|Health insurance|Assurance santé;تحكم بالمخدرات/الرقابة|Controlled-drug logs|Registre des stupéfiants;مخزون ومشتريات|Stock and purchasing|Stock et achats'),
 'h_rooms': pos('غرف العلاج|Treatment rooms|Salles de soins', 'جدولة الغرف والجلسات|Room/session scheduling|Planning des salles/séances;ملف المراجع وخطة العلاج|Client file and treatment plan|Dossier client et plan de soins;باقات وجلسات|Packages and sessions|Forfaits et séances;أجهزة وصيانة|Equipment|Équipements'),
 'b_fatoorati': pos('خصائص الفوترة|Invoicing features|Fonctions de facturation', 'فواتير ضريبية|Tax invoices|Factures fiscales;رمز QR|QR code|Code QR;عروض أسعار وسندات|Quotes and receipts|Devis et reçus;تعدد العملات|Multi-currency|Multi-devises;تصدير PDF|PDF export|Export PDF'),
 'b_invoicing': pos('خصائص الفوترة|Invoicing features|Fonctions de facturation', 'قوالب فواتير مخصصة|Custom invoice templates|Modèles de factures;فواتير متكررة|Recurring invoices|Factures récurrentes;تذكير بالدفع|Payment reminders|Relances de paiement;ربط بالدفع الإلكتروني|Online payment link|Lien de paiement en ligne'),
 'b_accounts': pos('خصائص الحسابات|Accounting features|Fonctions comptables', 'دليل حسابات|Chart of accounts|Plan comptable;قيود يومية|Journal entries|Écritures comptables;ميزان مراجعة وقوائم مالية|Trial balance and statements|Balance et états financiers;عملاء وموردون|Receivables/payables|Clients et fournisseurs;تعدد المستخدمين عن بعد|Remote multi-user access|Accès distant multi-utilisateurs'),
}

# ---------- التطبيقات والتصميم والتسويق والإضافات وصفحات الهبوط ----------
def one(*fs):
    return list(fs)

LOGO_COMMON = [
    F('brand', 'text', 'الاسم المراد كتابته في الشعار|Name to appear in the logo|Nom à faire figurer dans le logo', req=True),
    F('tagline', 'text', 'العبارة الدعائية (اختياري)|Tagline (optional)|Slogan (facultatif)'),
    F('activity', 'text', 'مجال النشاط|Field of activity|Domaine d’activité'),
    F('style', 'checkbox', 'الأسلوب المفضل|Preferred style|Style préféré', 'عصري بسيط|Modern minimal|Moderne minimaliste;كلاسيكي رسمي|Classic formal|Classique formel;كتابة عربية/خط|Calligraphy|Calligraphie;رمز/أيقونة|Symbol/icon|Symbole/icône;حيوي ملوّن|Vibrant colorful|Vif et coloré'),
    F('colors', 'text', 'ألوان مفضلة أو مستبعدة|Preferred or excluded colors|Couleurs préférées ou exclues'),
    F('logo_lang', 'checkbox', 'لغة الشعار|Logo language|Langue du logo', LANGOPT),
    F('logo_use', 'checkbox', 'مواضع الاستخدام|Where it will be used|Utilisations', 'مواقع وتواصل|Web and social|Web et réseaux;مطبوعات|Print|Imprimés;لوحات وواجهات|Signage|Enseignes;تغليف|Packaging|Emballage'),
]

SVC = {
 'web2app': one(
    F('site_url', 'url', 'رابط موقعك أو متجرك|Your website/store URL|URL de votre site/boutique', req=True, ph='https://'),
    F('cms', 'select', 'نوع الموقع|Website type|Type de site', 'ووردبريس|WordPress|WordPress;ووكومرس|WooCommerce|WooCommerce;آخر|Other|Autre'),
    F('os', 'checkbox', 'المنصات المطلوبة|Target platforms|Plateformes visées', 'أندرويد|Android|Android;آيفون iOS|iOS|iOS'),
    F('app_name', 'text', 'اسم التطبيق المقترح|Proposed app name|Nom de l’application'),
    F('feat', 'checkbox', 'الميزات|Features|Fonctions', 'إشعارات فورية|Push notifications|Notifications push;تسجيل دخول العملاء|Customer login|Connexion clients;دفع داخل التطبيق|In-app payment|Paiement dans l’app;شاشة بداية وشعار|Splash and icon|Écran d’accueil et icône;دعم عدة لغات|Multi-language|Multilingue'),
    F('store_acc', 'select', 'حساب متجر التطبيقات|App-store developer account|Compte développeur', 'لدي حساب|I have one|J’en ai un;أحتاج مساعدة في إنشائه|I need help creating it|J’ai besoin d’aide'),
 ),
 'android': one(
    F('idea', 'textarea', 'فكرة التطبيق|App idea|Idée de l’application', req=True),
    F('app_type', 'select', 'نوع التطبيق|App type|Type d’application', 'خدمات/حجوزات|Services/bookings|Services/réservations;تجارة إلكترونية|E-commerce|E-commerce;تعليمي|Education|Éducation;اجتماعي/مجتمع|Social/community|Social/communauté;أداة/أخرى|Utility/other|Utilitaire/autre'),
    F('feat', 'checkbox', 'الميزات المطلوبة|Required features|Fonctions souhaitées', 'تسجيل ودخول|Sign-up/login|Inscription/connexion;لوحة تحكم|Admin panel|Panneau d’administration;دفع إلكتروني|Online payments|Paiement en ligne;خرائط وموقع|Maps/location|Cartes/localisation;دردشة|Chat|Chat;إشعارات|Notifications|Notifications;ربط مع موقع|Website integration|Intégration site web'),
    F('ios', 'select', 'هل تحتاج نسخة آيفون؟|Do you also need iOS?|Besoin d’une version iOS ?', YNL),
    F('store_acc', 'select', 'حساب متجر Google Play|Google Play account|Compte Google Play', 'لدي حساب|I have one|J’en ai un;أحتاج مساعدة|I need help|J’ai besoin d’aide'),
 ),
 'g_logo_inst': LOGO_COMMON + [F('inst_type', 'text', 'نوع المؤسسة (حكومية، خيرية، تعليمية…)|Institution type (public, charity, education…)|Type d’institution (publique, caritative, éducative…)')],
 'g_logo_personal': LOGO_COMMON + [F('persona', 'text', 'من أنت وما مجالك؟|Who are you and what is your field?|Qui êtes-vous et quel est votre domaine ?')],
 'g_logo_company': LOGO_COMMON + [F('competitors', 'textarea', 'شركات منافسة أو مرجعية تعجبك|Competitors or reference brands you like|Concurrents ou marques de référence')],
 'g_identity': one(
    F('brand', 'text', 'اسم العلامة|Brand name|Nom de la marque', req=True),
    F('has_logo', 'select', 'هل لديك شعار؟|Do you have a logo?|Avez-vous un logo ?', 'نعم|Yes|Oui;لا، أحتاج تصميمه|No, I need one|Non, j’en ai besoin'),
    F('items', 'checkbox', 'عناصر الهوية المطلوبة|Identity items needed|Éléments d’identité', 'بطاقات أعمال|Business cards|Cartes de visite;أوراق رسمية ومظاريف|Letterheads and envelopes|Papier à en-tête et enveloppes;قوالب سوشيال ميديا|Social templates|Modèles réseaux sociaux;ملف إرشادات الهوية|Brand guidelines|Charte graphique;لوحات ولافتات|Signage|Enseignes;تغليف|Packaging|Emballage;عروض تقديمية|Presentations|Présentations'),
    F('activity', 'text', 'مجال النشاط|Field of activity|Domaine d’activité'),
    F('style', 'text', 'الأسلوب والألوان المفضلة|Preferred style and colors|Style et couleurs préférés'),
 ),
 'g_video': one(
    F('purpose', 'select', 'الهدف|Purpose|Objectif', 'ترويج منتج|Product promo|Promotion produit;تعريف بشركة|Company intro|Présentation société;إعلان لوسائل التواصل|Social ad|Publicité réseaux;شرح خدمة|Explainer|Vidéo explicative'),
    F('duration', 'select', 'المدة|Duration|Durée', 'حتى 15 ثانية|Up to 15s|Jusqu’à 15 s;30 ثانية|30s|30 s;60 ثانية|60s|60 s;أكثر|Longer|Plus long'),
    F('format', 'checkbox', 'المقاسات|Formats|Formats', 'عمودي 9:16|Vertical 9:16|Vertical 9:16;مربع 1:1|Square 1:1|Carré 1:1;أفقي 16:9|Horizontal 16:9|Horizontal 16:9'),
    F('voice', 'select', 'التعليق الصوتي|Voice-over|Voix off', 'عربي|Arabic|Arabe;إنجليزي|English|Anglais;فرنسي|French|Français;بدون|None|Aucune'),
    F('script', 'select', 'هل النص جاهز؟|Is the script ready?|Le script est-il prêt ?', 'جاهز|Ready|Prêt;أحتاج كتابته|I need it written|À rédiger'),
    F('assets', 'select', 'صور وفيديو من عندك؟|Footage/images provided?|Images/vidéos fournies ?', 'نعم|Yes|Oui;لا|No|Non;جزئياً|Partly|Partiellement'),
 ),
 'g_adimages': one(
    F('count', 'select', 'عدد التصاميم|Number of designs|Nombre de visuels', '1 – 5|1 – 5|1 à 5;6 – 20|6 – 20|6 à 20;أكثر من 20 (باقة شهرية)|20+ (monthly pack)|Plus de 20 (pack mensuel)'),
    F('platforms', 'checkbox', 'المنصات|Platforms|Plateformes', 'فيسبوك|Facebook|Facebook;إنستغرام|Instagram|Instagram;تيك توك|TikTok|TikTok;سناب شات|Snapchat|Snapchat;لافتات/طباعة|Print/banners|Impression/bannières'),
    F('brandkit', 'select', 'هل لديك هوية (ألوان/خطوط)؟|Do you have brand colors/fonts?|Avez-vous couleurs/polices de marque ?', YN),
    F('texts', 'select', 'النصوص الإعلانية|Ad copy|Texte publicitaire', 'جاهزة|Ready|Prêts;أحتاج كتابتها|I need them written|À rédiger'),
 ),
}

def ads(platform_label):
    return one(
    F('goal', 'select', 'هدف الحملة|Campaign goal|Objectif de la campagne', 'مبيعات|Sales|Ventes;رسائل وتواصل|Messages/leads|Messages/prospects;زيارات للموقع|Website traffic|Trafic site;تثبيت التطبيق|App installs|Installations;زيادة المتابعين|Followers|Abonnés;وعي بالعلامة|Awareness|Notoriété'),
    F('link', 'url', 'رابط الصفحة أو المتجر|Page or store link|Lien page/boutique', ph='https://'),
    F('target', 'text', 'الدولة/المدينة المستهدفة|Target country/city|Pays/ville ciblés'),
    F('age', 'text', 'الفئة العمرية والجنس والاهتمامات|Age, gender and interests|Âge, genre et centres d’intérêt'),
    F('daily', 'select', 'ميزانية الإعلان اليومية|Daily ad budget|Budget publicitaire quotidien', 'أقل من 5$|Under $5|Moins de 5 $;5$ – 20$|$5 – $20|5 $ – 20 $;أكثر من 20$|Over $20|Plus de 20 $'),
    F('period', 'select', 'مدة الحملة|Campaign duration|Durée de la campagne', 'أسبوع|1 week|1 semaine;شهر|1 month|1 mois;مستمرة شهرياً|Ongoing monthly|Mensuelle continue'),
    F('creative', 'select', 'التصاميم/الفيديوهات|Creatives|Créations', 'جاهزة عندي|I have them|Déjà prêtes;أحتاج تصميمها|Need design|À concevoir'),
    F('account', 'select', 'حساب الإعلانات|Ad account|Compte publicitaire', 'لدي حساب إعلانات|I have an ad account|J’ai un compte;أحتاج مساعدة في إنشائه|Need help creating it|Besoin d’aide'),
    )

def page(plat):
    return one(
    F('page_name', 'text', 'اسم الصفحة/الحساب|Page/account name|Nom de la page/du compte', req=True),
    F('activity', 'text', 'مجال النشاط|Field of activity|Domaine d’activité'),
    F('services', 'checkbox', 'المطلوب|Services needed|Services demandés', 'إنشاء الحساب وإعداده|Account creation and setup|Création et configuration;تصميم الغلاف والصورة الرمزية|Cover and avatar design|Couverture et avatar;كتابة النبذة والتعريف|Bio and about text|Bio et description;خطة محتوى أولية|Initial content plan|Plan de contenu initial;إدارة شهرية|Monthly management|Gestion mensuelle'),
    F('exists', 'select', 'هل لديك حساب سابق؟|Do you have an existing account?|Avez-vous déjà un compte ?', YN),
    F('lang', 'checkbox', 'لغة المحتوى|Content language|Langue du contenu', LANGOPT),
    )

SVC.update({
 'm_fb': ads('Facebook'), 'm_ig': ads('Instagram'), 'm_tt': ads('TikTok'),
 'm_social': ads('Social') + [F('platforms', 'checkbox', 'المنصات المطلوبة|Platforms|Plateformes', 'فيسبوك|Facebook|Facebook;إنستغرام|Instagram|Instagram;تيك توك|TikTok|TikTok;سناب شات|Snapchat|Snapchat;يوتيوب|YouTube|YouTube')],
 'm_fbpage': page('fb'), 'm_igpage': page('ig'), 'm_ttpage': page('tt'),
 'm_adsites': one(
    F('adtype', 'checkbox', 'نوع الإعلان|Ad type|Type de publicité', 'بانر|Banner|Bannière;مقال ممول|Sponsored article|Article sponsorisé;إعلان نصي|Text ad|Annonce texte;إعلان في الصفحة الرئيسية|Homepage placement|Placement en page d’accueil'),
    F('adlink', 'url', 'رابط الجهة المعلنة|Advertised link|Lien annoncé', ph='https://'),
    F('adperiod', 'select', 'مدة الإعلان|Ad duration|Durée', 'أسبوع|1 week|1 semaine;شهر|1 month|1 mois;3 أشهر|3 months|3 mois;أكثر|Longer|Plus long'),
    F('adlang', 'checkbox', 'لغة الإعلان|Ad language|Langue', LANGOPT),
    F('adbudget', 'text', 'ميزانيتك التقريبية|Your approximate budget|Votre budget approximatif'),
    F('assets', 'select', 'تصميم الإعلان|Ad creative|Création', 'جاهز|Ready|Prête;أحتاج تصميمه|Need design|À concevoir'),
 ),
 'p_cod': one(
    F('woo', 'select', 'هل تستخدم ووكومرس؟|Do you use WooCommerce?|Utilisez-vous WooCommerce ?', YN),
    F('countries', 'text', 'الدول التي تبيع إليها|Countries you sell to|Pays de vente'),
    F('feat', 'checkbox', 'الميزات|Features|Fonctions', 'رسوم الدفع عند الاستلام|COD fee|Frais de paiement à la livraison;حظر الطلبات الوهمية|Fake-order blocking|Blocage des fausses commandes;تأكيد عبر SMS/واتساب|SMS/WhatsApp confirmation|Confirmation SMS/WhatsApp;تحديد المدن/المناطق|Region restrictions|Restrictions par zone;ربط مع شركات الشحن|Courier integration|Intégration transporteurs;نموذج طلب سريع|One-page order form|Formulaire de commande rapide'),
    F('wp_ver', 'text', 'إصدار ووردبريس وووكومرس (إن عرفته)|WordPress/WooCommerce versions (if known)|Versions WordPress/WooCommerce'),
 ),
 'p_quick': one(
    F('woo', 'select', 'هل تستخدم ووكومرس؟|Do you use WooCommerce?|Utilisez-vous WooCommerce ?', YN),
    F('fields', 'checkbox', 'حقول نموذج الطلب|Order form fields|Champs du formulaire', 'الاسم|Name|Nom;الهاتف|Phone|Téléphone;العنوان|Address|Adresse;المدينة|City|Ville;ملاحظات|Notes|Notes;الكمية|Quantity|Quantité'),
    F('pay', 'checkbox', 'الدفع|Payments|Paiement', PAY),
    F('feat', 'checkbox', 'ميزات|Features|Fonctions', 'الشراء من صفحة المنتج دون سلة|Buy without cart|Achat sans panier;عروض الكميات|Quantity offers|Offres par quantité;تتبع الطلبات المتروكة|Abandoned-order tracking|Suivi des commandes abandonnées;بكسل التتبع|Tracking pixels|Pixels de suivi'),
 ),
 'p_cert': one(
    F('use', 'select', 'نوع الجهة|Organization type|Type d’organisation', 'أكاديمية|Academy|Académie;شركة تدريب|Training company|Société de formation;مؤسسة|Institution|Institution;أخرى|Other|Autre'),
    F('fields', 'text', 'بيانات الشهادة المطلوبة (اسم، رقم، تاريخ…)|Certificate data fields (name, ID, date…)|Données du certificat (nom, n°, date…)'),
    F('feat', 'checkbox', 'الميزات|Features|Fonctions', 'بحث برقم الشهادة|Search by certificate ID|Recherche par n° de certificat;رمز QR|QR code|Code QR;استيراد من إكسل|Excel bulk import|Import Excel;صفحة تحقق عامة|Public verification page|Page de vérification publique;نموذج شهادة للطباعة|Printable certificate|Certificat imprimable'),
    F('volume', 'select', 'عدد الشهادات|Number of certificates|Nombre de certificats', 'أقل من 500|Under 500|Moins de 500;500 – 5000|500 – 5,000|500 à 5 000;أكثر من 5000|Over 5,000|Plus de 5 000'),
    F('langs', 'checkbox', 'اللغات|Languages|Langues', LANGOPT),
 ),
 'p_diploma': one(
    F('use', 'select', 'نوع الجهة|Organization type|Type d’organisation', 'جامعة|University|Université;معهد|Institute|Institut;أكاديمية|Academy|Académie;أخرى|Other|Autre'),
    F('fields', 'text', 'بيانات الدبلوم (اسم، رقم، تخصص، سنة…)|Diploma data (name, ID, major, year…)|Données du diplôme'),
    F('feat', 'checkbox', 'الميزات|Features|Fonctions', 'توثيق ببوابة عامة|Public authentication portal|Portail public d’authentification;رمز QR وتوقيع|QR and signature|QR et signature;استيراد جماعي|Bulk import|Import en masse;لوحة تحكم بصلاحيات|Role-based dashboard|Tableau de bord par rôle;واجهة API للتحقق|Verification API|API de vérification'),
    F('volume', 'select', 'عدد الدبلومات|Number of diplomas|Nombre de diplômes', 'أقل من 500|Under 500|Moins de 500;500 – 5000|500 – 5,000|500 à 5 000;أكثر من 5000|Over 5,000|Plus de 5 000'),
 ),
 'landing': one(
    F('goal', 'select', 'هدف الصفحة|Page goal|Objectif de la page', 'بيع منتج|Sell a product|Vendre un produit;جمع بيانات عملاء|Lead generation|Collecte de prospects;حجز موعد|Bookings|Réservations;تسجيل في دورة/فعالية|Course/event signup|Inscription cours/événement;تحميل تطبيق|App download|Téléchargement d’app'),
    F('product', 'text', 'المنتج أو الخدمة المراد الترويج لها|Product or service to promote|Produit ou service à promouvoir', req=True),
    F('count', 'select', 'عدد الصفحات|Number of pages|Nombre de pages', '1|1|1;2 – 3|2 – 3|2 à 3;أكثر من 3|More than 3|Plus de 3'),
    F('sections', 'checkbox', 'الأقسام|Sections|Sections', 'مقدمة وعرض رئيسي|Hero|Héros;مزايا|Benefits|Avantages;آراء العملاء|Testimonials|Témoignages;أسعار وباقات|Pricing|Tarifs;أسئلة شائعة|FAQ|FAQ;عدّاد عرض محدود|Countdown|Compte à rebours;فيديو|Video|Vidéo;نموذج طلب|Order/lead form|Formulaire'),
    F('langs', 'checkbox', 'اللغات|Languages|Langues', LANGOPT),
    F('track', 'checkbox', 'التتبع والربط|Tracking and integrations|Suivi et intégrations', 'بكسل فيسبوك|Meta Pixel|Pixel Meta;تيك توك بكسل|TikTok Pixel|Pixel TikTok;Google Analytics|Google Analytics|Google Analytics;واتساب|WhatsApp|WhatsApp;ربط بجداول Google|Google Sheets|Google Sheets'),
    F('ai', 'select', 'هل تريد كتابة المحتوى بالذكاء الاصطناعي؟|AI-assisted copywriting?|Rédaction assistée par IA ?', YN),
    F('plugin', 'select', 'هل تملك إضافة BLR Landing Pro؟|Do you own BLR Landing Pro?|Possédez-vous BLR Landing Pro ?', 'نعم|Yes|Oui;لا|No|Non;أريد معرفة المزيد|Tell me more|En savoir plus'),
 ),
})

def fields_for(niche, tier=None):
    """يعيد حقول الخدمة الخاصة بالمستوى (دون المشتركة)."""
    if niche in WEB:
        f = web_base() + WEB[niche]
        if tier and tier in ('store_l', 'store_m', 'store_s'):
            pass
        return f
    if niche in POS:
        return POS[niche]
    return SVC[niche]

if __name__ == '__main__':
    import json
    n = 0
    for k in list(WEB) + list(POS) + list(SVC):
        n += len(fields_for(k))
    print('niches', len(WEB) + len(POS) + len(SVC), 'fields', n)
