<?php
/**
 * عند حذف الإضافة: تُمسح البيانات فقط إن فعّل المستخدم الخيار.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
$o = get_option( 'blrlp_settings', array() );
if ( ! is_array( $o ) || empty( $o['wipe'] ) || '1' !== $o['wipe'] ) {
	return;
}
global $wpdb;
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}blrlp_leads, {$wpdb->prefix}blrlp_stats" ); // phpcs:ignore WordPress.DB
foreach ( get_posts( array( 'post_type' => 'blr_landing', 'numberposts' => -1, 'post_status' => 'any', 'fields' => 'ids' ) ) as $id ) {
	wp_delete_post( $id, true );
}
foreach ( array( 'blrlp_settings', 'blrlp_license', 'blrlp_license_cfg', 'blrlp_instance', 'blrlp_db_version', 'blrlp_flush' ) as $opt ) {
	delete_option( $opt );
}
