<article <?php post_class( 'blr-post' ); ?>>
	<?php if ( has_post_thumbnail() ) : ?>
		<a class="blr-post__img" href="<?php the_permalink(); ?>"><?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy' ) ); ?></a>
	<?php endif; ?>
	<div class="blr-post__body">
		<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
		<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
		<p><?php echo esc_html( get_the_excerpt() ); ?></p>
	</div>
</article>
