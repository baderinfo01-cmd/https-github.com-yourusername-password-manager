<?php
/**
 * Footer.
 *
 * @package BLR_Shop_Pro
 */
?>
<footer class="blr-footer">
	<?php if ( is_active_sidebar( 'footer-1' ) || is_active_sidebar( 'footer-2' ) || is_active_sidebar( 'footer-3' ) || is_active_sidebar( 'footer-4' ) ) : ?>
	<div class="blr-wrap blr-footer__cols">
		<?php for ( $i = 1; $i <= 4; $i++ ) : ?>
			<div><?php dynamic_sidebar( 'footer-' . $i ); ?></div>
		<?php endfor; ?>
	</div>
	<?php endif; ?>

	<div class="blr-wrap blr-footer__bottom">
		<p><?php echo esc_html( get_theme_mod( 'blr_footer_text', '' ) ?: '© ' . gmdate( 'Y' ) . ' ' . get_bloginfo( 'name' ) ); ?></p>
		<?php wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'menu_class' => 'blr-footer-menu', 'fallback_cb' => false, 'depth' => 1 ) ); ?>
		<div class="blr-social">
			<?php
			foreach ( array( 'x' => 'X', 'instagram' => 'IG', 'youtube' => 'YT', 'tiktok' => 'TT', 'telegram' => 'TG' ) as $k => $l ) {
				$u = get_theme_mod( 'blr_social_' . $k, '' );
				if ( $u ) {
					printf( '<a href="%s" target="_blank" rel="noopener" aria-label="%s">%s</a>', esc_url( $u ), esc_attr( $k ), esc_html( $l ) );
				}
			}
			?>
		</div>
	</div>
</footer>

<div class="blr-modal" id="blr-modal" hidden role="dialog" aria-modal="true"><div class="blr-modal__box"><button type="button" class="blr-modal__x" data-blr-modal-close aria-label="<?php esc_attr_e( 'إغلاق', 'blr-shop-pro' ); ?>">×</button><div id="blr-modal-body"></div></div></div>
<aside class="blr-drawer" id="blr-drawer" hidden><header><strong id="blr-drawer-title"></strong><button type="button" data-blr-drawer-close aria-label="close">×</button></header><div id="blr-drawer-body"></div></aside>
<div class="blr-cmpbar" id="blr-cmpbar" hidden><span><span data-blr-cmp-count>0</span> <?php esc_html_e( 'منتجات للمقارنة', 'blr-shop-pro' ); ?></span><button type="button" class="blr-btn" data-blr-open="compare"><?php esc_html_e( 'قارن الآن', 'blr-shop-pro' ); ?></button><button type="button" class="blr-btn blr-btn--ghost" data-blr-cmp-clear><?php esc_html_e( 'مسح', 'blr-shop-pro' ); ?></button></div>
<?php wp_footer(); ?>
</body>
</html>
