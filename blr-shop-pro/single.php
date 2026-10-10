<?php
/**
 * Single post.
 *
 * @package BLR_Shop_Pro
 */

get_header();
the_post();
?>
<main id="main" class="blr-wrap blr-wrap--narrow">
	<article <?php post_class( 'blr-article' ); ?>>
		<h1 class="blr-title"><?php the_title(); ?></h1>
		<p class="blr-meta"><?php echo esc_html( get_the_date() ); ?> · <?php the_author(); ?></p>
		<?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'large', array( 'class' => 'blr-article__img' ) ); } ?>
		<div class="blr-content"><?php the_content(); wp_link_pages(); ?></div>
	</article>
	<?php if ( comments_open() || get_comments_number() ) { comments_template(); } ?>
</main>
<?php
get_footer();
