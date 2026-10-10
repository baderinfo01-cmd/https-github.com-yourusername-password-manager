<?php
/**
 * الترخيص: توكن Ed25519 موقّع من سيرفر BaderThemesLicense ومرتبط بالدومين.
 * بدون ترخيص تعمل الإضافة بنسخة Free؛ والترخيص يفتح ميزات Pro.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BLRLP_GRACE', 45 * DAY_IN_SECONDS );

/** إعدادات السيرفر: ثوابت داخلية فقط (يمكن تعريفها في wp-config.php قبل تحميل الإضافة). */
function blrlp_lic_cfg( $key ) {
	$map = array( 'server' => 'BLRLP_LICENSE_SERVER', 'pubkey' => 'BLRLP_LICENSE_PUBKEY', 'product' => 'BLRLP_PRODUCT' );
	return defined( $map[ $key ] ) ? constant( $map[ $key ] ) : '';
}

function blrlp_pubkey_ok() {
	$pub = base64_decode( (string) blrlp_lic_cfg( 'pubkey' ), true );
	return false !== $pub && 32 === strlen( $pub );
}

function blrlp_license_domain() {
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	return preg_replace( '/^www\./', '', $host );
}

function blrlp_license_instance() {
	$i = get_option( 'blrlp_instance', '' );
	if ( ! $i ) {
		$i = substr( hash( 'sha256', home_url() . '|' . wp_generate_password( 20, false ) ), 0, 32 );
		update_option( 'blrlp_instance', $i );
	}
	return $i;
}

function blrlp_license_get() {
	$d = get_option( 'blrlp_license', array() );
	return is_array( $d ) ? $d : array();
}

function blrlp_verify_token( $token ) {
	$token = trim( preg_replace( '/\s+/', '', (string) $token ) );
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
	$pub = base64_decode( (string) blrlp_lic_cfg( 'pubkey' ), true );
	if ( false === $msg || false === $sig || false === $pub || 32 !== strlen( $pub ) || 64 !== strlen( $sig ) ) {
		return false;
	}
	if ( ! sodium_crypto_sign_verify_detached( $sig, $msg, $pub ) ) {
		return false;
	}
	$payload = json_decode( $msg, true );
	return is_array( $payload ) ? $payload : false;
}

function blrlp_license_api( $action, $args = array() ) {
	$res = wp_remote_post( trailingslashit( blrlp_lic_cfg( 'server' ) ) . 'api.php', array(
		'timeout' => 15,
		'body'    => array_merge( array(
			'action'   => $action,
			'domain'   => blrlp_license_domain(),
			'instance' => blrlp_license_instance(),
			'version'  => BLRLP_VERSION,
			'product'  => blrlp_lic_cfg( 'product' ),
		), $args ),
	) );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	return is_array( $body ) ? $body : new WP_Error( 'blrlp_resp', __( 'ردّ غير صالح من السيرفر.', 'blr-landing-pro' ) );
}

function blrlp_status_message( $s ) {
	$m = array(
		'invalid_code'  => __( 'مفتاح الترخيص غير صحيح.', 'blr-landing-pro' ),
		'revoked'       => __( 'الترخيص ملغى. تواصل مع البائع.', 'blr-landing-pro' ),
		'expired'       => __( 'انتهت صلاحية الترخيص.', 'blr-landing-pro' ),
		'already_used'  => __( 'المفتاح مستعمل على موقع آخر.', 'blr-landing-pro' ),
		'wrong_domain'  => __( 'المفتاح مخصّص لدومين آخر.', 'blr-landing-pro' ),
		'wrong_product' => __( 'هذا المفتاح لمنتج آخر. تحقّق من «معرّف المنتج».', 'blr-landing-pro' ),
		'rate_limited'  => __( 'محاولات كثيرة، حاول بعد قليل.', 'blr-landing-pro' ),
	);
	return isset( $m[ $s ] ) ? $m[ $s ] : __( 'تعذّر التفعيل.', 'blr-landing-pro' );
}

function blrlp_license_activate( $key ) {
	$key  = trim( $key );
	$resp = blrlp_license_api( 'activate', array( 'code' => $key ) );
	if ( is_wp_error( $resp ) ) {
		/* translators: %s: error message */
		return new WP_Error( 'blrlp_net', sprintf( __( 'تعذّر الاتصال بسيرفر الترخيص (%s). تحقّق من اتصال موقعك بالإنترنت وحاول لاحقاً.', 'blr-landing-pro' ), $resp->get_error_message() ) );
	}
	if ( empty( $resp['success'] ) ) {
		return new WP_Error( 'blrlp_fail', blrlp_status_message( isset( $resp['code'] ) ? $resp['code'] : 'invalid' ) );
	}
	if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
		return new WP_Error( 'blrlp_sodium', __( 'امتداد PHP Sodium غير مفعّل على الخادم.', 'blr-landing-pro' ) );
	}
	if ( ! blrlp_pubkey_ok() ) {
		return new WP_Error( 'blrlp_pubkey', __( 'تعذّر التحقق من الترخيص. تواصل مع الدعم الفني.', 'blr-landing-pro' ) );
	}
	$payload = isset( $resp['token'] ) ? blrlp_verify_token( $resp['token'] ) : false;
	if ( false === $payload ) {
		return new WP_Error( 'blrlp_sig', __( 'تعذّر التحقّق من توقيع الترخيص. تواصل مع الدعم الفني.', 'blr-landing-pro' ) );
	}
	if ( empty( $payload['domain'] ) || $payload['domain'] !== blrlp_license_domain() ) {
		return new WP_Error( 'blrlp_domain', __( 'الدومين في الترخيص لا يطابق هذا الموقع.', 'blr-landing-pro' ) );
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
	update_option( 'blrlp_license', array(
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

function blrlp_license_validate() {
	$lic = blrlp_license_get();
	if ( empty( $lic['lid'] ) ) {
		return;
	}
	$resp = blrlp_license_api( 'check', array( 'lid' => $lic['lid'] ) );
	if ( is_wp_error( $resp ) || empty( $resp['success'] ) ) {
		return; // لا نُسقط الترخيص بسبب خطأ شبكة؛ تحميه فترة السماح.
	}
	$lic['status']     = isset( $resp['status'] ) ? $resp['status'] : $lic['status'];
	$lic['checked_at'] = time();
	if ( isset( $resp['token'] ) ) {
		$p = blrlp_verify_token( $resp['token'] );
		if ( is_array( $p ) && ! empty( $p['exp'] ) ) {
			$lic['expires_at'] = (int) $p['exp'];
		}
	}
	update_option( 'blrlp_license', $lic );
}
add_action( 'blrlp_license_cron', 'blrlp_license_validate' );
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'blrlp_license_cron' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'blrlp_license_cron' );
	}
} );

/** هل هذه نسخة Pro مفعّلة؟ */
function blrlp_is_pro() {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$lic = blrlp_license_get();
	$ok  = ! empty( $lic['status'] ) && 'active' === $lic['status']
		&& ! empty( $lic['domain'] ) && blrlp_license_domain() === $lic['domain']
		&& ( empty( $lic['expires_at'] ) || time() <= (int) $lic['expires_at'] )
		&& ( time() - (int) ( isset( $lic['checked_at'] ) ? $lic['checked_at'] : 0 ) ) <= BLRLP_GRACE;
	$cache = (bool) $ok;
	return $cache;
}

/** ميزات Pro: تُرجع true أو تعرض رسالة ترقية. */
function blrlp_pro_badge() {
	return blrlp_is_pro() ? '' : '<span class="blrlp-pro-tag">PRO</span>';
}
