<?php
/**
 * General front-end features: live search, shortcodes, floating buttons.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ---------- Live search ---------- */
add_action( 'wp_ajax_blr_search', 'blr_ajax_search' );
add_action( 'wp_ajax_nopriv_blr_search', 'blr_ajax_search' );
function blr_ajax_search() {
	check_ajax_referer( 'blr_front', 'nonce' );
	$q = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : '';
	if ( mb_strlen( $q ) < 2 ) {
		wp_send_json_success( array() );
	}
	$query = new WP_Query(
		array(
			'post_type'           => blr_is_woo() ? array( 'product', 'post' ) : array( 'post', 'page' ),
			's'                   => $q,
			'posts_per_page'      => 6,
			'post_status'         => 'publish',
			'no_found_rows'       => true,
			'ignore_sticky_posts' => true,
		)
	);
	$out = array();
	foreach ( $query->posts as $p ) {
		$price = '';
		if ( 'product' === $p->post_type && blr_is_woo() ) {
			$price = wp_strip_all_tags( html_entity_decode( wc_get_product( $p->ID )->get_price_html() ) );
		}
		$out[] = array(
			'title' => get_the_title( $p ),
			'url'   => get_permalink( $p ),
			'img'   => get_the_post_thumbnail_url( $p, 'thumbnail' ) ?: '',
			'price' => $price,
			'type'  => 'product' === $p->post_type ? '' : __( 'مقال', 'blr-shop-pro' ),
		);
	}
	wp_send_json_success( $out );
}

/* ---------- Floating WhatsApp ---------- */
add_action( 'wp_footer', function () {
	$n = preg_replace( '/\D/', '', (string) get_theme_mod( 'blr_whatsapp', '' ) );
	if ( $n ) {
		printf(
			'<a class="blr-fab blr-fab--wa" href="%s" target="_blank" rel="noopener" aria-label="WhatsApp">%s</a>',
			esc_url( 'https://wa.me/' . $n ),
			blr_icon( 'whatsapp', 26 ) // phpcs:ignore
		);
	}
	echo '<div class="blr-toast" id="blr-toast" role="status" aria-live="polite"></div>';
} );

/* ---------- Shortcodes ---------- */

// [blr_countdown to="2026-12-31 23:59"]
add_shortcode( 'blr_countdown', function ( $a ) {
	$a  = shortcode_atts( array( 'to' => '' ), $a );
	$ts = strtotime( $a['to'] );
	if ( ! $ts ) {
		return '';
	}
	return blr_countdown_html( $ts );
} );

function blr_countdown_html( $timestamp ) {
	return '<div class="blr-countdown" data-end="' . esc_attr( (int) $timestamp ) . '" aria-label="' . esc_attr__( 'العدّ التنازلي', 'blr-shop-pro' ) . '"></div>';
}

// [blr_pricing category="plans"] — جدول خطط الاشتراك من تصنيف ووكومرس.
add_shortcode( 'blr_pricing', function ( $a ) {
	if ( ! blr_is_woo() ) {
		return '';
	}
	$a   = shortcode_atts( array( 'category' => '', 'limit' => 4, 'highlight' => 2 ), $a );
	$ids = wc_get_products(
		array(
			'status'   => 'publish',
			'limit'    => absint( $a['limit'] ),
			'category' => array_filter( array_map( 'sanitize_title', explode( ',', $a['category'] ) ) ),
			'orderby'  => 'menu_order',
			'order'    => 'ASC',
		)
	);
	if ( ! $ids ) {
		return '';
	}
	ob_start();
	echo '<div class="lp-grid lp-grid--price">';
	foreach ( $ids as $i => $p ) {
		$hot = ( $i + 1 ) === (int) $a['highlight'];
		echo '<article class="lp-card lp-price' . ( $hot ? ' is-hot' : '' ) . '"><h3>' . esc_html( $p->get_name() ) . '</h3>';
		echo '<div class="lp-amount">' . wp_kses_post( $p->get_price_html() ) . '</div>';
		echo '<div class="lp-desc">' . wp_kses_post( wpautop( $p->get_short_description() ) ) . '</div>';
		echo '<a class="blr-btn' . ( $hot ? '' : ' blr-btn--ghost' ) . '" href="' . esc_url( $p->get_permalink() ) . '">' . esc_html( $p->single_add_to_cart_text() ) . '</a></article>';
	}
	echo '</div>';
	return ob_get_clean();
} );

// [blr_products type="digital|physical|subscription|sale|best|new" limit="8"]
add_shortcode( 'blr_products', function ( $a ) {
	if ( ! blr_is_woo() ) {
		return '';
	}
	$a = shortcode_atts( array( 'type' => 'new', 'limit' => 8 ), $a );
	return blr_products_row( $a['type'], absint( $a['limit'] ) );
} );

/**
 * Build a horizontal scroll row of products.
 */
function blr_products_row( $type, $limit = 8 ) {
	$args = array( 'post_type' => 'product', 'posts_per_page' => $limit, 'post_status' => 'publish', 'no_found_rows' => true );
	switch ( $type ) {
		case 'digital':
		case 'physical':
		case 'subscription':
		case 'service':
			$args['meta_query'] = array( array( 'key' => '_blr_ptype', 'value' => $type ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
			if ( 'digital' === $type ) {
				$args['meta_query'] = array( 'relation' => 'OR', array( 'key' => '_blr_ptype', 'value' => 'digital' ), array( 'key' => '_downloadable', 'value' => 'yes' ) );
			}
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
		return '<p class="blr-empty">' . esc_html__( 'لا توجد منتجات بعد.', 'blr-shop-pro' ) . '</p>';
	}
	ob_start();
	echo '<div class="blr-row-wrap"><button class="blr-row-nav" data-dir="-1" aria-label="prev">‹</button><ul class="blr-row products">';
	while ( $q->have_posts() ) {
		$q->the_post();
		wc_get_template_part( 'content', 'product' );
	}
	echo '</ul><button class="blr-row-nav" data-dir="1" aria-label="next">›</button></div>';
	wp_reset_postdata();
	return ob_get_clean();
}

/* ---------- Newsletter (يرسل للبريد، بلا خدمات خارجية) ---------- */
add_action( 'admin_post_nopriv_blr_news', 'blr_news_submit' );
add_action( 'admin_post_blr_news', 'blr_news_submit' );
function blr_news_submit() {
	$back = wp_get_referer() ?: home_url( '/' );
	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'blr_news' ) || ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( $back );
		exit;
	}
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( is_email( $email ) ) {
		$list = get_option( 'blr_subscribers', array() );
		if ( ! in_array( $email, $list, true ) ) {
			$list[] = $email;
			update_option( 'blr_subscribers', array_slice( $list, -5000 ), false );
			wp_mail( get_option( 'admin_email' ), '[' . get_bloginfo( 'name' ) . '] مشترك جديد', $email );
		}
		$back = add_query_arg( 'subscribed', '1', $back );
	}
	wp_safe_redirect( $back );
	exit;
}
