<?php
/**
 * المخصّص (Customizer): الأنماط، الألوان، الشريط العلوي، التواصل، الرأس والتذييل.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_customize( $wp ) {

	/* ===== قسم: الهوية والنمط ===== */
	$wp->add_section( 'baderlr_style', array(
		'title'    => __( 'BaderLR — النمط والألوان', 'baderlr-wp' ),
		'priority' => 25,
	) );

	$wp->add_setting( 'baderlr_variant', array( 'default' => 'aurora', 'sanitize_callback' => 'baderlr_sanitize_variant' ) );
	$wp->add_control( 'baderlr_variant', array(
		'label'   => __( 'نمط التصميم', 'baderlr-wp' ),
		'section' => 'baderlr_style',
		'type'    => 'select',
		'choices' => array(
			'aurora'  => __( 'Aurora — أزرق فاتح (الافتراضي)', 'baderlr-wp' ),
			'onyx'    => __( 'Onyx — داكن فخم + ذهبي', 'baderlr-wp' ),
			'verdant' => __( 'Verdant — أخضر زمردي', 'baderlr-wp' ),
		),
	) );

	$wp->add_setting( 'baderlr_accent', array( 'default' => '', 'sanitize_callback' => 'sanitize_hex_color' ) );
	$wp->add_control( new WP_Customize_Color_Control( $wp, 'baderlr_accent', array(
		'label'       => __( 'اللون الأساسي (يتجاوز النمط)', 'baderlr-wp' ),
		'description' => __( 'اتركه فارغاً لاستعمال لون النمط.', 'baderlr-wp' ),
		'section'     => 'baderlr_style',
	) ) );

	$wp->add_setting( 'baderlr_accent2', array( 'default' => '', 'sanitize_callback' => 'sanitize_hex_color' ) );
	$wp->add_control( new WP_Customize_Color_Control( $wp, 'baderlr_accent2', array(
		'label'   => __( 'اللون الثانوي (التدرّج)', 'baderlr-wp' ),
		'section' => 'baderlr_style',
	) ) );

	$wp->add_setting( 'baderlr_dark_default', array( 'default' => false, 'sanitize_callback' => 'baderlr_sanitize_bool' ) );
	$wp->add_control( 'baderlr_dark_default', array(
		'label'   => __( 'تشغيل الوضع الليلي افتراضياً', 'baderlr-wp' ),
		'section' => 'baderlr_style',
		'type'    => 'checkbox',
	) );

	$wp->add_setting( 'baderlr_dark_toggle', array( 'default' => true, 'sanitize_callback' => 'baderlr_sanitize_bool' ) );
	$wp->add_control( 'baderlr_dark_toggle', array(
		'label'   => __( 'إظهار زر تبديل الوضع الليلي للزوّار', 'baderlr-wp' ),
		'section' => 'baderlr_style',
		'type'    => 'checkbox',
	) );

	/* ===== قسم: الشريط العلوي ===== */
	$wp->add_section( 'baderlr_topbar', array( 'title' => __( 'BaderLR — الشريط العلوي', 'baderlr-wp' ), 'priority' => 26 ) );

	$wp->add_setting( 'baderlr_topbar_on', array( 'default' => true, 'sanitize_callback' => 'baderlr_sanitize_bool' ) );
	$wp->add_control( 'baderlr_topbar_on', array( 'label' => __( 'تفعيل الشريط العلوي', 'baderlr-wp' ), 'section' => 'baderlr_topbar', 'type' => 'checkbox' ) );

	$wp->add_setting( 'baderlr_topbar_text', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp->add_control( 'baderlr_topbar_text', array( 'label' => __( 'نص الشريط', 'baderlr-wp' ), 'section' => 'baderlr_topbar', 'type' => 'text' ) );

	$wp->add_setting( 'baderlr_phone', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp->add_control( 'baderlr_phone', array( 'label' => __( 'رقم الهاتف', 'baderlr-wp' ), 'section' => 'baderlr_topbar', 'type' => 'text' ) );

	$wp->add_setting( 'baderlr_email', array( 'default' => '', 'sanitize_callback' => 'sanitize_email' ) );
	$wp->add_control( 'baderlr_email', array( 'label' => __( 'البريد الإلكتروني', 'baderlr-wp' ), 'section' => 'baderlr_topbar', 'type' => 'email' ) );

	foreach ( array( 'facebook', 'instagram', 'linkedin', 'whatsapp', 'youtube' ) as $net ) {
		$wp->add_setting( 'baderlr_social_' . $net, array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
		$wp->add_control( 'baderlr_social_' . $net, array(
			/* translators: %s: social network name */
			'label'   => sprintf( __( 'رابط %s', 'baderlr-wp' ), ucfirst( $net ) ),
			'section' => 'baderlr_topbar',
			'type'    => 'url',
		) );
	}

	/* ===== قسم: الرأس ===== */
	$wp->add_section( 'baderlr_header', array( 'title' => __( 'BaderLR — الرأس', 'baderlr-wp' ), 'priority' => 27 ) );

	$wp->add_setting( 'baderlr_cta_text', array( 'default' => __( 'تواصل معنا', 'baderlr-wp' ), 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp->add_control( 'baderlr_cta_text', array( 'label' => __( 'نص زر الرأس', 'baderlr-wp' ), 'section' => 'baderlr_header', 'type' => 'text' ) );

	$wp->add_setting( 'baderlr_cta_url', array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
	$wp->add_control( 'baderlr_cta_url', array( 'label' => __( 'رابط زر الرأس', 'baderlr-wp' ), 'section' => 'baderlr_header', 'type' => 'url' ) );

	/* ===== قسم: التذييل ===== */
	$wp->add_section( 'baderlr_footer', array( 'title' => __( 'BaderLR — التذييل', 'baderlr-wp' ), 'priority' => 28 ) );

	$wp->add_setting( 'baderlr_footer_about', array( 'default' => '', 'sanitize_callback' => 'wp_kses_post' ) );
	$wp->add_control( 'baderlr_footer_about', array( 'label' => __( 'نبذة التذييل', 'baderlr-wp' ), 'section' => 'baderlr_footer', 'type' => 'textarea' ) );

	$wp->add_setting( 'baderlr_copyright', array( 'default' => '', 'sanitize_callback' => 'wp_kses_post' ) );
	$wp->add_control( 'baderlr_copyright', array( 'label' => __( 'نص الحقوق', 'baderlr-wp' ), 'section' => 'baderlr_footer', 'type' => 'text' ) );
}
add_action( 'customize_register', 'baderlr_customize' );

function baderlr_sanitize_variant( $v ) {
	return in_array( $v, array( 'aurora', 'onyx', 'verdant' ), true ) ? $v : 'aurora';
}
function baderlr_sanitize_bool( $v ) {
	return (bool) $v;
}
