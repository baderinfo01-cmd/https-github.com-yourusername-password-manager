<?php
/**
 * تحسين محركات البحث: بيانات Schema أساسية + Open Graph.
 * يتوقّف تلقائياً إذا كانت إضافة SEO معروفة مفعّلة (Yoast / Rank Math).
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_seo_active() {
	return defined( 'WPSEO_VERSION' ) || class_exists( 'RankMath' );
}

/**
 * Open Graph + Twitter card في الرأس.
 */
function baderlr_seo_meta() {
	if ( baderlr_seo_active() ) {
		return;
	}
	$title = wp_get_document_title();
	$desc  = '';
	if ( is_singular() ) {
		$desc = has_excerpt() ? get_the_excerpt() : wp_trim_words( wp_strip_all_tags( get_the_content() ), 30 );
	} else {
		$desc = get_bloginfo( 'description' );
	}
	$img = ( is_singular() && has_post_thumbnail() ) ? get_the_post_thumbnail_url( null, 'baderlr-wide' ) : '';

	echo "\n<meta property=\"og:site_name\" content=\"" . esc_attr( get_bloginfo( 'name' ) ) . "\">\n";
	echo '<meta property="og:title" content="' . esc_attr( $title ) . "\">\n";
	echo '<meta property="og:description" content="' . esc_attr( $desc ) . "\">\n";
	echo '<meta property="og:type" content="' . ( is_singular() ? 'article' : 'website' ) . "\">\n";
	echo '<meta property="og:url" content="' . esc_url( home_url( add_query_arg( null, null ) ) ) . "\">\n";
	if ( $img ) {
		echo '<meta property="og:image" content="' . esc_url( $img ) . "\">\n";
		echo "<meta name=\"twitter:card\" content=\"summary_large_image\">\n";
	} else {
		echo "<meta name=\"twitter:card\" content=\"summary\">\n";
	}
}
add_action( 'wp_head', 'baderlr_seo_meta', 5 );

/**
 * Schema.org (Organization + WebSite) في الواجهة.
 */
function baderlr_seo_schema() {
	if ( baderlr_seo_active() || is_admin() ) {
		return;
	}
	$schema = array(
		'@context' => 'https://schema.org',
		'@type'    => 'Organization',
		'name'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
	);
	if ( has_custom_logo() ) {
		$logo_id = get_theme_mod( 'custom_logo' );
		$src     = wp_get_attachment_image_url( $logo_id, 'full' );
		if ( $src ) {
			$schema['logo'] = $src;
		}
	}
	$phone = get_theme_mod( 'baderlr_phone', '' );
	if ( $phone ) {
		$schema['contactPoint'] = array( '@type' => 'ContactPoint', 'telephone' => $phone, 'contactType' => 'customer service' );
	}
	echo "\n<script type=\"application/ld+json\">" . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . "</script>\n";
}
add_action( 'wp_head', 'baderlr_seo_schema', 6 );
