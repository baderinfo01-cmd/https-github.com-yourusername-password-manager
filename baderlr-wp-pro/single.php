<?php
/**
 * مقال مفرد.
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
if ( baderlr_el_location( 'single' ) ) { get_footer(); return; }
while ( have_posts() ) : the_post(); ?>
	<article <?php post_class( 'blr-section' ); ?>>
		<div class="blr-container">
			<header class="blr-sec-head">
				<?php $cat = get_the_category(); if ( $cat ) : ?><span class="blr-badge"><?php echo esc_html( $cat[0]->name ); ?></span><?php endif; ?>
				<h1 style="margin-top:.4em"><?php the_title(); ?></h1>
				<p style="color:var(--muted)"><?php baderlr_posted_on(); ?></p>
			</header>
			<?php if ( has_post_thumbnail() ) : ?>
				<figure class="blr-narrow" style="margin-bottom:30px"><?php the_post_thumbnail( 'baderlr-wide', array( 'style' => 'border-radius:var(--radius-lg)' ) ); ?></figure>
			<?php endif; ?>
			<div class="blr-entry"><?php the_content(); wp_link_pages(); ?></div>
			<footer class="blr-narrow" style="margin-top:28px;padding-top:20px;border-top:1px solid var(--line)">
				<?php the_tags( '<div class="blr-tags">', ' ', '</div>' ); ?>
			</footer>
			<div class="blr-narrow" style="margin-top:20px"><?php
				the_post_navigation( array(
					'prev_text' => '<span>&larr; %title</span>',
					'next_text' => '<span>%title &rarr;</span>',
				) );
			?></div>
			<?php if ( comments_open() || get_comments_number() ) : echo '<div class="blr-narrow" style="margin-top:40px">'; comments_template(); echo '</div>'; endif; ?>
		</div>
	</article>
<?php endwhile;
get_footer();
