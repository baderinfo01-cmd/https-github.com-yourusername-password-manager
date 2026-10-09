<?php
/**
 * جسر الذكاء الاصطناعي: يربط القالب بإضافة BaderLR Companion (المساعد الذكي، SEO تلقائي، إلخ).
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** هل مزوّد الذكاء الاصطناعي مهيّأ؟ */
function baderlr_ai_ready() {
	return baderlr_has_companion() && function_exists( 'baderlr_ai_get_key' ) && (bool) baderlr_ai_get_key();
}

/** خيارات المخصّص: تفعيل المساعد الذكي في الواجهة. */
add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_section( 'baderlr_ai', array(
		'title'    => __( 'المساعد الذكي (AI)', 'baderlr-wp' ),
		'priority' => 60,
	) );
	$wp_customize->add_setting( 'baderlr_ai_chat', array( 'default' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
	$wp_customize->add_control( 'baderlr_ai_chat', array(
		'section'     => 'baderlr_ai',
		'type'        => 'checkbox',
		'label'       => __( 'إظهار المساعد الذكي للزوّار', 'baderlr-wp' ),
		'description' => baderlr_has_companion() ? '' : __( 'يتطلب تفعيل إضافة BaderLR Companion.', 'baderlr-wp' ),
	) );
	$wp_customize->add_setting( 'baderlr_ai_chat_greeting', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp_customize->add_control( 'baderlr_ai_chat_greeting', array(
		'section' => 'baderlr_ai',
		'type'    => 'text',
		'label'   => __( 'رسالة الترحيب', 'baderlr-wp' ),
	) );
	$wp_customize->add_setting( 'baderlr_ai_chat_context', array( 'default' => '', 'sanitize_callback' => 'sanitize_textarea_field' ) );
	$wp_customize->add_control( 'baderlr_ai_chat_context', array(
		'section'     => 'baderlr_ai',
		'type'        => 'textarea',
		'label'       => __( 'معلومات عن نشاطك للمساعد', 'baderlr-wp' ),
		'description' => __( 'الخدمات، الأسعار، ساعات العمل… يجيب المساعد منها فقط.', 'baderlr-wp' ),
	) );
} );
