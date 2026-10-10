<?php
/**
 * أنماط كتل احترافية جاهزة (Block Patterns) — فئة BaderLR.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_register_patterns() {
	if ( ! function_exists( 'register_block_pattern_category' ) ) {
		return;
	}
	register_block_pattern_category( 'baderlr', array( 'label' => __( 'BLR Shop', 'blr-shop-pro' ) ) );

	/* ---- Hero ---- */
	register_block_pattern( 'baderlr/hero', array(
		'title'      => __( 'قسم ترحيبي (Hero)', 'blr-shop-pro' ),
		'categories' => array( 'baderlr', 'featured' ),
		'content'    => '<!-- wp:cover {"minHeight":560,"gradient":"brand-soft","align":"full"} -->
<div class="wp-block-cover alignfull has-brand-soft-gradient-background has-background-gradient" style="min-height:560px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","fontSize":"small","textColor":"accent"} -->
<p class="has-text-align-center has-accent-color has-text-color has-small-font-size">✦ ' . esc_html__( 'قالب احترافي بالذكاء الاصطناعي', 'blr-shop-pro' ) . '</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":1,"fontSize":"xx-large"} -->
<h1 class="wp-block-heading has-text-align-center has-xx-large-font-size">' . esc_html__( 'ابنِ موقعاً استثنائياً في دقائق', 'blr-shop-pro' ) . '</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","fontSize":"medium","textColor":"muted"} -->
<p class="has-text-align-center has-muted-color has-text-color has-medium-font-size">' . esc_html__( 'تصميم عصري، سرعة عالية، ومولّد محتوى ذكي — كل ما تحتاجه لإطلاق موقع شركتك باحترافية.', 'blr-shop-pro' ) . '</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">' . esc_html__( 'ابدأ الآن', 'blr-shop-pro' ) . '</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button">' . esc_html__( 'شاهد العرض', 'blr-shop-pro' ) . '</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:cover -->',
	) );

	/* ---- Features (3 columns) ---- */
	register_block_pattern( 'baderlr/features', array(
		'title'      => __( 'ثلاث مزايا', 'blr-shop-pro' ),
		'categories' => array( 'baderlr' ),
		'content'    => '<!-- wp:heading {"textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center">' . esc_html__( 'لماذا تختارنا', 'blr-shop-pro' ) . '</h2>
<!-- /wp:heading -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">' . baderlr_pattern_feature_col( '⚡', __( 'أداء فائق', 'blr-shop-pro' ), __( 'كود نظيف وتحميل سريع يرضي محركات البحث وزوّارك.', 'blr-shop-pro' ) )
		. baderlr_pattern_feature_col( '✦', __( 'ذكاء اصطناعي', 'blr-shop-pro' ), __( 'ولّد نصوص صفحاتك ومنتجاتك بنقرة عبر إضافة Companion.', 'blr-shop-pro' ) )
		. baderlr_pattern_feature_col( '🛡', __( 'آمن وموثوق', 'blr-shop-pro' ), __( 'ترخيص موقّع وتحديثات مستمرة ودعم فني متواصل.', 'blr-shop-pro' ) )
		. '</div>
<!-- /wp:columns -->',
	) );

	/* ---- Stats ---- */
	register_block_pattern( 'baderlr/stats', array(
		'title'      => __( 'أرقام وإنجازات', 'blr-shop-pro' ),
		'categories' => array( 'baderlr' ),
		'content'    => '<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">' . baderlr_pattern_stat_col( '500+', __( 'عميل سعيد', 'blr-shop-pro' ) )
		. baderlr_pattern_stat_col( '99%', __( 'نسبة الرضا', 'blr-shop-pro' ) )
		. baderlr_pattern_stat_col( '24/7', __( 'دعم فني', 'blr-shop-pro' ) )
		. baderlr_pattern_stat_col( '12', __( 'سنة خبرة', 'blr-shop-pro' ) )
		. '</div>
<!-- /wp:columns -->',
	) );

	/* ---- CTA band ---- */
	register_block_pattern( 'baderlr/cta', array(
		'title'      => __( 'شريط دعوة لاتخاذ إجراء', 'blr-shop-pro' ),
		'categories' => array( 'baderlr' ),
		'content'    => '<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"60px","bottom":"60px","left":"40px","right":"40px"}},"border":{"radius":"30px"}},"gradient":"brand","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide has-brand-gradient-background has-background" style="border-radius:30px;padding:60px 40px"><!-- wp:heading {"textAlign":"center","textColor":"white"} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color">' . esc_html__( 'جاهز للانطلاق؟', 'blr-shop-pro' ) . '</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color">' . esc_html__( 'ابدأ اليوم واحصل على موقع احترافي يعكس هوية علامتك.', 'blr-shop-pro' ) . '</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"white","textColor":"accent"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-accent-color has-white-background-color has-text-color has-background wp-element-button">' . esc_html__( 'تواصل معنا', 'blr-shop-pro' ) . '</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->',
	) );
}
add_action( 'init', 'baderlr_register_patterns' );

function baderlr_pattern_feature_col( $icon, $title, $text ) {
	return '<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"fontSize":"x-large"} --><p class="has-x-large-font-size">' . esc_html( $icon ) . '</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">' . esc_html( $title ) . '</h3><!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"muted"} --><p class="has-muted-color has-text-color">' . esc_html( $text ) . '</p><!-- /wp:paragraph --></div>
<!-- /wp:column -->';
}

function baderlr_pattern_stat_col( $num, $label ) {
	return '<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"textAlign":"center","textColor":"accent"} --><h2 class="wp-block-heading has-text-align-center has-accent-color has-text-color">' . esc_html( $num ) . '</h2><!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"muted"} --><p class="has-text-align-center has-muted-color has-text-color">' . esc_html( $label ) . '</p><!-- /wp:paragraph --></div>
<!-- /wp:column -->';
}
