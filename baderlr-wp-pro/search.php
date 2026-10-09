<?php
/**
 * نتائج البحث.
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
?>
<div class="blr-section">
	<div class="blr-container">
		<header class="blr-sec-head">
			<h1><?php printf( esc_html__( 'نتائج البحث عن: %s', 'baderlr-wp' ), '<span>' . esc_html( get_search_query() ) . '</span>' ); ?></h1>
		</header>
		<?php if ( have_posts() ) : ?>
			<div class="blr-grid blr-grid--3">
				<?php while ( have_posts() ) : the_post(); baderlr_post_card(); endwhile; ?>
			</div>
			<?php baderlr_pagination(); ?>
		<?php else : ?>
			<div class="blr-narrow" style="text-align:center">
				<p><?php esc_html_e( 'لم يُعثر على نتائج. جرّب كلمات أخرى.', 'baderlr-wp' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</div>
<?php get_footer();
