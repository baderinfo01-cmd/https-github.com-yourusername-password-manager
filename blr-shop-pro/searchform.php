<form role="search" method="get" class="blr-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<input type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'بحث…', 'blr-shop-pro' ); ?>">
	<button type="submit" class="blr-btn"><?php esc_html_e( 'بحث', 'blr-shop-pro' ); ?></button>
</form>
