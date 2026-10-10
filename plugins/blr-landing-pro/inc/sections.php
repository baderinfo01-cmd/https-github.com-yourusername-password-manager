<?php
/**
 * سجل الأقسام: المخطط (schema) يُستعمل في المحرّر والتنظيف والذكاء الاصطناعي معاً.
 * أنواع الحقول: text, textarea, url, image, select, color, toggle, number, html, repeater.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** مساعد: تعريف حقل. */
function blrlp_f( $type, $label, $default = '', $extra = array() ) {
	return array_merge( array( 't' => $type, 'l' => $label, 'd' => $default ), $extra );
}

function blrlp_icon_options() {
	$o = array();
	foreach ( array_keys( blrlp_icons() ) as $k ) {
		$o[ $k ] = $k;
	}
	return $o;
}

function blrlp_sections() {
	static $s = null;
	if ( null !== $s ) {
		return $s;
	}
	$t  = function ( $l, $d = '' ) {
		return blrlp_f( 'text', $l, $d );
	};
	$ta = function ( $l, $d = '' ) {
		return blrlp_f( 'textarea', $l, $d );
	};
	$u  = function ( $l, $d = '' ) {
		return blrlp_f( 'url', $l, $d );
	};
	$im = function ( $l ) {
		return blrlp_f( 'image', $l, '' );
	};
	$ti = array( 'title' => $t( 'العنوان' ), 'subtitle' => $ta( 'وصف مختصر' ) );

	$s = array(
		'hero'         => array(
			'label'  => 'البطل (Hero)', 'icon' => 'rocket',
			'fields' => array(
				'layout'   => blrlp_f( 'select', 'التخطيط', 'split', array( 'o' => array( 'split' => 'نص + صورة', 'center' => 'في المنتصف' ) ) ),
				'badge'    => $t( 'شارة صغيرة', 'جديد' ),
				'title'    => $t( 'العنوان الرئيسي', 'أطلق مشروعك بثقة' ),
				'subtitle' => $ta( 'الوصف', 'وصف جذّاب يشرح القيمة التي يحصل عليها الزائر في جملتين.' ),
				'btn1'     => $t( 'زر رئيسي — نص', 'ابدأ الآن' ),
				'url1'     => $u( 'زر رئيسي — رابط', '#cta' ),
				'btn2'     => $t( 'زر ثانوي — نص', 'اعرف المزيد' ),
				'url2'     => $u( 'زر ثانوي — رابط', '#features' ),
				'image'    => $im( 'صورة (اختياري)' ),
				'note'     => $t( 'سطر ثقة أسفل الأزرار', '★★★★★ يثق بنا أكثر من 1000 عميل' ),
				'bullets'  => blrlp_f( 'repeater', 'نقاط سريعة', array(), array( 'f' => array( 'text' => $t( 'النص' ) ), 'tpl' => 'نقطة جديدة' ) ),
			),
		),
		'logos'        => array(
			'label'  => 'شعارات العملاء', 'icon' => 'users',
			'fields' => array(
				'title' => $t( 'العنوان', 'يثق بنا' ),
				'items' => blrlp_f( 'repeater', 'الشعارات', array(), array( 'f' => array( 'name' => $t( 'الاسم' ), 'image' => $im( 'الشعار' ) ) ) ),
			),
		),
		'stats'        => array(
			'label'  => 'إحصاءات', 'icon' => 'chart',
			'fields' => array(
				'items' => blrlp_f( 'repeater', 'الأرقام', array(), array( 'f' => array( 'num' => $t( 'الرقم' ), 'label' => $t( 'الوصف' ) ) ) ),
			),
		),
		'features'     => array(
			'label'  => 'المزايا', 'icon' => 'layers',
			'fields' => $ti + array(
				'cols'  => blrlp_f( 'select', 'الأعمدة', '3', array( 'o' => array( '2' => '2', '3' => '3', '4' => '4' ) ) ),
				'items' => blrlp_f( 'repeater', 'المزايا', array(), array( 'f' => array( 'icon' => blrlp_f( 'select', 'الأيقونة', 'bolt', array( 'o' => blrlp_icon_options() ) ), 'title' => $t( 'العنوان' ), 'text' => $ta( 'الوصف' ) ) ) ),
			),
		),
		'split'        => array(
			'label'  => 'نص + صورة', 'icon' => 'target',
			'fields' => array(
				'side'    => blrlp_f( 'select', 'مكان الصورة', 'end', array( 'o' => array( 'end' => 'نهاية', 'start' => 'بداية' ) ) ),
				'title'   => $t( 'العنوان' ),
				'text'    => $ta( 'النص' ),
				'bullets' => blrlp_f( 'repeater', 'نقاط', array(), array( 'f' => array( 'text' => $t( 'النص' ) ) ) ),
				'image'   => $im( 'الصورة' ),
				'btn'     => $t( 'نص الزر' ),
				'url'     => $u( 'رابط الزر' ),
			),
		),
		'steps'        => array(
			'label'  => 'خطوات العمل', 'icon' => 'repeat',
			'fields' => $ti + array( 'items' => blrlp_f( 'repeater', 'الخطوات', array(), array( 'f' => array( 'title' => $t( 'العنوان' ), 'text' => $ta( 'الوصف' ) ) ) ) ),
		),
		'pricing'      => array(
			'label'  => 'الأسعار', 'icon' => 'gift',
			'fields' => $ti + array(
				'items' => blrlp_f( 'repeater', 'الخطط', array(), array( 'f' => array(
					'name'      => $t( 'اسم الخطة' ),
					'price'     => $t( 'السعر' ),
					'period'    => $t( 'الفترة' ),
					'badge'     => $t( 'شارة' ),
					'desc'      => $t( 'وصف قصير' ),
					'features'  => $ta( 'المزايا (سطر لكل ميزة)' ),
					'btn'       => $t( 'نص الزر' ),
					'url'       => $u( 'رابط الزر' ),
					'highlight' => blrlp_f( 'toggle', 'مميّزة', false ),
				) ) ),
			),
		),
		'testimonials' => array(
			'label'  => 'آراء العملاء', 'icon' => 'star',
			'fields' => array(
				'title' => $t( 'العنوان', 'ماذا يقول عملاؤنا' ),
				'items' => blrlp_f( 'repeater', 'الآراء', array(), array( 'f' => array( 'name' => $t( 'الاسم' ), 'role' => $t( 'الوظيفة' ), 'text' => $ta( 'الرأي' ), 'avatar' => $im( 'الصورة' ), 'rating' => blrlp_f( 'number', 'التقييم (1-5)', 5 ) ) ) ),
			),
		),
		'faq'          => array(
			'label'  => 'الأسئلة الشائعة', 'icon' => 'headset',
			'fields' => array(
				'title' => $t( 'العنوان', 'الأسئلة الشائعة' ),
				'items' => blrlp_f( 'repeater', 'الأسئلة', array(), array( 'f' => array( 'q' => $t( 'السؤال' ), 'a' => $ta( 'الجواب' ) ) ) ),
			),
		),
		'cta'          => array(
			'label'  => 'دعوة لاتخاذ إجراء', 'icon' => 'bolt',
			'fields' => array(
				'title' => $t( 'العنوان', 'جاهز للبدء؟' ),
				'text'  => $ta( 'النص' ),
				'btn1'  => $t( 'زر رئيسي — نص', 'ابدأ الآن' ),
				'url1'  => $u( 'زر رئيسي — رابط', '#' ),
				'btn2'  => $t( 'زر ثانوي — نص' ),
				'url2'  => $u( 'زر ثانوي — رابط' ),
			),
		),
		'form'         => array(
			'label'  => 'نموذج عملاء محتملين', 'icon' => 'mail',
			'fields' => array(
				'title'   => $t( 'العنوان', 'احصل على عرضك المجاني' ),
				'text'    => $ta( 'النص' ),
				'name'    => blrlp_f( 'toggle', 'حقل الاسم', true ),
				'phone'   => blrlp_f( 'toggle', 'حقل الهاتف', true ),
				'message' => blrlp_f( 'toggle', 'حقل الرسالة', false ),
				'btn'     => $t( 'نص الزر', 'أرسل' ),
				'success' => $t( 'رسالة النجاح', 'شكراً لك! سنتواصل معك قريباً.' ),
				'consent' => $t( 'نص الموافقة (اختياري)' ),
				'wa'      => $t( 'رقم واتساب لتحويل الزائر بعد الإرسال (اختياري)' ),
			),
		),
		'video'        => array(
			'label'  => 'فيديو', 'icon' => 'play',
			'fields' => $ti + array( 'url' => $u( 'رابط YouTube / Vimeo / MP4' ), 'poster' => $im( 'صورة الغلاف' ) ),
		),
		'countdown'    => array(
			'label'  => 'عدّاد تنازلي', 'icon' => 'clock',
			'fields' => array(
				'title'    => $t( 'العنوان', 'العرض ينتهي قريباً' ),
				'text'     => $ta( 'النص' ),
				'end'      => $t( 'ينتهي في (YYYY-MM-DD HH:MM)' ),
				'evergreen'=> blrlp_f( 'number', 'عدّاد دائم: ساعات لكل زائر (بدل التاريخ)', 0 ),
				'btn'      => $t( 'نص الزر' ),
				'url'      => $u( 'رابط الزر' ),
			),
		),
		'gallery'      => array(
			'label'  => 'معرض صور', 'icon' => 'layers',
			'fields' => array(
				'title' => $t( 'العنوان' ),
				'items' => blrlp_f( 'repeater', 'الصور', array(), array( 'f' => array( 'image' => $im( 'الصورة' ), 'caption' => $t( 'التعليق' ) ) ) ),
			),
		),
		'products'     => array(
			'label'  => 'منتجات ووكومرس', 'icon' => 'cart',
			'fields' => $ti + array(
				'ids'      => $t( 'معرّفات المنتجات (مفصولة بفواصل)' ),
				'category' => $t( 'أو رابط تصنيف (slug)' ),
				'limit'    => blrlp_f( 'number', 'العدد', 4 ),
			),
		),
		'text'         => array(
			'label'  => 'نص حر (HTML)', 'icon' => 'code',
			'fields' => array( 'html' => blrlp_f( 'html', 'المحتوى', '' ) ),
		),
	);
	return $s;
}

/** القيم الافتراضية لقسم. */
function blrlp_section_defaults( $id ) {
	$all = blrlp_sections();
	$out = array();
	if ( isset( $all[ $id ] ) ) {
		foreach ( $all[ $id ]['fields'] as $k => $f ) {
			$out[ $k ] = $f['d'];
		}
	}
	return $out;
}

function blrlp_style_defaults() {
	return array( 'bg' => 'default', 'pad' => 'm', 'align' => 'auto', 'anchor' => '', 'hide' => '' );
}

function blrlp_design_defaults() {
	return array(
		'preset'   => 'aurora',
		'primary'  => '',
		'primary2' => '',
		'font'     => 'elmessiri',
		'radius'   => 18,
		'mode'     => 'preset', // preset | light | dark
		'anim'     => true,
		'sticky'   => array( 'on' => false, 'text' => '', 'btn' => '', 'url' => '' ),
		'announce' => array( 'on' => false, 'text' => '', 'url' => '' ),
		'exit'     => array( 'on' => false, 'title' => '', 'text' => '', 'btn' => '', 'url' => '' ),
		'wa'       => '',
	);
}

function blrlp_seo_defaults() {
	return array( 'title' => '', 'desc' => '', 'og' => '', 'noindex' => false );
}

function blrlp_settings_defaults() {
	return array( 'notify' => '', 'webhook' => '', 'redirect' => '', 'ab_partner' => 0 );
}

/** تنظيف قيمة حسب نوع الحقل. */
function blrlp_clean_field( $f, $v ) {
	switch ( $f['t'] ) {
		case 'textarea':
			return mb_substr( sanitize_textarea_field( is_scalar( $v ) ? (string) $v : '' ), 0, 2000 );
		case 'url':
			return blrlp_url( is_scalar( $v ) ? $v : '' );
		case 'image':
			return esc_url_raw( is_scalar( $v ) ? (string) $v : '' );
		case 'select':
			$v = is_scalar( $v ) ? (string) $v : '';
			return isset( $f['o'][ $v ] ) ? $v : $f['d'];
		case 'color':
			return sanitize_hex_color( is_scalar( $v ) ? (string) $v : '' );
		case 'toggle':
			return ! empty( $v ) && 'false' !== $v;
		case 'number':
			return is_numeric( $v ) ? $v + 0 : $f['d'];
		case 'html':
			return wp_kses_post( is_scalar( $v ) ? (string) $v : '' );
		case 'repeater':
			$out = array();
			foreach ( array_slice( is_array( $v ) ? $v : array(), 0, 40 ) as $row ) {
				if ( ! is_array( $row ) ) {
					continue;
				}
				$r = array();
				foreach ( $f['f'] as $k => $sf ) {
					$r[ $k ] = blrlp_clean_field( $sf, isset( $row[ $k ] ) ? $row[ $k ] : $sf['d'] );
				}
				$out[] = $r;
			}
			return $out;
		default:
			return mb_substr( sanitize_text_field( is_scalar( $v ) ? (string) $v : '' ), 0, 300 );
	}
}

function blrlp_clean_bool_group( $in, $defaults, $text_keys, $url_keys = array() ) {
	$in  = is_array( $in ) ? $in : array();
	$out = array( 'on' => ! empty( $in['on'] ) && 'false' !== $in['on'] );
	foreach ( $text_keys as $k ) {
		$out[ $k ] = isset( $in[ $k ] ) ? mb_substr( sanitize_text_field( (string) $in[ $k ] ), 0, 200 ) : '';
	}
	foreach ( $url_keys as $k ) {
		$out[ $k ] = isset( $in[ $k ] ) ? blrlp_url( $in[ $k ] ) : '';
	}
	return $out;
}

/** تنظيف كامل لبيانات صفحة الهبوط. */
function blrlp_sanitize_data( $raw ) {
	$raw      = is_array( $raw ) ? $raw : array();
	$registry = blrlp_sections();
	$pick     = function ( $arr, $key, $allowed, $default ) {
		$v = isset( $arr[ $key ] ) ? $arr[ $key ] : $default;
		return in_array( $v, $allowed, true ) ? $v : $default;
	};
	$out      = array( 'sections' => array(), 'design' => array(), 'seo' => array(), 'settings' => array() );

	foreach ( array_slice( isset( $raw['sections'] ) && is_array( $raw['sections'] ) ? $raw['sections'] : array(), 0, 60 ) as $sec ) {
		$id = isset( $sec['id'] ) ? sanitize_key( $sec['id'] ) : '';
		if ( ! isset( $registry[ $id ] ) ) {
			continue;
		}
		$data = array();
		foreach ( $registry[ $id ]['fields'] as $k => $f ) {
			$data[ $k ] = blrlp_clean_field( $f, isset( $sec['data'][ $k ] ) ? $sec['data'][ $k ] : $f['d'] );
		}
		$st = isset( $sec['style'] ) && is_array( $sec['style'] ) ? $sec['style'] : array();
		$out['sections'][] = array(
			'uid'   => isset( $sec['uid'] ) && preg_match( '/^s[a-f0-9]{8}$/', $sec['uid'] ) ? $sec['uid'] : blrlp_uid(),
			'id'    => $id,
			'on'    => ! isset( $sec['on'] ) || ( ! empty( $sec['on'] ) && 'false' !== $sec['on'] ),
			'style' => array(
				'bg'     => $pick( $st, 'bg', array( 'default', 'alt', 'accent', 'dark' ), 'default' ),
				'pad'    => $pick( $st, 'pad', array( 's', 'm', 'l' ), 'm' ),
				'align'  => $pick( $st, 'align', array( 'auto', 'start', 'center' ), 'auto' ),
				'anchor' => isset( $st['anchor'] ) ? preg_replace( '/[^A-Za-z0-9_\-]/', '', (string) $st['anchor'] ) : '',
				'hide'   => $pick( $st, 'hide', array( '', 'mobile', 'desktop' ), '' ),
			),
			'data'  => $data,
		);
	}

	$d  = isset( $raw['design'] ) && is_array( $raw['design'] ) ? $raw['design'] : array();
	$df = blrlp_design_defaults();
	$out['design'] = array(
		'preset'   => isset( blrlp_palettes()[ isset( $d['preset'] ) ? $d['preset'] : '' ] ) ? $d['preset'] : $df['preset'],
		'primary'  => sanitize_hex_color( isset( $d['primary'] ) ? $d['primary'] : '' ),
		'primary2' => sanitize_hex_color( isset( $d['primary2'] ) ? $d['primary2'] : '' ),
		'font'     => in_array( isset( $d['font'] ) ? $d['font'] : '', array( 'elmessiri', 'system' ), true ) ? $d['font'] : 'elmessiri',
		'radius'   => max( 0, min( 36, (int) ( isset( $d['radius'] ) ? $d['radius'] : $df['radius'] ) ) ),
		'mode'     => in_array( isset( $d['mode'] ) ? $d['mode'] : '', array( 'preset', 'light', 'dark' ), true ) ? $d['mode'] : 'preset',
		'anim'     => ! isset( $d['anim'] ) || ( ! empty( $d['anim'] ) && 'false' !== $d['anim'] ),
		'sticky'   => blrlp_clean_bool_group( isset( $d['sticky'] ) ? $d['sticky'] : array(), $df['sticky'], array( 'text', 'btn' ), array( 'url' ) ),
		'announce' => blrlp_clean_bool_group( isset( $d['announce'] ) ? $d['announce'] : array(), $df['announce'], array( 'text' ), array( 'url' ) ),
		'exit'     => blrlp_clean_bool_group( isset( $d['exit'] ) ? $d['exit'] : array(), $df['exit'], array( 'title', 'text', 'btn' ), array( 'url' ) ),
		'wa'       => preg_replace( '/\D/', '', (string) ( isset( $d['wa'] ) ? $d['wa'] : '' ) ),
	);

	$se = isset( $raw['seo'] ) && is_array( $raw['seo'] ) ? $raw['seo'] : array();
	$out['seo'] = array(
		'title'   => mb_substr( sanitize_text_field( isset( $se['title'] ) ? $se['title'] : '' ), 0, 120 ),
		'desc'    => mb_substr( sanitize_text_field( isset( $se['desc'] ) ? $se['desc'] : '' ), 0, 300 ),
		'og'      => esc_url_raw( isset( $se['og'] ) ? $se['og'] : '' ),
		'noindex' => ! empty( $se['noindex'] ) && 'false' !== $se['noindex'],
	);

	$st = isset( $raw['settings'] ) && is_array( $raw['settings'] ) ? $raw['settings'] : array();
	$out['settings'] = array(
		'notify'     => sanitize_email( isset( $st['notify'] ) ? $st['notify'] : '' ),
		'webhook'    => esc_url_raw( isset( $st['webhook'] ) ? $st['webhook'] : '', array( 'https' ) ),
		'redirect'   => esc_url_raw( isset( $st['redirect'] ) ? $st['redirect'] : '' ),
		'ab_partner' => absint( isset( $st['ab_partner'] ) ? $st['ab_partner'] : 0 ),
	);
	return $out;
}

/** قراءة بيانات صفحة مع القيم الافتراضية. */
function blrlp_get_data( $post_id ) {
	$j = json_decode( (string) get_post_meta( $post_id, '_blrlp_data', true ), true );
	$j = is_array( $j ) ? $j : array();
	return array(
		'sections' => isset( $j['sections'] ) && is_array( $j['sections'] ) ? $j['sections'] : array(),
		'design'   => array_replace_recursive( blrlp_design_defaults(), isset( $j['design'] ) && is_array( $j['design'] ) ? $j['design'] : array() ),
		'seo'      => array_merge( blrlp_seo_defaults(), isset( $j['seo'] ) && is_array( $j['seo'] ) ? $j['seo'] : array() ),
		'settings' => array_merge( blrlp_settings_defaults(), isset( $j['settings'] ) && is_array( $j['settings'] ) ? $j['settings'] : array() ),
	);
}
