<?php
/**
 * Plugin Name: BLR Shop Companion
 * Plugin URI: https://baderinfo.com/blr-shop-pro
 * Description: الإضافة الرفيقة لقالب BLR Shop Pro — كاتب منتجات ومساعد تسوق ومنشئ صفحات هبوط ومولّد محتوى بالذكاء الاصطناعي (OpenAI / Anthropic / مخصّص)، واستيراد مواقع جاهزة.
 * Version: 1.0.0
 * Author: baderinfo
 * Author URI: https://baderinfo.com
 * Text Domain: blr-shop-companion
 * Requires PHP: 7.4
 * Requires at least: 6.2
 *
 * @package blr-shop-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * تعارض مع إضافة BaderLR Companion القديمة (نفس الدوال والثوابت) — سبب الخطأ الفادح عند تفعيل الاثنتين.
 * نتوقّف هنا ونعطّل القديمة تلقائياً من لوحة التحكم؛ بعد إعادة تحميل الصفحة تعمل هذه الإضافة وحدها.
 */
if ( defined( 'BADERLR_COMPANION_VERSION' ) || function_exists( 'baderlr_c_menu' ) ) {
	add_action( 'admin_init', function () {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		foreach ( (array) get_option( 'active_plugins', array() ) as $plugin ) {
			if ( false !== strpos( $plugin, 'baderlr-companion' ) ) {
				deactivate_plugins( $plugin );
			}
		}
	} );
	add_action( 'admin_notices', function () {
		echo '<div class="notice notice-warning"><p><strong>BLR Shop Companion:</strong> ' . esc_html__( 'وُجدت إضافة BaderLR Companion القديمة وتم تعطيلها لأنها تتعارض مع هذه الإضافة. أعد تحميل الصفحة.', 'blr-shop-companion' ) . '</p></div>';
	} );
	return;
}

define( 'BADERLR_COMPANION_VERSION', '1.0.0' );
define( 'BADERLR_COMPANION_DIR', trailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'BADERLR_COMPANION_URI', trailingslashit( plugin_dir_url( __FILE__ ) ) );

require_once BADERLR_COMPANION_DIR . 'inc/admin.php';
require_once BADERLR_COMPANION_DIR . 'inc/ai.php';
require_once BADERLR_COMPANION_DIR . 'inc/ai-extras.php';
require_once BADERLR_COMPANION_DIR . 'inc/starter-sites.php';
require_once BADERLR_COMPANION_DIR . 'inc/shop-ai.php';

add_action( 'plugins_loaded', function () {
	load_plugin_textdomain( 'blr-shop-companion', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
} );

/**
 * تنبيه إذا لم يكن قالب BLR Shop Pro مفعّلاً.
 */
add_action( 'admin_notices', function () {
	$theme = wp_get_theme();
	$ok    = defined( 'BADERLR_VERSION' ) || 'BLR Shop Pro' === $theme->get( 'Name' ) || 'blr-shop-pro' === $theme->get_template();
	if ( ! $ok && current_user_can( 'activate_plugins' ) ) {
		echo '<div class="notice notice-warning"><p><strong>BLR Shop Companion:</strong> ' . esc_html__( 'هذه الإضافة مصمّمة لقالب BLR Shop Pro. فعّل القالب للاستفادة الكاملة.', 'blr-shop-companion' ) . '</p></div>';
	}
} );
