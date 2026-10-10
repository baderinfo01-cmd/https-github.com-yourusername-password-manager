<?php
/**
 * مولّد المحتوى بالذكاء الاصطناعي.
 * يدعم OpenAI و Anthropic (Claude) ومزوّداً مخصّصاً متوافقاً مع OpenAI.
 * مفتاح API ملك المستخدم ويُحفظ في قاعدة بيانات موقعه — لا يُشحن مع الإضافة.
 *
 * @package blr-shop-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_ai_get_settings() {
	$d = get_option( 'baderlr_ai', array() );
	$d = is_array( $d ) ? $d : array();
	return wp_parse_args( $d, array(
		'provider' => 'openai',
		'model'    => '',
		'api_key'  => '',
		'endpoint' => '',
	) );
}

function baderlr_ai_get_key() {
	$s = baderlr_ai_get_settings();
	return trim( (string) $s['api_key'] );
}

function baderlr_ai_default_model( $provider ) {
	$map = array(
		'openai'    => 'gpt-4o-mini',
		'anthropic' => 'claude-haiku-5-5',
		'custom'    => 'gpt-4o-mini',
	);
	return isset( $map[ $provider ] ) ? $map[ $provider ] : 'gpt-4o-mini';
}

/* ================= إعدادات ================= */

function baderlr_c_ai_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$saved = false;
	if ( 'POST' === $_SERVER['REQUEST_METHOD'] && check_admin_referer( 'baderlr_ai_settings' ) ) {
		update_option( 'baderlr_ai', array(
			'provider' => in_array( ( $_POST['provider'] ?? '' ), array( 'openai', 'anthropic', 'custom' ), true ) ? sanitize_text_field( wp_unslash( $_POST['provider'] ) ) : 'openai',
			'model'    => sanitize_text_field( wp_unslash( $_POST['model'] ?? '' ) ),
			'api_key'  => trim( sanitize_text_field( wp_unslash( $_POST['api_key'] ?? '' ) ) ),
			'endpoint' => esc_url_raw( wp_unslash( $_POST['endpoint'] ?? '' ) ),
		) );
		$saved = true;
	}
	$s   = baderlr_ai_get_settings();
	$key = $s['api_key'];
	$mask = $key ? str_repeat( '•', max( 0, strlen( $key ) - 4 ) ) . substr( $key, -4 ) : '';
	?>
	<div class="wrap baderlr-c" dir="rtl" style="max-width:720px">
		<h1><?php esc_html_e( 'إعدادات الذكاء الاصطناعي', 'blr-shop-companion' ); ?></h1>
		<?php if ( $saved ) : ?><div class="notice notice-success"><p><?php esc_html_e( 'تم الحفظ.', 'blr-shop-companion' ); ?></p></div><?php endif; ?>
		<p class="description"><?php esc_html_e( 'استعمل مفتاح API الخاص بك. لن يُرسل إلا إلى المزوّد الذي تختاره، ويبقى محفوظاً على موقعك.', 'blr-shop-companion' ); ?></p>
		<form method="post" class="blrc-form">
			<?php wp_nonce_field( 'baderlr_ai_settings' ); ?>
			<label><?php esc_html_e( 'المزوّد', 'blr-shop-companion' ); ?></label>
			<select name="provider">
				<option value="openai" <?php selected( $s['provider'], 'openai' ); ?>>OpenAI (ChatGPT)</option>
				<option value="anthropic" <?php selected( $s['provider'], 'anthropic' ); ?>>Anthropic (Claude)</option>
				<option value="custom" <?php selected( $s['provider'], 'custom' ); ?>><?php esc_html_e( 'مخصّص (متوافق مع OpenAI)', 'blr-shop-companion' ); ?></option>
			</select>

			<label><?php esc_html_e( 'النموذج', 'blr-shop-companion' ); ?> <span class="description"><?php esc_html_e( 'اتركه فارغاً للافتراضي', 'blr-shop-companion' ); ?></span></label>
			<input type="text" name="model" dir="ltr" value="<?php echo esc_attr( $s['model'] ); ?>" placeholder="gpt-4o-mini / claude-haiku-5-5">

			<label><?php esc_html_e( 'مفتاح API', 'blr-shop-companion' ); ?></label>
			<input type="password" name="api_key" dir="ltr" value="<?php echo esc_attr( $key ); ?>" placeholder="<?php echo esc_attr( $mask ? $mask : 'sk-...' ); ?>" autocomplete="off">

			<label class="blrc-custom"><?php esc_html_e( 'رابط المزوّد المخصّص (اختياري)', 'blr-shop-companion' ); ?></label>
			<input type="url" name="endpoint" dir="ltr" class="blrc-custom" value="<?php echo esc_attr( $s['endpoint'] ); ?>" placeholder="https://.../v1/chat/completions">

			<p><button class="button button-primary button-hero"><?php esc_html_e( 'حفظ الإعدادات', 'blr-shop-companion' ); ?></button></p>
		</form>
	</div>
	<?php
}

/* ================= واجهة التوليد ================= */

function baderlr_c_ai_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	$configured = (bool) baderlr_ai_get_key();
	?>
	<div class="wrap baderlr-c" dir="rtl">
		<h1>✦ <?php esc_html_e( 'مولّد المحتوى بالذكاء الاصطناعي', 'blr-shop-companion' ); ?></h1>
		<?php if ( ! $configured ) : ?>
			<div class="notice notice-warning"><p>
				<?php esc_html_e( 'لم تُضبط مفاتيح الذكاء الاصطناعي بعد.', 'blr-shop-companion' ); ?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-ai-settings' ) ); ?>"><?php esc_html_e( 'اضبطها الآن', 'blr-shop-companion' ); ?></a>
			</p></div>
		<?php endif; ?>
		<div class="blrc-ai">
			<form class="blrc-ai__form" id="blrc-ai-form">
				<label><?php esc_html_e( 'نوع المحتوى', 'blr-shop-companion' ); ?></label>
				<select name="type">
					<option value="page"><?php esc_html_e( 'محتوى صفحة كاملة', 'blr-shop-companion' ); ?></option>
					<option value="headline"><?php esc_html_e( 'عناوين جذّابة', 'blr-shop-companion' ); ?></option>
					<option value="about"><?php esc_html_e( 'نص «من نحن»', 'blr-shop-companion' ); ?></option>
					<option value="product"><?php esc_html_e( 'وصف منتج', 'blr-shop-companion' ); ?></option>
					<option value="meta"><?php esc_html_e( 'وصف SEO (ميتا)', 'blr-shop-companion' ); ?></option>
					<option value="translate"><?php esc_html_e( 'ترجمة نص', 'blr-shop-companion' ); ?></option>
				</select>

				<label><?php esc_html_e( 'الموضوع أو النص', 'blr-shop-companion' ); ?></label>
				<textarea name="topic" rows="4" required placeholder="<?php esc_attr_e( 'مثال: شركة تسويق رقمي في الجزائر متخصّصة في إدارة الحملات الإعلانية', 'blr-shop-companion' ); ?>"></textarea>

				<div class="blrc-ai__row">
					<div>
						<label><?php esc_html_e( 'اللغة', 'blr-shop-companion' ); ?></label>
						<select name="lang">
							<option value="العربية"><?php esc_html_e( 'العربية', 'blr-shop-companion' ); ?></option>
							<option value="الفرنسية"><?php esc_html_e( 'الفرنسية', 'blr-shop-companion' ); ?></option>
							<option value="الإنجليزية"><?php esc_html_e( 'الإنجليزية', 'blr-shop-companion' ); ?></option>
						</select>
					</div>
					<div>
						<label><?php esc_html_e( 'النبرة', 'blr-shop-companion' ); ?></label>
						<select name="tone">
							<option value="احترافية"><?php esc_html_e( 'احترافية', 'blr-shop-companion' ); ?></option>
							<option value="ودّية"><?php esc_html_e( 'ودّية', 'blr-shop-companion' ); ?></option>
							<option value="تسويقية مقنعة"><?php esc_html_e( 'تسويقية مقنعة', 'blr-shop-companion' ); ?></option>
							<option value="رسمية"><?php esc_html_e( 'رسمية', 'blr-shop-companion' ); ?></option>
						</select>
					</div>
				</div>
				<button class="button button-primary button-hero" id="blrc-ai-go"><?php esc_html_e( '✨ توليد', 'blr-shop-companion' ); ?></button>
			</form>
			<div class="blrc-ai__out">
				<div class="blrc-ai__outhead">
					<span><?php esc_html_e( 'النتيجة', 'blr-shop-companion' ); ?></span>
					<span><button class="button button-small" id="blrc-ai-copy" hidden><?php esc_html_e( 'نسخ', 'blr-shop-companion' ); ?></button>
					<button class="button button-small button-primary" id="blrc-ai-draft" hidden><?php esc_html_e( 'إنشاء مسودة صفحة', 'blr-shop-companion' ); ?></button></span>
				</div>
				<div class="blrc-ai__result" id="blrc-ai-result"><p class="blrc-muted"><?php esc_html_e( 'ستظهر النتيجة هنا بعد التوليد.', 'blr-shop-companion' ); ?></p></div>
			</div>
		</div>
	</div>
	<?php
}

/* ================= REST ================= */

add_action( 'rest_api_init', function () {
	register_rest_route( 'baderlr/v1', '/generate', array(
		'methods'             => 'POST',
		'callback'            => 'baderlr_ai_rest_generate',
		'permission_callback' => function () {
			return current_user_can( 'edit_posts' );
		},
	) );
} );

function baderlr_ai_rest_generate( WP_REST_Request $req ) {
	$type  = sanitize_text_field( (string) $req->get_param( 'type' ) );
	$topic = trim( wp_strip_all_tags( (string) $req->get_param( 'topic' ) ) );
	$lang  = sanitize_text_field( (string) $req->get_param( 'lang' ) );
	$tone  = sanitize_text_field( (string) $req->get_param( 'tone' ) );
	if ( '' === $topic ) {
		return new WP_REST_Response( array( 'error' => __( 'اكتب الموضوع أولاً.', 'blr-shop-companion' ) ), 400 );
	}
	if ( ! baderlr_ai_get_key() ) {
		return new WP_REST_Response( array( 'error' => __( 'اضبط مفتاح API من الإعدادات.', 'blr-shop-companion' ) ), 400 );
	}
	$prompt = baderlr_ai_build_prompt( $type, $topic, $lang, $tone );
	$text   = baderlr_ai_call( $prompt );
	if ( is_wp_error( $text ) ) {
		return new WP_REST_Response( array( 'error' => $text->get_error_message() ), 502 );
	}
	return new WP_REST_Response( array( 'text' => $text ), 200 );
}

function baderlr_ai_build_prompt( $type, $topic, $lang, $tone ) {
	$lang = $lang ? $lang : 'العربية';
	$tone = $tone ? $tone : 'احترافية';
	switch ( $type ) {
		case 'headline':
			return "اقترح 7 عناوين تسويقية جذّابة ومختصرة عن: {$topic}. اكتبها باللغة {$lang} بنبرة {$tone}، كل عنوان في سطر مرقّم.";
		case 'about':
			return "اكتب نص صفحة «من نحن» لـ: {$topic}. باللغة {$lang} وبنبرة {$tone}. اجعله فقرتين إلى ثلاث فقرات موجزة مع إبراز القيمة والخبرة.";
		case 'product':
			return "اكتب وصفاً تسويقياً لمنتج: {$topic}. باللغة {$lang} بنبرة {$tone}. ابدأ بجملة جذّابة ثم أبرز الفوائد في نقاط قصيرة ثم دعوة للشراء.";
		case 'meta':
			return "اكتب وصف ميتا (SEO meta description) لا يتجاوز 155 حرفاً عن: {$topic}. باللغة {$lang}. أرجِع النص فقط دون علامات اقتباس.";
		case 'translate':
			return "ترجم النص التالي إلى {$lang} ترجمة طبيعية واحترافية دون إضافة شرح:\n\n{$topic}";
		case 'page':
		default:
			return "اكتب محتوى صفحة ويب كاملة عن: {$topic}. باللغة {$lang} وبنبرة {$tone}. نظّمها بعناوين فرعية (##) وفقرات ونقاط عند الحاجة: عنوان رئيسي جذّاب، مقدّمة، المزايا/الخدمات، لماذا نحن، ودعوة لاتخاذ إجراء في النهاية.";
	}
}

/**
 * نداء المزوّد. يرجع النص أو WP_Error.
 */
function baderlr_ai_call( $prompt, $system = '', $history = array(), $max_tokens = 1200 ) {
	$s        = baderlr_ai_get_settings();
	$provider = $s['provider'];
	$model    = $s['model'] ? $s['model'] : baderlr_ai_default_model( $provider );
	$key      = $s['api_key'];
	$system   = $system ? $system : 'أنت كاتب محتوى تسويقي محترف لمواقع الشركات. اكتب محتوى أصيلاً وجاهزاً للنشر دون مقدّمات عن نفسك.';
	$msgs     = array();
	foreach ( (array) $history as $h ) {
		if ( isset( $h['role'], $h['content'] ) && in_array( $h['role'], array( 'user', 'assistant' ), true ) ) {
			$msgs[] = array( 'role' => $h['role'], 'content' => (string) $h['content'] );
		}
	}
	$msgs[] = array( 'role' => 'user', 'content' => $prompt );

	if ( 'anthropic' === $provider ) {
		$resp = wp_remote_post( 'https://api.anthropic.com/v1/messages', array(
			'timeout' => 45,
			'headers' => array(
				'x-api-key'         => $key,
				'anthropic-version' => '2023-06-01',
				'content-type'      => 'application/json',
			),
			'body'    => wp_json_encode( array(
				'model'      => $model,
				'max_tokens' => (int) $max_tokens,
				'system'     => $system,
				'messages'   => $msgs,
			) ),
		) );
		if ( is_wp_error( $resp ) ) {
			return $resp;
		}
		$code = wp_remote_retrieve_response_code( $resp );
		$body = json_decode( wp_remote_retrieve_body( $resp ), true );
		if ( 200 !== (int) $code ) {
			return new WP_Error( 'ai_http', baderlr_ai_err( $body, $code ) );
		}
		if ( isset( $body['content'][0]['text'] ) ) {
			return trim( $body['content'][0]['text'] );
		}
		return new WP_Error( 'ai_parse', __( 'رد غير متوقّع من Anthropic.', 'blr-shop-companion' ) );
	}

	// OpenAI أو مخصّص (متوافق مع OpenAI).
	$endpoint = ( 'custom' === $provider && $s['endpoint'] ) ? $s['endpoint'] : 'https://api.openai.com/v1/chat/completions';
	$resp     = wp_remote_post( $endpoint, array(
		'timeout' => 45,
		'headers' => array(
			'Authorization' => 'Bearer ' . $key,
			'Content-Type'  => 'application/json',
		),
		'body'    => wp_json_encode( array(
			'model'       => $model,
			'messages'    => array_merge( array( array( 'role' => 'system', 'content' => $system ) ), $msgs ),
			'temperature' => 0.7,
			'max_tokens'  => (int) $max_tokens,
		) ),
	) );
	if ( is_wp_error( $resp ) ) {
		return $resp;
	}
	$code = wp_remote_retrieve_response_code( $resp );
	$body = json_decode( wp_remote_retrieve_body( $resp ), true );
	if ( 200 !== (int) $code ) {
		return new WP_Error( 'ai_http', baderlr_ai_err( $body, $code ) );
	}
	if ( isset( $body['choices'][0]['message']['content'] ) ) {
		return trim( $body['choices'][0]['message']['content'] );
	}
	return new WP_Error( 'ai_parse', __( 'رد غير متوقّع من المزوّد.', 'blr-shop-companion' ) );
}

function baderlr_ai_err( $body, $code ) {
	if ( is_array( $body ) && isset( $body['error']['message'] ) ) {
		return sprintf( '%s (%d)', $body['error']['message'], (int) $code );
	}
	/* translators: %d: HTTP status code */
	return sprintf( __( 'تعذّر الاتصال بالمزوّد (رمز %d). تحقّق من المفتاح والنموذج.', 'blr-shop-companion' ), (int) $code );
}
