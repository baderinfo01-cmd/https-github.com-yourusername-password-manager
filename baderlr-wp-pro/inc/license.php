<?php
/**
 * عميل الترخيص — متوافق مع سيرفر BaderThemesLicense الجديد (api.php + توكِن موقّع).
 *
 * التفعيل يُرسل: action=activate, code, domain, instance, version, product
 * الرد: { success, status, token }  — التوكِن = PREFIX-<b64url(json)>.<b64url(sig)>
 * عدم التفعيل لا يُعطّل الموقع، لكنه يُظهر تنبيهاً ويعطّل الميزات المدفوعة (استيراد المواقع).
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BADERLR_LICENSE_GRACE', 45 * DAY_IN_SECONDS );

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
	$pub = base64_decode( BADERLR_LICENSE_PUBKEY, true );
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
	$url = trailingslashit( BADERLR_LICENSE_SERVER ) . 'api.php';
	$res = wp_remote_post( $url, array(
		'timeout' => 15,
		'body'    => array_merge( array(
			'action'   => $action,
			'domain'   => baderlr_license_domain(),
			'instance' => baderlr_license_instance(),
			'version'  => BADERLR_VERSION,
			'product'  => BADERLR_PRODUCT,
		), $args ),
	) );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	return is_array( $body ) ? $body : new WP_Error( 'baderlr_resp', __( 'ردّ غير صالح من السيرفر.', 'baderlr-wp' ) );
}

function baderlr_license_activate( $key ) {
	$key  = trim( $key );
	$resp = baderlr_license_api( 'activate', array( 'code' => $key ) );
	if ( is_wp_error( $resp ) ) {
		return $resp;
	}
	if ( empty( $resp['success'] ) ) {
		$code = isset( $resp['code'] ) ? $resp['code'] : 'invalid';
		return new WP_Error( 'baderlr_fail', baderlr_status_message( $code ) );
	}
	$payload = isset( $resp['token'] ) ? baderlr_verify_token( $resp['token'] ) : false;
	if ( false === $payload ) {
		return new WP_Error( 'baderlr_sig', __( 'تعذّر التحقّق من توقيع السيرفر. تأكّد أن المفتاح العام في القالب يطابق لوحة السيرفر.', 'baderlr-wp' ) );
	}
	if ( empty( $payload['domain'] ) || $payload['domain'] !== baderlr_license_domain() ) {
		return new WP_Error( 'baderlr_domain', __( 'الدومين في الترخيص لا يطابق هذا الموقع.', 'baderlr-wp' ) );
	}
	baderlr_license_save( array(
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
		'invalid_code'  => __( 'مفتاح الترخيص غير صحيح.', 'baderlr-wp' ),
		'revoked'       => __( 'الترخيص ملغى. تواصل مع البائع.', 'baderlr-wp' ),
		'expired'       => __( 'انتهت صلاحية الترخيص.', 'baderlr-wp' ),
		'already_used'  => __( 'المفتاح مستعمل على موقع آخر.', 'baderlr-wp' ),
		'wrong_domain'  => __( 'المفتاح مخصّص لدومين آخر.', 'baderlr-wp' ),
		'wrong_product' => __( 'هذا المفتاح لمنتج آخر.', 'baderlr-wp' ),
		'trial_used'    => __( 'النسخة التجريبية استُعملت سابقاً على هذا الموقع.', 'baderlr-wp' ),
		'rate_limited'  => __( 'محاولات كثيرة، حاول بعد قليل.', 'baderlr-wp' ),
	);
	return isset( $m[ $s ] ) ? $m[ $s ] : __( 'تعذّر التفعيل.', 'baderlr-wp' );
}

/* ---------- صفحة الترخيص في لوحة التحكم ---------- */
function baderlr_license_menu() {
	add_menu_page( __( 'ترخيص BaderLR WP', 'baderlr-wp' ), __( 'ترخيص القالب', 'baderlr-wp' ), 'manage_options', 'baderlr-license', 'baderlr_license_page', 'dashicons-shield', 59 );
}
add_action( 'admin_menu', 'baderlr_license_menu' );

function baderlr_license_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$notice = '';
	$type   = '';
	if ( 'POST' === $_SERVER['REQUEST_METHOD'] && check_admin_referer( 'baderlr_license' ) ) {
		if ( isset( $_POST['baderlr_activate'] ) ) {
			$key = isset( $_POST['baderlr_key'] ) ? sanitize_text_field( wp_unslash( $_POST['baderlr_key'] ) ) : '';
			$r   = baderlr_license_activate( $key );
			if ( is_wp_error( $r ) ) {
				$notice = $r->get_error_message();
				$type   = 'error';
			} else {
				$notice = __( '✓ تم تفعيل القالب بنجاح.', 'baderlr-wp' );
				$type   = 'success';
			}
		} elseif ( isset( $_POST['baderlr_deactivate'] ) ) {
			baderlr_license_deactivate();
			$notice = __( 'تم إلغاء التفعيل محلياً على هذا الموقع.', 'baderlr-wp' );
			$type   = 'success';
		}
	}
	$lic    = baderlr_license_get();
	$active = baderlr_licensed();
	?>
	<div class="wrap" dir="rtl" style="max-width:720px">
		<h1><?php esc_html_e( 'ترخيص قالب BaderLR WP', 'baderlr-wp' ); ?></h1>
		<?php if ( $notice ) : ?><div class="notice notice-<?php echo 'error' === $type ? 'error' : 'success'; ?>"><p><?php echo esc_html( $notice ); ?></p></div><?php endif; ?>
		<div class="card" style="padding:20px;margin-top:14px;max-width:none">
			<?php if ( $active ) : ?>
				<p style="font-size:16px;color:#1a7f37"><strong>✓ <?php esc_html_e( 'القالب مُفعَّل.', 'baderlr-wp' ); ?></strong></p>
				<table class="widefat striped" style="max-width:560px">
					<tr><td><?php esc_html_e( 'الدومين', 'baderlr-wp' ); ?></td><td dir="ltr"><?php echo esc_html( $lic['domain'] ); ?></td></tr>
					<tr><td><?php esc_html_e( 'رقم الترخيص', 'baderlr-wp' ); ?></td><td dir="ltr"><?php echo esc_html( isset( $lic['lid'] ) ? $lic['lid'] : '—' ); ?></td></tr>
					<tr><td><?php esc_html_e( 'المفتاح', 'baderlr-wp' ); ?></td><td dir="ltr"><?php echo esc_html( $lic['key'] ); ?></td></tr>
					<tr><td><?php esc_html_e( 'ينتهي', 'baderlr-wp' ); ?></td><td><?php echo esc_html( ! empty( $lic['expires_at'] ) ? date_i18n( 'Y-m-d', (int) $lic['expires_at'] ) : __( 'مدى الحياة', 'baderlr-wp' ) ); ?></td></tr>
				</table>
				<form method="post" style="margin-top:16px"><?php wp_nonce_field( 'baderlr_license' ); ?><button name="baderlr_deactivate" class="button"><?php esc_html_e( 'إلغاء التفعيل', 'baderlr-wp' ); ?></button></form>
			<?php else : ?>
				<p><?php esc_html_e( 'أدخل مفتاح الترخيص لتفعيل كل الخصائص (استيراد المواقع الجاهزة وإزالة سطر الحقوق).', 'baderlr-wp' ); ?></p>
				<p><strong><?php esc_html_e( 'دومين هذا الموقع:', 'baderlr-wp' ); ?></strong> <code dir="ltr"><?php echo esc_html( baderlr_license_domain() ); ?></code></p>
				<form method="post"><?php wp_nonce_field( 'baderlr_license' ); ?>
					<input type="text" name="baderlr_key" class="regular-text" placeholder="BT-XXXX-XXXX-XXXX" value="<?php echo esc_attr( isset( $lic['key'] ) ? $lic['key'] : '' ); ?>" style="direction:ltr;font-family:monospace" required>
					<p><button name="baderlr_activate" class="button button-primary button-hero"><?php esc_html_e( 'تفعيل القالب', 'baderlr-wp' ); ?></button></p>
				</form>
			<?php endif; ?>
		</div>
	</div>
	<?php
}

function baderlr_license_admin_notice() {
	if ( baderlr_licensed() || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s = get_current_screen();
	if ( $s && 'toplevel_page_baderlr-license' === $s->id ) {
		return;
	}
	echo '<div class="notice notice-warning"><p><strong>BaderLR WP:</strong> ';
	echo esc_html__( 'القالب غير مُفعَّل — فعّل الترخيص لإتاحة استيراد المواقع الجاهزة وإزالة سطر الحقوق.', 'baderlr-wp' );
	echo ' <a href="' . esc_url( admin_url( 'admin.php?page=baderlr-license' ) ) . '">' . esc_html__( 'تفعيل الآن', 'baderlr-wp' ) . '</a></p></div>';
}
add_action( 'admin_notices', 'baderlr_license_admin_notice' );
