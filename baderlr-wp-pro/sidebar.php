<?php
/**
 * الشريط الجانبي.
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! is_active_sidebar( 'sidebar-1' ) ) { return; }
?>
<aside class="blr-sidebar" aria-label="<?php esc_attr_e( 'الشريط الجانبي', 'baderlr-wp' ); ?>">
	<?php dynamic_sidebar( 'sidebar-1' ); ?>
</aside>
