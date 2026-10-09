<?php
/**
 * صفحة ثابتة.
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
if ( baderlr_el_location( 'single' ) ) { get_footer(); return; }
while ( have_posts() ) : the_post(); ?>
	<article <?php post_class( 'blr-section' ); ?>>
		<div class="blr-container">
			<header class="blr-sec-head"><h1><?php the_title(); ?></h1></header>
			<?php if ( has_post_thumbnail() ) : ?>
				<figure class="blr-narrow" style="margin-bottom:30px"><?php the_post_thumbnail( 'baderlr-wide', array( 'style' => 'border-radius:var(--radius-lg)' ) ); ?></figure>
			<?php endif; ?>
			<div class="blr-entry"><?php the_content(); wp_link_pages(); ?></div>
			<?php if ( comments_open() || get_comments_number() ) : echo '<div class="blr-narrow" style="margin-top:40px">'; comments_template(); echo '</div>'; endif; ?>
		</div>
	</article>
<?php endwhile;
get_footer();
