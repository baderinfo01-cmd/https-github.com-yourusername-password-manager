<?php
/**
 * 404.
 *
 * @package BLR_Shop_Pro
 */

get_header();
?>
<main id="main" class="blr-wrap blr-wrap--narrow blr-404">
	<h1>404</h1>
	<p><?php esc_html_e( 'الصفحة التي تبحث عنها غير موجودة.', 'blr-shop-pro' ); ?></p>
	<?php get_search_form(); ?>
	<p><a class="blr-btn" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'العودة للرئيسية', 'blr-shop-pro' ); ?></a></p>
</main>
<?php
get_footer();
