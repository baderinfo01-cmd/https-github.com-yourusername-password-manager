<?php
/**
 * License client + update checker.
 *
 * يتواصل مع إضافة BLR License Server (المرفقة في plugins/blr-license-server).
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blr_license_server() {
	$url = blr_opt( 'license_server', defined( 'BLR_LICENSE_SERVER' ) ? BLR_LICENSE_SERVER : 'https://your-domain.com/wp-json/blr-license/v1' );
	return untrailingslashit( apply_filters( 'blr_license_server', $url ) );
}

function blr_license_data() {
	$d = get_option( 'blr_license', array() );
	return wp_parse_args(
		is_array( $d ) ? $d : array(),
		array( 'key' => '', 'status' => 'inactive', 'expires' => '', 'plan' => '', 'checked' => 0 )
	);
}

function blr_license_status_label( $s ) {
	$map = array(
		'active'   => __( 'مفعّل', 'blr-shop-pro' ),
		'inactive' => __( 'غير مفعّل', 'blr-shop-pro' ),
		'expired'  => __( 'منتهي', 'blr-shop-pro' ),
		'revoked'  => __( 'ملغى', 'blr-shop-pro' ),
		'invalid'  => __( 'غير صالح', 'blr-shop-pro' ),
	);
	return isset( $map[ $s ] ) ? $map[ $s ] : $s;
}

function blr_is_licensed() {
	if ( defined( 'BLR_DEV_LICENSE' ) && BLR_DEV_LICENSE ) {
		return true; // لبيئات التطوير فقط.
	}
	$d = blr_license_data();
	return 'active' === $d['status'];
}

/**
 * Call the license server.
 *
 * @return array|WP_Error
 */
function blr_license_request( $action, $key ) {
	$res = wp_remote_post(
		blr_license_server() . '/' . $action,
		array(
			'timeout' => 20,
			'body'    => array(
				'key'     => $key,
				'domain'  => wp_parse_url( home_url(), PHP_URL_HOST ),
				'product' => 'blr-shop-pro',
				'version' => BLR_VERSION,
			),
		)
	);
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( ! is_array( $body ) ) {
		return new WP_Error( 'blr_bad_response', __( 'رد غير صالح من خادم الترخيص.', 'blr-shop-pro' ) );
	}
	return $body;
}

add_action( 'wp_ajax_blr_license', 'blr_ajax_license' );
function blr_ajax_license() {
	check_ajax_referer( 'blr_admin', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => __( 'غير مسموح.', 'blr-shop-pro' ) ), 403 );
	}
	$do  = isset( $_POST['do'] ) && 'deactivate' === $_POST['do'] ? 'deactivate' : 'activate';
	$key = isset( $_POST['key'] ) ? strtoupper( preg_replace( '/[^A-Za-z0-9\-]/', '', wp_unslash( $_POST['key'] ) ) ) : '';
	if ( 'activate' === $do && '' === $key ) {
		wp_send_json_error( array( 'message' => __( 'أدخل مفتاح الترخيص.', 'blr-shop-pro' ) ) );
	}
	if ( 'deactivate' === $do ) {
		$key = blr_license_data()['key'];
	}
	$r = blr_license_request( $do, $key );
	if ( is_wp_error( $r ) ) {
		wp_send_json_error( array( 'message' => $r->get_error_message() ) );
	}
	if ( empty( $r['success'] ) ) {
		wp_send_json_error( array( 'message' => isset( $r['message'] ) ? sanitize_text_field( $r['message'] ) : __( 'فشل التفعيل.', 'blr-shop-pro' ) ) );
	}
	if ( 'deactivate' === $do ) {
		delete_option( 'blr_license' );
		wp_send_json_success( array( 'message' => __( 'تم إلغاء التفعيل.', 'blr-shop-pro' ), 'status' => 'inactive', 'label' => blr_license_status_label( 'inactive' ) ) );
	}
	update_option(
		'blr_license',
		array(
			'key'     => $key,
			'status'  => 'active',
			'expires' => isset( $r['expires'] ) ? sanitize_text_field( $r['expires'] ) : '',
			'plan'    => isset( $r['plan'] ) ? sanitize_text_field( $r['plan'] ) : '',
			'checked' => time(),
		),
		false
	);
	wp_send_json_success( array( 'message' => __( 'تم تفعيل الترخيص بنجاح.', 'blr-shop-pro' ), 'status' => 'active', 'label' => blr_license_status_label( 'active' ) ) );
}

/* فحص دوري أسبوعي لحالة الترخيص. */
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'blr_license_check' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'weekly_blr', 'blr_license_check' );
	}
} );
add_filter( 'cron_schedules', function ( $s ) {
	$s['weekly_blr'] = array( 'interval' => WEEK_IN_SECONDS, 'display' => 'Weekly' );
	return $s;
} );
add_action( 'blr_license_check', function () {
	$d = blr_license_data();
	if ( '' === $d['key'] ) {
		return;
	}
	$r = blr_license_request( 'validate', $d['key'] );
	if ( is_wp_error( $r ) ) {
		return; // لا نُسقط الترخيص بسبب خطأ شبكة.
	}
	$d['status']  = ! empty( $r['success'] ) ? 'active' : ( isset( $r['status'] ) ? sanitize_key( $r['status'] ) : 'invalid' );
	$d['expires'] = isset( $r['expires'] ) ? sanitize_text_field( $r['expires'] ) : $d['expires'];
	$d['checked'] = time();
	update_option( 'blr_license', $d, false );
} );

/* تحديثات القالب من خادم الترخيص. */
add_filter( 'pre_set_site_transient_update_themes', 'blr_check_update' );
function blr_check_update( $transient ) {
	if ( empty( $transient->checked ) || ! blr_is_licensed() ) {
		return $transient;
	}
	$cache = get_transient( 'blr_update_info' );
	if ( false === $cache ) {
		$r     = blr_license_request( 'update', blr_license_data()['key'] );
		$cache = ( ! is_wp_error( $r ) && ! empty( $r['success'] ) ) ? $r : array();
		set_transient( 'blr_update_info', $cache, 12 * HOUR_IN_SECONDS );
	}
	if ( ! empty( $cache['version'] ) && ! empty( $cache['package'] ) && version_compare( $cache['version'], BLR_VERSION, '>' ) ) {
		$transient->response[ get_template() ] = array(
			'theme'       => get_template(),
			'new_version' => sanitize_text_field( $cache['version'] ),
			'url'         => isset( $cache['url'] ) ? esc_url_raw( $cache['url'] ) : '',
			'package'     => esc_url_raw( $cache['package'] ),
		);
	}
	return $transient;
}
