<?php
/**
 * قائمة التنقّل — fallback نظيف عند عدم تعيين قائمة.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * عرض القائمة الرئيسية مع fallback.
 */
function baderlr_primary_menu() {
	if ( has_nav_menu( 'primary' ) ) {
		wp_nav_menu( array(
			'theme_location' => 'primary',
			'container'      => false,
			'menu_class'     => 'blr-menu',
			'depth'          => 2,
			'fallback_cb'    => false,
		) );
	} else {
		echo '<ul class="blr-menu"><li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'الرئيسية', 'blr-shop-pro' ) . '</a></li>';
		wp_list_pages( array( 'title_li' => '', 'number' => 4, 'depth' => 1 ) );
		echo '</ul>';
	}
}

/**
 * قائمة التذييل.
 */
function baderlr_footer_menu() {
	if ( has_nav_menu( 'footer' ) ) {
		wp_nav_menu( array(
			'theme_location' => 'footer',
			'container'      => false,
			'menu_class'     => 'blr-footer-menu',
			'depth'          => 1,
			'fallback_cb'    => false,
		) );
	}
}
