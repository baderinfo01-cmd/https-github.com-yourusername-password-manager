<?php
/**
 * نموذج البحث.
 *
 * @package blr-shop-pro
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<form role="search" method="get" class="blr-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:flex;gap:8px">
	<label class="screen-reader-text" for="blr-s"><?php esc_html_e( 'بحث', 'blr-shop-pro' ); ?></label>
	<input type="search" id="blr-s" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'ابحث...', 'blr-shop-pro' ); ?>">
	<button type="submit" class="blr-btn blr-btn--primary"><?php esc_html_e( 'بحث', 'blr-shop-pro' ); ?></button>
</form>
