<?php
/**
 * صفحات الهبوط الإعلانية: المحتوى يُحفظ كـ JSON منظّم (بطل، إحصاءات، مزايا، خطوات، أسعار، آراء، أسئلة، CTA).
 * يُعدَّل يدوياً أو يُولَّد بالذكاء الاصطناعي من إضافة BLR Shop Companion.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bshop_landing_sample() {
	return array(
		'hero'         => array( 'badge' => 'جديد', 'title' => 'أطلق متجرك الاحترافي في دقائق', 'sub' => 'منتجات رقمية ومادية واشتراكات في قالب واحد سريع، بتصميم يحوّل الزوار إلى عملاء.', 'cta' => 'ابدأ الآن', 'url' => '#pricing', 'cta2' => 'شاهد المزايا', 'url2' => '#features', 'image' => '' ),
		'stats'        => array( array( 'n' => '+10,000', 'l' => 'عميل' ), array( 'n' => '99%', 'l' => 'رضا' ), array( 'n' => '24/7', 'l' => 'دعم' ), array( 'n' => '< 1s', 'l' => 'سرعة' ) ),
		'features'     => array(
			array( 'icon' => 'bolt', 'title' => 'سرعة فائقة', 'text' => 'كود خفيف وتحميل كسول للصور.' ),
			array( 'icon' => 'shield', 'title' => 'آمن وموثوق', 'text' => 'حماية وتحديثات مستمرة.' ),
			array( 'icon' => 'spark', 'title' => 'ذكاء اصطناعي', 'text' => 'أوصاف المنتجات ومساعد تسوق للزوار.' ),
			array( 'icon' => 'repeat', 'title' => 'اشتراكات مرنة', 'text' => 'خطط شهرية وسنوية.' ),
			array( 'icon' => 'download', 'title' => 'تسليم فوري', 'text' => 'منتجات رقمية بروابط تحميل.' ),
			array( 'icon' => 'truck', 'title' => 'شحن وتتبّع', 'text' => 'دعم كامل للمنتجات المادية.' ),
		),
		'steps'        => array( array( 'title' => 'ثبّت القالب', 'text' => 'ارفعه وفعّل الترخيص.' ), array( 'title' => 'خصّص هويتك', 'text' => 'ألوان وشعار وسلايدرات.' ), array( 'title' => 'ابدأ البيع', 'text' => 'أضف منتجاتك واستقبل الطلبات.' ) ),
		'pricing'      => array(
			array( 'name' => 'موقع واحد', 'price' => '49$', 'period' => 'سنوياً', 'features' => array( 'ترخيص لموقع واحد', 'تحديثات سنة', 'دعم بالبريد' ), 'cta' => 'اشترِ الآن', 'url' => '#', 'highlight' => false ),
			array( 'name' => 'احترافي', 'price' => '99$', 'period' => 'سنوياً', 'features' => array( '5 مواقع', 'ميزات الذكاء الاصطناعي', 'دعم أولوية' ), 'cta' => 'الأكثر طلباً', 'url' => '#', 'highlight' => true ),
			array( 'name' => 'وكالات', 'price' => '199$', 'period' => 'سنوياً', 'features' => array( 'مواقع غير محدودة', 'علامة بيضاء', 'دعم مباشر' ), 'cta' => 'تواصل معنا', 'url' => '#', 'highlight' => false ),
		),
		'testimonials' => array( array( 'name' => 'عميل', 'role' => 'صاحب متجر', 'text' => 'شهادة توضيحية — استبدلها بآراء عملائك الحقيقيين.' ) ),
		'faq'          => array( array( 'q' => 'هل يدعم العربية والـ RTL؟', 'a' => 'نعم، عربي أولاً ويدعم الاتجاهين.' ), array( 'q' => 'هل يعمل مع ووكومرس؟', 'a' => 'نعم، تكامل كامل مع الرقمي والمادي والاشتراكات.' ) ),
		'cta'          => array( 'title' => 'جاهز لإطلاق متجرك؟', 'text' => 'ابدأ اليوم.', 'btn' => 'احصل عليه', 'url' => '#pricing' ),
	);
}

/** تنظيف متكرر: نصوص فقط. */
function bshop_landing_clean( $v ) {
	if ( is_array( $v ) ) {
		return array_map( 'bshop_landing_clean', $v );
	}
	if ( is_bool( $v ) || is_int( $v ) || is_float( $v ) ) {
		return $v;
	}
	return wp_strip_all_tags( (string) $v );
}

function bshop_landing_data( $post_id ) {
	$j = json_decode( (string) get_post_meta( $post_id, '_bshop_landing', true ), true );
	return is_array( $j ) ? $j : bshop_landing_sample();
}

function bshop_landing_url( $u ) {
	$u = trim( (string) $u );
	return ( '' !== $u && '#' === $u[0] ) ? $u : esc_url( $u );
}

/* ---------- القالب يُسجَّل من مجلد page-templates ---------- */
add_filter( 'theme_page_templates', function ( $t ) {
	$t['page-templates/tpl-ad-landing.php'] = 'BLR — صفحة هبوط إعلانية (بنّاء JSON)';
	return $t;
} );

/* ---------- صندوق التحرير ---------- */
add_action( 'add_meta_boxes_page', function () {
	add_meta_box( 'bshop_landing', '🚀 ' . __( 'منشئ صفحة الهبوط — BLR Shop', 'blr-shop-pro' ), 'bshop_landing_box', 'page', 'normal', 'high' );
} );

function bshop_landing_box( $post ) {
	wp_nonce_field( 'bshop_landing_save', 'bshop_landing_nonce' );
	$json = get_post_meta( $post->ID, '_bshop_landing', true );
	if ( ! $json ) {
		$json = wp_json_encode( bshop_landing_sample(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
	}
	$ai = function_exists( 'baderlr_ai_get_key' ) && baderlr_ai_get_key();
	?>
	<p class="description"><?php esc_html_e( 'اختر قالب الصفحة «BLR — صفحة هبوط إعلانية». اكتب وصف المنتج فيولّد الذكاء الاصطناعي كل الأقسام، ثم عدّل وأحفظ. احذف أي قسم من JSON لإخفائه.', 'blr-shop-pro' ); ?></p>
	<?php if ( $ai && function_exists( 'baderlr_landing_rest' ) ) : ?>
		<p><textarea id="bshop-brief" rows="3" class="widefat" placeholder="<?php esc_attr_e( 'مثال: قالب ووردبريس للمتاجر العربية، السعر 49$ سنوياً، يدعم الاشتراكات…', 'blr-shop-pro' ); ?>"></textarea></p>
		<p><button type="button" class="button button-primary" id="bshop-gen">✨ <?php esc_html_e( 'ولّد الصفحة بالذكاء الاصطناعي', 'blr-shop-pro' ); ?></button> <span class="description" id="bshop-gen-msg"></span></p>
	<?php else : ?>
		<p><em><?php esc_html_e( 'للتوليد بالذكاء الاصطناعي فعّل إضافة BLR Shop Companion وأضف مفتاح API.', 'blr-shop-pro' ); ?></em></p>
	<?php endif; ?>
	<p><textarea id="bshop-json" name="bshop_landing_json" rows="22" class="widefat code" dir="ltr" style="font-family:monospace"><?php echo esc_textarea( $json ); ?></textarea></p>
	<?php
}

add_action( 'save_post_page', function ( $id ) {
	if ( ! isset( $_POST['bshop_landing_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['bshop_landing_nonce'] ) ), 'bshop_landing_save' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_page', $id ) ) {
		return;
	}
	$j = json_decode( isset( $_POST['bshop_landing_json'] ) ? wp_unslash( $_POST['bshop_landing_json'] ) : '', true ); // phpcs:ignore
	if ( is_array( $j ) ) {
		update_post_meta( $id, '_bshop_landing', wp_slash( wp_json_encode( bshop_landing_clean( $j ), JSON_UNESCAPED_UNICODE ) ) );
	}
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
		return;
	}
	wp_enqueue_script( 'bshop-landing-admin', BADERLR_URI . 'assets/js/landing-admin.js', array(), BADERLR_VERSION, true );
	wp_localize_script( 'bshop-landing-admin', 'BShopLP', array(
		'root'  => esc_url_raw( rest_url( 'baderlr/v1/' ) ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'busy'  => __( 'جارٍ التوليد…', 'blr-shop-pro' ),
		'ok'    => __( '✓ تم — راجع ثم اضغط «تحديث».', 'blr-shop-pro' ),
		'err'   => __( 'حدث خطأ.', 'blr-shop-pro' ),
		'sure'  => __( 'سيستبدل هذا JSON الحالي. متابعة؟', 'blr-shop-pro' ),
	) );
} );
