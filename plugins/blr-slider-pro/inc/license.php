<?php
/**
 * ترخيص BLR Slider Pro (Ed25519 مرتبط بالدومين) + بطاقة الترخيص.
 *
 * @package blr-slider-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BLRS_GRACE', 45 * DAY_IN_SECONDS );

/** إعدادات السيرفر: ثوابت داخلية فقط (يمكن تعريفها في wp-config.php قبل تحميل الإضافة). */
function blrs_lic_cfg( $key ) {
	$map = array( 'server' => 'BLRS_LICENSE_SERVER', 'pubkey' => 'BLRS_LICENSE_PUBKEY', 'product' => 'BLRS_PRODUCT' );
	return defined( $map[ $key ] ) ? constant( $map[ $key ] ) : '';
}

function blrs_pubkey_ok() {
	$pub = base64_decode( (string) blrs_lic_cfg( 'pubkey' ), true );
	return false !== $pub && 32 === strlen( $pub );
}

function blrs_license_domain() {
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	return preg_replace( '/^www\./', '', $host );
}

function blrs_license_instance() {
	$i = get_option( 'blrs_instance', '' );
	if ( ! $i ) {
		$i = substr( hash( 'sha256', home_url() . '|' . wp_generate_password( 20, false ) ), 0, 32 );
		update_option( 'blrs_instance', $i );
	}
	return $i;
}

function blrs_license_get() {
	$d = get_option( 'blrs_license', array() );
	return is_array( $d ) ? $d : array();
}

function blrs_verify_token( $token ) {
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
	$pub = base64_decode( (string) blrs_lic_cfg( 'pubkey' ), true );
	if ( false === $msg || false === $sig || false === $pub || 32 !== strlen( $pub ) || 64 !== strlen( $sig ) ) {
		return false;
	}
	if ( ! sodium_crypto_sign_verify_detached( $sig, $msg, $pub ) ) {
		return false;
	}
	$payload = json_decode( $msg, true );
	return is_array( $payload ) ? $payload : false;
}

function blrs_license_api( $action, $args = array() ) {
	$res = wp_remote_post( trailingslashit( blrs_lic_cfg( 'server' ) ) . 'api.php', array(
		'timeout' => 15,
		'body'    => array_merge( array(
			'action'   => $action,
			'domain'   => blrs_license_domain(),
			'instance' => blrs_license_instance(),
			'version'  => BLRS_VERSION,
			'product'  => blrs_lic_cfg( 'product' ),
		), $args ),
	) );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	return is_array( $body ) ? $body : new WP_Error( 'blrs_resp', __( 'ردّ غير صالح من السيرفر.', 'blr-slider-pro' ) );
}

function blrs_status_message( $s ) {
	$m = array(
		'invalid_code'  => __( 'مفتاح الترخيص غير صحيح.', 'blr-slider-pro' ),
		'revoked'       => __( 'الترخيص ملغى. تواصل مع البائع.', 'blr-slider-pro' ),
		'expired'       => __( 'انتهت صلاحية الترخيص.', 'blr-slider-pro' ),
		'already_used'  => __( 'المفتاح مستعمل على موقع آخر.', 'blr-slider-pro' ),
		'wrong_domain'  => __( 'المفتاح مخصّص لدومين آخر.', 'blr-slider-pro' ),
		'wrong_product' => __( 'هذا المفتاح لمنتج آخر. تحقّق من «معرّف المنتج».', 'blr-slider-pro' ),
		'rate_limited'  => __( 'محاولات كثيرة، حاول بعد قليل.', 'blr-slider-pro' ),
	);
	return isset( $m[ $s ] ) ? $m[ $s ] : __( 'تعذّر التفعيل.', 'blr-slider-pro' );
}

function blrs_license_activate( $key ) {
	$key  = trim( $key );
	$resp = blrs_license_api( 'activate', array( 'code' => $key ) );
	if ( is_wp_error( $resp ) ) {
		/* translators: %s: error message */
		return new WP_Error( 'blrs_net', sprintf( __( 'تعذّر الاتصال بسيرفر الترخيص (%s). تحقّق من اتصال موقعك بالإنترنت وحاول لاحقاً.', 'blr-slider-pro' ), $resp->get_error_message() ) );
	}
	if ( empty( $resp['success'] ) ) {
		return new WP_Error( 'blrs_fail', blrs_status_message( isset( $resp['code'] ) ? $resp['code'] : 'invalid' ) );
	}
	if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
		return new WP_Error( 'blrs_sodium', __( 'امتداد PHP Sodium غير مفعّل على الخادم.', 'blr-slider-pro' ) );
	}
	if ( ! blrs_pubkey_ok() ) {
		return new WP_Error( 'blrs_pubkey', __( 'تعذّر التحقق من الترخيص. تواصل مع الدعم الفني.', 'blr-slider-pro' ) );
	}
	$payload = isset( $resp['token'] ) ? blrs_verify_token( $resp['token'] ) : false;
	if ( false === $payload ) {
		return new WP_Error( 'blrs_sig', __( 'تعذّر التحقّق من توقيع الترخيص. تواصل مع الدعم الفني.', 'blr-slider-pro' ) );
	}
	if ( empty( $payload['domain'] ) || $payload['domain'] !== blrs_license_domain() ) {
		return new WP_Error( 'blrs_domain', __( 'الدومين في الترخيص لا يطابق هذا الموقع.', 'blr-slider-pro' ) );
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
	update_option( 'blrs_license', array(
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

function blrs_license_validate() {
	$lic = blrs_license_get();
	if ( empty( $lic['lid'] ) ) {
		return;
	}
	$resp = blrs_license_api( 'check', array( 'lid' => $lic['lid'] ) );
	if ( is_wp_error( $resp ) || empty( $resp['success'] ) ) {
		return; // لا نُسقط الترخيص بسبب خطأ شبكة؛ تحميه فترة السماح.
	}
	$lic['status']     = isset( $resp['status'] ) ? $resp['status'] : $lic['status'];
	$lic['checked_at'] = time();
	if ( isset( $resp['token'] ) ) {
		$p = blrs_verify_token( $resp['token'] );
		if ( is_array( $p ) && ! empty( $p['exp'] ) ) {
			$lic['expires_at'] = (int) $p['exp'];
		}
	}
	update_option( 'blrs_license', $lic );
}
add_action( 'blrs_license_cron', 'blrs_license_validate' );
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'blrs_license_cron' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'blrs_license_cron' );
	}
} );

/** هل هذه نسخة Pro مفعّلة؟ */
function blrs_is_pro() {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$lic = blrs_license_get();
	$ok  = ! empty( $lic['status'] ) && 'active' === $lic['status']
		&& ! empty( $lic['domain'] ) && blrs_license_domain() === $lic['domain']
		&& ( empty( $lic['expires_at'] ) || time() <= (int) $lic['expires_at'] )
		&& ( time() - (int) ( isset( $lic['checked_at'] ) ? $lic['checked_at'] : 0 ) ) <= BLRS_GRACE;
	$cache = (bool) $ok;
	return $cache;
}

/** ميزات Pro: تُرجع true أو تعرض رسالة ترقية. */
function blrs_pro_badge() {
	return blrs_is_pro() ? '' : '<span class="blrs-pro-tag">PRO</span>';
}

add_action( 'admin_post_blrs_license_do', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'blrs_license' ) ) {
		wp_die( esc_html__( 'غير مسموح.', 'blr-slider-pro' ) );
	}
	$do  = sanitize_key( $_POST['do'] ?? '' );
	$msg = '';
	$ok  = true;
	if ( 'activate' === $do ) {
		$r = blrs_license_activate( sanitize_text_field( wp_unslash( $_POST['key'] ?? '' ) ) );
		if ( is_wp_error( $r ) ) {
			$msg = $r->get_error_message();
			$ok  = false;
		} else {
			$msg = __( '✓ تم تفعيل Pro بنجاح.', 'blr-slider-pro' );
		}
	} elseif ( 'deactivate' === $do ) {
		delete_option( 'blrs_license' );
		$msg = __( 'تم إلغاء التفعيل على هذا الموقع.', 'blr-slider-pro' );
	}
	set_transient( 'blrs_notice_' . get_current_user_id(), array( $ok, $msg ), 60 );
	wp_safe_redirect( admin_url( 'edit.php?post_type=blr_slider&page=blr-slider-settings' ) );
	exit;
} );



/** بطاقة الترخيص: شهادة عند التفعيل، وصفحة تفعيل جذّابة قبله. */
function blrs_license_card( $notice = null ) {
	$lic  = blrs_license_get();
	$pro  = blrs_is_pro();
	echo '<div class="blrl">';
	if ( $notice ) {
		echo '<div class="blrl-msg ' . ( $notice[0] ? 'ok' : 'err' ) . '">' . esc_html( $notice[1] ) . '</div>';
	}
	if ( $pro ) {
		$from = ! empty( $lic['issued_at'] ) ? (int) $lic['issued_at'] : ( ! empty( $lic['activated_at'] ) ? (int) $lic['activated_at'] : 0 );
		$to   = ! empty( $lic['expires_at'] ) ? date_i18n( 'd-m-Y', (int) $lic['expires_at'] ) : '';
		$valid = $to ? ( $from ? sprintf( /* translators: 1: from 2: to */ __( 'من %1$s إلى %2$s', 'blr-slider-pro' ), date_i18n( 'd-m-Y', $from ), $to ) : $to ) : __( 'مدى الحياة', 'blr-slider-pro' );
		$edition = ! empty( $lic['edition'] ) ? $lic['edition'] : 'Pro';
		$lid     = ! empty( $lic['lid'] ) ? $lic['lid'] : '—';
		$key     = ! empty( $lic['key'] ) ? substr( $lic['key'], 0, 7 ) . '••••••••' . substr( $lic['key'], -4 ) : '—';
		$days    = ! empty( $lic['expires_at'] ) ? (int) floor( ( (int) $lic['expires_at'] - time() ) / DAY_IN_SECONDS ) : null;
		echo '<div class="blrl-card blrl-cert"><div>';
		echo '<span class="blrl-badge">✓ ' . esc_html__( 'ترخيص Pro مفعّل', 'blr-slider-pro' ) . '</span>';
		echo '<h2>' . esc_html( ! empty( $lic['holder'] ) ? $lic['holder'] : get_bloginfo( 'name' ) ) . '</h2>';
		if ( ! empty( $lic['company'] ) ) {
			echo '<p>' . esc_html( $lic['company'] ) . '</p>';
		}
		echo '<dl class="blrl-dl">';
		$rows = array(
			array( __( 'رقم الترخيص', 'blr-slider-pro' ), $lid, true ),
			array( __( 'الخطة', 'blr-slider-pro' ), $edition, false ),
			array( __( 'النطاق', 'blr-slider-pro' ), ! empty( $lic['domain'] ) ? $lic['domain'] : blrs_license_domain(), true ),
			array( __( 'الصلاحية', 'blr-slider-pro' ), $valid, false ),
			array( __( 'المفتاح', 'blr-slider-pro' ), $key, true ),
		);
		foreach ( $rows as $r ) {
			echo '<div><dt>' . esc_html( $r[0] ) . '</dt><dd' . ( $r[2] ? ' dir="ltr" style="text-align:end"' : '' ) . '>' . esc_html( $r[1] ) . '</dd></div>';
		}
		echo '</dl>';
		if ( null !== $days && $days <= 30 ) {
			echo '<div class="blrl-note">' . esc_html( $days >= 0 ? sprintf( /* translators: %d: days */ _n( 'ينتهي ترخيصك خلال %d يوم — جدّده لتبقى ميزات Pro فعّالة.', 'ينتهي ترخيصك خلال %d يوماً — جدّده لتبقى ميزات Pro فعّالة.', $days, 'blr-slider-pro' ), $days ) : __( 'انتهى ترخيصك.', 'blr-slider-pro' ) ) . '</div>';
		}
		echo '<form class="blrl-actions" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" onsubmit="return confirm(\'' . esc_js( __( 'إلغاء تفعيل الترخيص على هذا الموقع؟', 'blr-slider-pro' ) ) . '\')">';
		wp_nonce_field( 'blrs_license' );
		echo '<input type="hidden" name="action" value="blrs_license_do"><input type="hidden" name="do" value="deactivate"><button class="blrl-btn is-ghost">' . esc_html__( 'إلغاء التفعيل', 'blr-slider-pro' ) . '</button></form>';
		echo '</div><div class="blrl-seal"><img class="blrl-sealimg" src="' . esc_url( BLRS_URL . 'assets/img/seal.png' ) . '" alt=""><div class="blrl-stamp"><b>' . esc_html__( 'ترخيص أصلي', 'blr-slider-pro' ) . '</b><small>' . esc_html( strtoupper( $edition ) ) . '</small><small>' . esc_html( $lid ) . '</small></div></div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	} else {
		echo '<div class="blrl-card blrl-hero"><div class="blrl-ic"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div><div>';
		echo '<h2>' . esc_html__( 'فعّل BLR Slider Pro', 'blr-slider-pro' ) . '</h2><p>' . esc_html__( 'أدخل مفتاح الترخيص لفتح كل الميزات الاحترافية على موقعك.', 'blr-slider-pro' ) . '</p>';
		echo '<ul class="blrl-feat"><li>' . esc_html__( 'تأثير ثلاثي الأبعاد (Creative)', 'blr-slider-pro' ) . '</li><li>' . esc_html__( 'تأثير Ken Burns', 'blr-slider-pro' ) . '</li><li>' . esc_html__( 'شرائح فيديو MP4', 'blr-slider-pro' ) . '</li><li>' . esc_html__( 'عدّاد تنازلي داخل الشريحة', 'blr-slider-pro' ) . '</li><li>' . esc_html__( 'تحديثات ودعم فني', 'blr-slider-pro' ) . '</li><li>' . esc_html__( 'أولوية في الدعم', 'blr-slider-pro' ) . '</li></ul>';
		echo '<div class="blrl-domain">' . esc_html__( 'دومين موقعك', 'blr-slider-pro' ) . ' <code dir="ltr">' . esc_html( blrs_license_domain() ) . '</code></div>';
		echo '<form class="blrl-form" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		wp_nonce_field( 'blrs_license' );
		echo '<input type="hidden" name="action" value="blrs_license_do"><input type="hidden" name="do" value="activate"><input type="text" name="key" placeholder="BT-XXXX-XXXX-XXXX" autocomplete="off" required value="' . esc_attr( isset( $lic['key'] ) ? $lic['key'] : '' ) . '"><button class="blrl-btn">' . esc_html__( 'تفعيل الترخيص', 'blr-slider-pro' ) . '</button></form>';
		echo '<p class="blrl-help">' . esc_html__( 'لا تملك ترخيصاً؟', 'blr-slider-pro' ) . ' <a href="' . esc_url( BLRS_BUY_URL ) . '" target="_blank" rel="noopener">' . esc_html__( 'احصل على BLR Slider Pro', 'blr-slider-pro' ) . '</a></p>';
		if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
			echo '<div class="blrl-msg err">' . esc_html__( 'امتداد Sodium غير متوفر في PHP على استضافتك — فعّله ثم أعد المحاولة.', 'blr-slider-pro' ) . '</div>';
		}
		echo '</div></div>';
	}
	echo '</div>';
}

