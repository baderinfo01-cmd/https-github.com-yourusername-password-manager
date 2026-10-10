<?php
/**
 * الشريط الجانبي.
 *
 * @package blr-shop-pro
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! is_active_sidebar( 'sidebar-1' ) ) { return; }
?>
<aside class="blr-sidebar" aria-label="<?php esc_attr_e( 'الشريط الجانبي', 'blr-shop-pro' ); ?>">
	<?php dynamic_sidebar( 'sidebar-1' ); ?>
</aside>
