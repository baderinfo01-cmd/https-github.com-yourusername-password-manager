<?php
/**
 * Main template (blog / fallback).
 *
 * @package BLR_Shop_Pro
 */

get_header();
?>
<main id="main" class="blr-wrap blr-blog">
	<?php if ( is_home() && ! is_front_page() ) : ?><h1 class="blr-title"><?php single_post_title(); ?></h1><?php endif; ?>
	<?php if ( is_archive() ) : the_archive_title( '<h1 class="blr-title">', '</h1>' ); endif; ?>
	<?php if ( is_search() ) : ?><h1 class="blr-title"><?php printf( esc_html__( 'نتائج البحث عن: %s', 'blr-shop-pro' ), '<span>' . esc_html( get_search_query() ) . '</span>' ); ?></h1><?php endif; ?>

	<?php if ( have_posts() ) : ?>
		<div class="blr-posts">
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/card' );
			endwhile;
			?>
		</div>
		<?php blr_pagination(); ?>
	<?php else : ?>
		<p class="blr-empty"><?php esc_html_e( 'لا توجد نتائج.', 'blr-shop-pro' ); ?></p>
		<?php get_search_form(); ?>
	<?php endif; ?>
</main>
<?php
get_footer();
