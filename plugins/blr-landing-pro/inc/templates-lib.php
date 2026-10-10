<?php
/**
 * مكتبة القوالب الجاهزة. القوالب الثلاثة الأولى مجانية والباقي Pro.
 * المحتوى توضيحي بالعربية: استبدله بمحتواك أو ولّده بالذكاء الاصطناعي.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blrlp_templates_meta() {
	return array(
		'blank'   => array( 'name' => 'صفحة فارغة', 'emoji' => '📄', 'desc' => 'ابدأ من الصفر.', 'pro' => false, 'preset' => 'aurora' ),
		'saas'    => array( 'name' => 'تطبيق / SaaS', 'emoji' => '🚀', 'desc' => 'بطل، مزايا، خطوات، أسعار، أسئلة.', 'pro' => false, 'preset' => 'aurora' ),
		'store'   => array( 'name' => 'متجر / منتج', 'emoji' => '🛍️', 'desc' => 'عرض منتج مع عدّاد وآراء.', 'pro' => false, 'preset' => 'verdant' ),
		'digital' => array( 'name' => 'منتج رقمي', 'emoji' => '⚡', 'desc' => 'قالب/إضافة/ملف مع تسليم فوري.', 'pro' => false, 'preset' => 'aurora' ),
		'course'  => array( 'name' => 'دورة / ويبينار', 'emoji' => '🎓', 'desc' => 'منهج، مدرّب، تسجيل بنموذج.', 'pro' => true, 'preset' => 'aurora' ),
		'agency'  => array( 'name' => 'وكالة / خدمات', 'emoji' => '💼', 'desc' => 'خدمات، عملاء، طلب عرض سعر.', 'pro' => true, 'preset' => 'onyx' ),
		'event'   => array( 'name' => 'حدث / مؤتمر', 'emoji' => '🎤', 'desc' => 'عدّاد تنازلي، جدول، تسجيل.', 'pro' => true, 'preset' => 'onyx' ),
	);
}

function blrlp_tpl_sec( $id, $data = array(), $bg = 'default' ) {
	return array( 'id' => $id, 'on' => true, 'style' => array( 'bg' => $bg ), 'data' => $data );
}

function blrlp_tpl_items( $rows, $keys ) {
	$out = array();
	foreach ( $rows as $r ) {
		$out[] = array_combine( $keys, array_pad( (array) $r, count( $keys ), '' ) );
	}
	return $out;
}

function blrlp_template_sections( $slug ) {
	$S  = 'blrlp_tpl_sec';
	$I  = 'blrlp_tpl_items';
	$faq = $I( array(
		array( 'كيف أبدأ؟', 'سجّل، اختر خطتك، وستجد كل شيء جاهزاً خلال دقائق.' ),
		array( 'هل يمكنني الإلغاء في أي وقت؟', 'نعم، بلا التزامات أو رسوم خفية.' ),
		array( 'هل يوجد دعم فني؟', 'نعم، فريقنا يرد خلال ساعات العمل.' ),
	), array( 'q', 'a' ) );

	switch ( $slug ) {
		case 'saas':
			return array(
				$S( 'hero', array( 'title' => 'أدِر عملك بذكاء من مكان واحد', 'subtitle' => 'منصة سريعة وسهلة تختصر عليك الوقت وتضاعف نتائجك.', 'bullets' => array( array( 'text' => 'إعداد في دقائق' ), array( 'text' => 'بدون بطاقة ائتمان' ), array( 'text' => 'دعم عربي' ) ) ) ),
				$S( 'logos', array( 'items' => $I( array( array( 'شركة أ' ), array( 'شركة ب' ), array( 'شركة ج' ), array( 'شركة د' ) ), array( 'name', 'image' ) ) ), 'alt' ),
				$S( 'features', array( 'title' => 'كل ما تحتاجه', 'subtitle' => 'أدوات متكاملة تعمل معاً بسلاسة.', 'items' => $I( array( array( 'bolt', 'سرعة فائقة', 'أداء ثابت حتى مع الضغط العالي.' ), array( 'shield', 'أمان متقدم', 'تشفير وحماية لبياناتك.' ), array( 'chart', 'تقارير واضحة', 'لوحات تظهر لك ما يهم فعلاً.' ), array( 'users', 'عمل جماعي', 'شارك فريقك بصلاحيات مرنة.' ), array( 'spark', 'ذكاء اصطناعي', 'اقتراحات تلقائية توفّر وقتك.' ), array( 'headset', 'دعم مستمر', 'نحن بجانبك دائماً.' ) ), array( 'icon', 'title', 'text' ) ) ) ),
				$S( 'steps', array( 'title' => 'ثلاث خطوات للانطلاق', 'items' => $I( array( array( 'أنشئ حسابك', 'تسجيل سريع بدون تعقيد.' ), array( 'اضبط إعداداتك', 'اختر ما يناسب نشاطك.' ), array( 'ابدأ العمل', 'شاهد النتائج من اليوم الأول.' ) ), array( 'title', 'text' ) ) ), 'alt' ),
				$S( 'stats', array( 'items' => $I( array( array( '+10,000', 'مستخدم نشط' ), array( '99.9%', 'جاهزية الخدمة' ), array( '4.9/5', 'تقييم العملاء' ), array( '24/7', 'دعم' ) ), array( 'num', 'label' ) ) ) ),
				$S( 'pricing', array( 'title' => 'أسعار بسيطة وواضحة', 'items' => $I( array( array( 'أساسية', '29$', 'شهرياً', '', 'للأفراد', "مستخدم واحد\n10 مشاريع\nدعم بالبريد", 'ابدأ', '#cta', false ), array( 'احترافية', '79$', 'شهرياً', 'الأكثر طلباً', 'للفرق الصغيرة', "5 مستخدمين\nمشاريع غير محدودة\nتقارير متقدمة\nدعم أولوية", 'ابدأ الآن', '#cta', true ), array( 'مؤسسات', '199$', 'شهرياً', '', 'للشركات', "مستخدمون غير محدودين\nتكامل مخصص\nمدير حساب", 'تواصل معنا', '#cta', false ) ), array( 'name', 'price', 'period', 'badge', 'desc', 'features', 'btn', 'url', 'highlight' ) ) ) ),
				$S( 'testimonials', array( 'items' => $I( array( array( 'سارة', 'مديرة تسويق', 'وفّرت علينا ساعات أسبوعياً.', '', 5 ), array( 'خالد', 'مؤسس شركة', 'أفضل قرار اتخذناه هذا العام.', '', 5 ), array( 'منى', 'مصممة', 'سهلة وجميلة وسريعة.', '', 5 ) ), array( 'name', 'role', 'text', 'avatar', 'rating' ) ) ), 'alt' ),
				$S( 'faq', array( 'items' => $faq ) ),
				$S( 'form', array( 'title' => 'جرّب مجاناً الآن', 'text' => 'اترك بياناتك وسنرسل لك رابط التجربة.' ), 'alt' ),
				$S( 'cta', array( 'title' => 'جاهز للانطلاق؟', 'text' => 'انضم لآلاف المستخدمين اليوم.', 'btn1' => 'ابدأ مجاناً', 'url1' => '#' ) ),
			);
		case 'store':
			return array(
				$S( 'hero', array( 'layout' => 'split', 'badge' => 'عرض محدود', 'title' => 'منتج يستحق أن تقتنيه', 'subtitle' => 'جودة عالية، شحن سريع، وضمان استرجاع خلال 14 يوماً.', 'btn1' => 'اطلب الآن', 'btn2' => 'التفاصيل', 'url2' => '#features', 'note' => '★★★★★ 4.9 من 2,300 تقييم' ) ),
				$S( 'countdown', array( 'title' => 'ينتهي العرض خلال', 'text' => 'خصم 30% على الطلبات اليوم فقط.', 'evergreen' => 24, 'btn' => 'احصل على الخصم', 'url' => '#cta' ), 'alt' ),
				$S( 'features', array( 'cols' => '4', 'items' => $I( array( array( 'truck', 'شحن سريع', 'توصيل خلال 2-4 أيام.' ), array( 'shield', 'ضمان سنة', 'نغطي عيوب التصنيع.' ), array( 'refresh', 'استرجاع مجاني', 'خلال 14 يوماً.' ), array( 'lock', 'دفع آمن', 'حماية كاملة لبياناتك.' ) ), array( 'icon', 'title', 'text' ) ) ) ),
				$S( 'products', array( 'title' => 'اختر ما يناسبك', 'limit' => 4 ), 'alt' ),
				$S( 'testimonials', array( 'items' => $I( array( array( 'أحمد', 'مشترٍ موثّق', 'وصلني بسرعة والجودة ممتازة.', '', 5 ), array( 'ليلى', 'مشترية موثّقة', 'تغليف رائع وسعر مناسب.', '', 5 ), array( 'يوسف', 'مشترٍ موثّق', 'أنصح به بشدة.', '', 4 ) ), array( 'name', 'role', 'text', 'avatar', 'rating' ) ) ) ),
				$S( 'faq', array( 'items' => $I( array( array( 'كم يستغرق الشحن؟', 'من 2 إلى 4 أيام عمل.' ), array( 'كيف أسترجع المنتج؟', 'تواصل معنا خلال 14 يوماً وسنرتب الاسترجاع.' ) ), array( 'q', 'a' ) ) ), 'alt' ),
				$S( 'cta', array( 'title' => 'لا تفوّت العرض', 'text' => 'الكمية محدودة.', 'btn1' => 'اطلب الآن', 'url1' => '#' ) ),
			);
		case 'digital':
			return array(
				$S( 'hero', array( 'badge' => 'تحميل فوري', 'title' => 'احصل على الملف وابدأ خلال دقائق', 'subtitle' => 'منتج رقمي احترافي بتحديثات مجانية وترخيص واضح.', 'btn1' => 'اشترِ وحمّل', 'btn2' => 'معاينة', 'url2' => '#features', 'bullets' => array( array( 'text' => 'تحديثات مدى الحياة' ), array( 'text' => 'دعم فني' ), array( 'text' => 'ضمان استرجاع' ) ) ) ),
				$S( 'features', array( 'title' => 'ماذا ستحصل؟', 'items' => $I( array( array( 'download', 'تحميل فوري', 'بعد الدفع مباشرة.' ), array( 'layers', 'ملفات مصدرية', 'قابلة للتعديل بالكامل.' ), array( 'repeat', 'تحديثات مستمرة', 'نضيف ميزات باستمرار.' ), array( 'award', 'جودة موثوقة', 'اختبرناه على أرض الواقع.' ) ), array( 'icon', 'title', 'text' ) ) ) ),
				$S( 'split', array( 'title' => 'مصمّم ليوفّر وقتك', 'text' => 'كل ما تحتاجه في حزمة واحدة جاهزة للاستخدام.', 'bullets' => array( array( 'text' => 'سهل التثبيت' ), array( 'text' => 'توثيق كامل' ), array( 'text' => 'متوافق مع أحدث الإصدارات' ) ), 'btn' => 'اشترِ الآن', 'url' => '#pricing' ), 'alt' ),
				$S( 'pricing', array( 'title' => 'اختر الترخيص', 'items' => $I( array( array( 'شخصي', '39$', 'مرة واحدة', '', '', "موقع واحد\nتحديثات سنة", 'اشترِ', '#', false ), array( 'تجاري', '79$', 'مرة واحدة', 'الأفضل قيمة', '', "5 مواقع\nتحديثات سنة\nدعم أولوية", 'اشترِ', '#', true ) ), array( 'name', 'price', 'period', 'badge', 'desc', 'features', 'btn', 'url', 'highlight' ) ) ) ),
				$S( 'faq', array( 'items' => $faq ), 'alt' ),
				$S( 'cta', array( 'title' => 'ابدأ اليوم', 'btn1' => 'احصل عليه الآن', 'url1' => '#pricing' ) ),
			);
		case 'course':
			return array(
				$S( 'hero', array( 'layout' => 'center', 'badge' => 'تسجيل مفتوح', 'title' => 'تعلّم المهارة التي تغيّر مسارك المهني', 'subtitle' => 'دورة عملية مكثفة بمشاريع حقيقية وشهادة إتمام.', 'btn1' => 'احجز مقعدك', 'url1' => '#register', 'btn2' => 'المنهج', 'url2' => '#steps' ) ),
				$S( 'stats', array( 'items' => $I( array( array( '+5,000', 'خريج' ), array( '40', 'ساعة تدريب' ), array( '12', 'مشروعاً' ), array( '4.9', 'تقييم' ) ), array( 'num', 'label' ) ) ), 'alt' ),
				$S( 'steps', array( 'title' => 'منهج الدورة', 'items' => $I( array( array( 'الأساسيات', 'بناء قاعدة متينة.' ), array( 'التطبيق', 'مشاريع عملية خطوة بخطوة.' ), array( 'الاحتراف', 'أدوات وأسرار المحترفين.' ), array( 'الشهادة', 'مشروع تخرج وشهادة.' ) ), array( 'title', 'text' ) ) ) ),
				$S( 'testimonials', array( 'items' => $I( array( array( 'ريم', 'خريجة', 'غيّرت الدورة مساري بالكامل.', '', 5 ), array( 'عمر', 'خريج', 'شرح واضح وتطبيق عملي.', '', 5 ) ), array( 'name', 'role', 'text', 'avatar', 'rating' ) ) ), 'alt' ),
				$S( 'faq', array( 'items' => $faq ) ),
				$S( 'form', array( 'title' => 'احجز مقعدك الآن', 'text' => 'المقاعد محدودة.', 'btn' => 'سجّلني', 'phone' => true ), 'alt' ),
			);
		case 'agency':
			return array(
				$S( 'hero', array( 'layout' => 'center', 'badge' => 'وكالة إبداعية', 'title' => 'نبني علامتك التجارية لتبرز', 'subtitle' => 'تصميم، تطوير، وتسويق رقمي بنتائج قابلة للقياس.', 'btn1' => 'اطلب عرض سعر', 'url1' => '#quote', 'btn2' => 'خدماتنا', 'url2' => '#features' ) ),
				$S( 'features', array( 'title' => 'خدماتنا', 'items' => $I( array( array( 'target', 'استراتيجية', 'خطط مبنية على بيانات.' ), array( 'code', 'تطوير', 'مواقع وتطبيقات سريعة.' ), array( 'spark', 'تصميم', 'هوية وواجهات مميزة.' ), array( 'chart', 'تسويق', 'حملات تحقق عائداً.' ), array( 'users', 'محتوى', 'قصص تصل لجمهورك.' ), array( 'headset', 'دعم', 'متابعة مستمرة.' ) ), array( 'icon', 'title', 'text' ) ) ) ),
				$S( 'stats', array( 'items' => $I( array( array( '+200', 'مشروع' ), array( '12', 'سنة خبرة' ), array( '95%', 'عملاء يعودون' ) ), array( 'num', 'label' ) ) ), 'alt' ),
				$S( 'testimonials', array( 'items' => $I( array( array( 'م. فهد', 'مدير شركة', 'فريق محترف والتزام بالمواعيد.', '', 5 ), array( 'نورة', 'صاحبة علامة', 'ارتفعت مبيعاتنا بعد الحملة.', '', 5 ) ), array( 'name', 'role', 'text', 'avatar', 'rating' ) ) ) ),
				$S( 'form', array( 'title' => 'اطلب عرض سعر مجاني', 'text' => 'نرد خلال 24 ساعة.', 'message' => true, 'btn' => 'أرسل الطلب' ), 'alt' ),
			);
		case 'event':
			return array(
				$S( 'hero', array( 'layout' => 'center', 'badge' => 'حدث مباشر', 'title' => 'مؤتمر المستقبل الرقمي 2026', 'subtitle' => 'يوم كامل مع نخبة الخبراء، ورش عمل، وفرص تواصل.', 'btn1' => 'سجّل مجاناً', 'url1' => '#register', 'note' => 'المقاعد محدودة' ) ),
				$S( 'countdown', array( 'title' => 'يبدأ الحدث بعد', 'end' => gmdate( 'Y-m-d 18:00', time() + 30 * DAY_IN_SECONDS ), 'btn' => 'احجز مقعدك', 'url' => '#register' ), 'alt' ),
				$S( 'features', array( 'title' => 'ماذا ينتظرك؟', 'items' => $I( array( array( 'users', '20 متحدثاً', 'خبراء من مختلف المجالات.' ), array( 'rocket', '8 ورش عمل', 'تطبيق عملي مباشر.' ), array( 'globe', 'تواصل', 'التقِ شركاء المستقبل.' ) ), array( 'icon', 'title', 'text' ) ) ) ),
				$S( 'faq', array( 'items' => $I( array( array( 'أين يقام الحدث؟', 'الموقع والتفاصيل تصلك بعد التسجيل.' ), array( 'هل هو مجاني؟', 'التسجيل مجاني للمقاعد الأولى.' ) ), array( 'q', 'a' ) ) ), 'alt' ),
				$S( 'form', array( 'title' => 'سجّل حضورك', 'btn' => 'أؤكد حضوري' ) ),
			);
	}
	return array( $S( 'hero', array( 'layout' => 'center' ) ), $S( 'cta', array( 'btn1' => 'ابدأ' ) ) );
}

/** يبني بيانات صفحة كاملة (منظّفة) من قالب. */
function blrlp_template_data( $slug ) {
	$meta = blrlp_templates_meta();
	$slug = isset( $meta[ $slug ] ) ? $slug : 'blank';
	return blrlp_sanitize_data( array(
		'sections' => blrlp_template_sections( $slug ),
		'design'   => array( 'preset' => $meta[ $slug ]['preset'] ),
	) );
}

/* إنشاء صفحة من قالب. */
add_action( 'admin_post_blrlp_new', function () {
	if ( ! current_user_can( 'edit_posts' ) || ! check_admin_referer( 'blrlp_new' ) ) {
		wp_die( esc_html__( 'غير مسموح.', 'blr-landing-pro' ) );
	}
	$slug = isset( $_GET['tpl'] ) ? sanitize_key( $_GET['tpl'] ) : 'blank';
	$meta = blrlp_templates_meta();
	if ( ! isset( $meta[ $slug ] ) ) {
		$slug = 'blank';
	}
	if ( $meta[ $slug ]['pro'] && ! blrlp_is_pro() ) {
		wp_safe_redirect( admin_url( 'admin.php?page=blr-landing-settings&locked=1' ) );
		exit;
	}
	$id = wp_insert_post( array( 'post_type' => 'blr_landing', 'post_status' => 'draft', 'post_title' => $meta[ $slug ]['name'] ) );
	if ( $id && ! is_wp_error( $id ) ) {
		update_post_meta( $id, '_blrlp_data', wp_slash( wp_json_encode( blrlp_template_data( $slug ), JSON_UNESCAPED_UNICODE ) ) );
		wp_safe_redirect( get_edit_post_link( $id, 'raw' ) );
		exit;
	}
	wp_safe_redirect( admin_url( 'admin.php?page=blr-landing' ) );
	exit;
} );
