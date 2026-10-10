<?php
/**
 * Plugin Name: BLR Landing Pro
 * Plugin URI: https://baderinfo.com/blr-landing-pro
 * Description: منشئ صفحات هبوط احترافي لأي موقع ووردبريس: بنّاء أقسام مع معاينة حيّة، مولّد صفحات وكتابة بالذكاء الاصطناعي، نماذج عملاء محتملين، اختبار A/B، إحصاءات، قوالب جاهزة، تكامل ووكومرس، وترخيص مرتبط بالدومين.
 * Version: 1.0.1
 * Author: baderinfo
 * Author URI: https://baderinfo.com
 * Text Domain: blr-landing-pro
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * License: Proprietary — sold with a per-domain license.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( defined( 'BLRLP_VERSION' ) ) {
	return; // نسخة أخرى محمّلة.
}

define( 'BLRLP_VERSION', '1.0.1' );
define( 'BLRLP_FILE', __FILE__ );
define( 'BLRLP_DIR', trailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'BLRLP_URL', trailingslashit( plugin_dir_url( __FILE__ ) ) );

/* إعدادات سيرفر الترخيص — داخلية، لا تظهر في لوحة التحكم. */
if ( ! defined( 'BLRLP_LICENSE_SERVER' ) ) {
	define( 'BLRLP_LICENSE_SERVER', 'https://baderinfo.com/themes-license/' );
}
if ( ! defined( 'BLRLP_LICENSE_PUBKEY' ) ) {
	define( 'BLRLP_LICENSE_PUBKEY', '8e6G9g431dSU5rcykYca6b+7AfZcFcDpCr/+hrkj61I=' );
}
if ( ! defined( 'BLRLP_BUY_URL' ) ) {
	define( 'BLRLP_BUY_URL', 'https://baderinfo.com/blr-landing-pro' );
}
if ( ! defined( 'BLRLP_PRODUCT' ) ) {
	define( 'BLRLP_PRODUCT', 'blr-landing-pro' );
}

foreach ( array( 'helpers', 'license', 'sections', 'render', 'cpt', 'templates-lib', 'ai', 'leads', 'analytics', 'admin' ) as $blrlp_m ) {
	require_once BLRLP_DIR . 'inc/' . $blrlp_m . '.php';
}
unset( $blrlp_m );

register_activation_hook( __FILE__, 'blrlp_activate' );
function blrlp_activate() {
	blrlp_install_tables();
	blrlp_register_cpt();
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

add_action( 'plugins_loaded', function () {
	load_plugin_textdomain( 'blr-landing-pro', false, dirname( plugin_basename( BLRLP_FILE ) ) . '/languages' );
	// ترقية الجداول عند تغيّر الإصدار.
	if ( get_option( 'blrlp_db_version' ) !== BLRLP_VERSION ) {
		blrlp_install_tables();
		update_option( 'blrlp_db_version', BLRLP_VERSION );
	}
} );
