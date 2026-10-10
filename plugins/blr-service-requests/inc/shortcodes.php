<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bisr_enqueue_css() {
	wp_enqueue_style( 'bisr-pages', BISR_URL . 'assets/bi-pages.css', array(), bisr_ver( 'assets/bi-pages.css' ) );
}

/** تحميل CSS تلقائياً في الصفحات التي تحتوي class="bi". */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular() ) {
		return;
	}
	$p = get_post();
	if ( $p && ( false !== strpos( $p->post_content, 'class="bi' ) || has_shortcode( $p->post_content, 'bi_request' ) || has_shortcode( $p->post_content, 'bi_contact' ) ) ) {
		bisr_enqueue_css();
	}
} );

function bisr_enqueue_form( $lang ) {
	bisr_enqueue_css();
	wp_enqueue_script( 'bisr-forms', BISR_URL . 'assets/bi-forms.js', array(), bisr_ver( 'assets/bi-forms.js' ), true );
	static $done = false;
	if ( ! $done ) {
		$done = true;
		wp_localize_script( 'bisr-forms', 'BISR', array(
			'rest'    => esc_url_raw( rest_url( 'bi/v1/' ) ),
			'catalog' => BISR_URL . 'data/catalog.json?v=' . bisr_ver( 'data/catalog.json' ),
			'strings' => bisr_strings(),
		) );
	}
}

add_shortcode( 'bi_request', function ( $atts ) {
	$a = shortcode_atts( array( 'lang' => 'ar' ), $atts );
	$lang = bisr_lang( $a['lang'] );
	bisr_enqueue_form( $lang );
	return '<form class="bi-form" data-bisr="request" data-lang="' . esc_attr( $lang ) . '" dir="' . esc_attr( bisr_s( $lang, 'dir' ) ) . '" novalidate><noscript>JavaScript required.</noscript></form>';
} );

add_shortcode( 'bi_contact', function ( $atts ) {
	$a = shortcode_atts( array( 'lang' => 'ar' ), $atts );
	$lang = bisr_lang( $a['lang'] );
	bisr_enqueue_form( $lang );
	return '<form class="bi-form" data-bisr="contact" data-lang="' . esc_attr( $lang ) . '" dir="' . esc_attr( bisr_s( $lang, 'dir' ) ) . '" novalidate><noscript>JavaScript required.</noscript></form>';
} );

add_shortcode( 'bi_contact_info', function ( $atts ) {
	$a = shortcode_atts( array( 'lang' => 'ar' ), $atts );
	$lang = bisr_lang( $a['lang'] );
	bisr_enqueue_css();
	$rows = array();
	$phone = bisr_opt( 'phone' );
	$wa    = preg_replace( '/\D+/', '', (string) bisr_opt( 'whatsapp' ) );
	$mail  = bisr_opt( 'public_email' );
	if ( $phone ) {
		$rows[] = '📞 <b>' . esc_html( bisr_s( $lang, 'phone' ) ) . ':</b> <a href="tel:' . esc_attr( preg_replace( '/[^\d+]/', '', $phone ) ) . '" dir="ltr">' . esc_html( $phone ) . '</a>';
	}
	if ( $wa ) {
		$rows[] = '💬 <b>' . esc_html( bisr_s( $lang, 'wa' ) ) . ':</b> <a href="https://wa.me/' . esc_attr( $wa ) . '" target="_blank" rel="noopener" dir="ltr">+' . esc_html( $wa ) . '</a>';
	}
	if ( $mail ) {
		$rows[] = '✉️ <b>' . esc_html( bisr_s( $lang, 'email' ) ) . ':</b> <a href="mailto:' . esc_attr( $mail ) . '" dir="ltr">' . esc_html( $mail ) . '</a>';
	}
	foreach ( array( 'addr' => '📍', 'hours' => '🕒' ) as $k => $ic ) {
		$v = bisr_opt( $k . '_' . $lang, bisr_opt( $k ) );
		if ( $v ) {
			$rows[] = $ic . ' <b>' . esc_html( bisr_s( $lang, $k ) ) . ':</b> ' . esc_html( $v );
		}
	}
	if ( ! $rows ) {
		return '<p class="bi-sub">' . esc_html( bisr_s( $lang, 'soon' ) ) . '</p>';
	}
	return '<ul class="bi-info-list"><li>' . implode( '</li><li>', $rows ) . '</li></ul>'; // phpcs:ignore WordPress.Security.EscapeOutput
} );

add_shortcode( 'bi_products', function ( $atts ) {
	$a = shortcode_atts( array( 'kind' => 'physical', 'limit' => 12, 'lang' => 'ar' ), $atts );
	$lang = bisr_lang( $a['lang'] );
	bisr_enqueue_css();
	if ( ! class_exists( 'WooCommerce' ) ) {
		return '<div class="bi-placeholder">' . esc_html( bisr_s( $lang, 'noshop' ) ) . '</div>';
	}
	$limit = max( 1, min( 48, (int) $a['limit'] ) );
	$args  = array( 'post_type' => 'product', 'post_status' => 'publish', 'posts_per_page' => $limit, 'fields' => 'ids', 'no_found_rows' => true );
	if ( 'digital' === $a['kind'] ) {
		$args['meta_query'] = array( 'relation' => 'OR', array( 'key' => '_virtual', 'value' => 'yes' ), array( 'key' => '_downloadable', 'value' => 'yes' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	} else {
		$args['meta_query'] = array( 'relation' => 'AND', array( 'key' => '_virtual', 'value' => 'yes', 'compare' => '!=' ), array( 'key' => '_downloadable', 'value' => 'yes', 'compare' => '!=' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	}
	$ids = get_posts( $args );
	if ( ! $ids ) {
		return '<div class="bi-placeholder">' . esc_html( bisr_s( $lang, 'noshop' ) ) . '</div>';
	}
	return do_shortcode( '[products ids="' . implode( ',', array_map( 'absint', $ids ) ) . '" columns="4"]' );
} );

add_shortcode( 'bi_posts', function ( $atts ) {
	$a = shortcode_atts( array( 'limit' => 9, 'category' => '', 'lang' => 'ar' ), $atts );
	$lang = bisr_lang( $a['lang'] );
	bisr_enqueue_css();
	$q = new WP_Query( array( 'post_type' => 'post', 'posts_per_page' => max( 1, min( 30, (int) $a['limit'] ) ), 'category_name' => sanitize_title( $a['category'] ), 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
	if ( ! $q->have_posts() ) {
		return '<div class="bi-placeholder">' . esc_html( bisr_s( $lang, 'noposts' ) ) . '</div>';
	}
	$out = '<div class="bi-grid bi-posts">';
	while ( $q->have_posts() ) {
		$q->the_post();
		$img  = has_post_thumbnail() ? get_the_post_thumbnail( null, 'medium_large', array( 'loading' => 'lazy' ) ) : '';
		$out .= '<a class="bi-card" href="' . esc_url( get_permalink() ) . '">' . $img . '<h3>' . esc_html( get_the_title() ) . '</h3><p>' . esc_html( wp_trim_words( get_the_excerpt(), 24 ) ) . '</p><span class="bi-more">' . esc_html( bisr_s( $lang, 'read' ) ) . '</span></a>';
	}
	wp_reset_postdata();
	return $out . '</div>';
} );

add_shortcode( 'bi_portfolio', function ( $atts ) {
	$a = shortcode_atts( array( 'limit' => 24, 'lang' => 'ar' ), $atts );
	$lang = bisr_lang( $a['lang'] );
	bisr_enqueue_css();
	$q = new WP_Query( array( 'post_type' => 'bi_work', 'posts_per_page' => max( 1, min( 60, (int) $a['limit'] ) ), 'no_found_rows' => true ) );
	if ( ! $q->have_posts() ) {
		return '<div class="bi-placeholder">' . esc_html( bisr_s( $lang, 'noworks' ) ) . '</div>';
	}
	$out = '<div class="bi-grid bi-posts">';
	while ( $q->have_posts() ) {
		$q->the_post();
		$url  = get_post_meta( get_the_ID(), 'bi_url', true );
		$href = $url ? esc_url( $url ) : '';
		$img  = has_post_thumbnail() ? get_the_post_thumbnail( null, 'medium_large', array( 'loading' => 'lazy' ) ) : '';
		$tag  = $href ? 'a' : 'div';
		$out .= '<' . $tag . ' class="bi-card"' . ( $href ? ' href="' . $href . '" target="_blank" rel="noopener"' : '' ) . '>' . $img . '<h3>' . esc_html( get_the_title() ) . '</h3><p>' . esc_html( wp_trim_words( wp_strip_all_tags( get_the_content() ), 26 ) ) . '</p>' . ( $href ? '<span class="bi-more">' . esc_html( bisr_s( $lang, 'open' ) ) . '</span>' : '' ) . '</' . $tag . '>';
	}
	wp_reset_postdata();
	return $out . '</div>';
} );
