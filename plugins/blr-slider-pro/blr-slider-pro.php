<?php
/**
 * Plugin Name: BLR Slider Pro
 * Description: سلايدرات حديثة وخفيفة (بدون jQuery) للمتاجر: تأثيرات متعددة، سحب باللمس، تشغيل تلقائي ذكي، صور منفصلة للجوال، فيديو، عدّاد تنازلي، وكتلة Gutenberg وشورتكود.
 * Version: 1.0.1
 * Author: BLR
 * Text Domain: blr-slider-pro
 * License: GPL-2.0-or-later
 * Requires PHP: 7.4
 *
 * @package BLR_Slider_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BLRS_VER', '1.0.1' );
define( 'BLRS_VERSION', BLRS_VER );
define( 'BLRS_URL', plugin_dir_url( __FILE__ ) );
define( 'BLRS_DIR', plugin_dir_path( __FILE__ ) );

/* إعدادات سيرفر الترخيص — داخلية، لا تظهر في لوحة التحكم. */
if ( ! defined( 'BLRS_LICENSE_SERVER' ) ) {
	define( 'BLRS_LICENSE_SERVER', 'https://baderinfo.com/themes-license/' );
}
if ( ! defined( 'BLRS_LICENSE_PUBKEY' ) ) {
	define( 'BLRS_LICENSE_PUBKEY', '8e6G9g431dSU5rcykYca6b+7AfZcFcDpCr/+hrkj61I=' );
}
if ( ! defined( 'BLRS_PRODUCT' ) ) {
	define( 'BLRS_PRODUCT', 'blr-slider-pro' );
}
if ( ! defined( 'BLRS_BUY_URL' ) ) {
	define( 'BLRS_BUY_URL', 'https://baderinfo.com/blr-slider-pro' );
}

require_once BLRS_DIR . 'inc/license.php';
require_once BLRS_DIR . 'inc/admin.php';

/* ---------- CPT ---------- */
add_action( 'init', function () {
	register_post_type(
		'blr_slider',
		array(
			'labels'          => array(
				'name'          => 'BLR Sliders',
				'singular_name' => 'Slider',
				'add_new_item'  => 'إضافة سلايدر',
				'edit_item'     => 'تعديل السلايدر',
				'menu_name'     => 'BLR Sliders',
			),
			'public'          => false,
			'show_ui'         => true,
			'menu_icon'       => 'dashicons-images-alt2',
			'supports'        => array( 'title' ),
			'capability_type' => 'post',
			'menu_position'   => 57,
		)
	);
	register_block_type(
		'blr/slider',
		array(
			'api_version'     => 3,
			'attributes'      => array( 'id' => array( 'type' => 'number', 'default' => 0 ) ),
			'render_callback' => function ( $a ) {
				return blrs_render( absint( $a['id'] ?? 0 ) );
			},
		)
	);
} );

function blrs_defaults() {
	$d = array(
		'effect'   => 'slide',   // slide | fade | zoom | creative
		'autoplay' => 1,
		'delay'    => 5500,
		'loop'     => 1,
		'arrows'   => 1,
		'dots'     => 1,
		'progress' => 1,
		'hover'    => 1,
		'height'   => 520,
		'mheight'  => 420,
	);
	$saved = get_option( 'blrs_defaults', array() );
	return is_array( $saved ) ? array_merge( $d, $saved ) : $d;
}

/* ---------- Admin UI ---------- */
add_action( 'add_meta_boxes_blr_slider', function () {
	add_meta_box( 'blrs_cfg', 'الإعدادات', 'blrs_cfg_box', 'blr_slider', 'side', 'default' );
	add_meta_box( 'blrs_slides', 'الشرائح', 'blrs_slides_box', 'blr_slider', 'normal', 'high' );
	add_meta_box( 'blrs_code', 'الاستخدام', function ( $p ) {
		echo '<p><code>[blr_slider id="' . (int) $p->ID . '"]</code></p><p class="description">أو استخدم كتلة «BLR Slider» في محرر الكتل.</p>';
	}, 'blr_slider', 'side', 'low' );
} );

function blrs_cfg_box( $post ) {
	wp_nonce_field( 'blrs_save', 'blrs_nonce' );
	$c = wp_parse_args( json_decode( (string) get_post_meta( $post->ID, '_blrs_cfg', true ), true ) ?: array(), blrs_defaults() );
	$checks = array( 'autoplay' => 'تشغيل تلقائي', 'loop' => 'تكرار', 'arrows' => 'الأسهم', 'dots' => 'النقاط', 'progress' => 'شريط التقدم', 'hover' => 'إيقاف عند المرور' );
	echo '<p><label>التأثير<br><select name="blrs_cfg[effect]" class="widefat">';
	foreach ( array( 'slide' => 'انزلاق', 'fade' => 'تلاشي', 'zoom' => 'تلاشي + تكبير (Ken Burns) — Pro', 'creative' => 'إبداعي ثلاثي الأبعاد — Pro' ) as $k => $l ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $c['effect'], $k, false ), esc_html( $l ) );
	}
	echo '</select></label></p>';
	foreach ( $checks as $k => $l ) {
		printf( '<p><label><input type="checkbox" name="blrs_cfg[%s]" value="1"%s> %s</label></p>', esc_attr( $k ), checked( ! empty( $c[ $k ] ), true, false ), esc_html( $l ) );
	}
	printf( '<p><label>مدة الشريحة (مللي ثانية)<br><input type="number" class="widefat" name="blrs_cfg[delay]" min="1500" step="100" value="%d"></label></p>', (int) $c['delay'] );
	printf( '<p><label>الارتفاع — حاسوب (px)<br><input type="number" class="widefat" name="blrs_cfg[height]" min="200" value="%d"></label></p>', (int) $c['height'] );
	printf( '<p><label>الارتفاع — جوال (px)<br><input type="number" class="widefat" name="blrs_cfg[mheight]" min="200" value="%d"></label></p>', (int) $c['mheight'] );
}

function blrs_slides_box( $post ) {
	$json = get_post_meta( $post->ID, '_blrs_slides', true );
	?>
	<input type="hidden" id="blrs-data" name="blrs_slides" value="<?php echo esc_attr( $json ?: '[]' ); ?>">
	<div id="blrs-list"></div>
	<p><button type="button" class="button button-primary" id="blrs-add">+ إضافة شريحة</button></p>
	<?php
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	$s = get_current_screen();
	if ( $s && 'blr_slider' === $s->post_type ) {
		wp_enqueue_media();
		wp_enqueue_script( 'blrs-admin', BLRS_URL . 'assets/admin.js', array(), BLRS_VER, true );
		wp_enqueue_style( 'blrs-admin', BLRS_URL . 'assets/admin.css', array(), BLRS_VER );
	}
} );

add_action( 'enqueue_block_editor_assets', function () {
	$list = array();
	foreach ( get_posts( array( 'post_type' => 'blr_slider', 'numberposts' => 100, 'post_status' => 'publish' ) ) as $p ) {
		$list[] = array( 'value' => $p->ID, 'label' => $p->post_title ?: '#' . $p->ID );
	}
	wp_enqueue_script( 'blrs-block', BLRS_URL . 'assets/block.js', array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor' ), BLRS_VER, true );
	wp_localize_script( 'blrs-block', 'BLRS_SLIDERS', $list );
} );

add_action( 'save_post_blr_slider', function ( $id ) {
	if ( ! isset( $_POST['blrs_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['blrs_nonce'] ) ), 'blrs_save' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $id ) ) {
		return;
	}
	// Settings.
	$in  = isset( $_POST['blrs_cfg'] ) && is_array( $_POST['blrs_cfg'] ) ? wp_unslash( $_POST['blrs_cfg'] ) : array(); // phpcs:ignore
	$cfg = array(
		'effect' => in_array( $in['effect'] ?? '', array( 'slide', 'fade', 'zoom', 'creative' ), true ) ? $in['effect'] : 'slide',
		'delay'  => max( 1500, absint( $in['delay'] ?? 5500 ) ),
		'height' => max( 200, absint( $in['height'] ?? 520 ) ),
		'mheight' => max( 200, absint( $in['mheight'] ?? 420 ) ),
	);
	foreach ( array( 'autoplay', 'loop', 'arrows', 'dots', 'progress', 'hover' ) as $k ) {
		$cfg[ $k ] = empty( $in[ $k ] ) ? 0 : 1;
	}
	update_post_meta( $id, '_blrs_cfg', wp_slash( wp_json_encode( $cfg ) ) );

	// Slides.
	$raw    = isset( $_POST['blrs_slides'] ) ? json_decode( wp_unslash( $_POST['blrs_slides'] ), true ) : array(); // phpcs:ignore
	$slides = array();
	foreach ( is_array( $raw ) ? $raw : array() as $s ) {
		$slides[] = array(
			'img'     => absint( $s['img'] ?? 0 ),
			'mimg'    => absint( $s['mimg'] ?? 0 ),
			'video'   => esc_url_raw( $s['video'] ?? '' ),
			'badge'   => sanitize_text_field( $s['badge'] ?? '' ),
			'title'   => sanitize_text_field( $s['title'] ?? '' ),
			'text'    => sanitize_textarea_field( $s['text'] ?? '' ),
			'b1'      => sanitize_text_field( $s['b1'] ?? '' ),
			'u1'      => esc_url_raw( $s['u1'] ?? '' ),
			'b2'      => sanitize_text_field( $s['b2'] ?? '' ),
			'u2'      => esc_url_raw( $s['u2'] ?? '' ),
			'align'   => in_array( $s['align'] ?? '', array( 'start', 'center', 'end' ), true ) ? $s['align'] : 'start',
			'overlay' => max( 0, min( 90, absint( $s['overlay'] ?? 35 ) ) ),
			'dark'    => empty( $s['dark'] ) ? 0 : 1,
			'end'     => sanitize_text_field( $s['end'] ?? '' ),
		);
	}
	update_post_meta( $id, '_blrs_slides', wp_slash( wp_json_encode( $slides, JSON_UNESCAPED_UNICODE ) ) );
} );

/* ---------- Front-end ---------- */
add_shortcode( 'blr_slider', function ( $a ) {
	$a  = shortcode_atts( array( 'id' => 0 ), $a );
	$id = absint( $a['id'] );
	if ( ! $id ) { // أول سلايدر منشور.
		$p  = get_posts( array( 'post_type' => 'blr_slider', 'numberposts' => 1, 'post_status' => 'publish', 'orderby' => 'date', 'order' => 'ASC' ) );
		$id = $p ? $p[0]->ID : 0;
	}
	return blrs_render( $id );
} );

function blrs_render( $id ) {
	if ( ! $id || 'blr_slider' !== get_post_type( $id ) || 'publish' !== get_post_status( $id ) ) {
		return current_user_can( 'edit_posts' ) ? '<p><em>BLR Slider: اختر سلايدراً منشوراً.</em></p>' : '';
	}
	$slides = json_decode( (string) get_post_meta( $id, '_blrs_slides', true ), true );
	if ( empty( $slides ) ) {
		return '';
	}
	$cfg = wp_parse_args( json_decode( (string) get_post_meta( $id, '_blrs_cfg', true ), true ) ?: array(), blrs_defaults() );
	$pro = blrs_is_pro();
	if ( ! $pro ) { // ميزات Pro: تأثيرات متقدمة، فيديو، عدّاد.
		$cfg['effect'] = 'zoom' === $cfg['effect'] ? 'fade' : ( 'creative' === $cfg['effect'] ? 'slide' : $cfg['effect'] );
	}

	wp_enqueue_style( 'blrs', BLRS_URL . 'assets/slider.css', array(), BLRS_VER );
	wp_enqueue_script( 'blrs', BLRS_URL . 'assets/slider.js', array(), BLRS_VER, array( 'strategy' => 'defer', 'in_footer' => true ) );

	$uid = 'blrs-' . $id;
	ob_start();
	printf(
		'<section class="blrs blrs--%1$s" id="%2$s" data-cfg="%3$s" style="--blrs-h:%4$dpx;--blrs-mh:%5$dpx" role="region" aria-roledescription="carousel" aria-label="%6$s">',
		esc_attr( $cfg['effect'] ),
		esc_attr( $uid ),
		esc_attr( wp_json_encode( $cfg ) ),
		(int) $cfg['height'],
		(int) $cfg['mheight'],
		esc_attr( get_the_title( $id ) )
	);
	echo '<div class="blrs__viewport"><div class="blrs__track">';
	foreach ( $slides as $i => $s ) {
		$first = 0 === $i;
		printf(
			'<div class="blrs__slide%1$s%2$s" role="group" aria-roledescription="slide" aria-label="%3$d / %4$d" style="--blrs-ov:%5$s">',
			$first ? ' is-active' : '',
			' blrs--' . esc_attr( $s['align'] ?? 'start' ) . ( ! empty( $s['dark'] ) ? ' blrs--dark' : '' ),
			$i + 1,
			count( $slides ),
			esc_attr( ( (int) ( $s['overlay'] ?? 35 ) ) / 100 )
		);
		echo '<div class="blrs__media">';
		if ( $pro && ! empty( $s['video'] ) ) {
			printf( '<video src="%s" muted loop playsinline %s preload="metadata"></video>', esc_url( $s['video'] ), $first ? 'autoplay' : '' ); // phpcs:ignore
		} elseif ( ! empty( $s['img'] ) ) {
			$attrs = array( 'class' => 'blrs__img', 'alt' => '', 'loading' => $first ? 'eager' : 'lazy', 'decoding' => 'async' );
			if ( $first ) {
				$attrs['fetchpriority'] = 'high';
			}
			if ( ! empty( $s['mimg'] ) ) {
				$m = wp_get_attachment_image_url( $s['mimg'], 'large' );
				echo '<picture>' . ( $m ? '<source media="(max-width:700px)" srcset="' . esc_url( $m ) . '">' : '' ) . wp_get_attachment_image( $s['img'], 'full', false, $attrs ) . '</picture>'; // phpcs:ignore
			} else {
				echo wp_get_attachment_image( $s['img'], 'full', false, $attrs ); // phpcs:ignore
			}
		}
		echo '</div><div class="blrs__shade"></div><div class="blrs__content">';
		if ( ! empty( $s['badge'] ) ) {
			echo '<span class="blrs__badge">' . esc_html( $s['badge'] ) . '</span>';
		}
		if ( ! empty( $s['title'] ) ) {
			echo ( $first && is_front_page() ? '<h1' : '<h2' ) . ' class="blrs__title">' . esc_html( $s['title'] ) . ( $first && is_front_page() ? '</h1>' : '</h2>' );
		}
		if ( ! empty( $s['text'] ) ) {
			echo '<p class="blrs__text">' . esc_html( $s['text'] ) . '</p>';
		}
		if ( $pro && ! empty( $s['end'] ) && strtotime( $s['end'] ) ) {
			echo '<div class="blrs__cd" data-end="' . esc_attr( strtotime( $s['end'] ) ) . '"></div>';
		}
		if ( ! empty( $s['b1'] ) || ! empty( $s['b2'] ) ) {
			echo '<div class="blrs__btns">';
			if ( ! empty( $s['b1'] ) ) {
				echo '<a class="blrs__btn" href="' . esc_url( $s['u1'] ?? '#' ) . '">' . esc_html( $s['b1'] ) . '</a>';
			}
			if ( ! empty( $s['b2'] ) ) {
				echo '<a class="blrs__btn blrs__btn--ghost" href="' . esc_url( $s['u2'] ?? '#' ) . '">' . esc_html( $s['b2'] ) . '</a>';
			}
			echo '</div>';
		}
		echo '</div></div>';
	}
	echo '</div></div>';
	if ( count( $slides ) > 1 ) {
		if ( $cfg['arrows'] ) {
			echo '<button class="blrs__nav blrs__prev" type="button" aria-label="السابق"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></button><button class="blrs__nav blrs__next" type="button" aria-label="التالي"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>';
		}
		if ( $cfg['dots'] ) {
			echo '<div class="blrs__dots" role="tablist">';
			foreach ( $slides as $i => $s ) {
				printf( '<button type="button" role="tab" aria-label="%1$d" class="%2$s"></button>', $i + 1, 0 === $i ? 'is-on' : '' );
			}
			echo '</div>';
		}
		if ( $cfg['progress'] && $cfg['autoplay'] ) {
			echo '<div class="blrs__bar"><i></i></div>';
		}
	}
	echo '</section>';
	return ob_get_clean();
}
