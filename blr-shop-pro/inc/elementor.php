<?php
/**
 * توافق Elementor: مواقع Theme Builder (رأس/تذييل/مفرد/أرشيف) + نمط الخط والألوان.
 * يعمل مع Elementor المجاني ومع Elementor Pro المرخّص الذي تشتريه أنت.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_has_elementor() {
	return did_action( 'elementor/loaded' ) || defined( 'ELEMENTOR_VERSION' );
}

/**
 * تنفيذ موقع Theme Builder. يرجع true إذا عرض Elementor المحتوى فعلاً.
 */
function baderlr_el_location( $location ) {
	return function_exists( 'elementor_theme_do_location' ) && elementor_theme_do_location( $location );
}

add_action( 'elementor/theme/register_locations', function ( $manager ) {
	$manager->register_all_core_location();
} );

add_action( 'after_setup_theme', function () {
	add_theme_support( 'elementor-default-kit' );
}, 20 );

/** ضبط الخط الافتراضي للمصيري في Elementor + إلغاء قيود العرض الافتراضية. */
add_action( 'wp_head', function () {
	if ( ! baderlr_has_elementor() ) {
		return;
	}
	echo '<style id="baderlr-elementor">:root{--e-global-typography-primary-font-family:"El Messiri";--e-global-typography-secondary-font-family:"El Messiri";--e-global-typography-text-font-family:"El Messiri";--e-global-typography-accent-font-family:"El Messiri"}.elementor-widget-container,.elementor-widget-heading .elementor-heading-title,.elementor-button{font-family:var(--font,"El Messiri",sans-serif)}.elementor-page .blr-main>.blr-section{padding:0}</style>' . "\n";
}, 20 );

/** خط المصيري ضمن خطوط محرّر Elementor. */
add_filter( 'elementor/fonts/additional_fonts', function ( $fonts ) {
	$fonts['El Messiri'] = 'googlefonts';
	return $fonts;
} );

/** تحميل خط المصيري داخل المحرّر. */
add_action( 'elementor/editor/after_enqueue_styles', function () {
	wp_enqueue_style( 'baderlr-fonts', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null );
} );

/** تنبيه إداري لطيف إن لم يكن Elementor مثبتاً. */
add_action( 'admin_notices', function () {
	if ( baderlr_has_elementor() || ! current_user_can( 'install_plugins' ) || get_user_meta( get_current_user_id(), 'baderlr_el_dismiss', true ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->id, array( 'dashboard', 'themes', 'plugins' ), true ) ) {
		return;
	}
	$url = wp_nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=elementor' ), 'install-plugin_elementor' );
	echo '<div class="notice notice-info"><p><strong>BLR Shop Pro:</strong> ' . esc_html__( 'القالب متوافق كلياً مع Elementor. ثبّت Elementor لبناء الصفحات بالسحب والإفلات.', 'blr-shop-pro' ) . ' <a href="' . esc_url( $url ) . '">' . esc_html__( 'تثبيت Elementor', 'blr-shop-pro' ) . '</a></p></div>';
} );
