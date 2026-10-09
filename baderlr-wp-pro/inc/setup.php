<?php
/**
 * إعداد القالب: الدعم، القوائم، أحجام الصور، الترجمة.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_setup() {
	load_theme_textdomain( 'baderlr-wp', BADERLR_DIR . 'languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support( 'custom-logo', array( 'height' => 48, 'width' => 180, 'flex-height' => true, 'flex-width' => true ) );
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_nav_menus( array(
		'primary' => __( 'القائمة الرئيسية', 'baderlr-wp' ),
		'footer'  => __( 'قائمة التذييل', 'baderlr-wp' ),
	) );

	add_image_size( 'baderlr-card', 720, 450, true );
	add_image_size( 'baderlr-wide', 1280, 640, true );
}
add_action( 'after_setup_theme', 'baderlr_setup' );

function baderlr_content_width() {
	$GLOBALS['content_width'] = 1120;
}
add_action( 'after_setup_theme', 'baderlr_content_width', 0 );

/**
 * فتح/إغلاق غلاف المحتوى (يُستعمل في القوالب وفي WooCommerce).
 */
function baderlr_content_open() {
	echo '<div class="blr-container"><div class="blr-content-wrap">';
}
function baderlr_content_close() {
	echo '</div></div>';
}
