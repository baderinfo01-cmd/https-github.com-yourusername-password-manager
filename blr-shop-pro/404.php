<?php
/**
 * صفحة غير موجودة.
 *
 * @package blr-shop-pro
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
?>
<div class="blr-section" style="text-align:center">
	<div class="blr-container blr-narrow">
		<h1 style="font-size:clamp(4rem,10vw,8rem);background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">404</h1>
		<h2><?php esc_html_e( 'الصفحة غير موجودة', 'blr-shop-pro' ); ?></h2>
		<p style="color:var(--muted)"><?php esc_html_e( 'ربما نُقلت الصفحة أو حُذفت. جرّب البحث أو العودة للرئيسية.', 'blr-shop-pro' ); ?></p>
		<div style="margin:24px 0"><?php get_search_form(); ?></div>
		<a class="blr-btn blr-btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'العودة للرئيسية', 'blr-shop-pro' ); ?></a>
	</div>
</div>
<?php get_footer();
