<?php
/**
 * غلاف WooCommerce.
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
?>
<div class="blr-section">
	<div class="blr-container">
		<?php woocommerce_content(); ?>
	</div>
</div>
<?php get_footer();
