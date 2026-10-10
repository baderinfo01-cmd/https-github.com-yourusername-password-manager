<?php
/**
 * Front page — واجهة المتجر.
 *
 * @package BLR_Shop_Pro
 */

get_header();

$on = function ( $k ) {
	return (bool) get_theme_mod( $k, true );
};
?>
<main id="main" class="blr-home">

	<?php if ( $on( 'blr_show_slider' ) ) : ?>
		<section class="blr-home__hero">
			<?php
			if ( shortcode_exists( 'blr_slider' ) ) {
				$sid = absint( get_theme_mod( 'blr_slider_id', 0 ) );
				echo do_shortcode( $sid ? '[blr_slider id="' . $sid . '"]' : '[blr_slider]' );
			} else {
				?>
				<div class="blr-hero-fallback"><div class="blr-wrap">
					<h1><?php echo esc_html( get_theme_mod( 'blr_hero_title', '' ) ); ?></h1>
					<p><?php echo esc_html( get_theme_mod( 'blr_hero_text', '' ) ); ?></p>
					<?php if ( blr_is_woo() ) : ?><a class="blr-btn blr-btn--lg blr-btn--light" href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"><?php esc_html_e( 'تسوّق الآن', 'blr-shop-pro' ); ?></a><?php endif; ?>
				</div></div>
			<?php } ?>
		</section>
	<?php endif; ?>

	<?php if ( $on( 'blr_show_trust' ) ) : ?>
		<section class="blr-trustbar"><div class="blr-wrap">
			<div><?php echo blr_icon( 'bolt', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'تسليم فوري', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'للمنتجات الرقمية', 'blr-shop-pro' ); ?></span></div>
			<div><?php echo blr_icon( 'truck', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'شحن سريع', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'للمنتجات المادية', 'blr-shop-pro' ); ?></span></div>
			<div><?php echo blr_icon( 'repeat', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'اشتراكات مرنة', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'ألغِ في أي وقت', 'blr-shop-pro' ); ?></span></div>
			<div><?php echo blr_icon( 'shield', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'دفع آمن', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'حماية كاملة', 'blr-shop-pro' ); ?></span></div>
		</div></section>
	<?php endif; ?>

	<?php if ( blr_is_woo() ) : ?>

		<?php if ( $on( 'blr_show_cats' ) ) :
			$cats = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => true, 'number' => 8, 'parent' => 0, 'exclude' => array( (int) get_option( 'default_product_cat' ) ) ) );
			if ( $cats && ! is_wp_error( $cats ) ) : ?>
			<section class="blr-sec blr-wrap">
				<h2 class="blr-sec__t"><?php esc_html_e( 'تسوّق حسب التصنيف', 'blr-shop-pro' ); ?></h2>
				<div class="blr-cats">
					<?php foreach ( $cats as $c ) :
						$img = get_term_meta( $c->term_id, 'thumbnail_id', true ); ?>
						<a href="<?php echo esc_url( get_term_link( $c ) ); ?>" class="blr-cat">
							<?php echo $img ? wp_get_attachment_image( $img, 'thumbnail', false, array( 'loading' => 'lazy' ) ) : '<span class="blr-cat__ph">' . esc_html( mb_substr( $c->name, 0, 1 ) ) . '</span>'; // phpcs:ignore ?>
							<span><?php echo esc_html( $c->name ); ?></span>
						</a>
					<?php endforeach; ?>
				</div>
			</section>
		<?php endif; endif; ?>

		<?php if ( $on( 'blr_show_types' ) ) : ?>
			<section class="blr-sec blr-wrap" data-blr-tabs>
				<h2 class="blr-sec__t"><?php esc_html_e( 'اختر ما يناسبك', 'blr-shop-pro' ); ?></h2>
				<div class="blr-tabs" role="tablist">
					<button role="tab" class="is-on" data-tab="digital"><?php esc_html_e( 'منتجات رقمية', 'blr-shop-pro' ); ?></button>
					<button role="tab" data-tab="physical"><?php esc_html_e( 'منتجات مادية', 'blr-shop-pro' ); ?></button>
					<button role="tab" data-tab="subscription"><?php esc_html_e( 'اشتراكات', 'blr-shop-pro' ); ?></button>
				</div>
				<?php foreach ( array( 'digital', 'physical', 'subscription' ) as $i => $t ) : ?>
					<div class="blr-tabpane" data-pane="<?php echo esc_attr( $t ); ?>" <?php echo $i ? 'hidden' : ''; ?>><?php echo blr_products_row( $t, 8 ); // phpcs:ignore ?></div>
				<?php endforeach; ?>
			</section>
		<?php endif; ?>

		<?php if ( $on( 'blr_show_deals' ) && wc_get_product_ids_on_sale() ) : ?>
			<section class="blr-sec blr-sec--deals"><div class="blr-wrap">
				<h2 class="blr-sec__t">🔥 <?php esc_html_e( 'عروض لفترة محدودة', 'blr-shop-pro' ); ?></h2>
				<?php echo blr_products_row( 'sale', 8 ); // phpcs:ignore ?>
			</div></section>
		<?php endif; ?>

		<?php if ( $on( 'blr_show_best' ) ) : ?>
			<section class="blr-sec blr-wrap">
				<h2 class="blr-sec__t"><?php esc_html_e( 'الأكثر مبيعاً', 'blr-shop-pro' ); ?></h2>
				<?php echo blr_products_row( 'best', 8 ); // phpcs:ignore ?>
			</section>
		<?php endif; ?>

	<?php endif; ?>

	<?php if ( $on( 'blr_show_posts' ) ) :
		$posts = new WP_Query( array( 'posts_per_page' => 3, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
		if ( $posts->have_posts() ) : ?>
		<section class="blr-sec blr-wrap">
			<h2 class="blr-sec__t"><?php esc_html_e( 'من المدونة', 'blr-shop-pro' ); ?></h2>
			<div class="blr-posts"><?php while ( $posts->have_posts() ) : $posts->the_post(); get_template_part( 'template-parts/card' ); endwhile; wp_reset_postdata(); ?></div>
		</section>
	<?php endif; endif; ?>

	<?php if ( $on( 'blr_show_newsletter' ) ) : ?>
		<section class="lp-cta"><div class="blr-wrap">
			<h2><?php esc_html_e( 'اشترك في نشرتنا', 'blr-shop-pro' ); ?></h2>
			<p><?php echo isset( $_GET['subscribed'] ) ? esc_html__( 'شكراً! تم اشتراكك.', 'blr-shop-pro' ) : esc_html__( 'عروض حصرية ومنتجات جديدة تصلك أولاً.', 'blr-shop-pro' ); // phpcs:ignore ?></p>
			<form class="blr-news" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="blr_news">
				<?php wp_nonce_field( 'blr_news' ); ?>
				<input type="text" name="website" tabindex="-1" autocomplete="off" class="blr-hp" aria-hidden="true">
				<input type="email" name="email" required placeholder="<?php esc_attr_e( 'بريدك الإلكتروني', 'blr-shop-pro' ); ?>">
				<button class="blr-btn blr-btn--light" type="submit"><?php esc_html_e( 'اشترك', 'blr-shop-pro' ); ?></button>
			</form>
		</div></section>
	<?php endif; ?>
</main>
<?php
get_footer();
