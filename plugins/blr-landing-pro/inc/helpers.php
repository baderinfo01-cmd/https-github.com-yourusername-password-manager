<?php
/**
 * أدوات مساعدة: الإعدادات، الألوان، الأيقونات، التنظيف.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** نسخة الأصل: وقت تعديل الملف لتجاوز كاش المتصفح بعد كل تحديث. */
function blrlp_ver( $rel ) {
	$f = BLRLP_DIR . ltrim( $rel, '/' );
	return BLRLP_VERSION . '.' . ( is_readable( $f ) ? filemtime( $f ) : '0' );
}

function blrlp_opt( $key, $default = '' ) {
	$o = get_option( 'blrlp_settings', array() );
	return ( is_array( $o ) && isset( $o[ $key ] ) && '' !== $o[ $key ] ) ? $o[ $key ] : $default;
}

/** ألوان جاهزة مبنية على أنماط BaderLR: Aurora / Onyx / Verdant. */
function blrlp_palettes() {
	return array(
		'aurora'  => array(
			'label' => 'Aurora',
			'dark'  => false,
			'v'     => array( 'primary' => '#2F5BFF', 'primary2' => '#22C3F0', 'on' => '#ffffff', 'bg' => '#ffffff', 'bg2' => '#F4F7FD', 'card' => '#ffffff', 'ink' => '#0B1220', 'body' => '#39465C', 'muted' => '#6B7A92', 'line' => '#E3E9F4' ),
		),
		'onyx'    => array(
			'label' => 'Onyx',
			'dark'  => true,
			'v'     => array( 'primary' => '#E8B457', 'primary2' => '#F4D08A', 'on' => '#1A1206', 'bg' => '#0C0B09', 'bg2' => '#131210', 'card' => '#16140F', 'ink' => '#F4EFE6', 'body' => '#CFC6B5', 'muted' => '#9A917E', 'line' => '#2A271F' ),
		),
		'verdant' => array(
			'label' => 'Verdant',
			'dark'  => false,
			'v'     => array( 'primary' => '#0E9F6E', 'primary2' => '#3DD9A0', 'on' => '#ffffff', 'bg' => '#ffffff', 'bg2' => '#ECFBF4', 'card' => '#ffffff', 'ink' => '#08201A', 'body' => '#3B5A4E', 'muted' => '#6B8B7E', 'line' => '#D5EFE3' ),
		),
	);
}

/** أيقونات SVG (شبكة 24). */
function blrlp_icons() {
	return array(
		'bolt'     => '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
		'shield'   => '<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
		'spark'    => '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
		'check'    => '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
		'star'     => '<path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.5l1.1-6L3.4 9.3l6-.8z"/>',
		'heart'    => '<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>',
		'cart'     => '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.4 12h11l1.6-8H6"/>',
		'globe'    => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
		'layers'   => '<path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5"/>',
		'rocket'   => '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5zM9 9H5l-2 3 4 1M15 15v4l-3 2-1-4"/>',
		'clock'    => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'users'    => '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.4.6 4 2.4 4 5"/>',
		'chart'    => '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
		'lock'     => '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
		'gift'     => '<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9M12 8c-2-4-6-3-5 0 .5 1.5 3 1 5 0zm0 0c2-4 6-3 5 0-.5 1.5-3 1-5 0z"/>',
		'phone'    => '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
		'mail'     => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
		'play'     => '<path d="M7 4v16l13-8z"/>',
		'download' => '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>',
		'repeat'   => '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
		'truck'    => '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
		'award'    => '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
		'target'   => '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
		'code'     => '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
		'headset'  => '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.5-2 2-5 2"/>',
		'arrow'    => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'whatsapp' => '<path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .7a4 4 0 0 1-2-2l.7-1-1-2z"/>',
	);
}

function blrlp_icon( $name, $size = 24 ) {
	$i = blrlp_icons();
	if ( ! isset( $i[ $name ] ) ) {
		$name = 'check';
	}
	return '<svg width="' . (int) $size . '" height="' . (int) $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $i[ $name ] . '</svg>'; // phpcs:ignore
}

/** رابط آمن: يسمح بـ # و tel: و mailto: و http(s). */
function blrlp_url( $u ) {
	$u = trim( (string) $u );
	if ( '' === $u ) {
		return '';
	}
	if ( '#' === $u[0] ) {
		return '#' . preg_replace( '/[^A-Za-z0-9_\-]/', '', substr( $u, 1 ) );
	}
	return esc_url_raw( $u, array( 'http', 'https', 'tel', 'mailto' ) );
}

function blrlp_uid() {
	return 's' . substr( md5( uniqid( '', true ) ), 0, 8 );
}

function blrlp_is_bot() {
	$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) ) : '';
	return '' === $ua || (bool) preg_match( '/bot|crawl|spider|slurp|facebookexternalhit|preview|headless|monitor/', $ua );
}

function blrlp_client_ip_hash() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '0';
	return substr( hash( 'sha256', $ip . wp_salt( 'auth' ) ), 0, 16 );
}
