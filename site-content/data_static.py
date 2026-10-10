# -*- coding: utf-8 -*-
"""نصوص الصفحات الثابتة (ثلاث لغات). لا أرقام ولا أعمال مختلقة."""

def T(ar, en, fr):
    return {'ar': ar, 'en': en, 'fr': fr}

BRAND = 'Baderinfo'
TAGLINE = T('خدمات رقمية متكاملة في مكان واحد', 'Complete digital services in one place', 'Des services numériques complets au même endroit')

HOME = {
 'hero_title': T('نبني حضورك الرقمي… من الفكرة حتى النتائج', 'We build your digital presence — from idea to results', 'Nous construisons votre présence numérique — de l’idée aux résultats'),
 'hero_sub': T('مواقع ومتاجر وتطبيقات وبرامج إدارة وتصميم وتسويق وإضافات ووردبريس وصفحات هبوط، بجودة احترافية وبشرح واضح لكل خطوة.',
               'Websites, stores, apps, management software, design, marketing, WordPress plugins and landing pages — delivered professionally, with every step explained.',
               'Sites, boutiques, applications, logiciels de gestion, design, marketing, plugins WordPress et pages de destination — réalisés avec professionnalisme et expliqués étape par étape.'),
 'services_title': T('خدماتنا الرئيسية', 'Our main services', 'Nos services principaux'),
 'services_sub': T('اختر الخدمة التي تهمّك لتصل إلى التفاصيل والمواصفات وتطلبها مباشرة.', 'Pick a service to see details and specifications, then request it directly.', 'Choisissez un service pour voir les détails et le demander directement.'),
 'why_title': T('لماذا تختار Baderinfo؟', 'Why choose Baderinfo?', 'Pourquoi choisir Baderinfo ?'),
 'why': [
  T(('شريك واحد لكل احتياجك الرقمي'), 'One partner for all your digital needs', 'Un seul partenaire pour tous vos besoins numériques'),
  T('من الموقع إلى الإعلان إلى البرنامج، لا تحتاج التنقل بين عدة جهات.', 'From website to advertising to software, no need to juggle several providers.', 'Du site à la publicité en passant par les logiciels, un seul interlocuteur.'),
  T('وضوح قبل البدء', 'Clarity before we start', 'Clarté avant de commencer'),
  T('نحدد النطاق والمخرجات والمدة في عرض مكتوب قبل أي التزام.', 'Scope, deliverables and timeline are written in a quote before any commitment.', 'Périmètre, livrables et délais sont écrits dans un devis avant tout engagement.'),
  T('جودة وسرعة وأمان', 'Quality, speed and security', 'Qualité, rapidité et sécurité'),
  T('كود نظيف وتصميم متجاوب وتحسين أساسي لمحركات البحث وحماية معقولة.', 'Clean code, responsive design, basic SEO and sensible security.', 'Code propre, design responsive, SEO de base et sécurité adaptée.'),
  T('متعدد اللغات ويدعم العربية', 'Multilingual and Arabic-first', 'Multilingue, avec l’arabe en priorité'),
  T('واجهات تدعم العربية والإنجليزية والفرنسية واتجاه RTL بشكل سليم.', 'Interfaces in Arabic, English and French with proper RTL support.', 'Interfaces en arabe, anglais et français avec prise en charge RTL.'),
  T('أنت تملك مشروعك', 'You own your project', 'Votre projet vous appartient'),
  T('تحصل على لوحة تحكم وشرح استخدام لتديره بنفسك.', 'You get a dashboard and a usage guide so you can manage it yourself.', 'Vous recevez un tableau de bord et un guide pour le gérer vous-même.'),
  T('دعم بعد التسليم', 'Support after delivery', 'Support après livraison'),
  T('نتابع معك بعد الإطلاق ونحل ما يظهر من ملاحظات.', 'We follow up after launch and resolve any issues that appear.', 'Nous assurons le suivi après le lancement et corrigeons les remarques.'),
 ],
 'steps_title': T('كيف نعمل؟', 'How we work', 'Comment nous travaillons'),
 'steps': [
  T('1. تطلب الخدمة', '1. You request a service', '1. Vous demandez un service'),
  T('تملأ نموذجاً مخصصاً للخدمة بتفاصيل مشروعك.', 'Fill in a service-specific form with your project details.', 'Vous remplissez un formulaire adapté au service.'),
  T('2. نراجع ونرسل عرضاً', '2. We review and quote', '2. Nous étudions et proposons un devis'),
  T('نرد عليك بخطة وسعر ومدة واضحة.', 'We reply with a plan, price and timeline.', 'Nous répondons avec un plan, un prix et un délai.'),
  T('3. نُنفّذ ونُطلعك', '3. We build and keep you updated', '3. Nous réalisons et vous tenons informé'),
  T('تتابع التقدم وتعتمد المراحل.', 'You follow progress and approve each stage.', 'Vous suivez l’avancement et validez chaque étape.'),
  T('4. تسليم ودعم', '4. Delivery and support', '4. Livraison et support'),
  T('نسلّمك المشروع مع الشرح والدعم.', 'We hand over the project with guidance and support.', 'Nous livrons le projet avec explications et support.'),
 ],
 'quick_title': T('اكتشف أكثر', 'Explore more', 'Découvrir'),
 'faq_title': T('أسئلة شائعة', 'Common questions', 'Questions fréquentes'),
 'faq': [
  (T('كيف أطلب خدمة؟', 'How do I request a service?', 'Comment demander un service ?'),
   T('افتح صفحة الخدمة واضغط «اطلب هذه الخدمة»، أو افتح صفحة طلب خدمة واختر الخدمة من القائمة، ثم املأ التفاصيل.', 'Open the service page and click “Request this service”, or open the request page and choose a service, then fill in the details.', 'Ouvrez la page du service et cliquez sur « Demander ce service », ou ouvrez la page de demande et choisissez le service, puis remplissez les détails.')),
  (T('هل الطلب ملزم؟', 'Is a request binding?', 'La demande est-elle engageante ?'),
   T('لا، الطلب لا يُلزمك بشيء؛ نرسل لك عرضاً وتقرر بعد مراجعته.', 'No. A request does not commit you; we send a quote and you decide after reviewing it.', 'Non. La demande ne vous engage pas ; nous envoyons un devis et vous décidez ensuite.')),
  (T('متى أحصل على رد؟', 'When will I get a reply?', 'Quand aurai-je une réponse ?'),
   T('نحرص على الرد في أقرب وقت ممكن خلال أيام العمل عبر البريد أو واتساب حسب اختيارك.', 'We reply as soon as possible on business days by email or WhatsApp, as you choose.', 'Nous répondons dès que possible les jours ouvrés par e-mail ou WhatsApp selon votre choix.')),
  (T('هل تعملون بلغات متعددة؟', 'Do you work in several languages?', 'Travaillez-vous en plusieurs langues ?'),
   T('نعم، نخدمك بالعربية والإنجليزية والفرنسية ونبني المواقع متعددة اللغات.', 'Yes — we serve you in Arabic, English and French and build multilingual sites.', 'Oui — nous vous servons en arabe, anglais et français et créons des sites multilingues.')),
 ],
 'cta_title': T('هل لديك مشروع في بالك؟', 'Have a project in mind?', 'Un projet en tête ?'),
 'cta_text': T('أخبرنا بفكرتك ونرد عليك بخطة وعرض سعر واضح.', 'Tell us your idea and we will reply with a plan and a clear quote.', 'Parlez-nous de votre idée et recevez un plan et un devis clair.'),
}

SERVICES = {
 'title': T('خدماتنا', 'Our Services', 'Nos services'),
 'intro': T('كل ما يحتاجه حضورك الرقمي في مكان واحد. اختر المجال لتصل إلى الأقسام الفرعية والمواصفات والتفاصيل.',
            'Everything your digital presence needs in one place. Choose a field to reach sub-services, specifications and details.',
            'Tout ce dont votre présence numérique a besoin au même endroit. Choisissez un domaine pour accéder aux sous-services et aux détails.'),
}

SHOP = {
 'title': T('المتجر', 'Shop', 'Boutique'),
 'intro': T('متجر Baderinfo يضم قسمين: منتجات مادية ومنتجات رقمية. اختر القسم لتتصفح المنتجات.',
            'The Baderinfo shop has two sections: physical products and digital products. Choose a section to browse products.',
            'La boutique Baderinfo comprend deux rayons : produits physiques et produits numériques. Choisissez un rayon pour parcourir les produits.'),
 'physical': T('منتجات تُشحن إلى عنوانك مع تتبع الطلب وخيارات الدفع المتاحة.', 'Products shipped to your address with order tracking and available payment options.', 'Produits expédiés à votre adresse avec suivi de commande et moyens de paiement disponibles.'),
 'digital': T('ملفات وقوالب وإضافات وخدمات رقمية تُسلَّم فوراً بعد الدفع.', 'Files, themes, plugins and digital goods delivered instantly after payment.', 'Fichiers, thèmes, plugins et biens numériques livrés immédiatement après paiement.'),
 'note': T('تُعرض المنتجات من متجر ووكومرس. ضع داخل هذه الصفحة الاختصار الموضّح في الدليل ليظهر المنتجات تلقائياً.', 'Products come from your WooCommerce store. Put the shortcode shown in the guide on this page to list them automatically.', 'Les produits proviennent de WooCommerce. Placez le shortcode indiqué dans le guide sur cette page pour les afficher automatiquement.'),
 'open': T('تصفّح المنتجات', 'Browse products', 'Parcourir les produits'),
}

BLOG = {
 'title': T('المدونة', 'Blog', 'Blog'),
 'intro': T('مقالات وشروحات ونصائح في المواقع والتسويق والبرمجة والتصميم.', 'Articles, tutorials and tips on websites, marketing, development and design.', 'Articles, tutoriels et conseils sur les sites, le marketing, le développement et le design.'),
 'note': T('تُعرض المقالات تلقائياً من تدوينات ووردبريس.', 'Posts are listed automatically from your WordPress posts.', 'Les articles s’affichent automatiquement depuis vos articles WordPress.'),
}

PORTFOLIO = {
 'title': T('أعمالنا', 'Our Work', 'Nos réalisations'),
 'intro': T('نماذج من مشاريعنا ونتائج عملائنا.', 'Samples of our projects and our clients’ results.', 'Exemples de nos projets et des résultats de nos clients.'),
 'note': T('أضف أعمالك الحقيقية هنا (صورة + عنوان + وصف + رابط). راجع قسم «إضافة الأعمال» في الدليل.', 'Add your real projects here (image + title + description + link). See “Adding portfolio items” in the guide.', 'Ajoutez ici vos vraies réalisations (image + titre + description + lien). Voir « Ajouter des réalisations » dans le guide.'),
 'cats': [
  T('مواقع ومتاجر', 'Websites & stores', 'Sites et boutiques'),
  T('تطبيقات وبرامج', 'Apps & software', 'Applications et logiciels'),
  T('تصميم وهويات', 'Design & identity', 'Design et identité'),
  T('تسويق وإعلانات', 'Marketing & ads', 'Marketing et publicité'),
 ],
}

ABOUT = {
 'title': T('من نحن', 'About Us', 'À propos'),
 'lead': T('Baderinfo منصة خدمات رقمية تساعد الأفراد والشركات على بناء حضورهم على الإنترنت وإدارة أعمالهم بأدوات حديثة.',
           'Baderinfo is a digital services platform that helps individuals and businesses build their online presence and run their work with modern tools.',
           'Baderinfo est une plateforme de services numériques qui aide particuliers et entreprises à bâtir leur présence en ligne et à gérer leur activité avec des outils modernes.'),
 'vals_title': T('قيمنا', 'Our values', 'Nos valeurs'),
 'vals': [
  T('الوضوح', 'Clarity', 'Clarté'), T('نشرح كل خدمة ونسعّرها بشفافية قبل البدء.', 'We explain each service and price it transparently before starting.', 'Nous expliquons chaque service et le chiffrons avec transparence.'),
  T('الإتقان', 'Craftsmanship', 'Exigence'), T('نهتم بالتفاصيل: التصميم والسرعة والأمان وتجربة المستخدم.', 'We care about details: design, speed, security and user experience.', 'Nous soignons les détails : design, rapidité, sécurité et expérience utilisateur.'),
  T('الالتزام', 'Commitment', 'Engagement'), T('نحترم المواعيد ونتابعك حتى بعد التسليم.', 'We respect deadlines and follow up after delivery.', 'Nous respectons les délais et assurons le suivi après livraison.'),
  T('التنوع اللغوي', 'Multilingual by design', 'Multilingue par conception'), T('نخدمك بالعربية والإنجليزية والفرنسية.', 'We serve you in Arabic, English and French.', 'Nous vous servons en arabe, anglais et français.'),
 ],
 'what_title': T('ماذا نقدّم؟', 'What we offer', 'Ce que nous proposons'),
 'note': T('عدّل هذه الصفحة بقصتك الحقيقية وفريقك وسنوات خبرتك عندما تكون جاهزاً.', 'Edit this page with your real story, team and experience when ready.', 'Modifiez cette page avec votre histoire, votre équipe et votre expérience réelles.'),
}

CONTACT = {
 'title': T('اتصل بنا', 'Contact Us', 'Contact'),
 'intro': T('لأي استفسار عام أو سؤال قبل الطلب، راسلنا وسنرد عليك. وإن كنت تريد خدمة محددة بتفاصيلها فاستخدم صفحة طلب خدمة.',
            'For any general enquiry or pre-sales question, write to us. If you want a specific service with details, use the service request page.',
            'Pour toute question générale ou avant-vente, écrivez-nous. Pour un service précis avec détails, utilisez la page de demande de service.'),
 'info_title': T('بيانات التواصل', 'Contact details', 'Coordonnées'),
 'form_title': T('أرسل رسالة', 'Send a message', 'Envoyer un message'),
 'to_request': T('تريد طلب خدمة بتفاصيلها؟', 'Want a service with full details?', 'Besoin d’un service détaillé ?'),
}

REQUEST = {
 'title': T('طلب خدمة', 'Request a Service', 'Demande de service'),
 'intro': T('اختر الخدمة وسيظهر لك نموذج بالحقول الخاصة بها. كلما كانت التفاصيل أدق كان عرضنا أدق.',
            'Choose a service and a form with its specific fields appears. The more precise your details, the more precise our quote.',
            'Choisissez un service : un formulaire avec ses champs spécifiques s’affiche. Plus vos détails sont précis, plus notre devis l’est.'),
 'steps': T('اختر الخدمة ← املأ التفاصيل ← أرسل ← نرد بعرض', 'Choose service → fill details → send → we reply with a quote', 'Choisir le service → remplir les détails → envoyer → nous répondons avec un devis'),
}
