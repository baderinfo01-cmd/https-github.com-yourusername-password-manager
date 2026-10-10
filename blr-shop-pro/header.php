<?php
/**
 * Header.
 *
 * @package BLR_Shop_Pro
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="screen-reader-text blr-skip" href="#main"><?php esc_html_e( 'تخطَّ إلى المحتوى', 'blr-shop-pro' ); ?></a>

<?php
$ann  = get_theme_mod( 'blr_announce_text', '' );
$link = get_theme_mod( 'blr_announce_link', '' );
if ( $ann ) :
	?>
	<div class="blr-announce" id="blr-announce">
		<div class="blr-wrap">
			<?php if ( $link ) : ?><a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( $ann ); ?></a><?php else : ?><span><?php echo esc_html( $ann ); ?></span><?php endif; ?>
			<button type="button" data-blr-close-announce aria-label="<?php esc_attr_e( 'إغلاق', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'close', 16 ); // phpcs:ignore ?></button>
		</div>
	</div>
<?php endif; ?>

<header class="blr-header" id="blr-header">
	<div class="blr-wrap blr-header__bar">
		<button class="blr-iconbtn blr-burger" type="button" data-blr-menu-open aria-label="<?php esc_attr_e( 'القائمة', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'menu' ); // phpcs:ignore ?></button>

		<div class="blr-logo">
			<?php if ( has_custom_logo() ) : the_custom_logo(); else : ?>
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
			<?php endif; ?>
		</div>

		<nav class="blr-nav" id="blr-nav" aria-label="<?php esc_attr_e( 'القائمة الرئيسية', 'blr-shop-pro' ); ?>">
			<button class="blr-iconbtn blr-nav__close" type="button" data-blr-menu-close aria-label="<?php esc_attr_e( 'إغلاق', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'close' ); // phpcs:ignore ?></button>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'blr-menu',
					'fallback_cb'    => 'blr_fallback_menu',
					'depth'          => 3,
				)
			);
			?>
		</nav>

		<div class="blr-tools">
			<button class="blr-iconbtn" type="button" data-blr-search-toggle aria-label="<?php esc_attr_e( 'بحث', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'search' ); // phpcs:ignore ?></button>
			<button class="blr-iconbtn" type="button" data-blr-theme aria-label="<?php esc_attr_e( 'تبديل الوضع الليلي', 'blr-shop-pro' ); ?>"><span class="ico-moon"><?php echo blr_icon( 'moon' ); // phpcs:ignore ?></span><span class="ico-sun"><?php echo blr_icon( 'sun' ); // phpcs:ignore ?></span></button>
			<?php if ( blr_is_woo() ) : ?>
				<?php if ( get_theme_mod( 'blr_wishlist', true ) ) : ?>
					<button class="blr-iconbtn blr-has-count" type="button" data-blr-open="wish" aria-label="<?php esc_attr_e( 'المفضلة', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'heart' ); // phpcs:ignore ?><span class="blr-count" data-blr-wish-count>0</span></button>
				<?php endif; ?>
				<a class="blr-iconbtn" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" aria-label="<?php esc_attr_e( 'حسابي', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'user' ); // phpcs:ignore ?></a>
				<a class="blr-iconbtn blr-has-count" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="<?php esc_attr_e( 'السلة', 'blr-shop-pro' ); ?>"><?php echo blr_icon( 'cart' ); // phpcs:ignore ?><span class="blr-count blr-cart-count"><?php echo (int) WC()->cart->get_cart_contents_count(); ?></span></a>
			<?php endif; ?>
		</div>
	</div>

	<div class="blr-searchbar" id="blr-searchbar" hidden>
		<div class="blr-wrap">
			<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
				<?php echo blr_icon( 'search', 20 ); // phpcs:ignore ?>
				<input type="search" name="s" id="blr-search-input" autocomplete="off" placeholder="<?php esc_attr_e( 'ابحث عن منتج، اشتراك، قالب…', 'blr-shop-pro' ); ?>">
				<?php if ( blr_is_woo() ) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
			</form>
			<div class="blr-live" id="blr-live" hidden></div>
		</div>
	</div>
</header>
<div class="blr-overlay" data-blr-overlay hidden></div>
