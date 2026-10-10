<?php
/**
 * Assets.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* منع وميض الوضع الليلي: يُطبَّق قبل رسم الصفحة. */
add_action( 'wp_head', 'blr_theme_boot', 1 );
function blr_theme_boot() {
	$default = get_theme_mod( 'blr_dark_default', 'auto' );
	?>
<script>(function(){try{var t=localStorage.getItem('blr-theme')||'<?php echo esc_js( $default ); ?>';if(t==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
	<?php
}

add_action( 'wp_enqueue_scripts', 'blr_enqueue' );
function blr_enqueue() {
	wp_enqueue_style( 'blr-main', BLR_URI . '/assets/css/main.css', array(), BLR_VERSION );
	wp_enqueue_style( 'blr-style', get_stylesheet_uri(), array( 'blr-main' ), BLR_VERSION );

	wp_enqueue_script( 'blr-main', BLR_URI . '/assets/js/main.js', array(), BLR_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );

	wp_localize_script(
		'blr-main',
		'BLR',
		array(
			'ajax'     => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'blr_front' ),
			'ai'       => blr_ai_chat_enabled() ? 1 : 0,
			'currency' => blr_is_woo() ? get_woocommerce_currency_symbol() : '',
			'i18n'     => array(
				'added'     => __( 'تمت الإضافة', 'blr-shop-pro' ),
				'emptyWish' => __( 'قائمة المفضلة فارغة', 'blr-shop-pro' ),
				'emptyCmp'  => __( 'اختر منتجين على الأقل للمقارنة', 'blr-shop-pro' ),
				'cmpMax'    => __( 'يمكنك مقارنة 4 منتجات كحد أقصى', 'blr-shop-pro' ),
				'error'     => __( 'حدث خطأ، حاول مرة أخرى', 'blr-shop-pro' ),
				'typing'    => __( 'يكتب…', 'blr-shop-pro' ),
				'chatHello' => __( 'أهلاً! أنا مساعد التسوق الذكي. اسألني عن أي منتج أو اشتراك.', 'blr-shop-pro' ),
				'days'      => __( 'يوم', 'blr-shop-pro' ),
				'hrs'       => __( 'ساعة', 'blr-shop-pro' ),
				'min'       => __( 'دقيقة', 'blr-shop-pro' ),
				'sec'       => __( 'ثانية', 'blr-shop-pro' ),
			),
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}

	wp_add_inline_style( 'blr-main', blr_dynamic_css() );
}

/**
 * CSS variables from the Customizer.
 */
function blr_dynamic_css() {
	$primary = sanitize_hex_color( get_theme_mod( 'blr_primary', '#4f46e5' ) ) ?: '#4f46e5';
	$accent  = sanitize_hex_color( get_theme_mod( 'blr_accent', '#f59e0b' ) ) ?: '#f59e0b';
	$radius  = absint( get_theme_mod( 'blr_radius', 14 ) );
	$cols    = max( 2, min( 5, absint( get_theme_mod( 'blr_shop_cols', 4 ) ) ) );
	$font    = get_theme_mod( 'blr_font', 'system' );
	$stack   = "'Tajawal','Cairo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
	if ( 'system' === $font ) {
		$stack = "system-ui,-apple-system,'Segoe UI','Noto Sans Arabic',Tahoma,Roboto,sans-serif";
	}
	return ":root{--blr-primary:{$primary};--blr-accent:{$accent};--blr-radius:{$radius}px;--blr-cols:{$cols};--blr-font:{$stack};}";
}

/* خط عربي اختياري من Google Fonts عند اختياره في التخصيص. */
add_action( 'wp_head', 'blr_font_link', 2 );
function blr_font_link() {
	if ( 'tajawal' !== get_theme_mod( 'blr_font', 'system' ) ) {
		return;
	}
	echo '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
	echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap">';
}
