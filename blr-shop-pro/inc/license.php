<?php
/**
 * عميل الترخيص — متوافق مع سيرفر BaderThemesLicense الجديد (api.php + توكِن موقّع).
 *
 * التفعيل يُرسل: action=activate, code, domain, instance, version, product
 * الرد: { success, status, token }  — التوكِن = PREFIX-<b64url(json)>.<b64url(sig)>
 * عدم التفعيل لا يُعطّل الموقع، لكنه يُظهر تنبيهاً ويعطّل الميزات المدفوعة (استيراد المواقع).
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BADERLR_LICENSE_GRACE', 45 * DAY_IN_SECONDS );

/** إعدادات السيرفر: ثوابت داخلية فقط (لا تظهر في لوحة التحكم). */
function baderlr_lic_cfg( $key ) {
	$map = array( 'server' => 'BADERLR_LICENSE_SERVER', 'pubkey' => 'BADERLR_LICENSE_PUBKEY', 'product' => 'BADERLR_PRODUCT' );
	return defined( $map[ $key ] ) ? constant( $map[ $key ] ) : '';
}

/** هل المفتاح العام صالح (32 بايت base64)؟ */
function baderlr_pubkey_ok() {
	$pub = base64_decode( (string) baderlr_lic_cfg( 'pubkey' ), true );
	return false !== $pub && 32 === strlen( $pub );
}

function baderlr_license_domain() {
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	return preg_replace( '/^www\./', '', $host );
}

function baderlr_license_instance() {
	$i = get_option( 'baderlr_instance', '' );
	if ( ! $i ) {
		$i = substr( hash( 'sha256', home_url() . '|' . wp_generate_password( 20, false ) ), 0, 32 );
		update_option( 'baderlr_instance', $i );
	}
	return $i;
}

function baderlr_license_get() {
	$d = get_option( 'baderlr_license', array() );
	return is_array( $d ) ? $d : array();
}
function baderlr_license_save( $d ) {
	update_option( 'baderlr_license', $d );
}

/**
 * التحقّق من التوكِن الموقّع (Ed25519) وإرجاع الحمولة، أو false.
 */
function baderlr_verify_token( $token ) {
	$token = trim( preg_replace( '/\s+/', '', (string) $token ) );
	// إزالة البادئة (مثل BT-) قبل أول شرطة.
	if ( preg_match( '/^[A-Za-z0-9]{2,12}-/', $token ) && false !== strpos( $token, '.' ) ) {
		$token = substr( $token, strpos( $token, '-' ) + 1 );
	}
	$parts = explode( '.', $token );
	if ( 2 !== count( $parts ) || ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
		return false;
	}
	$dec = function ( $d ) {
		$d   = strtr( $d, '-_', '+/' );
		$pad = strlen( $d ) % 4;
		return base64_decode( $d . ( $pad ? str_repeat( '=', 4 - $pad ) : '' ), true );
	};
	$msg = $dec( $parts[0] );
	$sig = $dec( $parts[1] );
	$pub = base64_decode( (string) baderlr_lic_cfg( 'pubkey' ), true );
	if ( false === $msg || false === $sig || false === $pub || 32 !== strlen( $pub ) || 64 !== strlen( $sig ) ) {
		return false;
	}
	if ( ! sodium_crypto_sign_verify_detached( $sig, $msg, $pub ) ) {
		return false;
	}
	$payload = json_decode( $msg, true );
	return is_array( $payload ) ? $payload : false;
}

/**
 * طلب إلى api.php بالسيرفر.
 */
function baderlr_license_api( $action, $args = array() ) {
	$url = trailingslashit( baderlr_lic_cfg( 'server' ) ) . 'api.php';
	$res = wp_remote_post( $url, array(
		'timeout' => 15,
		'body'    => array_merge( array(
			'action'   => $action,
			'domain'   => baderlr_license_domain(),
			'instance' => baderlr_license_instance(),
			'version'  => BADERLR_VERSION,
			'product'  => baderlr_lic_cfg( 'product' ),
		), $args ),
	) );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	return is_array( $body ) ? $body : new WP_Error( 'baderlr_resp', __( 'ردّ غير صالح من السيرفر.', 'blr-shop-pro' ) );
}

function baderlr_license_activate( $key ) {
	$key  = trim( $key );
	$resp = baderlr_license_api( 'activate', array( 'code' => $key ) );
	if ( is_wp_error( $resp ) ) {
		/* translators: %s: error */
		return new WP_Error( 'baderlr_net', sprintf( __( 'تعذّر الاتصال بسيرفر الترخيص (%s). تحقّق من اتصال موقعك بالإنترنت وحاول لاحقاً.', 'blr-shop-pro' ), $resp->get_error_message() ) );
	}
	if ( empty( $resp['success'] ) ) {
		$code = isset( $resp['code'] ) ? $resp['code'] : 'invalid';
		return new WP_Error( 'baderlr_fail', baderlr_status_message( $code ) );
	}
	if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
		return new WP_Error( 'baderlr_sodium', __( 'امتداد PHP Sodium غير مفعّل على الخادم. فعّله من استضافتك (PHP 7.2+ يتضمنه عادةً).', 'blr-shop-pro' ) );
	}
	if ( ! baderlr_pubkey_ok() ) {
		return new WP_Error( 'baderlr_pubkey', __( 'تعذّر التحقق من الترخيص. تواصل مع الدعم الفني.', 'blr-shop-pro' ) );
	}
	$payload = isset( $resp['token'] ) ? baderlr_verify_token( $resp['token'] ) : false;
	if ( false === $payload ) {
		return new WP_Error( 'baderlr_sig', __( 'تعذّر التحقّق من توقيع الترخيص. تواصل مع الدعم الفني.', 'blr-shop-pro' ) );
	}
	if ( empty( $payload['domain'] ) || $payload['domain'] !== baderlr_license_domain() ) {
		return new WP_Error( 'baderlr_domain', __( 'الدومين في الترخيص لا يطابق هذا الموقع.', 'blr-shop-pro' ) );
	}
	$pick = function () use ( $resp, $payload ) {
		foreach ( func_get_args() as $k ) {
			foreach ( array( $resp, $payload ) as $src ) {
				if ( is_array( $src ) && ! empty( $src[ $k ] ) && is_scalar( $src[ $k ] ) ) {
					return sanitize_text_field( (string) $src[ $k ] );
				}
			}
		}
		return '';
	};
	baderlr_license_save( array(
		'holder'       => $pick( 'name', 'customer', 'client', 'holder' ),
		'company'      => $pick( 'company', 'org', 'organization', 'business' ),
		'issued_at'    => (int) $pick( 'iat', 'issued', 'issued_at', 'start' ),
		'activated_at' => time(),
		'key'        => $key,
		'lid'        => isset( $payload['lid'] ) ? $payload['lid'] : '',
		'status'     => isset( $resp['status'] ) ? $resp['status'] : 'active',
		'domain'     => $payload['domain'],
		'edition'    => isset( $payload['edition'] ) ? $payload['edition'] : '',
		'expires_at' => ! empty( $payload['exp'] ) ? (int) $payload['exp'] : 0,
		'checked_at' => time(),
	) );
	return true;
}

function baderlr_license_validate() {
	$lic = baderlr_license_get();
	if ( empty( $lic['lid'] ) ) {
		return;
	}
	$resp = baderlr_license_api( 'check', array( 'lid' => $lic['lid'] ) );
	if ( is_wp_error( $resp ) || empty( $resp['success'] ) ) {
		return;
	}
	$lic['status']     = isset( $resp['status'] ) ? $resp['status'] : $lic['status'];
	$lic['checked_at'] = time();
	if ( isset( $resp['token'] ) ) {
		$p = baderlr_verify_token( $resp['token'] );
		if ( is_array( $p ) && ! empty( $p['exp'] ) ) {
			$lic['expires_at'] = (int) $p['exp'];
		}
	}
	baderlr_license_save( $lic );
}
add_action( 'baderlr_license_cron', 'baderlr_license_validate' );
add_action( 'wp', function () {
	if ( ! wp_next_scheduled( 'baderlr_license_cron' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'baderlr_license_cron' );
	}
} );

function baderlr_license_deactivate() {
	delete_option( 'baderlr_license' );
}

function baderlr_licensed() {
	$lic = baderlr_license_get();
	if ( empty( $lic['status'] ) || 'active' !== $lic['status'] ) {
		return false;
	}
	if ( empty( $lic['domain'] ) || $lic['domain'] !== baderlr_license_domain() ) {
		return false;
	}
	if ( ! empty( $lic['expires_at'] ) && time() > (int) $lic['expires_at'] ) {
		return false;
	}
	return ( time() - (int) ( isset( $lic['checked_at'] ) ? $lic['checked_at'] : 0 ) ) <= BADERLR_LICENSE_GRACE;
}

function baderlr_status_message( $s ) {
	$m = array(
		'invalid_code'  => __( 'مفتاح الترخيص غير صحيح.', 'blr-shop-pro' ),
		'revoked'       => __( 'الترخيص ملغى. تواصل مع البائع.', 'blr-shop-pro' ),
		'expired'       => __( 'انتهت صلاحية الترخيص.', 'blr-shop-pro' ),
		'already_used'  => __( 'المفتاح مستعمل على موقع آخر.', 'blr-shop-pro' ),
		'wrong_domain'  => __( 'المفتاح مخصّص لدومين آخر.', 'blr-shop-pro' ),
		'wrong_product' => __( 'هذا المفتاح لمنتج آخر.', 'blr-shop-pro' ),
		'trial_used'    => __( 'النسخة التجريبية استُعملت سابقاً على هذا الموقع.', 'blr-shop-pro' ),
		'rate_limited'  => __( 'محاولات كثيرة، حاول بعد قليل.', 'blr-shop-pro' ),
	);
	return isset( $m[ $s ] ) ? $m[ $s ] : __( 'تعذّر التفعيل.', 'blr-shop-pro' );
}

/* ---------- صفحة الترخيص في لوحة التحكم ---------- */
function baderlr_license_menu() {
	add_menu_page( __( 'ترخيص BLR Shop Pro', 'blr-shop-pro' ), __( 'ترخيص القالب', 'blr-shop-pro' ), 'manage_options', 'baderlr-license', 'baderlr_license_page', 'dashicons-shield', 59 );
}
add_action( 'admin_menu', 'baderlr_license_menu' );

function baderlr_license_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$notice = null;
	if ( 'POST' === $_SERVER['REQUEST_METHOD'] && check_admin_referer( 'baderlr_license' ) ) {
		if ( isset( $_POST['baderlr_activate'] ) ) {
			$key = isset( $_POST['baderlr_key'] ) ? sanitize_text_field( wp_unslash( $_POST['baderlr_key'] ) ) : '';
			$r   = baderlr_license_activate( $key );
			$notice = is_wp_error( $r ) ? array( false, $r->get_error_message() ) : array( true, __( '✓ تم تفعيل القالب بنجاح.', 'blr-shop-pro' ) );
		} elseif ( isset( $_POST['baderlr_deactivate'] ) ) {
			baderlr_license_deactivate();
			$notice = array( true, __( 'تم إلغاء التفعيل على هذا الموقع.', 'blr-shop-pro' ) );
		}
	}
	$lic    = baderlr_license_get();
	$active = baderlr_licensed();
	$seal   = '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="blrlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22C3F0"/><stop offset="1" stop-color="#2F5BFF"/></linearGradient></defs><circle cx="60" cy="60" r="56" fill="none" stroke="url(#blrlg)" stroke-width="3" stroke-dasharray="2 5"/><circle cx="60" cy="60" r="47" fill="url(#blrlg)"/><path d="M60 30l22 8v16c0 14-9 25-22 30-13-5-22-16-22-30V38z" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 60l8 8 14-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	?>
	<div class="wrap blrl" dir="rtl">
		<?php if ( $notice ) : ?><div class="blrl-msg <?php echo $notice[0] ? 'ok' : 'err'; ?>"><?php echo esc_html( $notice[1] ); ?></div><?php endif; ?>

		<?php if ( $active ) :
			$from    = ! empty( $lic['issued_at'] ) ? (int) $lic['issued_at'] : ( ! empty( $lic['activated_at'] ) ? (int) $lic['activated_at'] : 0 );
			$to      = ! empty( $lic['expires_at'] ) ? date_i18n( 'd-m-Y', (int) $lic['expires_at'] ) : '';
			$valid   = $to ? ( $from ? sprintf( /* translators: 1: from 2: to */ __( 'من %1$s إلى %2$s', 'blr-shop-pro' ), date_i18n( 'd-m-Y', $from ), $to ) : $to ) : __( 'مدى الحياة', 'blr-shop-pro' );
			$edition = ! empty( $lic['edition'] ) ? $lic['edition'] : 'Pro';
			$lid     = ! empty( $lic['lid'] ) ? $lic['lid'] : '—';
			$mask    = ! empty( $lic['key'] ) ? substr( $lic['key'], 0, 7 ) . '••••••••' . substr( $lic['key'], -4 ) : '—';
			$days    = ! empty( $lic['expires_at'] ) ? (int) floor( ( (int) $lic['expires_at'] - time() ) / DAY_IN_SECONDS ) : null;
			$rows    = array(
				array( __( 'رقم الترخيص', 'blr-shop-pro' ), $lid, true ),
				array( __( 'الخطة', 'blr-shop-pro' ), $edition, false ),
				array( __( 'النطاق', 'blr-shop-pro' ), ! empty( $lic['domain'] ) ? $lic['domain'] : baderlr_license_domain(), true ),
				array( __( 'الصلاحية', 'blr-shop-pro' ), $valid, false ),
				array( __( 'المفتاح', 'blr-shop-pro' ), $mask, true ),
			);
			?>
			<div class="blrl-card blrl-cert">
				<div>
					<span class="blrl-badge">✓ <?php esc_html_e( 'القالب مفعّل', 'blr-shop-pro' ); ?></span>
					<h2><?php echo esc_html( ! empty( $lic['holder'] ) ? $lic['holder'] : get_bloginfo( 'name' ) ); ?></h2>
					<?php if ( ! empty( $lic['company'] ) ) : ?><p><?php echo esc_html( $lic['company'] ); ?></p><?php endif; ?>
					<dl class="blrl-dl">
						<?php foreach ( $rows as $r ) : ?>
							<div><dt><?php echo esc_html( $r[0] ); ?></dt><dd<?php echo $r[2] ? ' dir="ltr" style="text-align:end"' : ''; ?>><?php echo esc_html( $r[1] ); ?></dd></div>
						<?php endforeach; ?>
					</dl>
					<?php if ( null !== $days && $days <= 30 ) : ?>
						<div class="blrl-note"><?php echo esc_html( $days >= 0 ? sprintf( /* translators: %d: days */ _n( 'ينتهي ترخيصك خلال %d يوم — جدّده للاستمرار.', 'ينتهي ترخيصك خلال %d يوماً — جدّده للاستمرار.', $days, 'blr-shop-pro' ), $days ) : __( 'انتهى ترخيصك.', 'blr-shop-pro' ) ); ?></div>
					<?php endif; ?>
					<form class="blrl-actions" method="post" onsubmit="return confirm('<?php echo esc_js( __( 'إلغاء تفعيل الترخيص على هذا الموقع؟', 'blr-shop-pro' ) ); ?>')">
						<?php wp_nonce_field( 'baderlr_license' ); ?>
						<button name="baderlr_deactivate" class="blrl-btn is-ghost"><?php esc_html_e( 'إلغاء التفعيل', 'blr-shop-pro' ); ?></button>
					</form>
				</div>
				<div class="blrl-seal">
					<?php echo $seal; // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<div class="blrl-stamp"><b><?php esc_html_e( 'ترخيص أصلي', 'blr-shop-pro' ); ?></b><small><?php echo esc_html( strtoupper( $edition ) ); ?></small><small><?php echo esc_html( $lid ); ?></small></div>
				</div>
			</div>
		<?php else : ?>
			<div class="blrl-card blrl-hero">
				<div class="blrl-ic"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
				<div>
					<h2><?php esc_html_e( 'فعّل قالب BLR Shop Pro', 'blr-shop-pro' ); ?></h2>
					<p><?php esc_html_e( 'أدخل مفتاح الترخيص لفتح كل ميزات القالب على موقعك.', 'blr-shop-pro' ); ?></p>
					<ul class="blrl-feat">
						<li><?php esc_html_e( 'استيراد المواقع الجاهزة بنقرة', 'blr-shop-pro' ); ?></li>
						<li><?php esc_html_e( 'إزالة سطر الحقوق من التذييل', 'blr-shop-pro' ); ?></li>
						<li><?php esc_html_e( 'ميزات المتجر والذكاء الاصطناعي', 'blr-shop-pro' ); ?></li>
						<li><?php esc_html_e( 'تحديثات ودعم فني', 'blr-shop-pro' ); ?></li>
					</ul>
					<div class="blrl-domain"><?php esc_html_e( 'دومين موقعك', 'blr-shop-pro' ); ?> <code dir="ltr"><?php echo esc_html( baderlr_license_domain() ); ?></code></div>
					<form class="blrl-form" method="post"><?php wp_nonce_field( 'baderlr_license' ); ?>
						<input type="text" name="baderlr_key" placeholder="BT-XXXX-XXXX-XXXX" autocomplete="off" required value="<?php echo esc_attr( isset( $lic['key'] ) ? $lic['key'] : '' ); ?>">
						<button name="baderlr_activate" class="blrl-btn"><?php esc_html_e( 'تفعيل الترخيص', 'blr-shop-pro' ); ?></button>
					</form>
					<?php if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) : ?>
						<div class="blrl-msg err" style="margin-top:14px"><?php esc_html_e( 'امتداد Sodium غير متوفر في PHP على استضافتك — فعّله ثم أعد المحاولة.', 'blr-shop-pro' ); ?></div>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>
	</div>
	<?php
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( 'toplevel_page_baderlr-license' !== $hook ) {
		return;
	}
	wp_enqueue_style( 'baderlr-license-font', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null ); // phpcs:ignore
	wp_enqueue_style( 'baderlr-license', BADERLR_URI . 'assets/css/license.css', array(), BADERLR_VERSION . '.' . (int) @filemtime( BADERLR_DIR . 'assets/css/license.css' ) );
} );

function baderlr_license_admin_notice() {
	if ( baderlr_licensed() || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s = get_current_screen();
	if ( $s && 'toplevel_page_baderlr-license' === $s->id ) {
		return;
	}
	echo '<div class="notice notice-warning"><p><strong>BLR Shop Pro:</strong> ';
	echo esc_html__( 'القالب غير مُفعَّل — فعّل الترخيص لإتاحة استيراد المواقع الجاهزة وإزالة سطر الحقوق.', 'blr-shop-pro' );
	echo ' <a href="' . esc_url( admin_url( 'admin.php?page=baderlr-license' ) ) . '">' . esc_html__( 'تفعيل الآن', 'blr-shop-pro' ) . '</a></p></div>';
}
add_action( 'admin_notices', 'baderlr_license_admin_notice' );
