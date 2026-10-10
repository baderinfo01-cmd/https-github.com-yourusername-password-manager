<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'bi/v1', '/token', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$ts = time();
			$r  = new WP_REST_Response( array( 'ts' => $ts, 'sig' => hash_hmac( 'sha256', 'bisr|' . $ts, wp_salt( 'nonce' ) ) ) );
			$r->header( 'Cache-Control', 'no-store' );
			return $r;
		},
	) );
	register_rest_route( 'bi/v1', '/submit', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'bisr_handle_submit',
	) );
} );

function bisr_err( $msg, $code = 400 ) {
	return new WP_REST_Response( array( 'ok' => false, 'message' => $msg ), $code );
}

function bisr_clean_value( $f, $v ) {
	$t = $f['t'];
	if ( 'checkbox' === $t ) {
		$v    = is_array( $v ) ? $v : array();
		$ok   = array_map( function ( $o ) { return $o['v']; }, isset( $f['o'] ) ? $f['o'] : array() );
		$v    = array_values( array_intersect( array_map( 'sanitize_text_field', $v ), $ok ) );
		return $v;
	}
	$v = is_scalar( $v ) ? (string) $v : '';
	switch ( $t ) {
		case 'email':
			$v = sanitize_email( $v );
			return is_email( $v ) ? $v : '';
		case 'tel':
			return substr( preg_replace( '/[^\d+\-\(\)\s\/]/', '', $v ), 0, 30 );
		case 'url':
			return substr( esc_url_raw( $v ), 0, 300 );
		case 'textarea':
			return substr( sanitize_textarea_field( $v ), 0, 4000 );
		case 'select':
			$v  = sanitize_text_field( $v );
			$ok = array_map( function ( $o ) { return $o['v']; }, isset( $f['o'] ) ? $f['o'] : array() );
			return in_array( $v, $ok, true ) ? $v : '';
		default:
			return substr( sanitize_text_field( $v ), 0, 200 );
	}
}

/** اسم القيمة بلغة الزائر. */
function bisr_value_label( $f, $v, $lang ) {
	if ( ! isset( $f['o'] ) ) {
		return is_array( $v ) ? implode( '، ', $v ) : $v;
	}
	$map = array();
	foreach ( $f['o'] as $o ) {
		$map[ $o['v'] ] = isset( $o['l'][ $lang ] ) ? $o['l'][ $lang ] : $o['v'];
	}
	$vals = (array) $v;
	return implode( '، ', array_map( function ( $x ) use ( $map ) { return isset( $map[ $x ] ) ? $map[ $x ] : $x; }, $vals ) );
}

function bisr_handle_submit( WP_REST_Request $req ) {
	$p    = $req->get_json_params();
	$p    = is_array( $p ) ? $p : array();
	$lang = bisr_lang( isset( $p['lang'] ) ? $p['lang'] : 'ar' );
	$kind = ( isset( $p['kind'] ) && 'contact' === $p['kind'] ) ? 'contact' : 'request';
	$msg  = function ( $k ) use ( $lang ) { return bisr_s( $lang, $k ); };

	// مصيدة روبوتات + توقيع زمني.
	if ( ! empty( $p['hp'] ) ) {
		return new WP_REST_Response( array( 'ok' => true, 'ref' => 0 ) ); // نتظاهر بالنجاح.
	}
	$ts  = isset( $p['ts'] ) ? (int) $p['ts'] : 0;
	$sig = isset( $p['sig'] ) ? (string) $p['sig'] : '';
	if ( ! $ts || ! hash_equals( hash_hmac( 'sha256', 'bisr|' . $ts, wp_salt( 'nonce' ) ), $sig ) || time() - $ts < 3 || time() - $ts > 2 * DAY_IN_SECONDS ) {
		return bisr_err( $msg( 'err' ), 429 );
	}
	// تحديد المعدل لكل IP.
	$ip   = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$hash = hash_hmac( 'sha256', $ip, wp_salt( 'auth' ) );
	$tk   = 'bisr_rl_' . substr( $hash, 0, 24 );
	$n    = (int) get_transient( $tk );
	if ( $n >= (int) bisr_opt( 'rate', 6 ) ) {
		return bisr_err( $msg( 'err' ), 429 );
	}

	$input = isset( $p['fields'] ) && is_array( $p['fields'] ) ? $p['fields'] : array();
	$cat   = bisr_catalog();
	$defs  = array();
	$label = '';
	$sid   = '';

	if ( 'request' === $kind ) {
		$sid = isset( $p['service'] ) ? sanitize_text_field( $p['service'] ) : '';
		$svc = bisr_find_service( $sid );
		if ( ! $svc || empty( $cat['fields'][ $svc['f'] ] ) ) {
			return bisr_err( $msg( 'err' ) );
		}
		$label = $svc['n'][ $lang ];
		$defs  = array_merge( $cat['common'], $cat['fields'][ $svc['f'] ], $cat['foot'] );
	} else {
		$mk = function ( $k, $t, $ar, $en, $fr, $r = false ) { return array( 'k' => $k, 't' => $t, 'l' => compact( 'ar', 'en', 'fr' ), 'r' => $r ? 1 : 0 ); };
		$defs = array(
			$mk( 'name', 'text', 'الاسم', 'Name', 'Nom', true ),
			$mk( 'email', 'email', 'البريد الإلكتروني', 'Email', 'E-mail', true ),
			$mk( 'phone', 'tel', 'الهاتف', 'Phone', 'Téléphone' ),
			$mk( 'subject', 'text', 'الموضوع', 'Subject', 'Objet' ),
			$mk( 'details', 'textarea', 'الرسالة', 'Message', 'Message', true ),
		);
	}

	$clean = array();
	$rows  = array();
	$errs  = array();
	foreach ( $defs as $f ) {
		$raw = isset( $input[ $f['k'] ] ) ? $input[ $f['k'] ] : '';
		$v   = bisr_clean_value( $f, $raw );
		$empty = is_array( $v ) ? ! $v : '' === $v;
		if ( ! empty( $f['r'] ) && $empty ) {
			$errs[] = $f['k'];
			continue;
		}
		if ( $empty ) {
			continue;
		}
		$clean[ $f['k'] ] = $v;
		$rows[]           = array( 'k' => $f['k'], 'l' => $f['l'][ $lang ], 'v' => bisr_value_label( $f, $v, $lang ) );
	}
	if ( $errs ) {
		return new WP_REST_Response( array( 'ok' => false, 'message' => $msg( 'fix' ), 'fields' => $errs ), 422 );
	}

	global $wpdb;
	$wpdb->insert( $wpdb->prefix . 'bisr_requests', array(
		'created'       => current_time( 'mysql' ),
		'kind'          => $kind,
		'lang'          => $lang,
		'service_id'    => $sid,
		'service_label' => $label,
		'name'          => isset( $clean['name'] ) ? $clean['name'] : '',
		'email'         => isset( $clean['email'] ) ? $clean['email'] : '',
		'phone'         => isset( $clean['phone'] ) ? $clean['phone'] : '',
		'status'        => 'new',
		'data'          => wp_json_encode( $rows, JSON_UNESCAPED_UNICODE ),
		'page_url'      => esc_url_raw( wp_get_referer() ? wp_get_referer() : '' ),
		'ip_hash'       => substr( $hash, 0, 32 ),
	) );
	$id = (int) $wpdb->insert_id;
	set_transient( $tk, $n + 1, HOUR_IN_SECONDS );
	bisr_notify( $id, $kind, $lang, $label, $clean, $rows );

	return new WP_REST_Response( array( 'ok' => true, 'ref' => $id ) );
}

function bisr_table_html( $rows ) {
	$h = '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Tahoma,Arial,sans-serif;font-size:14px">';
	foreach ( $rows as $r ) {
		$h .= '<tr><td style="border:1px solid #e3e8f3;background:#f5f7fb;width:34%;font-weight:bold">' . esc_html( $r['l'] ) . '</td><td style="border:1px solid #e3e8f3">' . nl2br( esc_html( $r['v'] ) ) . '</td></tr>';
	}
	return $h . '</table>';
}

function bisr_notify( $id, $kind, $lang, $label, $clean, $rows ) {
	$to = bisr_opt( 'notify', get_option( 'admin_email' ) );
	$hd = array( 'Content-Type: text/html; charset=UTF-8' );
	if ( ! empty( $clean['email'] ) ) {
		$hd[] = 'Reply-To: ' . str_replace( array( "\r", "\n", ',' ), '', isset( $clean['name'] ) ? $clean['name'] : '' ) . ' <' . $clean['email'] . '>';
	}
	$site = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
	$subj = ( 'request' === $kind ? 'طلب خدمة جديد' : 'رسالة اتصال جديدة' ) . ' #' . $id . ( $label ? ' — ' . $label : '' ) . ' [' . $site . ']';
	$body = '<div dir="rtl"><h2 style="font-family:Tahoma">' . esc_html( $subj ) . '</h2>' . bisr_table_html( $rows )
		. '<p style="font-family:Tahoma"><a href="' . esc_url( admin_url( 'admin.php?page=bisr&view=' . $id ) ) . '">فتح الطلب في لوحة التحكم</a> · اللغة: ' . esc_html( $lang ) . '</p></div>';
	wp_mail( $to, $subj, $body, $hd );

	if ( '1' === (string) bisr_opt( 'autoreply', '1' ) && ! empty( $clean['email'] ) ) {
		$t = array(
			'ar' => array( 'استلمنا طلبك', 'شكراً لتواصلك. استلمنا طلبك وسنراجع التفاصيل ونرد عليك قريباً. هذا ملخص ما أرسلته:' ),
			'en' => array( 'We received your request', 'Thank you for contacting us. We received your request and will review the details and reply soon. Here is a summary of what you sent:' ),
			'fr' => array( 'Nous avons reçu votre demande', 'Merci de nous avoir contactés. Nous avons bien reçu votre demande et vous répondrons rapidement. Voici le récapitulatif :' ),
		);
		$dir = 'ar' === $lang ? 'rtl' : 'ltr';
		$ab  = '<div dir="' . $dir . '" style="font-family:Tahoma,Arial,sans-serif"><h2>' . esc_html( $t[ $lang ][0] ) . ' #' . $id . '</h2><p>' . esc_html( $t[ $lang ][1] ) . '</p>' . bisr_table_html( $rows ) . '</div>';
		wp_mail( $clean['email'], $t[ $lang ][0] . ' #' . $id . ' — ' . $site, $ab, array( 'Content-Type: text/html; charset=UTF-8' ) );
	}
}
