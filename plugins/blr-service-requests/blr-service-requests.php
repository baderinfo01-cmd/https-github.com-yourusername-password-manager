<?php
/**
 * Plugin Name: Baderinfo Service Requests
 * Description: نماذج طلب الخدمات والاتصال لموقع Baderinfo: حقول مخصصة لكل خدمة (عربي/إنجليزي/فرنسي)، صندوق طلبات في لوحة التحكم، إشعارات بريدية، ومعرض أعمال، مع اختصارات المتجر والمدونة.
 * Version:     1.0.0
 * Author:      Baderinfo
 * Text Domain: bisr
 * Requires PHP: 7.4
 *
 * @package bisr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BISR_VER', '1.0.0' );
define( 'BISR_DIR', plugin_dir_path( __FILE__ ) );
define( 'BISR_URL', plugin_dir_url( __FILE__ ) );

require_once BISR_DIR . 'inc/helpers.php';
require_once BISR_DIR . 'inc/shortcodes.php';
require_once BISR_DIR . 'inc/submit.php';
require_once BISR_DIR . 'inc/cpt.php';
if ( is_admin() ) {
	require_once BISR_DIR . 'inc/admin.php';
}

register_activation_hook( __FILE__, 'bisr_install' );

function bisr_install() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$t = $wpdb->prefix . 'bisr_requests';
	$c = $wpdb->get_charset_collate();
	dbDelta( "CREATE TABLE {$t} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		created datetime NOT NULL,
		kind varchar(12) NOT NULL DEFAULT 'request',
		lang varchar(5) NOT NULL DEFAULT 'ar',
		service_id varchar(190) NOT NULL DEFAULT '',
		service_label varchar(255) NOT NULL DEFAULT '',
		name varchar(190) NOT NULL DEFAULT '',
		email varchar(190) NOT NULL DEFAULT '',
		phone varchar(60) NOT NULL DEFAULT '',
		status varchar(16) NOT NULL DEFAULT 'new',
		data longtext NULL,
		page_url varchar(255) NOT NULL DEFAULT '',
		ip_hash varchar(64) NOT NULL DEFAULT '',
		note text NULL,
		PRIMARY KEY  (id),
		KEY status (status),
		KEY kind (kind),
		KEY created (created)
	) {$c};" );
	bisr_register_cpt();
	flush_rewrite_rules();
	update_option( 'bisr_db_ver', BISR_VER );
}

// ترقية الجدول عند تحديث الإضافة دون إعادة تفعيل.
add_action( 'plugins_loaded', function () {
	if ( get_option( 'bisr_db_ver' ) !== BISR_VER ) {
		bisr_install();
	}
} );
