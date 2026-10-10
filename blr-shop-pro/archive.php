<?php
/**
 * الأرشيف (التصنيفات، الوسوم، أنواع المحتوى).
 *
 * @package blr-shop-pro
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
if ( baderlr_el_location( 'archive' ) ) { get_footer(); return; }
?>
<div class="blr-section">
	<div class="blr-container">
		<header class="blr-sec-head">
			<?php the_archive_title( '<h1>', '</h1>' ); the_archive_description( '<p>', '</p>' ); ?>
		</header>
		<?php if ( have_posts() ) : ?>
			<div class="blr-grid blr-grid--3">
				<?php while ( have_posts() ) : the_post(); baderlr_post_card(); endwhile; ?>
			</div>
			<?php baderlr_pagination(); ?>
		<?php else : ?>
			<p style="text-align:center"><?php esc_html_e( 'لا توجد عناصر.', 'blr-shop-pro' ); ?></p>
		<?php endif; ?>
	</div>
</div>
<?php get_footer();
