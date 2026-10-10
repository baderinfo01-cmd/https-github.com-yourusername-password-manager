<?php
/**
 * Theme setup & helpers.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'after_setup_theme', 'blr_setup' );
function blr_setup() {
	load_theme_textdomain( 'blr-shop-pro', BLR_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_nav_menus(
		array(
			'primary' => __( 'القائمة الرئيسية', 'blr-shop-pro' ),
			'footer'  => __( 'قائمة التذييل', 'blr-shop-pro' ),
		)
	);

	add_image_size( 'blr-card', 600, 600, true );
	add_image_size( 'blr-hero', 1920, 800, true );
	add_image_size( 'blr-hero-mobile', 800, 1000, true );
}

add_action( 'widgets_init', 'blr_widgets' );
function blr_widgets() {
	$args = array(
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
	);
	register_sidebar( array_merge( $args, array( 'name' => __( 'الشريط الجانبي للمتجر', 'blr-shop-pro' ), 'id' => 'shop-sidebar' ) ) );
	register_sidebar( array_merge( $args, array( 'name' => __( 'الشريط الجانبي للمدونة', 'blr-shop-pro' ), 'id' => 'blog-sidebar' ) ) );
	for ( $i = 1; $i <= 4; $i++ ) {
		register_sidebar(
			array_merge(
				$args,
				array(
					/* translators: %d: column number */
					'name' => sprintf( __( 'التذييل — عمود %d', 'blr-shop-pro' ), $i ),
					'id'   => 'footer-' . $i,
				)
			)
		);
	}
}

/**
 * Read a value from the main settings option.
 */
function blr_opt( $key, $default = '' ) {
	static $opts = null;
	if ( null === $opts ) {
		$opts = get_option( 'blr_settings', array() );
		$opts = is_array( $opts ) ? $opts : array();
	}
	return isset( $opts[ $key ] ) && '' !== $opts[ $key ] ? $opts[ $key ] : $default;
}

function blr_is_woo() {
	return class_exists( 'WooCommerce' );
}

/**
 * Inline SVG icons (stroke icons, 24px grid).
 */
function blr_icon( $name, $size = 22 ) {
	$paths = array(
		'search'   => '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
		'cart'     => '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6"/>',
		'user'     => '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
		'heart'    => '<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>',
		'moon'     => '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
		'sun'      => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		'menu'     => '<path d="M3 6h18M3 12h18M3 18h18"/>',
		'close'    => '<path d="M5 5l14 14M19 5 5 19"/>',
		'whatsapp' => '<path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .7a4 4 0 0 1-2-2l.7-1-1-2z"/>',
		'bolt'     => '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
		'shield'   => '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
		'truck'    => '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
		'refresh'  => '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
		'star'     => '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
		'compare'  => '<path d="M8 3 4 7l4 4M4 7h12M16 21l4-4-4-4M20 17H8"/>',
		'eye'      => '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
		'bot'      => '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M2 14h2M20 14h2"/>',
		'send'     => '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
		'download' => '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>',
		'repeat'   => '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
		'check'    => '<path d="m5 12 5 5L20 7"/>',
		'arrow'    => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'sparkle'  => '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return sprintf(
		'<svg class="blr-i blr-i-%1$s" width="%2$d" height="%2$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%3$s</svg>',
		esc_attr( $name ),
		(int) $size,
		$paths[ $name ] // phpcs:ignore WordPress.Security.EscapeOutput
	);
}

/**
 * Body classes.
 */
add_filter( 'body_class', 'blr_body_class' );
function blr_body_class( $classes ) {
	$classes[] = 'blr-shop-pro';
	$classes[] = 'blr-header-' . get_theme_mod( 'blr_header_style', 'classic' );
	if ( get_theme_mod( 'blr_sticky_header', true ) ) {
		$classes[] = 'blr-sticky-header';
	}
	return $classes;
}

/**
 * Light clean-up for speed.
 */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_generator' );

add_filter( 'excerpt_length', function () {
	return 28;
} );
add_filter( 'excerpt_more', function () {
	return '…';
} );

/**
 * Basic Organization schema + Open Graph fallbacks.
 */
add_action( 'wp_head', 'blr_schema', 5 );
function blr_schema() {
	if ( ! is_front_page() ) {
		return;
	}
	$data = array(
		'@context' => 'https://schema.org',
		'@type'    => 'Organization',
		'name'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
	);
	if ( has_custom_logo() ) {
		$data['logo'] = wp_get_attachment_image_url( get_theme_mod( 'custom_logo' ), 'full' );
	}
	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
}

/**
 * Pagination helper.
 */
function blr_pagination() {
	the_posts_pagination(
		array(
			'mid_size'  => 1,
			'prev_text' => '‹',
			'next_text' => '›',
		)
	);
}

/**
 * Fallback menu.
 */
function blr_fallback_menu() {
	echo '<ul class="blr-menu"><li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'الرئيسية', 'blr-shop-pro' ) . '</a></li>';
	if ( blr_is_woo() ) {
		echo '<li><a href="' . esc_url( wc_get_page_permalink( 'shop' ) ) . '">' . esc_html__( 'المتجر', 'blr-shop-pro' ) . '</a></li>';
	}
	echo '</ul>';
}
