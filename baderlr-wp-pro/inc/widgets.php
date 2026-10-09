<?php
/**
 * مناطق الودجت: الشريط الجانبي + أربعة أعمدة تذييل.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_widgets() {
	register_sidebar( array(
		'name'          => __( 'الشريط الجانبي', 'baderlr-wp' ),
		'id'            => 'sidebar-1',
		'description'   => __( 'يظهر في المقالات والصفحات ذات الشريط الجانبي.', 'baderlr-wp' ),
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
	) );

	for ( $i = 1; $i <= 4; $i++ ) {
		register_sidebar( array(
			/* translators: %d: footer column number */
			'name'          => sprintf( __( 'تذييل %d', 'baderlr-wp' ), $i ),
			'id'            => 'footer-' . $i,
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		) );
	}
}
add_action( 'widgets_init', 'baderlr_widgets' );
