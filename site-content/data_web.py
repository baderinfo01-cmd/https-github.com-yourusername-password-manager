# -*- coding: utf-8 -*-
"""محتوى تصميم المواقع: المجالات (niches) والمستويات (tiers)."""

def L(ar, en, fr):
    return {'ar': ar, 'en': en, 'fr': fr}

# كل مجال: intro + feats(6) + who(3)
NICHES = {
 'store': dict(
  intro=L('متجر إلكتروني متكامل على الووردبريس وووكومرس يبيع منتجاتك المادية والرقمية على مدار الساعة، بتجربة شراء سلسة من أول زيارة حتى تأكيد الطلب.',
          'A complete online store on WordPress and WooCommerce that sells your physical and digital products around the clock, with a smooth journey from first visit to confirmed order.',
          'Une boutique en ligne complète sous WordPress et WooCommerce qui vend vos produits physiques et numériques 24h/24, avec un parcours fluide de la première visite à la commande.'),
  feats=L(['عرض المنتجات بتصنيفات وفلاتر بحث ذكية', 'سلة وإتمام طلب مبسّط بخطوات قليلة', 'بوابات دفع محلية وعالمية والدفع عند الاستلام', 'إدارة المخزون والعروض والكوبونات', 'ربط شركات الشحن وحساب التكلفة تلقائياً', 'لوحة تقارير للمبيعات والطلبات'],
          ['Product catalog with categories and smart filters', 'Simple cart and short checkout', 'Local and international payments plus cash on delivery', 'Inventory, offers and coupons management', 'Shipping integration with automatic cost calculation', 'Sales and orders reporting dashboard'],
          ['Catalogue avec catégories et filtres intelligents', 'Panier et paiement simplifiés', 'Paiements locaux et internationaux et paiement à la livraison', 'Gestion du stock, des offres et des coupons', 'Intégration des transporteurs et calcul automatique des frais', 'Tableau de bord des ventes et commandes']),
  who=L(['تجّار يريدون الانتقال إلى البيع الإلكتروني', 'علامات تجارية تحتاج متجراً باسمها الخاص', 'بائعو منتجات رقمية وملفات وتراخيص'],
        ['Merchants moving to online selling', 'Brands needing a store under their own name', 'Sellers of digital products, files and licenses'],
        ['Commerçants qui passent à la vente en ligne', 'Marques ayant besoin d\'une boutique à leur nom', 'Vendeurs de produits numériques, fichiers et licences'])),
 'website': dict(
  intro=L('موقع إلكتروني احترافي يعكس هوية مشروعك ويحوّل الزائر إلى عميل، مبني بتقنيات حديثة وسريعة ومتوافق مع محركات البحث.',
          'A professional website that reflects your brand and turns visitors into customers, built with modern, fast technology and optimized for search engines.',
          'Un site web professionnel qui reflète votre marque et transforme les visiteurs en clients, conçu avec des technologies modernes, rapides et optimisées pour le référencement.'),
  feats=L(['تصميم متجاوب يعمل على كل الأجهزة', 'لوحة تحكم سهلة لتعديل المحتوى بنفسك', 'سرعة تحميل عالية وتحسين لمحركات البحث', 'نماذج تواصل وطلب مرتبطة بالبريد', 'دعم عدة لغات واتجاه RTL/LTR', 'حماية وشهادة SSL ونسخ احتياطي'],
          ['Responsive design for every device', 'Easy dashboard to edit content yourself', 'High speed and SEO optimization', 'Contact and request forms linked to email', 'Multi-language with RTL/LTR support', 'Security, SSL certificate and backups'],
          ['Design responsive pour tous les appareils', 'Tableau de bord simple pour modifier le contenu', 'Vitesse élevée et optimisation SEO', 'Formulaires de contact et de demande liés à l\'e-mail', 'Multilingue avec prise en charge RTL/LTR', 'Sécurité, certificat SSL et sauvegardes']),
  who=L(['أصحاب مشاريع جديدة أو قائمة', 'مهنيون ومستقلون يريدون حضوراً رقمياً', 'مؤسسات تريد تحديث موقعها القديم'],
        ['Owners of new or existing businesses', 'Professionals and freelancers who need a web presence', 'Organizations updating an outdated site'],
        ['Porteurs de projets nouveaux ou existants', 'Professionnels et freelances souhaitant une présence en ligne', 'Organisations qui modernisent un ancien site'])),
 'realestate': dict(
  intro=L('منصة عقارية تعرض العقارات للبيع والإيجار بتفاصيل كاملة وبحث متقدم، وتجمع الاستفسارات من المهتمين مباشرة.',
          'A real-estate platform listing properties for sale and rent with full details and advanced search, collecting inquiries directly from interested buyers.',
          'Une plateforme immobilière présentant biens à vendre et à louer avec détails complets et recherche avancée, et collectant les demandes des intéressés.'),
  feats=L(['عرض العقارات بصور ومعارض وخرائط الموقع', 'بحث متقدم بالنوع والسعر والمساحة والمدينة', 'صفحة تفصيلية لكل عقار مع نموذج استفسار', 'حسابات للوسطاء والمالكين لإضافة عقاراتهم', 'قوائم مفضلة ومقارنة بين العقارات', 'تنبيهات بالبريد عند ظهور عقار مناسب'],
          ['Listings with galleries and location maps', 'Advanced search by type, price, area and city', 'Detailed property page with inquiry form', 'Agent and owner accounts to add listings', 'Favorites and property comparison', 'Email alerts when a matching property appears'],
          ['Annonces avec galeries et cartes', 'Recherche avancée par type, prix, surface et ville', 'Page détaillée par bien avec formulaire de demande', 'Comptes agents et propriétaires pour publier', 'Favoris et comparaison de biens', 'Alertes e-mail pour les biens correspondants']),
  who=L(['مكاتب ووكالات عقارية', 'ملاك ومطورون عقاريون', 'وسطاء يعرضون عقاراتهم أونلاين'],
        ['Real-estate offices and agencies', 'Property owners and developers', 'Brokers listing properties online'],
        ['Agences immobilières', 'Propriétaires et promoteurs', 'Courtiers publiant leurs biens en ligne'])),
 'company': dict(
  intro=L('موقع مؤسسي يعرّف بشركتك وخدماتها ومشاريعها بصورة تبني الثقة وتفتح لك فرص التعاون والعقود.',
          'A corporate website presenting your company, services and projects in a way that builds trust and opens partnership and contract opportunities.',
          'Un site institutionnel qui présente votre entreprise, ses services et projets de façon à inspirer confiance et ouvrir des opportunités de partenariat.'),
  feats=L(['صفحات تعريف بالشركة والرؤية والفريق', 'عرض الخدمات والمشاريع وقصص النجاح', 'نموذج طلب عرض سعر وتواصل مباشر', 'قسم أخبار ومقالات للشركة', 'صفحة وظائف واستقبال السير الذاتية', 'ربط الخرائط وبيانات الاتصال والفروع'],
          ['About, vision and team pages', 'Services, projects and case studies', 'Quote request form and direct contact', 'Company news and articles section', 'Careers page with CV submission', 'Maps, contact details and branches'],
          ['Pages présentation, vision et équipe', 'Services, projets et études de cas', 'Formulaire de devis et contact direct', 'Section actualités et articles', 'Page carrières avec dépôt de CV', 'Cartes, coordonnées et succursales']),
  who=L(['شركات تجارية وصناعية', 'شركات خدمات ومقاولات', 'مؤسسات ناشئة تبني حضورها'],
        ['Commercial and industrial companies', 'Service and contracting companies', 'Startups building their presence'],
        ['Entreprises commerciales et industrielles', 'Sociétés de services et de construction', 'Startups qui construisent leur présence'])),
 'newspaper': dict(
  intro=L('جريدة إلكترونية بنظام نشر احترافي لعرض الأخبار والمقالات بسرعة وتنظيم، مع أدوات للمحررين وللإعلانات.',
          'An online newspaper with a professional publishing system to display news and articles quickly and neatly, with tools for editors and advertising.',
          'Un journal en ligne avec un système de publication professionnel pour diffuser actualités et articles, avec outils pour rédacteurs et publicité.'),
  feats=L(['أقسام وتصنيفات للأخبار والعاجل والمقالات', 'أدوار للمحررين والمراجعين ومدير التحرير', 'مساحات إعلانية قابلة للإدارة', 'تحسين الأخبار لمحركات البحث وGoogle News', 'مشاركة اجتماعية وتعليقات وإشعارات', 'أرشيف وبحث سريع في المحتوى'],
          ['Sections for news, breaking news and opinion', 'Roles for editors, reviewers and editor-in-chief', 'Manageable advertising slots', 'News SEO and Google News readiness', 'Social sharing, comments and notifications', 'Archive and fast content search'],
          ['Rubriques actualités, urgent et opinions', 'Rôles rédacteur, relecteur et rédacteur en chef', 'Espaces publicitaires gérables', 'SEO news et préparation Google Actualités', 'Partage social, commentaires et notifications', 'Archives et recherche rapide']),
  who=L(['صحفيون ومؤسسات إعلامية', 'مواقع أخبار محلية', 'مجلات رقمية متخصصة'],
        ['Journalists and media organizations', 'Local news websites', 'Niche digital magazines'],
        ['Journalistes et médias', 'Sites d\'actualité locale', 'Magazines numériques spécialisés'])),
 'education': dict(
  intro=L('منصة تعليمية تنظّم الدروس والمحتوى والاختبارات لتصل إلى الطلاب بسهولة، سواء كانت مجانية أو مدفوعة.',
          'An educational platform that organizes lessons, content and quizzes so students reach them easily, whether free or paid.',
          'Une plateforme éducative qui organise cours, contenus et quiz pour les rendre accessibles aux élèves, gratuits ou payants.'),
  feats=L(['دورات ودروس مرتبة بوحدات وفيديوهات', 'اختبارات وواجبات وتصحيح تلقائي', 'حسابات للطلاب والمعلمين وتتبع التقدم', 'اشتراكات وبيع الدورات وبوابات الدفع', 'شهادات إتمام قابلة للتحقق', 'منتدى ونقاش بين الطلاب'],
          ['Courses and lessons in modules with video', 'Quizzes, assignments and auto-grading', 'Student and teacher accounts with progress tracking', 'Subscriptions and course sales with payment gateways', 'Verifiable completion certificates', 'Student discussion forum'],
          ['Cours et leçons en modules avec vidéos', 'Quiz, devoirs et correction automatique', 'Comptes élèves et enseignants avec suivi', 'Abonnements et vente de cours avec paiement', 'Certificats de réussite vérifiables', 'Forum de discussion']),
  who=L(['معلمون ومدرّسون مستقلون', 'مراكز دعم ومدارس', 'مؤسسات تدريب'],
        ['Independent teachers and tutors', 'Support centers and schools', 'Training institutions'],
        ['Enseignants indépendants', 'Centres de soutien et écoles', 'Organismes de formation'])),
 'academy': dict(
  intro=L('موقع أكاديمية يعرض برامجك التدريبية ويسجّل الدارسين ويدير الجداول والمدربين في مكان واحد.',
          'An academy website that presents your training programs, registers learners and manages schedules and trainers in one place.',
          'Un site d\'académie qui présente vos programmes, inscrit les apprenants et gère plannings et formateurs au même endroit.'),
  feats=L(['عرض البرامج والتخصصات والمدربين', 'تسجيل الدارسين إلكترونياً مع دفع الرسوم', 'جدول الدورات والمواعيد والقاعات', 'بوابة للدارسين لمتابعة الدورات والشهادات', 'نظام إشعارات بالبريد والرسائل', 'تقارير الحضور والتسجيل'],
          ['Programs, specializations and trainers showcase', 'Online learner registration with fee payment', 'Course, schedule and room timetable', 'Learner portal for courses and certificates', 'Email and message notifications', 'Attendance and enrollment reports'],
          ['Vitrine des programmes, spécialités et formateurs', 'Inscription en ligne avec paiement des frais', 'Planning des cours, horaires et salles', 'Portail apprenant pour cours et certificats', 'Notifications par e-mail et message', 'Rapports de présence et d\'inscription']),
  who=L(['أكاديميات تدريب ولغات', 'معاهد ومراكز مهنية', 'مدربون يقدمون برامج متعددة'],
        ['Training and language academies', 'Institutes and vocational centers', 'Trainers offering multiple programs'],
        ['Académies de formation et de langues', 'Instituts et centres professionnels', 'Formateurs proposant plusieurs programmes'])),
 'tourism': dict(
  intro=L('موقع سياحي يعرض الوجهات والرحلات والفنادق ويستقبل الحجوزات والاستفسارات بتجربة ملهمة.',
          'A tourism website presenting destinations, trips and hotels and receiving bookings and inquiries in an inspiring experience.',
          'Un site touristique présentant destinations, voyages et hôtels, avec réservations et demandes dans une expérience inspirante.'),
  feats=L(['عرض الرحلات والبرامج والوجهات بالصور والفيديو', 'نظام حجز وطلبات مع تأكيد بالبريد', 'تقويم الأسعار والتوافر والمواسم', 'صفحات الفنادق والخدمات المرتبطة', 'خرائط ومسارات الرحلات', 'آراء المسافرين ومعارض الصور'],
          ['Trips, programs and destinations with photos and video', 'Booking and request system with email confirmation', 'Price, availability and season calendar', 'Hotel and related service pages', 'Maps and trip itineraries', 'Traveler reviews and photo galleries'],
          ['Voyages, programmes et destinations en photos et vidéos', 'Réservations et demandes avec confirmation par e-mail', 'Calendrier des prix, disponibilités et saisons', 'Pages hôtels et services associés', 'Cartes et itinéraires', 'Avis voyageurs et galeries photos']),
  who=L(['وكالات سفر وسياحة', 'فنادق ونزل ومنتجعات', 'منظمو رحلات ومرشدون'],
        ['Travel and tourism agencies', 'Hotels, lodges and resorts', 'Tour organizers and guides'],
        ['Agences de voyage', 'Hôtels, gîtes et resorts', 'Organisateurs de circuits et guides'])),
 'medical': dict(
  intro=L('موقع طبي يعرّف بالطبيب أو المركز وتخصصاته ويتيح حجز المواعيد بسهولة، مع الالتزام بخصوصية المرضى.',
          'A medical website introducing the doctor or center and specialties and enabling easy appointment booking, with respect for patient privacy.',
          'Un site médical présentant le médecin ou le centre et ses spécialités, avec prise de rendez-vous simple et respect de la confidentialité.'),
  feats=L(['صفحات التخصصات والأطباء والخدمات', 'حجز المواعيد إلكترونياً مع تذكير بالبريد', 'نماذج استشارة وطلب معلومات', 'مقالات توعوية طبية', 'عرض ساعات العمل والموقع والاتصال', 'حماية البيانات والخصوصية'],
          ['Specialties, doctors and services pages', 'Online appointment booking with email reminders', 'Consultation and information request forms', 'Medical awareness articles', 'Opening hours, location and contact', 'Data protection and privacy'],
          ['Pages spécialités, médecins et services', 'Prise de rendez-vous en ligne avec rappels e-mail', 'Formulaires de consultation et d\'information', 'Articles de sensibilisation médicale', 'Horaires, localisation et contact', 'Protection des données et confidentialité']),
  who=L(['أطباء وعيادات خاصة', 'مراكز طبية ومخابر', 'مصحّات وصيدليات'],
        ['Doctors and private clinics', 'Medical centers and labs', 'Sanatoriums and pharmacies'],
        ['Médecins et cabinets privés', 'Centres médicaux et laboratoires', 'Cliniques et pharmacies'])),
 'blog': dict(
  intro=L('موقع أو مدونة شخصية تعرض خبرتك وأفكارك ومحتواك بأسلوب أنيق، وتبني جمهوراً يتابعك.',
          'A personal website or blog that showcases your expertise, ideas and content elegantly and builds an audience that follows you.',
          'Un site ou blog personnel qui met en valeur votre expertise, vos idées et contenus avec élégance, et fédère une audience.'),
  feats=L(['تصميم أنيق يركّز على القراءة', 'تصنيفات ووسوم وبحث داخل المقالات', 'نشرة بريدية وجمع المشتركين', 'صفحة السيرة والأعمال والتواصل', 'تحسين المقالات لمحركات البحث', 'تكامل مع وسائل التواصل'],
          ['Elegant, reading-focused design', 'Categories, tags and search', 'Newsletter and subscriber collection', 'Bio, portfolio and contact pages', 'SEO-optimized articles', 'Social media integration'],
          ['Design élégant centré sur la lecture', 'Catégories, tags et recherche', 'Newsletter et collecte d\'abonnés', 'Pages bio, portfolio et contact', 'Articles optimisés SEO', 'Intégration des réseaux sociaux']),
  who=L(['كتّاب ومدونون', 'مستشارون وخبراء', 'فنانون ومبدعون'],
        ['Writers and bloggers', 'Consultants and experts', 'Artists and creators'],
        ['Auteurs et blogueurs', 'Consultants et experts', 'Artistes et créateurs'])),
}

# مستويات: وصف النطاق + 5 نقاط
TIERS = {
 'store_l': dict(
  scope=L('للمتاجر ذات الكتالوج الكبير والطلبات اليومية المرتفعة.', 'For stores with large catalogs and high daily order volume.', 'Pour les boutiques à grand catalogue et fort volume de commandes.'),
  pts=L(['آلاف المنتجات مع متغيرات (مقاسات/ألوان) ومستودعات', 'استضافة وأداء مهيّأ للضغط العالي (تخزين مؤقت وCDN)', 'تكاملات متقدمة: محاسبة، شحن، ERP، CRM', 'عدة عملات ولغات وطرق دفع وشحن', 'برامج ولاء وكوبونات وتسويق عبر البريد'],
        ['Thousands of products with variations and warehouses', 'Hosting and performance tuned for high load (caching, CDN)', 'Advanced integrations: accounting, shipping, ERP, CRM', 'Multiple currencies, languages, payment and shipping methods', 'Loyalty programs, coupons and email marketing'],
        ['Milliers de produits avec variantes et entrepôts', 'Hébergement et performance pour forte charge (cache, CDN)', 'Intégrations avancées : comptabilité, livraison, ERP, CRM', 'Multi-devises, langues, paiements et livraisons', 'Fidélité, coupons et e-mail marketing'])),
 'store_m': dict(
  scope=L('للمتاجر النامية ذات الكتالوج المتوسط.', 'For growing stores with a medium catalog.', 'Pour les boutiques en croissance à catalogue moyen.'),
  pts=L(['مئات المنتجات بتصنيفات وفلاتر', 'بوابات دفع وشحن شائعة جاهزة', 'كوبونات وعروض وتقارير مبيعات', 'تصميم مخصّص بهوية متجرك', 'تدريب على إدارة المتجر'],
        ['Hundreds of products with categories and filters', 'Popular payment and shipping integrations ready', 'Coupons, offers and sales reports', 'Custom design with your brand identity', 'Store management training'],
        ['Centaines de produits avec catégories et filtres', 'Paiements et livraisons courants prêts', 'Coupons, offres et rapports de ventes', 'Design personnalisé à votre identité', 'Formation à la gestion de la boutique'])),
 'store_s': dict(
  scope=L('لبداية سريعة بمتجر يضم عدداً محدوداً من المنتجات.', 'For a fast start with a limited number of products.', 'Pour démarrer vite avec un nombre limité de produits.'),
  pts=L(['عشرات المنتجات بصفحات واضحة', 'سلة وإتمام طلب بسيط', 'الدفع عند الاستلام أو بوابة واحدة', 'قالب احترافي بتخصيص الألوان والشعار', 'قابل للتوسّع لاحقاً دون إعادة بناء'],
        ['Dozens of products with clear pages', 'Simple cart and checkout', 'Cash on delivery or a single gateway', 'Professional theme with your colors and logo', 'Scalable later without rebuilding'],
        ['Dizaines de produits avec pages claires', 'Panier et paiement simples', 'Paiement à la livraison ou une passerelle', 'Thème professionnel à vos couleurs et logo', 'Évolutif sans reconstruction'])),
 'dynamic': dict(
  scope=L('موقع يتفاعل مع المستخدم ويعتمد على قواعد بيانات ولوحات تحكم.', 'A site that interacts with users and relies on databases and dashboards.', 'Un site interactif reposant sur bases de données et tableaux de bord.'),
  pts=L(['حسابات مستخدمين وصلاحيات متعددة', 'محتوى يتغير تلقائياً من قاعدة البيانات', 'نماذج وطلبات ولوحات متابعة', 'تقارير وإحصاءات مخصصة', 'تكاملات وواجهات برمجية API'],
        ['User accounts with multiple roles', 'Content driven automatically by the database', 'Forms, requests and tracking dashboards', 'Custom reports and analytics', 'Integrations and API endpoints'],
        ['Comptes utilisateurs et rôles multiples', 'Contenu piloté par la base de données', 'Formulaires, demandes et tableaux de suivi', 'Rapports et statistiques sur mesure', 'Intégrations et API'])),
 'info': dict(
  scope=L('موقع تعريفي أنيق يقدّم مشروعك بوضوح وبأقل تعقيد.', 'A polished informational site presenting your business clearly and simply.', 'Un site vitrine soigné qui présente clairement votre activité.'),
  pts=L(['من 5 إلى 10 صفحات رئيسية تقريباً', 'تصميم متجاوب وسرعة عالية', 'نموذج تواصل وروابط التواصل الاجتماعي', 'تحسين أساسي لمحركات البحث', 'تسليم سريع وتكلفة مناسبة'],
        ['Roughly 5 to 10 main pages', 'Responsive design and high speed', 'Contact form and social links', 'Basic SEO setup', 'Fast delivery and fair cost'],
        ['Environ 5 à 10 pages principales', 'Design responsive et grande vitesse', 'Formulaire de contact et réseaux sociaux', 'SEO de base', 'Livraison rapide et coût adapté'])),
 'spec': dict(
  scope=L('موقع مصمَّم لمتطلبات مجالك تحديداً بوظائف إضافية تخدم عملك.', 'A site built for your field\'s specific requirements, with extra functions that serve your business.', 'Un site conçu pour les besoins précis de votre domaine, avec fonctions supplémentaires.'),
  pts=L(['دراسة دقيقة لمتطلبات المجال قبل التصميم', 'وظائف مخصصة (حجز، بحث متقدم، حسابات…)', 'لوحة تحكم مبسطة لإدارة المحتوى', 'تحسين شامل لمحركات البحث والأداء', 'دعم فني وتدريب بعد التسليم'],
        ['In-depth study of field requirements before design', 'Custom functions (booking, advanced search, accounts…)', 'Simplified dashboard for content management', 'Full SEO and performance optimization', 'Technical support and training after delivery'],
        ['Étude approfondie des besoins avant la conception', 'Fonctions sur mesure (réservation, recherche avancée, comptes…)', 'Tableau de bord simplifié', 'SEO et performance complets', 'Support technique et formation après livraison'])),
}
