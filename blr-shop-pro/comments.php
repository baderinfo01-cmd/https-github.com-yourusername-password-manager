<?php
/**
 * التعليقات.
 *
 * @package blr-shop-pro
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( post_password_required() ) { return; }
?>
<div id="comments" class="blr-comments">
	<?php if ( have_comments() ) : ?>
		<h3><?php printf( esc_html( _n( 'تعليق واحد', '%s تعليقات', get_comments_number(), 'blr-shop-pro' ) ), esc_html( number_format_i18n( get_comments_number() ) ) ); ?></h3>
		<ol class="comment-list" style="list-style:none;padding:0">
			<?php wp_list_comments( array( 'style' => 'ol', 'avatar_size' => 48 ) ); ?>
		</ol>
		<?php the_comments_pagination(); ?>
	<?php endif; ?>
	<?php comment_form(); ?>
</div>
