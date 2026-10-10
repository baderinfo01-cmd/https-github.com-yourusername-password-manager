<?php
/**
 * المدونة / الأرشيف الافتراضي.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<div class="blr-section">
	<div class="blr-container">
		<header class="blr-sec-head">
			<h1><?php echo is_home() && ! is_front_page() ? esc_html( get_the_title( get_option( 'page_for_posts' ) ) ) : esc_html__( 'المدونة', 'blr-shop-pro' ); ?></h1>
		</header>
		<?php if ( have_posts() ) : ?>
			<div class="blr-grid blr-grid--3">
				<?php
				while ( have_posts() ) :
					the_post();
					baderlr_post_card();
				endwhile;
				?>
			</div>
			<?php baderlr_pagination(); ?>
		<?php else : ?>
			<p class="blr-narrow" style="text-align:center"><?php esc_html_e( 'لا توجد مقالات بعد.', 'blr-shop-pro' ); ?></p>
		<?php endif; ?>
	</div>
</div>
<?php
get_footer();
