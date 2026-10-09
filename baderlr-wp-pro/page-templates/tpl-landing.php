<?php
/**
 * Template Name: صفحة هبوط (عرض كامل)
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
while ( have_posts() ) : the_post(); ?>
	<article <?php post_class( 'blr-landing' ); ?>>
		<?php the_content(); ?>
	</article>
<?php endwhile;
get_footer();
