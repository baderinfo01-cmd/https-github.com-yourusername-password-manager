<?php
/**
 * ذكاء اصطناعي للمتجر:
 *  1) كاتب المنتجات (وصف طويل/قصير + SEO + وسوم) داخل شاشة تحرير المنتج.
 *  2) سياق كتالوج المتجر لمساعد الزوّار (يقترح منتجات حقيقية فقط).
 *  3) مولّد صفحات الهبوط الإعلانية (JSON منظّم يقرؤه القالب).
 *
 * @package blr-shop-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** استخراج أول كائن JSON من رد النموذج. */
function baderlr_ai_extract_json( $text ) {
	$text = preg_replace( '/^```(?:json)?|```$/m', '', (string) $text );
	$a    = strpos( $text, '{' );
	$b    = strrpos( $text, '}' );
	if ( false === $a || false === $b ) {
		return null;
	}
	$j = json_decode( substr( $text, $a, $b - $a + 1 ), true );
	return is_array( $j ) ? $j : null;
}

/* ===================== 2) سياق الكتالوج للدردشة ===================== */
function baderlr_shop_catalog_context( $query ) {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return '';
	}
	$list = wc_get_products( array( 'status' => 'publish', 'limit' => 8, 's' => $query ) );
	if ( ! $list ) {
		$list = wc_get_products( array( 'status' => 'publish', 'limit' => 6, 'orderby' => 'popularity', 'order' => 'DESC' ) );
	}
	$lines = array();
	foreach ( $list as $p ) {
		$kind    = function_exists( 'bshop_product_kind' ) ? bshop_product_kind( $p ) : 'physical';
		$label   = function_exists( 'bshop_product_kind_label' ) ? bshop_product_kind_label( $kind ) : $kind;
		$lines[] = sprintf( '- %s | %s | %s | %s', $p->get_name(), $label, wp_strip_all_tags( html_entity_decode( $p->get_price_html() ) ), get_permalink( $p->get_id() ) );
	}
	return implode( "\n", $lines );
}

/* ===================== 1) كاتب المنتجات ===================== */
add_action( 'add_meta_boxes', function () {
	add_meta_box( 'baderlr_ai_product', '✦ ' . __( 'كاتب المنتج بالذكاء الاصطناعي', 'blr-shop-companion' ), 'baderlr_ai_product_box', 'product', 'side', 'high' );
} );

function baderlr_ai_product_box() {
	if ( ! baderlr_ai_get_key() ) {
		echo '<p>' . esc_html__( 'اضبط مفتاح API من BLR Shop ← إعدادات AI.', 'blr-shop-companion' ) . '</p>';
		return;
	}
	?>
	<p><label><?php esc_html_e( 'كلمات مفتاحية / ملاحظات', 'blr-shop-companion' ); ?><br>
		<textarea id="blrc-p-notes" rows="3" class="widefat" placeholder="<?php esc_attr_e( 'مثال: قالب ووردبريس، سريع، متوافق مع RTL', 'blr-shop-companion' ); ?>"></textarea></label></p>
	<p><label><?php esc_html_e( 'النبرة', 'blr-shop-companion' ); ?>
		<select id="blrc-p-tone" class="widefat"><option>احترافية</option><option>ودّية</option><option>تسويقية حماسية</option><option>فخمة</option></select></label></p>
	<p><button type="button" class="button button-primary widefat" id="blrc-p-run">✨ <?php esc_html_e( 'ولّد الوصف والـ SEO', 'blr-shop-companion' ); ?></button></p>
	<p class="description" id="blrc-p-msg"></p>
	<?php
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	global $post;
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || ! $post || 'product' !== $post->post_type ) {
		return;
	}
	wp_enqueue_script( 'baderlr-product-ai', BADERLR_COMPANION_URI . 'assets/product.js', array(), BADERLR_COMPANION_VERSION, true );
	wp_localize_script( 'baderlr-product-ai', 'BaderLRP', array(
		'root'  => esc_url_raw( rest_url( 'baderlr/v1/' ) ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'busy'  => __( 'جارٍ التوليد…', 'blr-shop-companion' ),
		'done'  => __( '✓ تم. راجع النص قبل الحفظ.', 'blr-shop-companion' ),
		'err'   => __( 'حدث خطأ.', 'blr-shop-companion' ),
		'kind'  => ( $post->ID && function_exists( 'bshop_product_kind' ) ) ? bshop_product_kind( $post->ID ) : 'physical',
	) );
} );

add_action( 'rest_api_init', function () {
	register_rest_route( 'baderlr/v1', '/product', array(
		'methods'             => 'POST',
		'callback'            => 'baderlr_product_rest',
		'permission_callback' => function () {
			return current_user_can( 'edit_products' );
		},
	) );
	register_rest_route( 'baderlr/v1', '/landing', array(
		'methods'             => 'POST',
		'callback'            => 'baderlr_landing_rest',
		'permission_callback' => function () {
			return current_user_can( 'edit_pages' );
		},
	) );
} );

function baderlr_product_rest( WP_REST_Request $req ) {
	$title = sanitize_text_field( (string) $req->get_param( 'title' ) );
	$notes = mb_substr( sanitize_textarea_field( (string) $req->get_param( 'notes' ) ), 0, 800 );
	$tone  = sanitize_text_field( (string) $req->get_param( 'tone' ) );
	$kind  = sanitize_key( (string) $req->get_param( 'kind' ) );
	if ( '' === $title ) {
		return new WP_REST_Response( array( 'error' => __( 'اكتب عنوان المنتج أولاً.', 'blr-shop-companion' ) ), 400 );
	}
	if ( ! baderlr_ai_get_key() ) {
		return new WP_REST_Response( array( 'error' => __( 'اضبط مفتاح API من الإعدادات.', 'blr-shop-companion' ) ), 400 );
	}
	$system = sprintf(
		'أنت كاتب محتوى تجارة إلكترونية محترف لمتجر "%1$s". اكتب بالعربية وبنبرة %2$s. لا تخترع مواصفات أو أرقاماً غير مذكورة. أعد JSON صالحاً فقط بلا أي نص خارجه بالمفاتيح: description (HTML بسيط: p, ul, li, strong — 150 إلى 250 كلمة)، short (جملتان)، seo_desc (حتى 155 حرفاً)، tags (مصفوفة 5 كلمات).',
		get_bloginfo( 'name' ),
		$tone ? $tone : 'احترافية'
	);
	$out = baderlr_ai_call( "نوع المنتج: {$kind}\nالاسم: {$title}\nملاحظات: {$notes}", $system, array(), 1500 );
	if ( is_wp_error( $out ) ) {
		return new WP_REST_Response( array( 'error' => $out->get_error_message() ), 502 );
	}
	$j = baderlr_ai_extract_json( $out );
	if ( ! $j ) {
		return new WP_REST_Response( array( 'error' => __( 'تعذّر قراءة رد النموذج، أعد المحاولة.', 'blr-shop-companion' ) ), 502 );
	}
	return new WP_REST_Response( array(
		'description' => wp_kses_post( isset( $j['description'] ) ? $j['description'] : '' ),
		'short'       => wp_kses_post( isset( $j['short'] ) ? $j['short'] : '' ),
		'seo_desc'    => sanitize_text_field( isset( $j['seo_desc'] ) ? $j['seo_desc'] : '' ),
		'tags'        => array_map( 'sanitize_text_field', (array) ( isset( $j['tags'] ) ? $j['tags'] : array() ) ),
	), 200 );
}

/* ===================== 3) مولّد صفحة الهبوط ===================== */
function baderlr_landing_rest( WP_REST_Request $req ) {
	$brief = mb_substr( sanitize_textarea_field( (string) $req->get_param( 'brief' ) ), 0, 1500 );
	if ( mb_strlen( $brief ) < 10 ) {
		return new WP_REST_Response( array( 'error' => __( 'اكتب وصفاً أوضح (10 أحرف على الأقل).', 'blr-shop-companion' ) ), 400 );
	}
	if ( ! baderlr_ai_get_key() || ! function_exists( 'bshop_landing_sample' ) ) {
		return new WP_REST_Response( array( 'error' => __( 'اضبط مفتاح API وفعّل قالب BLR Shop Pro.', 'blr-shop-companion' ) ), 400 );
	}
	$schema = wp_json_encode( bshop_landing_sample(), JSON_UNESCAPED_UNICODE );
	$system = 'أنت خبير كتابة صفحات هبوط إعلانية عالية التحويل، تكتب بالعربية. أعد JSON صالحاً فقط (بلا شرح) يطابق تماماً بنية هذا المثال: ' . $schema
		. ' . الأيقونات المسموحة في features: bolt, shield, spark, repeat, download, truck, star, heart, check, cart, globe, layers. '
		. 'لا تخترع إحصاءات حقيقية أو شهادات لأشخاص حقيقيين؛ اجعل الأرقام والشهادات توضيحية عامة. استخدم # كرابط ما لم يُعطَ رابط.';
	$out = baderlr_ai_call( $brief, $system, array(), 3500 );
	if ( is_wp_error( $out ) ) {
		return new WP_REST_Response( array( 'error' => $out->get_error_message() ), 502 );
	}
	$j = baderlr_ai_extract_json( $out );
	if ( ! $j || ! function_exists( 'bshop_landing_clean' ) ) {
		return new WP_REST_Response( array( 'error' => __( 'تعذّر قراءة رد النموذج، أعد المحاولة.', 'blr-shop-companion' ) ), 502 );
	}
	return new WP_REST_Response( array( 'json' => wp_json_encode( bshop_landing_clean( $j ), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) ), 200 );
}
