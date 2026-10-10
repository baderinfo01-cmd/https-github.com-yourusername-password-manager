<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bisr_register_cpt() {
	register_post_type( 'bi_work', array(
		'labels'       => array( 'name' => 'أعمالنا', 'singular_name' => 'عمل', 'add_new' => 'إضافة عمل', 'add_new_item' => 'إضافة عمل جديد', 'edit_item' => 'تعديل العمل', 'menu_name' => 'أعمالنا' ),
		'public'       => false,
		'show_ui'      => true,
		'menu_icon'    => 'dashicons-portfolio',
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'show_in_rest' => true,
	) );
}
add_action( 'init', 'bisr_register_cpt' );

add_action( 'add_meta_boxes', function () {
	add_meta_box( 'bisr_work', 'رابط العمل', function ( $post ) {
		wp_nonce_field( 'bisr_work', 'bisr_work_n' );
		printf( '<p><input type="url" name="bi_url" value="%s" style="width:100%%" dir="ltr" placeholder="https://"></p><p class="description">اختياري: رابط الموقع أو المشروع المنجز. الصورة البارزة = صورة العمل.</p>', esc_attr( get_post_meta( $post->ID, 'bi_url', true ) ) );
	}, 'bi_work', 'side' );
} );

add_action( 'save_post_bi_work', function ( $id ) {
	if ( ! isset( $_POST['bisr_work_n'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['bisr_work_n'] ) ), 'bisr_work' ) || ! current_user_can( 'edit_post', $id ) ) {
		return;
	}
	update_post_meta( $id, 'bi_url', isset( $_POST['bi_url'] ) ? esc_url_raw( wp_unslash( $_POST['bi_url'] ) ) : '' );
} );
