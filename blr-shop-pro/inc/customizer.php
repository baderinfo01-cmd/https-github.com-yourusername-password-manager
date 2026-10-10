<?php
/**
 * المخصّص (Customizer): الأنماط، الألوان، الشريط العلوي، التواصل، الرأس والتذييل.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_customize( $wp ) {

	/* ===== قسم: الهوية والنمط ===== */
	$wp->add_section( 'baderlr_style', array(
		'title'    => __( 'BLR Shop — النمط والألوان', 'blr-shop-pro' ),
		'priority' => 25,
	) );

	$wp->add_setting( 'baderlr_variant', array( 'default' => 'aurora', 'sanitize_callback' => 'baderlr_sanitize_variant' ) );
	$wp->add_control( 'baderlr_variant', array(
		'label'   => __( 'نمط التصميم', 'blr-shop-pro' ),
		'section' => 'baderlr_style',
		'type'    => 'select',
		'choices' => array(
			'aurora'  => __( 'Aurora — أزرق فاتح (الافتراضي)', 'blr-shop-pro' ),
			'onyx'    => __( 'Onyx — داكن فخم + ذهبي', 'blr-shop-pro' ),
			'verdant' => __( 'Verdant — أخضر زمردي', 'blr-shop-pro' ),
		),
	) );

	$wp->add_setting( 'baderlr_accent', array( 'default' => '', 'sanitize_callback' => 'sanitize_hex_color' ) );
	$wp->add_control( new WP_Customize_Color_Control( $wp, 'baderlr_accent', array(
		'label'       => __( 'اللون الأساسي (يتجاوز النمط)', 'blr-shop-pro' ),
		'description' => __( 'اتركه فارغاً لاستعمال لون النمط.', 'blr-shop-pro' ),
		'section'     => 'baderlr_style',
	) ) );

	$wp->add_setting( 'baderlr_accent2', array( 'default' => '', 'sanitize_callback' => 'sanitize_hex_color' ) );
	$wp->add_control( new WP_Customize_Color_Control( $wp, 'baderlr_accent2', array(
		'label'   => __( 'اللون الثانوي (التدرّج)', 'blr-shop-pro' ),
		'section' => 'baderlr_style',
	) ) );

	$wp->add_setting( 'baderlr_dark_default', array( 'default' => false, 'sanitize_callback' => 'baderlr_sanitize_bool' ) );
	$wp->add_control( 'baderlr_dark_default', array(
		'label'   => __( 'تشغيل الوضع الليلي افتراضياً', 'blr-shop-pro' ),
		'section' => 'baderlr_style',
		'type'    => 'checkbox',
	) );

	$wp->add_setting( 'baderlr_dark_toggle', array( 'default' => true, 'sanitize_callback' => 'baderlr_sanitize_bool' ) );
	$wp->add_control( 'baderlr_dark_toggle', array(
		'label'   => __( 'إظهار زر تبديل الوضع الليلي للزوّار', 'blr-shop-pro' ),
		'section' => 'baderlr_style',
		'type'    => 'checkbox',
	) );

	/* ===== قسم: الشريط العلوي ===== */
	$wp->add_section( 'baderlr_topbar', array( 'title' => __( 'BLR Shop — الشريط العلوي', 'blr-shop-pro' ), 'priority' => 26 ) );

	$wp->add_setting( 'baderlr_topbar_on', array( 'default' => true, 'sanitize_callback' => 'baderlr_sanitize_bool' ) );
	$wp->add_control( 'baderlr_topbar_on', array( 'label' => __( 'تفعيل الشريط العلوي', 'blr-shop-pro' ), 'section' => 'baderlr_topbar', 'type' => 'checkbox' ) );

	$wp->add_setting( 'baderlr_topbar_text', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp->add_control( 'baderlr_topbar_text', array( 'label' => __( 'نص الشريط', 'blr-shop-pro' ), 'section' => 'baderlr_topbar', 'type' => 'text' ) );

	$wp->add_setting( 'baderlr_phone', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp->add_control( 'baderlr_phone', array( 'label' => __( 'رقم الهاتف', 'blr-shop-pro' ), 'section' => 'baderlr_topbar', 'type' => 'text' ) );

	$wp->add_setting( 'baderlr_email', array( 'default' => '', 'sanitize_callback' => 'sanitize_email' ) );
	$wp->add_control( 'baderlr_email', array( 'label' => __( 'البريد الإلكتروني', 'blr-shop-pro' ), 'section' => 'baderlr_topbar', 'type' => 'email' ) );

	foreach ( array( 'facebook', 'instagram', 'linkedin', 'whatsapp', 'youtube' ) as $net ) {
		$wp->add_setting( 'baderlr_social_' . $net, array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
		$wp->add_control( 'baderlr_social_' . $net, array(
			/* translators: %s: social network name */
			'label'   => sprintf( __( 'رابط %s', 'blr-shop-pro' ), ucfirst( $net ) ),
			'section' => 'baderlr_topbar',
			'type'    => 'url',
		) );
	}

	/* ===== قسم: الرأس ===== */
	$wp->add_section( 'baderlr_header', array( 'title' => __( 'BLR Shop — الرأس', 'blr-shop-pro' ), 'priority' => 27 ) );

	$wp->add_setting( 'baderlr_cta_text', array( 'default' => __( 'تواصل معنا', 'blr-shop-pro' ), 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp->add_control( 'baderlr_cta_text', array( 'label' => __( 'نص زر الرأس', 'blr-shop-pro' ), 'section' => 'baderlr_header', 'type' => 'text' ) );

	$wp->add_setting( 'baderlr_cta_url', array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
	$wp->add_control( 'baderlr_cta_url', array( 'label' => __( 'رابط زر الرأس', 'blr-shop-pro' ), 'section' => 'baderlr_header', 'type' => 'url' ) );

	/* ===== قسم: التذييل ===== */
	$wp->add_section( 'baderlr_footer', array( 'title' => __( 'BLR Shop — التذييل', 'blr-shop-pro' ), 'priority' => 28 ) );

	$wp->add_setting( 'baderlr_footer_about', array( 'default' => '', 'sanitize_callback' => 'wp_kses_post' ) );
	$wp->add_control( 'baderlr_footer_about', array( 'label' => __( 'نبذة التذييل', 'blr-shop-pro' ), 'section' => 'baderlr_footer', 'type' => 'textarea' ) );

	$wp->add_setting( 'baderlr_copyright', array( 'default' => '', 'sanitize_callback' => 'wp_kses_post' ) );
	$wp->add_control( 'baderlr_copyright', array( 'label' => __( 'نص الحقوق', 'blr-shop-pro' ), 'section' => 'baderlr_footer', 'type' => 'text' ) );
}
add_action( 'customize_register', 'baderlr_customize' );

function baderlr_sanitize_variant( $v ) {
	return in_array( $v, array( 'aurora', 'onyx', 'verdant' ), true ) ? $v : 'aurora';
}
function baderlr_sanitize_bool( $v ) {
	return (bool) $v;
}
