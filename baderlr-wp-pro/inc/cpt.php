<?php
/**
 * أنواع محتوى احترافية: خدمات، أعمال، فريق، آراء العملاء.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_register_cpt() {
	$types = array(
		'blr_service'  => array( 'dashicons-screenoptions', __( 'الخدمات', 'baderlr-wp' ), __( 'خدمة', 'baderlr-wp' ), 'services' ),
		'blr_project'  => array( 'dashicons-portfolio', __( 'الأعمال', 'baderlr-wp' ), __( 'عمل', 'baderlr-wp' ), 'projects' ),
		'blr_member'   => array( 'dashicons-groups', __( 'الفريق', 'baderlr-wp' ), __( 'عضو', 'baderlr-wp' ), 'team' ),
		'blr_review'   => array( 'dashicons-format-quote', __( 'آراء العملاء', 'baderlr-wp' ), __( 'رأي', 'baderlr-wp' ), 'reviews' ),
	);
	foreach ( $types as $slug => $t ) {
		register_post_type( $slug, array(
			'labels'       => array(
				'name'          => $t[1],
				'singular_name' => $t[2],
				/* translators: %s: singular post-type name */
				'add_new_item'  => sprintf( __( 'إضافة %s', 'baderlr-wp' ), $t[2] ),
			),
			'public'       => true,
			'has_archive'  => true,
			'menu_icon'    => $t[0],
			'rewrite'      => array( 'slug' => $t[3] ),
			'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'page-attributes' ),
			'show_in_rest' => true,
		) );
	}
}
add_action( 'init', 'baderlr_register_cpt' );
