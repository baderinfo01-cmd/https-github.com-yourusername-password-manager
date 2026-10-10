<?php
/**
 * الصفحة الرئيسية الافتراضية للمتجر — تصميم جاهز يظهر عند عدم تعيين صفحة رئيسية.
 * إن عيّن المستخدم «صفحة ثابتة» كرئيسية، يُعرض محتواها بدلاً من ذلك.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

// إذا كانت الرئيسية صفحة ثابتة بمحتوى، اعرض المحتوى.
if ( 'page' === get_option( 'show_on_front' ) && get_the_ID() && get_post( get_the_ID() ) && trim( (string) get_post_field( 'post_content', get_the_ID() ) ) !== '' ) :
	while ( have_posts() ) :
		the_post();
		echo '<div class="blr-section"><div class="blr-container blr-entry">';
		the_content();
		echo '</div></div>';
	endwhile;
else :
	$on  = function ( $k ) {
		return (bool) get_theme_mod( $k, true );
	};
	$woo = class_exists( 'WooCommerce' );
	$shop_url = $woo ? wc_get_page_permalink( 'shop' ) : '#';
	?>
	<!-- Hero: سلايدر BLR Slider Pro إن وُجد، وإلا بانر احتياطي -->
	<?php if ( shortcode_exists( 'blr_slider' ) && get_posts( array( 'post_type' => 'blr_slider', 'numberposts' => 1, 'post_status' => 'publish', 'fields' => 'ids' ) ) ) : ?>
		<section class="bs-home-slider">
			<?php $sid = absint( get_theme_mod( 'bshop_slider_id', 0 ) ); echo do_shortcode( $sid ? '[blr_slider id="' . $sid . '"]' : '[blr_slider]' ); // phpcs:ignore ?>
		</section>
	<?php else : ?>
		<section class="blr-hero"><div class="blr-container"><div class="blr-hero__grid">
			<div class="blr-reveal is-in">
				<span class="blr-eyebrow"><?php echo baderlr_icon( 'spark', 15 ); // phpcs:ignore ?> <?php esc_html_e( 'متجر عصري', 'blr-shop-pro' ); ?></span>
				<h1><?php echo esc_html( get_theme_mod( 'bshop_hero_title', 'متجرك الرقمي والمادي في مكان واحد' ) ); ?></h1>
				<p class="blr-lead"><?php echo esc_html( get_theme_mod( 'bshop_hero_text', '' ) ); ?></p>
				<div class="blr-hero__cta"><a class="blr-btn blr-btn--primary blr-btn--lg" href="<?php echo esc_url( $shop_url ); ?>"><?php esc_html_e( 'تسوّق الآن', 'blr-shop-pro' ); ?> <?php echo baderlr_icon( 'arrow', 18 ); // phpcs:ignore ?></a></div>
			</div>
			<div class="blr-hero__art blr-reveal is-in"><div style="display:grid;place-items:center;height:100%;color:var(--accent);opacity:.8"><?php echo baderlr_icon( 'cart', 96 ); // phpcs:ignore ?></div></div>
		</div></div></section>
	<?php endif; ?>

	<?php if ( $on( 'bshop_show_trust' ) ) : ?>
		<section class="bs-trustbar"><div class="blr-container">
			<div><?php echo baderlr_icon( 'bolt', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'تسليم فوري', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'للمنتجات الرقمية', 'blr-shop-pro' ); ?></span></div>
			<div><?php echo baderlr_icon( 'truck', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'شحن سريع', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'للمنتجات المادية', 'blr-shop-pro' ); ?></span></div>
			<div><?php echo baderlr_icon( 'repeat', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'اشتراكات مرنة', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'ألغِ في أي وقت', 'blr-shop-pro' ); ?></span></div>
			<div><?php echo baderlr_icon( 'shield', 26 ); // phpcs:ignore ?><span><strong><?php esc_html_e( 'دفع آمن', 'blr-shop-pro' ); ?></strong><?php esc_html_e( 'حماية كاملة', 'blr-shop-pro' ); ?></span></div>
		</div></section>
	<?php endif; ?>

	<?php if ( $woo ) : ?>

		<?php
		if ( $on( 'bshop_show_cats' ) ) :
			$cats = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => true, 'number' => 8, 'parent' => 0, 'exclude' => array( (int) get_option( 'default_product_cat' ) ) ) );
			if ( $cats && ! is_wp_error( $cats ) ) :
				?>
			<section class="blr-section blr-section--tight"><div class="blr-container">
				<div class="blr-sec-head blr-reveal"><h2><?php esc_html_e( 'تسوّق حسب التصنيف', 'blr-shop-pro' ); ?></h2></div>
				<div class="bs-cats">
					<?php foreach ( $cats as $c ) : $img = get_term_meta( $c->term_id, 'thumbnail_id', true ); ?>
						<a href="<?php echo esc_url( get_term_link( $c ) ); ?>" class="bs-cat">
							<?php echo $img ? wp_get_attachment_image( $img, 'thumbnail', false, array( 'loading' => 'lazy' ) ) : '<span class="bs-cat__ph">' . esc_html( mb_substr( $c->name, 0, 1 ) ) . '</span>'; // phpcs:ignore ?>
							<span><?php echo esc_html( $c->name ); ?></span>
						</a>
					<?php endforeach; ?>
				</div>
			</div></section>
		<?php endif; endif; ?>

		<?php if ( $on( 'bshop_show_types' ) ) : ?>
			<section class="blr-section" data-bs-tabs><div class="blr-container">
				<div class="blr-sec-head blr-reveal"><h2><?php esc_html_e( 'اختر ما يناسبك', 'blr-shop-pro' ); ?></h2></div>
				<div class="bs-tabs" role="tablist">
					<button type="button" role="tab" class="is-on" data-tab="digital"><?php esc_html_e( 'منتجات رقمية', 'blr-shop-pro' ); ?></button>
					<button type="button" role="tab" data-tab="physical"><?php esc_html_e( 'منتجات مادية', 'blr-shop-pro' ); ?></button>
					<button type="button" role="tab" data-tab="subscription"><?php esc_html_e( 'اشتراكات', 'blr-shop-pro' ); ?></button>
				</div>
				<?php foreach ( array( 'digital', 'physical', 'subscription' ) as $i => $t ) : ?>
					<div data-pane="<?php echo esc_attr( $t ); ?>" <?php echo $i ? 'hidden' : ''; ?>><?php echo bshop_products_row( $t, 8 ); // phpcs:ignore ?></div>
				<?php endforeach; ?>
			</div></section>
		<?php endif; ?>

		<?php if ( $on( 'bshop_show_deals' ) && wc_get_product_ids_on_sale() ) : ?>
			<section class="blr-section bs-deals"><div class="blr-container">
				<div class="blr-sec-head blr-reveal"><h2>🔥 <?php esc_html_e( 'عروض لفترة محدودة', 'blr-shop-pro' ); ?></h2></div>
				<?php echo bshop_products_row( 'sale', 8 ); // phpcs:ignore ?>
			</div></section>
		<?php endif; ?>

		<?php if ( $on( 'bshop_show_best' ) ) : ?>
			<section class="blr-section"><div class="blr-container">
				<div class="blr-sec-head blr-reveal"><h2><?php esc_html_e( 'الأكثر مبيعاً', 'blr-shop-pro' ); ?></h2></div>
				<?php echo bshop_products_row( 'best', 8 ); // phpcs:ignore ?>
			</div></section>
		<?php endif; ?>

	<?php endif; ?>

	<?php
	if ( $on( 'bshop_show_posts' ) ) :
		$recent = new WP_Query( array( 'posts_per_page' => 3, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
		if ( $recent->have_posts() ) :
			?>
		<section class="blr-section"><div class="blr-container">
			<div class="blr-sec-head blr-reveal"><h2><?php esc_html_e( 'من المدونة', 'blr-shop-pro' ); ?></h2></div>
			<div class="blr-grid blr-grid--3"><?php while ( $recent->have_posts() ) : $recent->the_post(); baderlr_post_card(); endwhile; ?></div>
		</div></section>
		<?php wp_reset_postdata(); endif; endif; ?>

	<?php if ( $on( 'bshop_show_newsletter' ) ) : ?>
		<section class="blr-section"><div class="blr-container"><div class="blr-cta blr-reveal">
			<h2><?php esc_html_e( 'اشترك في نشرتنا', 'blr-shop-pro' ); ?></h2>
			<p style="max-width:52ch;margin-inline:auto"><?php echo isset( $_GET['subscribed'] ) ? esc_html__( 'شكراً! تم اشتراكك.', 'blr-shop-pro' ) : esc_html__( 'عروض حصرية ومنتجات جديدة تصلك أولاً.', 'blr-shop-pro' ); // phpcs:ignore ?></p>
			<form class="bs-news" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="bshop_news">
				<?php wp_nonce_field( 'bshop_news' ); ?>
				<input type="text" name="website" tabindex="-1" autocomplete="off" class="bs-hp" aria-hidden="true">
				<input type="email" name="email" required placeholder="<?php esc_attr_e( 'بريدك الإلكتروني', 'blr-shop-pro' ); ?>">
				<button class="blr-btn blr-btn--primary" type="submit"><?php esc_html_e( 'اشترك', 'blr-shop-pro' ); ?></button>
			</form>
		</div></div></section>
	<?php endif; ?>
	<?php
endif;

get_footer();
