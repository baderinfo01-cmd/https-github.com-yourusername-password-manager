<?php
/**
 * BLR Shop Pro — functions.php
 *
 * قالب متجر احترافي مدفوع (BLR Shop Pro) مبني على نظام BaderLR، مُعزَّز بالذكاء الاصطناعي عبر إضافة BLR Shop Companion،
 * ومحمي بترخيص Ed25519 مرتبط بالدومين (سيرفر BaderThemesLicense).
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BADERLR_VERSION', '1.0.0' );
define( 'BADERLR_DIR', trailingslashit( get_template_directory() ) );
define( 'BADERLR_URI', trailingslashit( get_template_directory_uri() ) );

/* =====================================================================
 * إعدادات الترخيص — عدّلها لتطابق سيرفرك BaderThemesLicense.
 *   LICENSE_SERVER : رابط مجلّد السيرفر (حيث يوجد api.php).
 *   LICENSE_PUBKEY : المفتاح العام من «الإعدادات ← مفتاح التوقيع» في لوحة السيرفر.
 *   PRODUCT        : معرّف المنتج في لوحة السيرفر.
 * ===================================================================== */
if ( ! defined( 'BADERLR_LICENSE_SERVER' ) ) {
	define( 'BADERLR_LICENSE_SERVER', 'https://baderinfo.com/themes-license/' );
}
if ( ! defined( 'BADERLR_LICENSE_PUBKEY' ) ) {
	define( 'BADERLR_LICENSE_PUBKEY', 'ضع-هنا-المفتاح-العام-من-لوحة-السيرفر' );
}
if ( ! defined( 'BADERLR_PRODUCT' ) ) {
	define( 'BADERLR_PRODUCT', 'blr-wp' );
}

/* =====================================================================
 * تحميل الوحدات.
 * ===================================================================== */
$baderlr_modules = array(
	'inc/setup.php',
	'inc/enqueue.php',
	'inc/template-tags.php',
	'inc/nav-walker.php',
	'inc/widgets.php',
	'inc/customizer.php',
	'inc/customizer-css.php',
	'inc/shortcodes.php',
	'inc/cpt.php',
	'inc/block-patterns.php',
	'inc/seo.php',
	'inc/license.php',
	'inc/onboarding.php',
	'inc/elementor.php',
	'inc/ai-bridge.php',
	'inc/shop-woo.php',  // ووكومرس: رقمي/مادي/اشتراك/خدمة + تجربة الشراء.
	'inc/shop-extras.php', // بحث مباشر، واتساب، نشرة بريدية، شورتكودات.
	'inc/landing.php',   // صفحات الهبوط الإعلانية.
);
foreach ( $baderlr_modules as $baderlr_m ) {
	$baderlr_p = BADERLR_DIR . $baderlr_m;
	if ( is_readable( $baderlr_p ) ) {
		require_once $baderlr_p;
	}
}
unset( $baderlr_m, $baderlr_p, $baderlr_modules );

/**
 * هل إضافة BLR Shop Companion (الذكاء الاصطناعي + استيراد المواقع) مفعّلة؟
 */
function baderlr_has_companion() {
	return defined( 'BADERLR_COMPANION_VERSION' );
}

/**
 * متغيّرات الجسم: النمط (Aurora/Onyx/Verdant) + الوضع الليلي الافتراضي.
 */
add_filter( 'body_class', function ( $classes ) {
	$variant = get_theme_mod( 'baderlr_variant', 'aurora' );
	if ( 'onyx' === $variant ) {
		$classes[] = 'blr-v-onyx';
	} elseif ( 'verdant' === $variant ) {
		$classes[] = 'blr-v-verdant';
	}
	if ( get_theme_mod( 'baderlr_dark_default', false ) ) {
		$classes[] = 'blr-dark';
	}
	return $classes;
} );
