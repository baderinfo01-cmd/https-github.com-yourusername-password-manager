<?php
/**
 * AI layer: product copywriter + shopper assistant.
 * كل الطلبات تمر عبر الخادم؛ مفتاح API لا يصل للمتصفح أبداً.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blr_ai_ready() {
	return '' !== blr_opt( 'ai_key' ) && blr_is_licensed();
}

function blr_ai_chat_enabled() {
	return blr_ai_ready() && (bool) blr_opt( 'ai_chat', 0 );
}

/**
 * Low-level call.
 *
 * @param string $system System prompt.
 * @param array  $messages [ ['role'=>'user|assistant','content'=>''], … ].
 * @return string|WP_Error
 */
function blr_ai_call( $system, array $messages, $max_tokens = 1800 ) {
	$key      = blr_opt( 'ai_key' );
	$provider = blr_opt( 'ai_provider', 'anthropic' );
	$model    = blr_opt( 'ai_model', 'claude-sonnet-5-5' );
	if ( '' === $key ) {
		return new WP_Error( 'blr_no_key', __( 'أضف مفتاح API من إعدادات BLR Shop Pro.', 'blr-shop-pro' ) );
	}

	if ( 'openai' === $provider ) {
		$url     = trailingslashit( blr_opt( 'ai_base', 'https://api.openai.com/v1' ) ) . 'chat/completions';
		$headers = array( 'Authorization' => 'Bearer ' . $key, 'Content-Type' => 'application/json' );
		$body    = array(
			'model'      => $model,
			'max_tokens' => $max_tokens,
			'messages'   => array_merge( array( array( 'role' => 'system', 'content' => $system ) ), $messages ),
		);
	} else {
		$url     = 'https://api.anthropic.com/v1/messages';
		$headers = array( 'x-api-key' => $key, 'anthropic-version' => '2023-06-01', 'Content-Type' => 'application/json' );
		$body    = array(
			'model'      => $model,
			'max_tokens' => $max_tokens,
			'system'     => $system,
			'messages'   => $messages,
		);
	}

	$res = wp_remote_post( $url, array( 'timeout' => 60, 'headers' => $headers, 'body' => wp_json_encode( $body ) ) );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$code = wp_remote_retrieve_response_code( $res );
	$data = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( $code >= 400 || ! is_array( $data ) ) {
		$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : 'HTTP ' . $code;
		return new WP_Error( 'blr_ai_http', sanitize_text_field( $msg ) );
	}
	if ( 'openai' === $provider ) {
		$text = isset( $data['choices'][0]['message']['content'] ) ? $data['choices'][0]['message']['content'] : '';
	} else {
		$text = '';
		foreach ( (array) ( $data['content'] ?? array() ) as $block ) {
			if ( isset( $block['type'], $block['text'] ) && 'text' === $block['type'] ) {
				$text .= $block['text'];
			}
		}
	}
	return '' === trim( $text ) ? new WP_Error( 'blr_ai_empty', __( 'رد فارغ من النموذج.', 'blr-shop-pro' ) ) : trim( $text );
}

/**
 * Pull the first JSON object out of a model reply.
 */
function blr_ai_json( $text ) {
	$text = preg_replace( '/^```(?:json)?|```$/m', '', $text );
	$a    = strpos( $text, '{' );
	$b    = strrpos( $text, '}' );
	if ( false === $a || false === $b ) {
		return null;
	}
	$j = json_decode( substr( $text, $a, $b - $a + 1 ), true );
	return is_array( $j ) ? $j : null;
}

/* ---------------------------------------------------------------
 * 1) كاتب محتوى المنتج (داخل شاشة تحرير المنتج)
 * ------------------------------------------------------------- */
add_action( 'add_meta_boxes', function () {
	add_meta_box( 'blr_ai_product', '✨ ' . __( 'كاتب المنتج بالذكاء الاصطناعي', 'blr-shop-pro' ), 'blr_ai_product_box', 'product', 'side', 'high' );
} );

function blr_ai_product_box() {
	if ( ! blr_ai_ready() ) {
		echo '<p>' . esc_html__( 'فعّل الترخيص وأضف مفتاح API من إعدادات BLR Shop Pro لاستخدام هذه الميزة.', 'blr-shop-pro' ) . '</p>';
		return;
	}
	?>
	<p><label><?php esc_html_e( 'كلمات مفتاحية / ملاحظات', 'blr-shop-pro' ); ?><br>
		<textarea id="blr-ai-notes" rows="3" class="widefat" placeholder="<?php esc_attr_e( 'مثال: قالب ووردبريس، سريع، متوافق مع RTL', 'blr-shop-pro' ); ?>"></textarea></label></p>
	<p><label><?php esc_html_e( 'النبرة', 'blr-shop-pro' ); ?>
		<select id="blr-ai-tone" class="widefat">
			<option value="احترافية">احترافية</option>
			<option value="ودّية">ودّية</option>
			<option value="تسويقية حماسية">تسويقية حماسية</option>
			<option value="فخمة">فخمة</option>
		</select></label></p>
	<p><button type="button" class="button button-primary widefat" id="blr-ai-run" data-blr-ai-product>✨ <?php esc_html_e( 'ولّد الوصف والـ SEO', 'blr-shop-pro' ); ?></button></p>
	<p class="description" id="blr-ai-msg"></p>
	<?php
}

add_action( 'wp_ajax_blr_ai_product', 'blr_ajax_ai_product' );
function blr_ajax_ai_product() {
	check_ajax_referer( 'blr_admin', 'nonce' );
	if ( ! current_user_can( 'edit_products' ) || ! blr_ai_ready() ) {
		wp_send_json_error( array( 'message' => __( 'غير مسموح أو الميزة غير مفعّلة.', 'blr-shop-pro' ) ), 403 );
	}
	$title = isset( $_POST['title'] ) ? sanitize_text_field( wp_unslash( $_POST['title'] ) ) : '';
	$notes = isset( $_POST['notes'] ) ? sanitize_textarea_field( wp_unslash( $_POST['notes'] ) ) : '';
	$tone  = isset( $_POST['tone'] ) ? sanitize_text_field( wp_unslash( $_POST['tone'] ) ) : 'احترافية';
	$kind  = isset( $_POST['kind'] ) ? sanitize_key( $_POST['kind'] ) : 'physical';
	if ( '' === $title ) {
		wp_send_json_error( array( 'message' => __( 'اكتب عنوان المنتج أولاً.', 'blr-shop-pro' ) ) );
	}
	$system = sprintf(
		'أنت كاتب محتوى تجارة إلكترونية محترف لمتجر "%1$s". اكتب بـ%2$s وبنبرة %3$s. لا تخترع مواصفات غير مذكورة. أعد JSON فقط بدون أي نص خارجه بالمفاتيح: description (HTML بسيط: p, ul, li, strong، 150-250 كلمة)، short (جملتان)، seo_title (حتى 60 حرفاً)، seo_desc (حتى 155 حرفاً)، tags (مصفوفة 5 كلمات).',
		blr_opt( 'ai_brand', get_bloginfo( 'name' ) ),
		blr_opt( 'ai_lang', 'العربية' ),
		$tone
	);
	$r = blr_ai_call( $system, array( array( 'role' => 'user', 'content' => "نوع المنتج: {$kind}\nالاسم: {$title}\nملاحظات: {$notes}" ) ), 1500 );
	if ( is_wp_error( $r ) ) {
		wp_send_json_error( array( 'message' => $r->get_error_message() ) );
	}
	$j = blr_ai_json( $r );
	if ( ! $j ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر قراءة رد النموذج، أعد المحاولة.', 'blr-shop-pro' ) ) );
	}
	wp_send_json_success(
		array(
			'description' => wp_kses_post( $j['description'] ?? '' ),
			'short'       => wp_kses_post( $j['short'] ?? '' ),
			'seo_title'   => sanitize_text_field( $j['seo_title'] ?? '' ),
			'seo_desc'    => sanitize_text_field( $j['seo_desc'] ?? '' ),
			'tags'        => array_map( 'sanitize_text_field', (array) ( $j['tags'] ?? array() ) ),
		)
	);
}

/* وصف SEO يُطبع تلقائياً إن لم يكن هناك إضافة SEO. */
add_action( 'woocommerce_process_product_meta', function ( $id ) {
	if ( isset( $_POST['blr_seo_title'] ) && current_user_can( 'edit_post', $id ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		update_post_meta( $id, '_blr_seo_title', sanitize_text_field( wp_unslash( $_POST['blr_seo_title'] ) ) ); // phpcs:ignore
		update_post_meta( $id, '_blr_seo_desc', sanitize_text_field( wp_unslash( $_POST['blr_seo_desc'] ?? '' ) ) ); // phpcs:ignore
	}
} );
add_action( 'wp_head', function () {
	if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || ! is_singular( 'product' ) ) {
		return;
	}
	$d = get_post_meta( get_the_ID(), '_blr_seo_desc', true );
	if ( $d ) {
		echo '<meta name="description" content="' . esc_attr( $d ) . '">' . "\n";
	}
}, 3 );

/* ---------------------------------------------------------------
 * 2) مساعد التسوق للزوار
 * ------------------------------------------------------------- */
add_action( 'wp_ajax_blr_chat', 'blr_ajax_chat' );
add_action( 'wp_ajax_nopriv_blr_chat', 'blr_ajax_chat' );
function blr_ajax_chat() {
	check_ajax_referer( 'blr_front', 'nonce' );
	if ( ! blr_ai_chat_enabled() ) {
		wp_send_json_error( array( 'message' => __( 'المساعد غير متاح حالياً.', 'blr-shop-pro' ) ), 403 );
	}

	// حدود الاستخدام: لكل زائر/ساعة، وسقف يومي عام لحماية الفاتورة.
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '0';
	$ik  = 'blr_chat_' . md5( $ip );
	$cnt = (int) get_transient( $ik );
	$day = (int) get_transient( 'blr_chat_day' );
	if ( $cnt >= 20 || $day >= (int) blr_opt( 'ai_chat_cap', 300 ) ) {
		wp_send_json_error( array( 'message' => __( 'وصلت للحد المسموح حالياً. تواصل معنا عبر واتساب.', 'blr-shop-pro' ) ), 429 );
	}
	set_transient( $ik, $cnt + 1, HOUR_IN_SECONDS );
	set_transient( 'blr_chat_day', $day + 1, DAY_IN_SECONDS );

	$msg = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';
	$msg = mb_substr( $msg, 0, 400 );
	if ( '' === $msg ) {
		wp_send_json_error( array( 'message' => __( 'اكتب رسالة.', 'blr-shop-pro' ) ) );
	}

	$history = array();
	$raw     = isset( $_POST['history'] ) ? json_decode( wp_unslash( $_POST['history'] ), true ) : array(); // phpcs:ignore
	foreach ( array_slice( is_array( $raw ) ? $raw : array(), -6 ) as $h ) {
		if ( isset( $h['role'], $h['content'] ) && in_array( $h['role'], array( 'user', 'assistant' ), true ) ) {
			$history[] = array( 'role' => $h['role'], 'content' => mb_substr( sanitize_textarea_field( $h['content'] ), 0, 600 ) );
		}
	}
	// Anthropic يشترط أن تبدأ المحادثة برسالة مستخدم وتتناوب الأدوار.
	while ( $history && 'user' !== $history[0]['role'] ) {
		array_shift( $history );
	}
	$clean = array();
	foreach ( $history as $h ) {
		if ( $clean && $clean[ count( $clean ) - 1 ]['role'] === $h['role'] ) {
			continue;
		}
		$clean[] = $h;
	}
	if ( $clean && 'user' === $clean[ count( $clean ) - 1 ]['role'] ) {
		array_pop( $clean );
	}
	$clean[] = array( 'role' => 'user', 'content' => $msg );

	$system = sprintf(
		"أنت مساعد تسوق لمتجر \"%1\$s\". أجب بـ%2\$s بإيجاز (٣ جمل كحد أقصى) ولطف. اعتمد فقط على قائمة المنتجات أدناه ولا تخترع منتجات أو أسعاراً أو سياسات. عند التوصية اذكر اسم المنتج وسعره ورابطه كما هو. إن لم تجد ما يناسب فاعتذر واقترح التواصل مع الدعم.\n\nمنتجات ذات صلة:\n%3\$s",
		blr_opt( 'ai_brand', get_bloginfo( 'name' ) ),
		blr_opt( 'ai_lang', 'العربية' ),
		blr_ai_catalog_context( $msg )
	);
	$r = blr_ai_call( $system, $clean, 500 );
	if ( is_wp_error( $r ) ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر الرد الآن، حاول لاحقاً.', 'blr-shop-pro' ) ) );
	}
	wp_send_json_success( array( 'reply' => wp_strip_all_tags( $r ) ) );
}

function blr_ai_catalog_context( $query ) {
	if ( ! blr_is_woo() ) {
		return '(لا يوجد متجر)';
	}
	$args = array( 'status' => 'publish', 'limit' => 8, 's' => $query );
	$list = wc_get_products( $args );
	if ( ! $list ) {
		$list = wc_get_products( array( 'status' => 'publish', 'limit' => 8, 'orderby' => 'popularity', 'order' => 'DESC' ) );
	}
	$lines = array();
	foreach ( $list as $p ) {
		$lines[] = sprintf(
			'- %1$s | النوع: %2$s | السعر: %3$s | %4$s',
			$p->get_name(),
			blr_product_kind_label( blr_product_kind( $p ) ),
			wp_strip_all_tags( html_entity_decode( $p->get_price_html() ) ),
			get_permalink( $p->get_id() )
		);
	}
	return $lines ? implode( "\n", $lines ) : '(لا توجد منتجات)';
}

/* واجهة المحادثة في الفوتر */
add_action( 'wp_footer', 'blr_chat_markup' );
function blr_chat_markup() {
	if ( ! blr_ai_chat_enabled() ) {
		return;
	}
	?>
	<div class="blr-chat" id="blr-chat" hidden>
		<div class="blr-chat__head"><?php echo blr_icon( 'sparkle', 18 ); // phpcs:ignore ?> <strong><?php esc_html_e( 'مساعد التسوق الذكي', 'blr-shop-pro' ); ?></strong>
			<button type="button" data-blr-chat-close aria-label="<?php esc_attr_e( 'إغلاق', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'close', 18 ); // phpcs:ignore ?></button></div>
		<div class="blr-chat__log" aria-live="polite"></div>
		<form class="blr-chat__form"><input type="text" maxlength="400" placeholder="<?php esc_attr_e( 'اكتب سؤالك…', 'blr-shop-pro' ); ?>" required>
			<button type="submit" aria-label="<?php esc_attr_e( 'إرسال', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'send', 18 ); // phpcs:ignore ?></button></form>
	</div>
	<button type="button" class="blr-fab blr-fab--ai" data-blr-chat-open aria-label="<?php esc_attr_e( 'مساعد التسوق', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'bot', 26 ); // phpcs:ignore ?></button>
	<?php
}
