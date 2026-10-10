<?php
/**
 * BLR Shop Pro — functions.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BLR_VERSION', '1.0.0' );
define( 'BLR_DIR', get_template_directory() );
define( 'BLR_URI', get_template_directory_uri() );

$blr_modules = array(
	'setup',          // دعم القالب، القوائم، الودجات، أدوات مساعدة.
	'enqueue',        // الأنماط والسكربتات.
	'customizer',     // خيارات التخصيص.
	'admin-settings', // صفحة إعدادات BLR Shop Pro.
	'license',        // نظام الترخيص والتحديثات.
	'ai',             // الذكاء الاصطناعي: وصف المنتجات + مساعد التسوق.
	'landing',        // منشئ صفحات الهبوط الإعلانية.
	'features',       // بحث مباشر، وضع ليلي، واتساب، شورتكودات.
	'woocommerce',    // تكامل ووكومرس: رقمي/مادي/اشتراكات.
);

foreach ( $blr_modules as $blr_module ) {
	require_once BLR_DIR . '/inc/' . $blr_module . '.php';
}
