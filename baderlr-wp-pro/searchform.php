<?php
/**
 * نموذج البحث.
 *
 * @package baderlr-wp
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<form role="search" method="get" class="blr-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:flex;gap:8px">
	<label class="screen-reader-text" for="blr-s"><?php esc_html_e( 'بحث', 'baderlr-wp' ); ?></label>
	<input type="search" id="blr-s" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'ابحث...', 'baderlr-wp' ); ?>">
	<button type="submit" class="blr-btn blr-btn--primary"><?php esc_html_e( 'بحث', 'baderlr-wp' ); ?></button>
</form>
