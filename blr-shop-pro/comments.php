<?php
/**
 * Comments.
 *
 * @package BLR_Shop_Pro
 */

if ( post_password_required() ) {
	return;
}
?>
<section id="comments" class="blr-comments">
	<?php if ( have_comments() ) : ?>
		<h2><?php printf( esc_html( _n( 'تعليق واحد', '%d تعليقات', get_comments_number(), 'blr-shop-pro' ) ), (int) get_comments_number() ); ?></h2>
		<ol class="blr-comment-list"><?php wp_list_comments( array( 'style' => 'ol', 'avatar_size' => 48 ) ); ?></ol>
		<?php the_comments_pagination(); ?>
	<?php endif; ?>
	<?php comment_form(); ?>
</section>
