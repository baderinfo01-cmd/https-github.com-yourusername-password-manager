<?php
/**
 * Plugin Name: BaderLR Companion
 * Plugin URI: https://baderinfo.com/baderlr-wp
 * Description: الإضافة الرفيقة لقالب BaderLR WP — مولّد محتوى ومواقع بالذكاء الاصطناعي (OpenAI / Anthropic / مزوّد مخصّص)، واستيراد مواقع جاهزة بنقرة.
 * Version: 2.0.0
 * Author: baderinfo
 * Author URI: https://baderinfo.com
 * Text Domain: baderlr-companion
 * Requires PHP: 7.4
 * Requires at least: 6.2
 *
 * @package baderlr-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BADERLR_COMPANION_VERSION', '2.0.0' );
define( 'BADERLR_COMPANION_DIR', trailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'BADERLR_COMPANION_URI', trailingslashit( plugin_dir_url( __FILE__ ) ) );

require_once BADERLR_COMPANION_DIR . 'inc/admin.php';
require_once BADERLR_COMPANION_DIR . 'inc/ai.php';
require_once BADERLR_COMPANION_DIR . 'inc/ai-extras.php';
require_once BADERLR_COMPANION_DIR . 'inc/starter-sites.php';

add_action( 'plugins_loaded', function () {
	load_plugin_textdomain( 'baderlr-companion', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
} );

/**
 * تنبيه إذا لم يكن قالب BaderLR WP مفعّلاً.
 */
add_action( 'admin_notices', function () {
	$theme = wp_get_theme();
	$ok    = defined( 'BADERLR_VERSION' ) || 'BaderLR WP' === $theme->get( 'Name' ) || 'baderlr-wp' === $theme->get_template();
	if ( ! $ok && current_user_can( 'activate_plugins' ) ) {
		echo '<div class="notice notice-warning"><p><strong>BaderLR Companion:</strong> ' . esc_html__( 'هذه الإضافة مصمّمة لقالب BaderLR WP. فعّل القالب للاستفادة الكاملة.', 'baderlr-companion' ) . '</p></div>';
	}
} );
