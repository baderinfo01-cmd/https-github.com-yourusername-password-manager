<?php
/**
 * إخراج CSS من المخصّص (اللون الأساسي والثانوي).
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_inline_css() {
	$accent  = get_theme_mod( 'baderlr_accent', '' );
	$accent2 = get_theme_mod( 'baderlr_accent2', '' );
	if ( ! $accent && ! $accent2 ) {
		return;
	}
	$css = ':root{';
	if ( $accent ) {
		$css .= '--accent:' . esc_attr( $accent ) . ';--accent-d:' . esc_attr( $accent ) . ';';
	}
	if ( $accent && $accent2 ) {
		$css .= '--grad:linear-gradient(135deg,' . esc_attr( $accent2 ) . ' 0%,' . esc_attr( $accent ) . ' 100%);';
		$css .= '--accent-2:' . esc_attr( $accent2 ) . ';';
	}
	$css .= '}';
	wp_add_inline_style( 'baderlr-style', $css );
}
add_action( 'wp_enqueue_scripts', 'baderlr_inline_css', 20 );
