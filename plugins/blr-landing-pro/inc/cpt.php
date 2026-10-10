<?php
/**
 * نوع المحتوى blr_landing، قالب Canvas مستقل عن القالب، SEO، اختبار A/B.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blrlp_register_cpt() {
	register_post_type( 'blr_landing', array(
		'labels'              => array(
			'name'               => __( 'صفحات الهبوط', 'blr-landing-pro' ),
			'singular_name'      => __( 'صفحة هبوط', 'blr-landing-pro' ),
			'add_new'            => __( 'إضافة صفحة', 'blr-landing-pro' ),
			'add_new_item'       => __( 'إضافة صفحة هبوط', 'blr-landing-pro' ),
			'edit_item'          => __( 'تعديل صفحة الهبوط', 'blr-landing-pro' ),
			'all_items'          => __( 'كل الصفحات', 'blr-landing-pro' ),
			'search_items'       => __( 'بحث', 'blr-landing-pro' ),
			'not_found'          => __( 'لا توجد صفحات بعد.', 'blr-landing-pro' ),
		),
		'public'              => true,
		'publicly_queryable'  => true,
		'exclude_from_search' => true,
		'show_ui'             => true,
		'show_in_menu'        => 'blr-landing',
		'show_in_rest'        => false,
		'has_archive'         => false,
		'supports'            => array( 'title' ),
		'rewrite'             => array( 'slug' => sanitize_title( blrlp_opt( 'slug', 'lp' ) ), 'with_front' => false ),
		'capability_type'     => 'post',
	) );
}
add_action( 'init', 'blrlp_register_cpt' );

function blrlp_is_landing_request() {
	return is_singular( 'blr_landing' );
}

/* قالب Canvas: صفحة كاملة بلا رأس/تذييل القالب (تعمل مع أي ثيم). */
add_filter( 'template_include', function ( $tpl ) {
	if ( blrlp_is_landing_request() ) {
		return BLRLP_DIR . 'templates/canvas.php';
	}
	return $tpl;
}, 99 );

add_action( 'wp_enqueue_scripts', function () {
	if ( blrlp_is_landing_request() ) {
		blrlp_enqueue_front();
	}
}, 5 );

/* عزل الأنماط: إزالة أنماط القالب الحالي حتى لا تفسد التصميم. */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! blrlp_is_landing_request() || '0' === (string) blrlp_opt( 'isolate', '1' ) ) {
		return;
	}
	global $wp_styles;
	if ( ! $wp_styles ) {
		return;
	}
	$themes = content_url( 'themes/' );
	foreach ( (array) $wp_styles->registered as $h => $st ) {
		if ( 'blrlp-front' !== $h && ! empty( $st->src ) && is_string( $st->src ) && 0 === strpos( $st->src, $themes ) ) {
			wp_dequeue_style( $h );
		}
	}
}, 9999 );

/* العنوان والوصف وOG وrobots وSchema والخط. */
add_filter( 'pre_get_document_title', function ( $t ) {
	if ( blrlp_is_landing_request() ) {
		$d = blrlp_get_data( get_queried_object_id() );
		return $d['seo']['title'] ? $d['seo']['title'] : get_the_title( get_queried_object_id() );
	}
	return $t;
} );

add_action( 'wp_head', function () {
	if ( ! blrlp_is_landing_request() ) {
		return;
	}
	$id   = get_queried_object_id();
	$data = blrlp_get_data( $id );
	$seo  = $data['seo'];
	if ( ! current_theme_supports( 'title-tag' ) ) {
		echo '<title>' . esc_html( $seo['title'] ? $seo['title'] : get_the_title( $id ) ) . '</title>' . "\n";
	}
	echo blrlp_font_link( $data ); // phpcs:ignore
	if ( $seo['desc'] ) {
		echo '<meta name="description" content="' . esc_attr( $seo['desc'] ) . '">' . "\n";
		echo '<meta property="og:description" content="' . esc_attr( $seo['desc'] ) . '">' . "\n";
	}
	echo '<meta property="og:title" content="' . esc_attr( $seo['title'] ? $seo['title'] : get_the_title( $id ) ) . '">' . "\n";
	echo '<meta property="og:type" content="website"><meta property="og:url" content="' . esc_url( get_permalink( $id ) ) . '">' . "\n";
	if ( $seo['og'] ) {
		echo '<meta property="og:image" content="' . esc_url( $seo['og'] ) . '"><meta name="twitter:card" content="summary_large_image">' . "\n";
	}
	if ( $seo['noindex'] ) {
		echo '<meta name="robots" content="noindex,nofollow">' . "\n";
	}
	echo blrlp_schema( $id, $data ) . "\n"; // phpcs:ignore
	echo '<meta name="theme-color" content="' . esc_attr( ! empty( $data['design']['primary'] ) ? $data['design']['primary'] : blrlp_palettes()[ $data['design']['preset'] ]['v']['primary'] ) . '">' . "\n";
}, 2 );

/* ---------- حفظ البيانات ---------- */
add_action( 'save_post_blr_landing', function ( $id ) {
	if ( ! isset( $_POST['blrlp_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['blrlp_nonce'] ) ), 'blrlp_save' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $id ) ) {
		return;
	}
	$raw  = isset( $_POST['blrlp_data'] ) ? json_decode( wp_unslash( $_POST['blrlp_data'] ), true ) : null; // phpcs:ignore
	if ( ! is_array( $raw ) ) {
		return;
	}
	$data = blrlp_sanitize_data( $raw );
	if ( ! blrlp_is_pro() ) { // A/B حصري لـ Pro.
		$data['settings']['ab_partner'] = 0;
	}
	// ربط اختبار A/B في الاتجاهين.
	$old = blrlp_get_data( $id );
	$new_partner = (int) $data['settings']['ab_partner'];
	$old_partner = (int) $old['settings']['ab_partner'];
	if ( $old_partner && $old_partner !== $new_partner ) {
		blrlp_set_partner( $old_partner, 0 );
	}
	if ( $new_partner && ( 'blr_landing' !== get_post_type( $new_partner ) || $new_partner === (int) $id ) ) {
		$data['settings']['ab_partner'] = 0;
		$new_partner = 0;
	}
	if ( $new_partner ) {
		blrlp_set_partner( $new_partner, (int) $id );
	}
	update_post_meta( $id, '_blrlp_data', wp_slash( wp_json_encode( $data, JSON_UNESCAPED_UNICODE ) ) );
} );

function blrlp_set_partner( $post_id, $partner ) {
	if ( 'blr_landing' !== get_post_type( $post_id ) ) {
		return;
	}
	$d = blrlp_get_data( $post_id );
	$d['settings']['ab_partner'] = (int) $partner;
	update_post_meta( $post_id, '_blrlp_data', wp_slash( wp_json_encode( $d, JSON_UNESCAPED_UNICODE ) ) );
}

/* ---------- اختبار A/B (Pro): توزيع عشوائي ثابت لكل زائر ---------- */
add_action( 'template_redirect', function () {
	if ( ! blrlp_is_landing_request() || ! blrlp_is_pro() || blrlp_is_bot() || is_preview() || current_user_can( 'edit_posts' ) ) {
		return;
	}
	$id      = get_queried_object_id();
	$partner = (int) blrlp_get_data( $id )['settings']['ab_partner'];
	if ( ! $partner || 'publish' !== get_post_status( $partner ) ) {
		return;
	}
	$key    = 'blrlp_ab_' . min( $id, $partner );
	$chosen = isset( $_COOKIE[ $key ] ) ? absint( $_COOKIE[ $key ] ) : 0;
	if ( ! in_array( $chosen, array( $id, $partner ), true ) ) {
		$chosen = wp_rand( 0, 1 ) ? $id : $partner;
		setcookie( $key, (string) $chosen, time() + 30 * DAY_IN_SECONDS, COOKIEPATH ? COOKIEPATH : '/', COOKIE_DOMAIN, is_ssl(), true );
	}
	if ( $chosen !== $id ) {
		nocache_headers();
		wp_safe_redirect( get_permalink( $chosen ), 302 );
		exit;
	}
} );
