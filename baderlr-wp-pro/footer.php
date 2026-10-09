<?php
/**
 * التذييل: أعمدة الودجت + شريط الحقوق + زر الصعود.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$about     = get_theme_mod( 'baderlr_footer_about', '' );
$copyright = get_theme_mod( 'baderlr_copyright', '' );
$has_cols  = is_active_sidebar( 'footer-1' ) || is_active_sidebar( 'footer-2' ) || is_active_sidebar( 'footer-3' ) || is_active_sidebar( 'footer-4' );
?>
</main>

<?php if ( ! baderlr_el_location( 'footer' ) ) : ?>
<footer class="blr-footer" role="contentinfo">
	<div class="blr-container">
		<?php if ( $has_cols || $about ) : ?>
			<div class="blr-footer__grid">
				<div class="blr-footer__brand">
					<?php baderlr_logo(); ?>
					<?php if ( $about ) : ?><p style="margin-top:14px;color:#8DA0BC"><?php echo wp_kses_post( $about ); ?></p><?php endif; ?>
				</div>
				<?php for ( $i = 1; $i <= 3; $i++ ) : ?>
					<?php if ( is_active_sidebar( 'footer-' . $i ) ) : ?>
						<div class="blr-footer__col"><?php dynamic_sidebar( 'footer-' . $i ); ?></div>
					<?php endif; ?>
				<?php endfor; ?>
			</div>
		<?php endif; ?>
	</div>
	<div class="blr-container">
		<div class="blr-footer__bottom">
			<div>
				<?php
				if ( $copyright ) {
					echo wp_kses_post( do_shortcode( $copyright ) );
				} else {
					/* translators: %1$s: year, %2$s: site name */
					printf( esc_html__( '© %1$s %2$s — كل الحقوق محفوظة.', 'baderlr-wp' ), esc_html( gmdate( 'Y' ) ), esc_html( get_bloginfo( 'name' ) ) );
				}
				?>
			</div>
			<?php if ( ! ( function_exists( 'baderlr_licensed' ) && baderlr_licensed() ) ) : ?>
				<div><?php esc_html_e( 'يعمل بـ', 'baderlr-wp' ); ?> <a href="https://baderinfo.com/baderlr-wp" target="_blank" rel="noopener">BaderLR WP</a></div>
			<?php else : ?>
				<?php if ( has_nav_menu( 'footer' ) ) : baderlr_footer_menu(); endif; ?>
			<?php endif; ?>
		</div>
	</div>
</footer>
<?php endif; // elementor footer location ?>

<button class="blr-top" id="blr-top" aria-label="<?php esc_attr_e( 'الصعود للأعلى', 'baderlr-wp' ); ?>"><?php echo baderlr_icon( 'arrow-up', 22 ); // phpcs:ignore ?></button>

<?php wp_footer(); ?>
</body>
</html>
