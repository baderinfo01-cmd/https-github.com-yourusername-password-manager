<?php
/**
 * Customizer.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'customize_register', 'blr_customize' );
function blr_customize( $wp ) {
	$wp->add_panel( 'blr', array( 'title' => __( 'BLR Shop Pro', 'blr-shop-pro' ), 'priority' => 30 ) );

	$sections = array(
		'blr_style'  => __( 'الألوان والخطوط', 'blr-shop-pro' ),
		'blr_header' => __( 'الهيدر وشريط الإعلان', 'blr-shop-pro' ),
		'blr_home'   => __( 'الصفحة الرئيسية', 'blr-shop-pro' ),
		'blr_shop'   => __( 'المتجر والمنتجات', 'blr-shop-pro' ),
		'blr_footer' => __( 'التذييل والتواصل', 'blr-shop-pro' ),
	);
	foreach ( $sections as $id => $title ) {
		$wp->add_section( $id, array( 'title' => $title, 'panel' => 'blr' ) );
	}

	$add = function ( $id, $section, $label, $type, $default, $san, $choices = null ) use ( $wp ) {
		$wp->add_setting( $id, array( 'default' => $default, 'sanitize_callback' => $san, 'transport' => 'refresh' ) );
		$args = array( 'label' => $label, 'section' => $section, 'type' => $type );
		if ( $choices ) {
			$args['choices'] = $choices;
		}
		if ( 'color' === $type ) {
			$wp->add_control( new WP_Customize_Color_Control( $wp, $id, array( 'label' => $label, 'section' => $section ) ) );
		} else {
			$wp->add_control( $id, $args );
		}
	};
	$bool = function ( $v ) {
		return (bool) $v;
	};

	// Style.
	$add( 'blr_primary', 'blr_style', __( 'اللون الأساسي', 'blr-shop-pro' ), 'color', '#4f46e5', 'sanitize_hex_color' );
	$add( 'blr_accent', 'blr_style', __( 'لون التمييز (العروض)', 'blr-shop-pro' ), 'color', '#f59e0b', 'sanitize_hex_color' );
	$add( 'blr_radius', 'blr_style', __( 'استدارة الزوايا (px)', 'blr-shop-pro' ), 'number', 14, 'absint' );
	$add( 'blr_font', 'blr_style', __( 'الخط', 'blr-shop-pro' ), 'select', 'system', 'sanitize_key', array( 'system' => __( 'خط النظام (الأسرع)', 'blr-shop-pro' ), 'tajawal' => 'Tajawal (Google Fonts)' ) );
	$add( 'blr_dark_default', 'blr_style', __( 'الوضع الافتراضي', 'blr-shop-pro' ), 'select', 'auto', 'sanitize_key', array( 'auto' => __( 'تلقائي حسب الجهاز', 'blr-shop-pro' ), 'light' => __( 'نهاري', 'blr-shop-pro' ), 'dark' => __( 'ليلي', 'blr-shop-pro' ) ) );

	// Header.
	$add( 'blr_header_style', 'blr_header', __( 'شكل الهيدر', 'blr-shop-pro' ), 'select', 'classic', 'sanitize_key', array( 'classic' => __( 'كلاسيكي', 'blr-shop-pro' ), 'centered' => __( 'شعار في المنتصف', 'blr-shop-pro' ) ) );
	$add( 'blr_sticky_header', 'blr_header', __( 'تثبيت الهيدر عند التمرير', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'blr_announce_text', 'blr_header', __( 'نص شريط الإعلان', 'blr-shop-pro' ), 'text', '🔥 خصم 20% على جميع الاشتراكات — استخدم الكود BLR20', 'sanitize_text_field' );
	$add( 'blr_announce_link', 'blr_header', __( 'رابط الشريط', 'blr-shop-pro' ), 'url', '', 'esc_url_raw' );

	// Home.
	$home = array(
		'blr_show_slider'    => __( 'عرض السلايدر (إضافة BLR Slider Pro)', 'blr-shop-pro' ),
		'blr_show_trust'     => __( 'شريط الثقة', 'blr-shop-pro' ),
		'blr_show_cats'      => __( 'تصنيفات المنتجات', 'blr-shop-pro' ),
		'blr_show_types'     => __( 'تبويبات (رقمي / مادي / اشتراكات)', 'blr-shop-pro' ),
		'blr_show_deals'     => __( 'عروض مع عدّاد تنازلي', 'blr-shop-pro' ),
		'blr_show_best'      => __( 'الأكثر مبيعاً', 'blr-shop-pro' ),
		'blr_show_posts'     => __( 'أحدث المقالات', 'blr-shop-pro' ),
		'blr_show_newsletter' => __( 'اشتراك النشرة البريدية', 'blr-shop-pro' ),
	);
	foreach ( $home as $id => $label ) {
		$add( $id, 'blr_home', $label, 'checkbox', true, $bool );
	}
	$add( 'blr_slider_id', 'blr_home', __( 'رقم السلايدر (ID) — اتركه فارغاً لأول سلايدر', 'blr-shop-pro' ), 'number', 0, 'absint' );
	$add( 'blr_hero_title', 'blr_home', __( 'عنوان البانر الاحتياطي', 'blr-shop-pro' ), 'text', 'متجرك الرقمي والمادي في مكان واحد', 'sanitize_text_field' );
	$add( 'blr_hero_text', 'blr_home', __( 'نص البانر الاحتياطي', 'blr-shop-pro' ), 'textarea', 'منتجات رقمية بتسليم فوري، منتجات مادية بشحن سريع، واشتراكات مرنة.', 'sanitize_textarea_field' );

	// Shop.
	$add( 'blr_shop_cols', 'blr_shop', __( 'أعمدة المنتجات (2–5)', 'blr-shop-pro' ), 'number', 4, 'absint' );
	$add( 'blr_quickview', 'blr_shop', __( 'المعاينة السريعة', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'blr_wishlist', 'blr_shop', __( 'المفضلة والمقارنة', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'blr_sticky_atc', 'blr_shop', __( 'شريط الشراء الثابت في صفحة المنتج', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'blr_free_ship', 'blr_shop', __( 'حد الشحن المجاني (0 = تعطيل)', 'blr-shop-pro' ), 'number', 0, 'absint' );

	// Footer.
	$add( 'blr_whatsapp', 'blr_footer', __( 'رقم واتساب (بصيغة دولية بدون +)', 'blr-shop-pro' ), 'text', '', 'sanitize_text_field' );
	$add( 'blr_footer_text', 'blr_footer', __( 'نص حقوق النشر', 'blr-shop-pro' ), 'text', '', 'sanitize_text_field' );
	foreach ( array( 'x' => 'X / Twitter', 'instagram' => 'Instagram', 'youtube' => 'YouTube', 'tiktok' => 'TikTok', 'telegram' => 'Telegram' ) as $k => $l ) {
		$add( 'blr_social_' . $k, 'blr_footer', $l, 'url', '', 'esc_url_raw' );
	}
}
