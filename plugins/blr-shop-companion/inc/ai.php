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
		$old = baderlr_ai_get_settings();
		$new_key = trim( sanitize_text_field( wp_unslash( $_POST['api_key'] ?? '' ) ) );
		update_option( 'baderlr_ai', array(
			'provider' => in_array( ( $_POST['provider'] ?? '' ), array( 'openai', 'anthropic', 'custom' ), true ) ? sanitize_text_field( wp_unslash( $_POST['provider'] ) ) : 'openai',
			'model'    => sanitize_text_field( wp_unslash( $_POST['model'] ?? '' ) ),
			'api_key'  => '' !== $new_key ? $new_key : $old['api_key'], // لا نعرض المفتاح؛ الفارغ يعني الإبقاء.
			'endpoint' => esc_url_raw( wp_unslash( $_POST['endpoint'] ?? '' ) ),
		) );
		$saved = true;
	}
	$s       = baderlr_ai_get_settings();
	$has_key = '' !== trim( (string) $s['api_key'] );
	$mask    = $has_key ? str_repeat( '•', 12 ) . substr( $s['api_key'], -4 ) : '';
	?>
	<div class="wrap blrui baderlr-c">
		<?php baderlr_c_header( __( 'إعدادات الذكاء الاصطناعي', 'blr-shop-companion' ) ); ?>
		<?php if ( $saved ) : ?><div class="blrl-msg ok"><?php esc_html_e( '✓ تم حفظ الإعدادات.', 'blr-shop-companion' ); ?></div><?php endif; ?>
		<form method="post" id="blrc-settings">
			<?php wp_nonce_field( 'baderlr_ai_settings' ); ?>
			<div class="blrui-card">
				<div class="blrui-card__h"><span class="blrui-ico">⚙️</span><div><h2><?php esc_html_e( 'مزوّد الذكاء الاصطناعي', 'blr-shop-companion' ); ?></h2><p><?php esc_html_e( 'مفتاحك لا يُرسل إلا للمزوّد الذي تختاره ويبقى على موقعك، ولا يظهر للزوار.', 'blr-shop-companion' ); ?></p></div><span class="blrui-grow"></span><span class="blrui-chip <?php echo $has_key ? 'ok' : 'warn'; ?>"><?php echo $has_key ? esc_html__( 'المفتاح محفوظ', 'blr-shop-companion' ) : esc_html__( 'لا يوجد مفتاح', 'blr-shop-companion' ); ?></span></div>
				<div class="blrui-card__b">
					<div class="blrui-row"><label for="blrc-provider"><?php esc_html_e( 'المزوّد', 'blr-shop-companion' ); ?></label>
						<div><select id="blrc-provider" class="blrui-in" name="provider">
							<option value="openai" <?php selected( $s['provider'], 'openai' ); ?>>OpenAI (ChatGPT)</option>
							<option value="anthropic" <?php selected( $s['provider'], 'anthropic' ); ?>>Anthropic (Claude)</option>
							<option value="custom" <?php selected( $s['provider'], 'custom' ); ?>><?php esc_html_e( 'مخصّص (متوافق مع OpenAI)', 'blr-shop-companion' ); ?></option>
						</select></div></div>
					<div class="blrui-row"><label for="blrc-key"><?php esc_html_e( 'مفتاح API', 'blr-shop-companion' ); ?><small><?php esc_html_e( 'اتركه فارغاً للإبقاء على المفتاح المحفوظ.', 'blr-shop-companion' ); ?></small></label>
						<div><input id="blrc-key" class="blrui-in is-ltr" type="password" name="api_key" value="" autocomplete="new-password" placeholder="<?php echo esc_attr( $mask ? $mask : 'sk-...' ); ?>"></div></div>
					<div class="blrui-row"><label for="blrc-model"><?php esc_html_e( 'النموذج', 'blr-shop-companion' ); ?><small><?php esc_html_e( 'اتركه فارغاً للنموذج الافتراضي.', 'blr-shop-companion' ); ?></small></label>
						<div><input id="blrc-model" class="blrui-in is-ltr" type="text" name="model" value="<?php echo esc_attr( $s['model'] ); ?>" placeholder="gpt-4o-mini / claude-haiku-5-5"></div></div>
					<div class="blrui-row" id="blrc-endpoint-row"><label for="blrc-endpoint"><?php esc_html_e( 'رابط المزوّد المخصّص', 'blr-shop-companion' ); ?></label>
						<div><input id="blrc-endpoint" class="blrui-in is-ltr" type="url" name="endpoint" value="<?php echo esc_attr( $s['endpoint'] ); ?>" placeholder="https://.../v1/chat/completions"></div></div>
				</div>
				<div class="blrui-card__f"><button class="blrui-btn"><?php esc_html_e( 'حفظ الإعدادات', 'blr-shop-companion' ); ?></button><button type="button" class="blrui-btn is-ghost" id="blrc-test"><?php esc_html_e( 'اختبار الاتصال', 'blr-shop-companion' ); ?></button><span class="blrui-test" id="blrc-test-msg"></span></div>
			</div>
		</form>
	</div>
	<script>
	(function(){var p=document.getElementById('blrc-provider'),r=document.getElementById('blrc-endpoint-row');function f(){r.style.display=p.value==='custom'?'':'none'}p.addEventListener('change',f);f();})();
	</script>
	<?php
}

/* ================= واجهة التوليد ================= */

function baderlr_c_ai_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	$configured = (bool) baderlr_ai_get_key();
	?>
	<div class="wrap blrui baderlr-c">
		<?php baderlr_c_header( __( 'مولّد المحتوى بالذكاء الاصطناعي', 'blr-shop-companion' ) ); ?>
		<?php if ( ! $configured ) : ?>
			<div class="blrl-msg err"><p style="margin:0">
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
