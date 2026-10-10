<?php
/**
 * Landing page builder (قالب صفحة الهبوط الإعلانية).
 * المحتوى يُحفظ كـ JSON منظم، ويمكن توليده بالذكاء الاصطناعي أو تعديله يدوياً.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blr_landing_sample() {
	return array(
		'hero'         => array(
			'badge' => 'جديد',
			'title' => 'أطلق متجرك الاحترافي في دقائق',
			'sub'   => 'قالب متكامل لبيع المنتجات الرقمية والمادية والاشتراكات، بسرعة عالية وتصميم يحوّل الزوار إلى عملاء.',
			'cta'   => 'ابدأ الآن',
			'url'   => '#pricing',
			'cta2'  => 'شاهد المزايا',
			'url2'  => '#features',
			'image' => '',
		),
		'stats'        => array(
			array( 'n' => '+10,000', 'l' => 'عميل سعيد' ),
			array( 'n' => '99%', 'l' => 'رضا العملاء' ),
			array( 'n' => '24/7', 'l' => 'دعم فني' ),
			array( 'n' => '< 1s', 'l' => 'سرعة التحميل' ),
		),
		'features'     => array(
			array( 'icon' => 'bolt', 'title' => 'سرعة فائقة', 'text' => 'كود خفيف وتحميل كسول للصور لأداء ممتاز.' ),
			array( 'icon' => 'shield', 'title' => 'آمن وموثوق', 'text' => 'حماية متقدمة وتحديثات مستمرة.' ),
			array( 'icon' => 'sparkle', 'title' => 'ذكاء اصطناعي', 'text' => 'توليد أوصاف المنتجات ومساعد تسوق للزوار.' ),
			array( 'icon' => 'repeat', 'title' => 'اشتراكات مرنة', 'text' => 'خطط شهرية وسنوية بتجديد تلقائي.' ),
			array( 'icon' => 'download', 'title' => 'تسليم فوري', 'text' => 'منتجات رقمية بروابط تحميل وتراخيص.' ),
			array( 'icon' => 'truck', 'title' => 'شحن وتتبع', 'text' => 'دعم كامل للمنتجات المادية وشركات الشحن.' ),
		),
		'steps'        => array(
			array( 'title' => 'ثبّت القالب', 'text' => 'ارفع القالب وفعّل الترخيص.' ),
			array( 'title' => 'خصّص هويتك', 'text' => 'ألوان وشعار وسلايدرات من لوحة واحدة.' ),
			array( 'title' => 'ابدأ البيع', 'text' => 'أضف منتجاتك واستقبل الطلبات.' ),
		),
		'pricing'      => array(
			array( 'name' => 'موقع واحد', 'price' => '49$', 'period' => 'سنوياً', 'features' => array( 'ترخيص لموقع واحد', 'تحديثات سنة', 'دعم بالبريد' ), 'cta' => 'اشترِ الآن', 'url' => '#', 'highlight' => false ),
			array( 'name' => 'احترافي', 'price' => '99$', 'period' => 'سنوياً', 'features' => array( '5 مواقع', 'ميزات الذكاء الاصطناعي', 'دعم أولوية' ), 'cta' => 'الأكثر طلباً', 'url' => '#', 'highlight' => true ),
			array( 'name' => 'وكالات', 'price' => '199$', 'period' => 'سنوياً', 'features' => array( 'مواقع غير محدودة', 'علامة بيضاء', 'دعم مباشر' ), 'cta' => 'تواصل معنا', 'url' => '#', 'highlight' => false ),
		),
		'testimonials' => array(
			array( 'name' => 'أحمد', 'role' => 'صاحب متجر', 'text' => 'ضاعفت مبيعاتي بعد الانتقال للقالب.' ),
			array( 'name' => 'سارة', 'role' => 'مصممة', 'text' => 'أفضل قالب جربته للمنتجات الرقمية.' ),
			array( 'name' => 'خالد', 'role' => 'مطوّر', 'text' => 'كود نظيف وسهل التخصيص.' ),
		),
		'faq'          => array(
			array( 'q' => 'هل يدعم العربية والـ RTL؟', 'a' => 'نعم، مبني بالعربية أولاً ويدعم الاتجاهين.' ),
			array( 'q' => 'هل يعمل مع ووكومرس؟', 'a' => 'نعم، تكامل كامل مع الرقمي والمادي والاشتراكات.' ),
			array( 'q' => 'ماذا يحدث عند انتهاء الترخيص؟', 'a' => 'يستمر القالب بالعمل، وتتوقف التحديثات وميزات الذكاء الاصطناعي حتى التجديد.' ),
		),
		'cta'          => array( 'title' => 'جاهز لإطلاق متجرك؟', 'text' => 'انضم لآلاف المتاجر الناجحة اليوم.', 'btn' => 'احصل على القالب', 'url' => '#pricing' ),
	);
}

/* ---------- Metabox ---------- */
add_action( 'add_meta_boxes_page', function () {
	add_meta_box( 'blr_landing', '🚀 ' . __( 'منشئ صفحة الهبوط — BLR', 'blr-shop-pro' ), 'blr_landing_box', 'page', 'normal', 'high' );
} );

function blr_landing_box( $post ) {
	wp_nonce_field( 'blr_landing_save', 'blr_landing_nonce' );
	$json = get_post_meta( $post->ID, '_blr_landing', true );
	if ( ! $json ) {
		$json = wp_json_encode( blr_landing_sample(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
	}
	?>
	<p class="description"><?php esc_html_e( 'اختر قالب الصفحة "BLR — صفحة هبوط" من خصائص الصفحة. اكتب وصفاً مختصراً للمنتج وسيُنشئ الذكاء الاصطناعي كل الأقسام، ثم عدّل ما تشاء.', 'blr-shop-pro' ); ?></p>
	<?php if ( blr_ai_ready() ) : ?>
		<p><textarea id="blr-landing-brief" rows="3" class="widefat" placeholder="<?php esc_attr_e( 'مثال: قالب ووردبريس للمتاجر، يبيع للعرب، السعر 49$ سنوياً، يدعم الاشتراكات…', 'blr-shop-pro' ); ?>"></textarea></p>
		<p><button type="button" class="button button-primary" data-blr-landing-ai>✨ <?php esc_html_e( 'ولّد الصفحة بالذكاء الاصطناعي', 'blr-shop-pro' ); ?></button>
		<span class="description" id="blr-landing-msg"></span></p>
	<?php else : ?>
		<p><em><?php esc_html_e( 'التوليد بالذكاء الاصطناعي يحتاج ترخيصاً مفعّلاً ومفتاح API. يمكنك التعديل اليدوي أدناه.', 'blr-shop-pro' ); ?></em></p>
	<?php endif; ?>
	<p><label for="blr-landing-json"><strong>JSON</strong></label>
	<textarea id="blr-landing-json" name="blr_landing_json" rows="22" class="widefat code" dir="ltr" style="font-family:monospace"><?php echo esc_textarea( $json ); ?></textarea></p>
	<p class="description">hero · stats · features · steps · pricing · testimonials · faq · cta — <?php esc_html_e( 'احذف أي قسم لإخفائه.', 'blr-shop-pro' ); ?></p>
	<?php
}

function blr_landing_clean( $v ) {
	if ( is_array( $v ) ) {
		return array_map( 'blr_landing_clean', $v );
	}
	if ( is_bool( $v ) || is_int( $v ) || is_float( $v ) ) {
		return $v;
	}
	return wp_strip_all_tags( (string) $v );
}

add_action( 'save_post_page', function ( $id ) {
	if ( ! isset( $_POST['blr_landing_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['blr_landing_nonce'] ) ), 'blr_landing_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE || ! current_user_can( 'edit_page', $id ) ) {
		return;
	}
	$raw = isset( $_POST['blr_landing_json'] ) ? wp_unslash( $_POST['blr_landing_json'] ) : ''; // phpcs:ignore
	$j   = json_decode( $raw, true );
	if ( is_array( $j ) ) {
		update_post_meta( $id, '_blr_landing', wp_slash( wp_json_encode( blr_landing_clean( $j ), JSON_UNESCAPED_UNICODE ) ) );
	}
} );

/* ---------- AI generation ---------- */
add_action( 'wp_ajax_blr_ai_landing', function () {
	check_ajax_referer( 'blr_admin', 'nonce' );
	if ( ! current_user_can( 'edit_pages' ) || ! blr_ai_ready() ) {
		wp_send_json_error( array( 'message' => __( 'غير مسموح أو الميزة غير مفعّلة.', 'blr-shop-pro' ) ), 403 );
	}
	$brief = isset( $_POST['brief'] ) ? sanitize_textarea_field( wp_unslash( $_POST['brief'] ) ) : '';
	if ( mb_strlen( $brief ) < 10 ) {
		wp_send_json_error( array( 'message' => __( 'اكتب وصفاً أوضح (10 أحرف على الأقل).', 'blr-shop-pro' ) ) );
	}
	$schema = wp_json_encode( blr_landing_sample(), JSON_UNESCAPED_UNICODE );
	$system = sprintf(
		'أنت خبير كتابة صفحات هبوط إعلانية عالية التحويل. اكتب بـ%1$s. أعد JSON صالحاً فقط (بدون شرح) يطابق تماماً بنية هذا المثال: %2$s . الأيقونات المسموحة في features: bolt, shield, sparkle, repeat, download, truck, star, heart, check. لا تخترع إحصاءات أو شهادات حقيقية لأشخاص حقيقيين؛ اجعل الأرقام والشهادات توضيحية عامة. استخدم # أو الروابط المعطاة فقط.',
		blr_opt( 'ai_lang', 'العربية' ),
		$schema
	);
	$r = blr_ai_call( $system, array( array( 'role' => 'user', 'content' => $brief ) ), 3500 );
	if ( is_wp_error( $r ) ) {
		wp_send_json_error( array( 'message' => $r->get_error_message() ) );
	}
	$j = blr_ai_json( $r );
	if ( ! $j ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر قراءة رد النموذج، أعد المحاولة.', 'blr-shop-pro' ) ) );
	}
	wp_send_json_success( array( 'json' => wp_json_encode( blr_landing_clean( $j ), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) ) );
} );

/* ---------- Template registration (works regardless of file location) ---------- */
add_filter( 'theme_page_templates', function ( $t ) {
	$t['template-landing.php'] = 'BLR — صفحة هبوط';
	return $t;
} );

/* ---------- Render ---------- */
function blr_landing_data( $post_id ) {
	$j = json_decode( (string) get_post_meta( $post_id, '_blr_landing', true ), true );
	return is_array( $j ) ? $j : blr_landing_sample();
}

function blr_landing_url( $u ) {
	$u = trim( (string) $u );
	return ( '' !== $u && '#' === $u[0] ) ? $u : esc_url( $u );
}
