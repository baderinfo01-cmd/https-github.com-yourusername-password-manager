<?php
/**
 * الذكاء الاصطناعي (Pro): توليد صفحة كاملة، إعادة كتابة قسم، عناوين بديلة، وصف SEO.
 * يدعم Anthropic وOpenAI ومزوّداً متوافقاً مع OpenAI. المفتاح للمستخدم ويُستعمل من الخادم فقط.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blrlp_ai_key() {
	return trim( (string) blrlp_opt( 'ai_key' ) );
}

function blrlp_ai_ready() {
	return blrlp_is_pro() && '' !== blrlp_ai_key();
}

/** @return string|WP_Error */
function blrlp_ai_call( $system, $prompt, $max_tokens = 3500 ) {
	$provider = blrlp_opt( 'ai_provider', 'anthropic' );
	$model    = blrlp_opt( 'ai_model', 'openai' === $provider ? 'gpt-4o-mini' : 'claude-sonnet-5-5' );
	$key      = blrlp_ai_key();
	if ( '' === $key ) {
		return new WP_Error( 'blrlp_nokey', __( 'أضف مفتاح API من BLR Landing ← الإعدادات.', 'blr-landing-pro' ) );
	}
	if ( 'anthropic' === $provider ) {
		$url  = 'https://api.anthropic.com/v1/messages';
		$head = array( 'x-api-key' => $key, 'anthropic-version' => '2023-06-01', 'Content-Type' => 'application/json' );
		$body = array( 'model' => $model, 'max_tokens' => (int) $max_tokens, 'system' => $system, 'messages' => array( array( 'role' => 'user', 'content' => $prompt ) ) );
	} else {
		$url  = 'custom' === $provider && blrlp_opt( 'ai_base' ) ? blrlp_opt( 'ai_base' ) : 'https://api.openai.com/v1/chat/completions';
		$head = array( 'Authorization' => 'Bearer ' . $key, 'Content-Type' => 'application/json' );
		$body = array( 'model' => $model, 'max_tokens' => (int) $max_tokens, 'messages' => array( array( 'role' => 'system', 'content' => $system ), array( 'role' => 'user', 'content' => $prompt ) ) );
	}
	$res = wp_remote_post( $url, array( 'timeout' => 90, 'headers' => $head, 'body' => wp_json_encode( $body ) ) );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$code = wp_remote_retrieve_response_code( $res );
	$j    = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( 200 !== (int) $code || ! is_array( $j ) ) {
		$m = isset( $j['error']['message'] ) ? $j['error']['message'] : 'HTTP ' . (int) $code;
		return new WP_Error( 'blrlp_http', sanitize_text_field( $m ) );
	}
	if ( 'anthropic' === $provider ) {
		$text = '';
		foreach ( (array) ( isset( $j['content'] ) ? $j['content'] : array() ) as $b ) {
			if ( isset( $b['text'] ) ) {
				$text .= $b['text'];
			}
		}
	} else {
		$text = isset( $j['choices'][0]['message']['content'] ) ? $j['choices'][0]['message']['content'] : '';
	}
	return '' === trim( $text ) ? new WP_Error( 'blrlp_empty', __( 'رد فارغ من النموذج.', 'blr-landing-pro' ) ) : trim( $text );
}

function blrlp_ai_json( $text ) {
	$text = preg_replace( '/^```(?:json)?|```$/m', '', (string) $text );
	$a    = strpos( $text, '{' );
	$b    = strrpos( $text, '}' );
	if ( false === $a || false === $b ) {
		return null;
	}
	$j = json_decode( substr( $text, $a, $b - $a + 1 ), true );
	return is_array( $j ) ? $j : null;
}

/** وصف مضغوط للمخطط يُرسَل للنموذج. */
function blrlp_ai_schema_text( $only = null ) {
	$lines = array();
	foreach ( blrlp_sections() as $id => $s ) {
		if ( $only && ! in_array( $id, $only, true ) ) {
			continue;
		}
		$f = array();
		foreach ( $s['fields'] as $k => $def ) {
			$d = $def['t'];
			if ( 'select' === $def['t'] ) {
				$d = 'one of: ' . implode( '|', array_keys( $def['o'] ) );
			} elseif ( 'repeater' === $def['t'] ) {
				$sub = array();
				foreach ( $def['f'] as $sk => $sd ) {
					$sub[] = $sk . ':' . ( 'select' === $sd['t'] ? implode( '|', array_keys( $sd['o'] ) ) : $sd['t'] );
				}
				$d = 'array of {' . implode( ', ', $sub ) . '}';
			}
			if ( 'image' === $def['t'] || 'html' === $def['t'] ) {
				continue; // لا نطلب صوراً من النموذج.
			}
			$f[] = $k . ' (' . $d . ')';
		}
		$lines[] = $id . ': ' . implode( '; ', $f );
	}
	return implode( "\n", $lines );
}

/** بوّابة موحّدة لنقاط AJAX. */
function blrlp_ai_guard() {
	check_ajax_referer( 'blrlp_admin', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => __( 'غير مسموح.', 'blr-landing-pro' ) ), 403 );
	}
	if ( ! blrlp_is_pro() ) {
		wp_send_json_error( array( 'message' => __( 'الذكاء الاصطناعي ميزة Pro — فعّل الترخيص.', 'blr-landing-pro' ), 'pro' => true ), 402 );
	}
	if ( '' === blrlp_ai_key() ) {
		wp_send_json_error( array( 'message' => __( 'أضف مفتاح API من BLR Landing ← الإعدادات.', 'blr-landing-pro' ) ) );
	}
	$k = 'blrlp_ai_' . get_current_user_id();
	$n = (int) get_transient( $k );
	if ( $n >= 40 ) {
		wp_send_json_error( array( 'message' => __( 'وصلت للحد الساعي لطلبات الذكاء الاصطناعي.', 'blr-landing-pro' ) ), 429 );
	}
	set_transient( $k, $n + 1, HOUR_IN_SECONDS );
}

function blrlp_ai_sys( $extra = '' ) {
	return 'أنت كاتب إعلانات (copywriter) وخبير صفحات هبوط عالية التحويل. اكتب بلغة المستخدم المحددة بنبرة مقنعة وواضحة دون مبالغة كاذبة. لا تخترع أرقاماً أو شهادات حقيقية أو أسماء عملاء حقيقيين أو ادعاءات طبية/مالية؛ اجعل الأمثلة توضيحية عامة. أعد JSON صالحاً فقط بلا أي نص خارجه. ' . $extra;
}

/* 1) توليد صفحة كاملة */
add_action( 'wp_ajax_blrlp_ai_generate', function () {
	blrlp_ai_guard();
	$brief = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['brief'] ?? '' ) ), 0, 2000 ); // phpcs:ignore
	if ( mb_strlen( $brief ) < 15 ) {
		wp_send_json_error( array( 'message' => __( 'اكتب وصفاً أوضح للمنتج/الخدمة (15 حرفاً على الأقل).', 'blr-landing-pro' ) ) );
	}
	$tone = sanitize_text_field( wp_unslash( $_POST['tone'] ?? 'احترافية' ) ); // phpcs:ignore
	$goal = sanitize_text_field( wp_unslash( $_POST['goal'] ?? 'مبيعات' ) ); // phpcs:ignore
	$lang = sanitize_text_field( wp_unslash( $_POST['lang'] ?? 'العربية' ) ); // phpcs:ignore
	$want = isset( $_POST['sections'] ) && is_array( $_POST['sections'] ) ? array_map( 'sanitize_key', wp_unslash( $_POST['sections'] ) ) : array(); // phpcs:ignore
	$want = array_values( array_intersect( $want, array_keys( blrlp_sections() ) ) );
	if ( ! $want ) {
		$want = array( 'hero', 'logos', 'features', 'steps', 'stats', 'pricing', 'testimonials', 'faq', 'form', 'cta' );
	}
	$sys = blrlp_ai_sys( 'اللغة: ' . $lang . '. النبرة: ' . $tone . '. الهدف من الصفحة: ' . $goal . '. أعد كائناً بالشكل {"sections":[{"id":"...","data":{...}}],"seo":{"title":"حتى 60 حرفاً","desc":"حتى 155 حرفاً"}} بنفس ترتيب الأقسام المطلوبة وبالمفاتيح التالية فقط (لكل قسم):' . "\n" . blrlp_ai_schema_text( $want ) . "\nاستخدم # أو روابط الأقسام (#features #pricing #faq #cta) في الأزرار. في pricing اجعل خطة واحدة highlight=true. features في pricing سطر لكل ميزة. قسم hero فيه layout=split." );
	$out = blrlp_ai_call( $sys, "الأقسام المطلوبة بالترتيب: " . implode( ', ', $want ) . "\n\nوصف العمل:\n" . $brief, 4500 );
	if ( is_wp_error( $out ) ) {
		wp_send_json_error( array( 'message' => $out->get_error_message() ) );
	}
	$j = blrlp_ai_json( $out );
	if ( ! $j || empty( $j['sections'] ) ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر قراءة رد النموذج، أعد المحاولة.', 'blr-landing-pro' ) ) );
	}
	$clean = blrlp_sanitize_data( array( 'sections' => $j['sections'] ) );
	$seo   = isset( $j['seo'] ) && is_array( $j['seo'] ) ? $j['seo'] : array();
	wp_send_json_success( array(
		'sections' => $clean['sections'],
		'seo'      => array( 'title' => sanitize_text_field( isset( $seo['title'] ) ? $seo['title'] : '' ), 'desc' => sanitize_text_field( isset( $seo['desc'] ) ? $seo['desc'] : '' ) ),
	) );
} );

/* 2) إعادة كتابة قسم */
add_action( 'wp_ajax_blrlp_ai_section', function () {
	blrlp_ai_guard();
	$id  = sanitize_key( wp_unslash( $_POST['section'] ?? '' ) ); // phpcs:ignore
	$reg = blrlp_sections();
	if ( ! isset( $reg[ $id ] ) ) {
		wp_send_json_error( array( 'message' => 'bad section' ) );
	}
	$cur  = json_decode( wp_unslash( $_POST['data'] ?? '{}' ), true ); // phpcs:ignore
	$cur  = is_array( $cur ) ? $cur : array();
	$inst = mb_substr( sanitize_text_field( wp_unslash( $_POST['instruction'] ?? '' ) ), 0, 300 ); // phpcs:ignore
	$lang = sanitize_text_field( wp_unslash( $_POST['lang'] ?? 'العربية' ) ); // phpcs:ignore
	$ctx  = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['context'] ?? '' ) ), 0, 600 ); // phpcs:ignore
	$sys  = blrlp_ai_sys( 'اللغة: ' . $lang . '. عدّل محتوى قسم واحد (' . $id . ') حسب التعليمات. أعد {"data":{...}} بنفس المفاتيح بالضبط:' . "\n" . blrlp_ai_schema_text( array( $id ) ) );
	// نرسل النصوص فقط (بدون صور/HTML).
	$clean_cur = blrlp_sanitize_data( array( 'sections' => array( array( 'id' => $id, 'data' => $cur ) ) ) );
	$out = blrlp_ai_call( $sys, "سياق العمل: {$ctx}\nالتعليمات: " . ( $inst ? $inst : 'حسّن الصياغة وزد الإقناع' ) . "\nالمحتوى الحالي:\n" . wp_json_encode( $clean_cur['sections'][0]['data'] ?? array(), JSON_UNESCAPED_UNICODE ), 2500 );
	if ( is_wp_error( $out ) ) {
		wp_send_json_error( array( 'message' => $out->get_error_message() ) );
	}
	$j = blrlp_ai_json( $out );
	if ( ! $j || empty( $j['data'] ) ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر قراءة رد النموذج.', 'blr-landing-pro' ) ) );
	}
	$new = blrlp_sanitize_data( array( 'sections' => array( array( 'id' => $id, 'data' => $j['data'] ) ) ) );
	$d   = $new['sections'][0]['data'];
	// نحافظ على الصور/الروابط الحالية إن كانت فارغة في الرد.
	foreach ( $reg[ $id ]['fields'] as $k => $f ) {
		if ( in_array( $f['t'], array( 'image', 'html' ), true ) && isset( $clean_cur['sections'][0]['data'][ $k ] ) ) {
			$d[ $k ] = $clean_cur['sections'][0]['data'][ $k ];
		}
	}
	wp_send_json_success( array( 'data' => $d ) );
} );

/* 3) عناوين بديلة + 4) SEO */
add_action( 'wp_ajax_blrlp_ai_headlines', function () {
	blrlp_ai_guard();
	$ctx  = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['context'] ?? '' ) ), 0, 800 ); // phpcs:ignore
	$cur  = mb_substr( sanitize_text_field( wp_unslash( $_POST['current'] ?? '' ) ), 0, 200 ); // phpcs:ignore
	$lang = sanitize_text_field( wp_unslash( $_POST['lang'] ?? 'العربية' ) ); // phpcs:ignore
	$out  = blrlp_ai_call( blrlp_ai_sys( 'اللغة: ' . $lang . '. أعد {"headlines":["..."]} بستة عناوين رئيسية مختلفة الزوايا (فائدة، فضول، رقم، حل مشكلة، اجتماعي، عاجل)، كل عنوان حتى 70 حرفاً.' ), "العنوان الحالي: {$cur}\nسياق: {$ctx}", 800 );
	if ( is_wp_error( $out ) ) {
		wp_send_json_error( array( 'message' => $out->get_error_message() ) );
	}
	$j = blrlp_ai_json( $out );
	if ( ! $j || empty( $j['headlines'] ) ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر قراءة رد النموذج.', 'blr-landing-pro' ) ) );
	}
	wp_send_json_success( array( 'headlines' => array_slice( array_map( 'sanitize_text_field', (array) $j['headlines'] ), 0, 8 ) ) );
} );

add_action( 'wp_ajax_blrlp_ai_seo', function () {
	blrlp_ai_guard();
	$ctx  = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['context'] ?? '' ) ), 0, 3000 ); // phpcs:ignore
	$lang = sanitize_text_field( wp_unslash( $_POST['lang'] ?? 'العربية' ) ); // phpcs:ignore
	$out  = blrlp_ai_call( blrlp_ai_sys( 'اللغة: ' . $lang . '. أعد {"title":"حتى 60 حرفاً","desc":"حتى 155 حرفاً"} لوسوم SEO مناسبة للصفحة.' ), $ctx, 500 );
	if ( is_wp_error( $out ) ) {
		wp_send_json_error( array( 'message' => $out->get_error_message() ) );
	}
	$j = blrlp_ai_json( $out );
	if ( ! $j ) {
		wp_send_json_error( array( 'message' => __( 'تعذّر قراءة رد النموذج.', 'blr-landing-pro' ) ) );
	}
	wp_send_json_success( array( 'title' => sanitize_text_field( isset( $j['title'] ) ? $j['title'] : '' ), 'desc' => sanitize_text_field( isset( $j['desc'] ) ? $j['desc'] : '' ) ) );
} );
