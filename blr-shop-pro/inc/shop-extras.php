<?php
/**
 * إضافات الواجهة: بحث مباشر، واتساب، نشرة بريدية، شورتكودات المتجر.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bshop_is_woo() {
	return class_exists( 'WooCommerce' );
}

/* ---------- عدّاد تنازلي ---------- */
function bshop_countdown_html( $timestamp ) {
	return '<div class="bs-countdown" data-end="' . esc_attr( (int) $timestamp ) . '"></div>';
}

/* ---------- بحث مباشر ---------- */
add_action( 'wp_ajax_bshop_search', 'bshop_ajax_search' );
add_action( 'wp_ajax_nopriv_bshop_search', 'bshop_ajax_search' );
function bshop_ajax_search() {
	check_ajax_referer( 'bshop', 'nonce' );
	$q = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : '';
	if ( mb_strlen( $q ) < 2 ) {
		wp_send_json_success( array() );
	}
	$query = new WP_Query( array(
		'post_type'           => bshop_is_woo() ? array( 'product', 'post' ) : array( 'post', 'page' ),
		's'                   => $q,
		'posts_per_page'      => 6,
		'post_status'         => 'publish',
		'no_found_rows'       => true,
		'ignore_sticky_posts' => true,
	) );
	$out = array();
	foreach ( $query->posts as $p ) {
		$price = '';
		if ( 'product' === $p->post_type ) {
			$wc    = wc_get_product( $p->ID );
			$price = $wc ? wp_strip_all_tags( html_entity_decode( $wc->get_price_html() ) ) : '';
		}
		$out[] = array(
			'title' => get_the_title( $p ),
			'url'   => get_permalink( $p ),
			'img'   => get_the_post_thumbnail_url( $p, 'thumbnail' ) ? get_the_post_thumbnail_url( $p, 'thumbnail' ) : '',
			'sub'   => 'product' === $p->post_type ? $price : __( 'مقال', 'blr-shop-pro' ),
		);
	}
	wp_send_json_success( $out );
}

/* ---------- واتساب عائم + عناصر الواجهة المشتركة ---------- */
add_action( 'wp_footer', function () {
	$n = preg_replace( '/\D/', '', (string) get_theme_mod( 'bshop_whatsapp', '' ) );
	if ( $n ) {
		printf(
			'<a class="bs-fab bs-fab--wa" href="%s" target="_blank" rel="noopener" aria-label="WhatsApp">%s</a>',
			esc_url( 'https://wa.me/' . $n ),
			baderlr_icon( 'whatsapp', 26 ) // phpcs:ignore
		);
	}
} );

/* ---------- نشرة بريدية (تحفظ محلياً وتُخطر المدير؛ بلا خدمات خارجية) ---------- */
add_action( 'admin_post_nopriv_bshop_news', 'bshop_news_submit' );
add_action( 'admin_post_bshop_news', 'bshop_news_submit' );
function bshop_news_submit() {
	$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'bshop_news' ) || ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( $back );
		exit;
	}
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( is_email( $email ) ) {
		$list = get_option( 'bshop_subscribers', array() );
		if ( ! in_array( $email, $list, true ) ) {
			$list[] = $email;
			update_option( 'bshop_subscribers', array_slice( $list, -5000 ), false );
			wp_mail( get_option( 'admin_email' ), '[' . get_bloginfo( 'name' ) . '] مشترك جديد', $email );
		}
		$back = add_query_arg( 'subscribed', '1', $back );
	}
	wp_safe_redirect( $back );
	exit;
}

/* ---------- شورتكودات ---------- */

// [bshop_countdown to="2026-12-31 23:59"]
add_shortcode( 'bshop_countdown', function ( $a ) {
	$a  = shortcode_atts( array( 'to' => '' ), $a );
	$ts = strtotime( $a['to'] );
	return $ts ? bshop_countdown_html( $ts ) : '';
} );

/** صف منتجات أفقي. */
function bshop_products_row( $type, $limit = 8 ) {
	if ( ! bshop_is_woo() ) {
		return '';
	}
	$args = array( 'post_type' => 'product', 'posts_per_page' => $limit, 'post_status' => 'publish', 'no_found_rows' => true );
	switch ( $type ) {
		case 'physical':
		case 'subscription':
		case 'service':
			$args['meta_query'] = array( array( 'key' => '_bshop_ptype', 'value' => $type ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
			break;
		case 'digital':
			$args['meta_query'] = array( 'relation' => 'OR', array( 'key' => '_bshop_ptype', 'value' => 'digital' ), array( 'key' => '_downloadable', 'value' => 'yes' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
			break;
		case 'sale':
			$args['post__in'] = array_merge( array( 0 ), wc_get_product_ids_on_sale() );
			break;
		case 'best':
			$args['meta_key'] = 'total_sales'; // phpcs:ignore WordPress.DB.SlowDBQuery
			$args['orderby']  = 'meta_value_num';
			break;
	}
	$q = new WP_Query( $args );
	if ( ! $q->have_posts() ) {
		return '<p class="bs-empty">' . esc_html__( 'لا توجد منتجات بعد.', 'blr-shop-pro' ) . '</p>';
	}
	ob_start();
	echo '<div class="bs-row-wrap woocommerce"><button type="button" class="bs-row-nav" data-dir="-1" aria-label="prev">‹</button><ul class="bs-row products">';
	while ( $q->have_posts() ) {
		$q->the_post();
		wc_get_template_part( 'content', 'product' );
	}
	echo '</ul><button type="button" class="bs-row-nav" data-dir="1" aria-label="next">›</button></div>';
	wp_reset_postdata();
	return ob_get_clean();
}

// [bshop_products type="digital|physical|subscription|service|sale|best|new" limit="8"]
add_shortcode( 'bshop_products', function ( $a ) {
	$a = shortcode_atts( array( 'type' => 'new', 'limit' => 8 ), $a );
	return bshop_products_row( sanitize_key( $a['type'] ), min( 24, absint( $a['limit'] ) ) );
} );

// [bshop_pricing category="plans" limit="3" highlight="2"] — جدول خطط الاشتراك من تصنيف.
add_shortcode( 'bshop_pricing', function ( $a ) {
	if ( ! bshop_is_woo() ) {
		return '';
	}
	$a        = shortcode_atts( array( 'category' => '', 'limit' => 3, 'highlight' => 2 ), $a );
	$products = wc_get_products( array(
		'status'   => 'publish',
		'limit'    => min( 6, absint( $a['limit'] ) ),
		'category' => array_filter( array_map( 'sanitize_title', explode( ',', $a['category'] ) ) ),
		'orderby'  => 'menu_order',
		'order'    => 'ASC',
	) );
	if ( ! $products ) {
		return '';
	}
	ob_start();
	echo '<div class="blr-grid blr-grid--' . ( count( $products ) >= 3 ? '3' : '2' ) . '">';
	foreach ( $products as $i => $p ) {
		$hot = ( $i + 1 ) === (int) $a['highlight'];
		echo '<div class="blr-plan' . ( $hot ? ' blr-plan--pop' : '' ) . '"' . ( $hot ? ' data-badge="' . esc_attr__( 'الأكثر طلباً', 'blr-shop-pro' ) . '"' : '' ) . '>';
		echo '<h3>' . esc_html( $p->get_name() ) . '</h3><div class="blr-plan__price">' . wp_kses_post( $p->get_price_html() ) . '</div>';
		echo '<div class="bs-plan-desc">' . wp_kses_post( wpautop( $p->get_short_description() ) ) . '</div>';
		echo '<a class="blr-btn ' . ( $hot ? 'blr-btn--primary' : 'blr-btn--ghost' ) . '" href="' . esc_url( $p->get_permalink() ) . '">' . esc_html( $p->single_add_to_cart_text() ) . '</a></div>';
	}
	echo '</div>';
	return ob_get_clean();
} );

// [bshop_recent] — شوهد مؤخراً.
add_shortcode( 'bshop_recent', function () {
	if ( ! bshop_is_woo() ) {
		return '';
	}
	$raw = isset( $_COOKIE['woocommerce_recently_viewed'] ) ? sanitize_text_field( wp_unslash( $_COOKIE['woocommerce_recently_viewed'] ) ) : ''; // phpcs:ignore
	$ids = array_filter( array_map( 'absint', explode( '|', $raw ) ) );
	if ( ! $ids ) {
		return '';
	}
	$q = new WP_Query( array( 'post_type' => 'product', 'post__in' => array_slice( array_reverse( $ids ), 0, 8 ), 'orderby' => 'post__in', 'no_found_rows' => true ) );
	ob_start();
	echo '<div class="bs-row-wrap woocommerce"><ul class="bs-row products">';
	while ( $q->have_posts() ) {
		$q->the_post();
		wc_get_template_part( 'content', 'product' );
	}
	echo '</ul></div>';
	wp_reset_postdata();
	return ob_get_clean();
} );

/* ---------- خيارات المخصّص للمتجر ---------- */
add_action( 'customize_register', function ( $wp ) {
	$wp->add_section( 'bshop', array( 'title' => __( 'BLR Shop — المتجر والرئيسية', 'blr-shop-pro' ), 'priority' => 24 ) );

	$bool = function ( $v ) {
		return (bool) $v;
	};
	$add = function ( $id, $label, $type, $default, $san, $choices = null ) use ( $wp ) {
		$wp->add_setting( $id, array( 'default' => $default, 'sanitize_callback' => $san ) );
		$args = array( 'label' => $label, 'section' => 'bshop', 'type' => $type );
		if ( $choices ) {
			$args['choices'] = $choices;
		}
		$wp->add_control( $id, $args );
	};

	$add( 'bshop_cols', __( 'أعمدة المنتجات (2–5)', 'blr-shop-pro' ), 'number', 3, 'absint' );
	$add( 'bshop_quickview', __( 'المعاينة السريعة', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'bshop_wishlist', __( 'المفضلة والمقارنة', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'bshop_sticky_atc', __( 'شريط الشراء الثابت في صفحة المنتج', 'blr-shop-pro' ), 'checkbox', true, $bool );
	$add( 'bshop_free_ship', __( 'حد الشحن المجاني (0 = تعطيل)', 'blr-shop-pro' ), 'number', 0, 'absint' );
	$add( 'bshop_whatsapp', __( 'رقم واتساب (دولي بدون +)', 'blr-shop-pro' ), 'text', '', 'sanitize_text_field' );
	$add( 'bshop_slider_id', __( 'رقم السلايدر في الرئيسية (0 = أول سلايدر)', 'blr-shop-pro' ), 'number', 0, 'absint' );
	$add( 'bshop_hero_title', __( 'عنوان البانر الاحتياطي (بلا سلايدر)', 'blr-shop-pro' ), 'text', 'متجرك الرقمي والمادي في مكان واحد', 'sanitize_text_field' );
	$add( 'bshop_hero_text', __( 'نص البانر الاحتياطي', 'blr-shop-pro' ), 'textarea', 'منتجات رقمية بتسليم فوري، منتجات مادية بشحن سريع، واشتراكات مرنة.', 'sanitize_textarea_field' );
	foreach ( array(
		'bshop_show_trust'      => __( 'شريط الثقة', 'blr-shop-pro' ),
		'bshop_show_cats'       => __( 'التصنيفات', 'blr-shop-pro' ),
		'bshop_show_types'      => __( 'تبويبات رقمي/مادي/اشتراكات', 'blr-shop-pro' ),
		'bshop_show_deals'      => __( 'عروض بعدّاد تنازلي', 'blr-shop-pro' ),
		'bshop_show_best'       => __( 'الأكثر مبيعاً', 'blr-shop-pro' ),
		'bshop_show_posts'      => __( 'أحدث المقالات', 'blr-shop-pro' ),
		'bshop_show_newsletter' => __( 'النشرة البريدية', 'blr-shop-pro' ),
	) as $k => $l ) {
		$add( $k, $l, 'checkbox', true, $bool );
	}
} );
