<?php
/**
 * الرأس: الشريط العلوي + الرأس الثابت + القائمة المتجاوبة.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="blr-skip" href="#blr-main"><?php esc_html_e( 'تخطّي إلى المحتوى', 'blr-shop-pro' ); ?></a>

<?php
$blr_el_header = baderlr_el_location( 'header' );
if ( ! $blr_el_header ) :
$topbar_on = get_theme_mod( 'baderlr_topbar_on', true );
$topbar_tx = get_theme_mod( 'baderlr_topbar_text', '' );
$phone     = get_theme_mod( 'baderlr_phone', '' );
$email     = get_theme_mod( 'baderlr_email', '' );
if ( $topbar_on && ( $topbar_tx || $phone || $email ) ) :
	?>
	<div class="blr-topbar">
		<div class="blr-container">
			<div class="blr-topbar__text"><?php echo esc_html( $topbar_tx ); ?></div>
			<div class="blr-topbar__right" style="display:flex;align-items:center;gap:16px">
				<?php if ( $phone ) : ?><a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', $phone ) ); ?>" dir="ltr"><?php echo esc_html( $phone ); ?></a><?php endif; ?>
				<?php if ( $email ) : ?><a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a><?php endif; ?>
				<?php
				$social = array();
				foreach ( array( 'facebook', 'instagram', 'linkedin', 'whatsapp', 'youtube' ) as $net ) {
					$u = get_theme_mod( 'baderlr_social_' . $net, '' );
					if ( $u ) {
						$social[ $net ] = $u;
					}
				}
				if ( $social ) :
					echo '<span class="blr-topbar__social">';
					foreach ( $social as $net => $u ) {
						echo '<a href="' . esc_url( $u ) . '" target="_blank" rel="noopener" aria-label="' . esc_attr( ucfirst( $net ) ) . '">' . esc_html( strtoupper( substr( $net, 0, 1 ) ) ) . '</a>';
					}
					echo '</span>';
				endif;
				?>
			</div>
		</div>
	</div>
<?php endif; ?>

<header class="blr-header" id="blr-header">
	<div class="blr-container">
		<div class="blr-header__bar">
			<div class="blr-header__brand"><?php baderlr_logo(); ?></div>
			<nav class="blr-nav" aria-label="<?php esc_attr_e( 'القائمة الرئيسية', 'blr-shop-pro' ); ?>"><?php baderlr_primary_menu(); ?></nav>
			<div class="blr-header__actions">
				<button class="blr-icon-btn" type="button" data-bs-search-toggle aria-label="<?php esc_attr_e( 'بحث', 'blr-shop-pro' ); ?>"><?php echo baderlr_icon( 'search', 20 ); // phpcs:ignore ?></button>
				<?php if ( class_exists( 'WooCommerce' ) ) : ?>
					<?php if ( get_theme_mod( 'bshop_wishlist', true ) ) : ?>
						<button class="blr-icon-btn bs-has-count" type="button" data-bs-open="wish" aria-label="<?php esc_attr_e( 'المفضلة', 'blr-shop-pro' ); ?>"><?php echo baderlr_icon( 'heart', 20 ); // phpcs:ignore ?><span class="blr-count" data-bs-wish-count="0">0</span></button>
					<?php endif; ?>
					<a class="blr-icon-btn bs-hide-sm" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" aria-label="<?php esc_attr_e( 'حسابي', 'blr-shop-pro' ); ?>"><?php echo baderlr_icon( 'user', 20 ); // phpcs:ignore ?></a>
					<a class="blr-icon-btn bs-has-count" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="<?php esc_attr_e( 'السلة', 'blr-shop-pro' ); ?>"><?php echo baderlr_icon( 'cart', 20 ); // phpcs:ignore ?><span class="blr-count bs-cart-count"><?php echo (int) ( WC()->cart ? WC()->cart->get_cart_contents_count() : 0 ); ?></span></a>
				<?php endif; ?>
				<?php if ( get_theme_mod( 'baderlr_dark_toggle', true ) ) : ?>
					<button class="blr-icon-btn" id="blr-dark" aria-label="<?php esc_attr_e( 'الوضع الليلي', 'blr-shop-pro' ); ?>"><?php echo baderlr_icon( 'moon', 20 ); // phpcs:ignore ?></button>
				<?php endif; ?>
				<?php
				$cta_txt = get_theme_mod( 'baderlr_cta_text', __( 'تواصل معنا', 'blr-shop-pro' ) );
				$cta_url = get_theme_mod( 'baderlr_cta_url', '' );
				if ( $cta_txt && $cta_url ) :
					?>
					<a class="blr-btn blr-btn--primary blr-cta-head" href="<?php echo esc_url( $cta_url ); ?>"><?php echo esc_html( $cta_txt ); ?></a>
				<?php endif; ?>
				<button class="blr-icon-btn blr-burger" id="blr-burger" aria-label="<?php esc_attr_e( 'القائمة', 'blr-shop-pro' ); ?>" aria-expanded="false"><?php echo baderlr_icon( 'menu', 22 ); // phpcs:ignore ?></button>
			</div>
		</div>
	</div>
	<div class="bs-searchbar" id="bs-searchbar" hidden>
		<div class="blr-container">
			<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
				<?php echo baderlr_icon( 'search', 20 ); // phpcs:ignore ?>
				<input type="search" name="s" id="bs-search-input" autocomplete="off" placeholder="<?php esc_attr_e( 'ابحث عن منتج، اشتراك، قالب…', 'blr-shop-pro' ); ?>">
				<?php if ( class_exists( 'WooCommerce' ) ) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
			</form>
			<div class="bs-live" id="bs-live" hidden></div>
		</div>
	</div>
</header>

<div class="blr-drawer" id="blr-drawer">
	<div class="blr-drawer__ov" data-close></div>
	<div class="blr-drawer__panel">
		<div style="display:flex;justify-content:space-between;align-items:center">
			<?php baderlr_logo(); ?>
			<button class="blr-icon-btn" data-close aria-label="<?php esc_attr_e( 'إغلاق', 'blr-shop-pro' ); ?>"><?php echo baderlr_icon( 'close', 20 ); // phpcs:ignore ?></button>
		</div>
		<?php baderlr_primary_menu(); ?>
	</div>
</div>

<?php endif; // elementor header location ?>

<main id="blr-main" class="blr-main">
