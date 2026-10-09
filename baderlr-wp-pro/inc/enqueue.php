<?php
/**
 * تحميل الأنماط والسكربتات والخطوط.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_assets() {
	$v = BADERLR_VERSION;

	// Google Fonts (El Messiri) — preconnect for speed.
	wp_enqueue_style( 'baderlr-fonts', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null );

	wp_enqueue_style( 'baderlr-style', get_stylesheet_uri(), array( 'baderlr-fonts' ), $v );

	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'baderlr-woo', BADERLR_URI . 'assets/css/woocommerce.css', array( 'baderlr-style' ), $v );
	}

	wp_enqueue_script( 'baderlr-theme', BADERLR_URI . 'assets/js/theme.js', array(), $v, true );
	wp_localize_script( 'baderlr-theme', 'BaderLR', array(
		'rtl'       => is_rtl(),
		'darkLabel' => __( 'الوضع الليلي', 'baderlr-wp' ),
	) );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'baderlr_assets' );

/**
 * preconnect لخطوط جوجل (أداء).
 */
add_filter( 'wp_resource_hints', function ( $hints, $relation ) {
	if ( 'preconnect' === $relation ) {
		$hints[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' );
	}
	return $hints;
}, 10, 2 );

/**
 * أنماط المحرّر (لوحة التحكم) تتبع نفس الخطوط والألوان.
 */
add_action( 'enqueue_block_editor_assets', function () {
	wp_enqueue_style( 'baderlr-fonts', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null );
} );
