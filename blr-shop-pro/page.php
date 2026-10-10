<?php
/**
 * Page.
 *
 * @package BLR_Shop_Pro
 */

get_header();
the_post();
?>
<main id="main" class="blr-wrap<?php echo ( function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() ) ) ? '' : ' blr-wrap--narrow'; ?>">
	<h1 class="blr-title"><?php the_title(); ?></h1>
	<div class="blr-content"><?php the_content(); ?></div>
</main>
<?php
get_footer();
