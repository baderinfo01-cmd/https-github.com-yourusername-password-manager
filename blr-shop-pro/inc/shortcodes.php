<?php
/**
 * أكواد مختصرة مساعدة.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** [baderlr_year] → السنة الحالية (لنص الحقوق). */
add_shortcode( 'baderlr_year', function () {
	return esc_html( gmdate( 'Y' ) );
} );

/** [baderlr_button text="..." url="..." style="primary|ghost"] */
add_shortcode( 'baderlr_button', function ( $atts ) {
	$a = shortcode_atts( array( 'text' => __( 'اعرف المزيد', 'blr-shop-pro' ), 'url' => '#', 'style' => 'primary' ), $atts );
	$style = in_array( $a['style'], array( 'primary', 'ghost', 'soft' ), true ) ? $a['style'] : 'primary';
	return '<a class="blr-btn blr-btn--' . esc_attr( $style ) . '" href="' . esc_url( $a['url'] ) . '">' . esc_html( $a['text'] ) . '</a>';
} );

/** [baderlr_stat number="500+" label="عميل"] */
add_shortcode( 'baderlr_stat', function ( $atts ) {
	$a = shortcode_atts( array( 'number' => '', 'label' => '' ), $atts );
	return '<div class="blr-stat"><b>' . esc_html( $a['number'] ) . '</b><span>' . esc_html( $a['label'] ) . '</span></div>';
} );
