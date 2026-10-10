<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
$o = get_option( 'bisr_settings', array() );
if ( ! empty( $o['wipe'] ) && '1' === $o['wipe'] ) {
	global $wpdb;
	$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}bisr_requests" ); // phpcs:ignore
	delete_option( 'bisr_settings' );
	delete_option( 'bisr_db_ver' );
}
