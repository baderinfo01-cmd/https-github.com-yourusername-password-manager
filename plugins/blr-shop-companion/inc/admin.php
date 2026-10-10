<?php
/**
 * لوحة الإضافة: القوائم، لوحة البداية، تحميل الأصول.
 *
 * @package blr-shop-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_c_menu() {
	add_menu_page(
		__( 'BLR Shop', 'blr-shop-companion' ),
		__( 'BLR Shop', 'blr-shop-companion' ),
		'edit_pages',
		'baderlr-dashboard',
		'baderlr_c_dashboard_page',
		'dashicons-superhero',
		58
	);
	add_submenu_page( 'baderlr-dashboard', __( 'لوحة البداية', 'blr-shop-companion' ), __( 'لوحة البداية', 'blr-shop-companion' ), 'edit_pages', 'baderlr-dashboard', 'baderlr_c_dashboard_page' );
	add_submenu_page( 'baderlr-dashboard', __( 'مولّد الذكاء الاصطناعي', 'blr-shop-companion' ), __( 'الذكاء الاصطناعي', 'blr-shop-companion' ), 'edit_posts', 'baderlr-ai', 'baderlr_c_ai_page' );
	add_submenu_page( 'baderlr-dashboard', __( 'المواقع الجاهزة', 'blr-shop-companion' ), __( 'المواقع الجاهزة', 'blr-shop-companion' ), 'edit_pages', 'baderlr-sites', 'baderlr_c_sites_page' );
	add_submenu_page( 'baderlr-dashboard', __( 'إعدادات الذكاء الاصطناعي', 'blr-shop-companion' ), __( 'إعدادات AI', 'blr-shop-companion' ), 'manage_options', 'baderlr-ai-settings', 'baderlr_c_ai_settings_page' );
}
add_action( 'admin_menu', 'baderlr_c_menu' );

function baderlr_c_assets( $hook ) {
	if ( false === strpos( (string) $hook, 'baderlr' ) ) {
		return;
	}
	$ver = BADERLR_COMPANION_VERSION . '.' . (int) @filemtime( BADERLR_COMPANION_DIR . 'assets/blr-ui.css' ) . (int) @filemtime( BADERLR_COMPANION_DIR . 'assets/admin.css' );
	wp_enqueue_style( 'baderlr-c-font', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null ); // phpcs:ignore
	wp_enqueue_style( 'blrui', BADERLR_COMPANION_URI . 'assets/blr-ui.css', array(), $ver );
	wp_enqueue_style( 'baderlr-c-admin', BADERLR_COMPANION_URI . 'assets/admin.css', array( 'blrui' ), $ver );
	wp_enqueue_script( 'baderlr-c-admin', BADERLR_COMPANION_URI . 'assets/admin.js', array(), $ver, true );
	wp_localize_script( 'baderlr-c-admin', 'BaderLRC', array(
		'root'  => esc_url_raw( rest_url( 'baderlr/v1/' ) ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'i18n'  => array(
			'generating' => __( 'جارٍ التوليد...', 'blr-shop-companion' ),
			'copied'     => __( 'تم النسخ', 'blr-shop-companion' ),
			'copy'       => __( 'نسخ', 'blr-shop-companion' ),
			'error'      => __( 'حدث خطأ. تحقّق من مفتاح API في الإعدادات.', 'blr-shop-companion' ),
			'importing'  => __( 'جارٍ الاستيراد...', 'blr-shop-companion' ),
		),
	) );
}
add_action( 'admin_enqueue_scripts', 'baderlr_c_assets' );

/** رأس موحّد لكل صفحات الإضافة. */
function baderlr_c_header( $title ) {
	$licensed = function_exists( 'baderlr_licensed' ) && baderlr_licensed();
	$ai       = (bool) baderlr_ai_get_key();
	?>
	<div class="blrui-top">
		<span class="blrui-mark">B</span>
		<div><h1><?php echo esc_html( $title ); ?></h1><small>BLR Shop Companion · v<?php echo esc_html( BADERLR_COMPANION_VERSION ); ?></small></div>
		<span class="blrui-grow"></span>
		<span class="blrui-chip <?php echo $ai ? 'ok' : 'warn'; ?>"><?php echo $ai ? esc_html__( 'AI جاهز', 'blr-shop-companion' ) : esc_html__( 'AI بلا مفتاح', 'blr-shop-companion' ); ?></span>
		<span class="blrui-chip <?php echo $licensed ? 'pro' : ''; ?>"><?php echo $licensed ? 'PRO ✓' : esc_html__( 'غير مرخّص', 'blr-shop-companion' ); ?></span>
	</div>
	<?php
}

function baderlr_c_dashboard_page() {
	$configured = (bool) baderlr_ai_get_key();
	$licensed   = function_exists( 'baderlr_licensed' ) && baderlr_licensed();
	$lic        = function_exists( 'baderlr_license_get' ) ? baderlr_license_get() : array();
	$woo        = class_exists( 'WooCommerce' );
	$slider     = shortcode_exists( 'blr_slider' );
	$chat       = (bool) get_theme_mod( 'baderlr_ai_chat', false );
	$checks     = array(
		array( __( 'ترخيص القالب', 'blr-shop-companion' ), $licensed, admin_url( 'admin.php?page=baderlr-license' ), __( 'تفعيل', 'blr-shop-companion' ) ),
		array( __( 'مفتاح الذكاء الاصطناعي', 'blr-shop-companion' ), $configured, admin_url( 'admin.php?page=baderlr-ai-settings' ), __( 'إضافة', 'blr-shop-companion' ) ),
		array( __( 'ووكومرس', 'blr-shop-companion' ), $woo, admin_url( 'plugins.php' ), __( 'تثبيت', 'blr-shop-companion' ) ),
		array( __( 'إضافة السلايدر', 'blr-shop-companion' ), $slider, admin_url( 'plugins.php' ), __( 'تثبيت', 'blr-shop-companion' ) ),
		array( __( 'مساعد التسوق للزوار', 'blr-shop-companion' ), $chat && $configured, admin_url( 'customize.php' ), __( 'تفعيل', 'blr-shop-companion' ) ),
	);
	$done = count( array_filter( array_column( $checks, 1 ) ) );
	$pct  = (int) round( $done / count( $checks ) * 100 );
	?>
	<div class="wrap blrui baderlr-c">
		<?php baderlr_c_header( __( 'لوحة البداية', 'blr-shop-companion' ) ); ?>

		<div class="blrui-hero">
			<div><h2>✦ <?php esc_html_e( 'ابنِ متجرك بالذكاء الاصطناعي', 'blr-shop-companion' ); ?></h2><p><?php esc_html_e( 'كاتب منتجات، مساعد تسوق، مولّد صفحات هبوط، ومواقع جاهزة بنقرة — كلها من هنا.', 'blr-shop-companion' ); ?></p></div>
			<a class="blrui-btn" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-ai' ) ); ?>"><?php esc_html_e( 'ابدأ التوليد', 'blr-shop-companion' ); ?></a>
		</div>

		<div class="blrui-card">
			<div class="blrui-card__h"><span class="blrui-ico">✔</span><div><h2><?php esc_html_e( 'جاهزية الموقع', 'blr-shop-companion' ); ?></h2><p><?php echo esc_html( sprintf( /* translators: 1: done 2: total */ __( 'أُنجز %1$d من %2$d', 'blr-shop-companion' ), $done, count( $checks ) ) ); ?></p></div><span class="blrui-grow"></span><span class="blrui-chip <?php echo 100 === $pct ? 'ok' : 'warn'; ?>"><?php echo (int) $pct; ?>%</span></div>
			<div class="blrui-card__b">
				<div class="blrui-prog"><i style="width:<?php echo (int) $pct; ?>%"></i></div>
				<ul class="blrui-list" style="margin-top:14px">
					<?php foreach ( $checks as $c ) : ?>
						<li><span class="blrui-chip <?php echo $c[1] ? 'ok' : 'warn'; ?>"><?php echo $c[1] ? '✓' : '!'; ?></span><?php echo esc_html( $c[0] ); ?><small><?php if ( ! $c[1] ) : ?><a href="<?php echo esc_url( $c[2] ); ?>"><?php echo esc_html( $c[3] ); ?></a><?php else : esc_html_e( 'جاهز', 'blr-shop-companion' ); endif; ?></small></li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>

		<div class="blrui-grid">
			<div class="blrui-tile"><span class="blrui-ico">✨</span><h3><?php esc_html_e( 'مولّد الذكاء الاصطناعي', 'blr-shop-companion' ); ?></h3><p><?php esc_html_e( 'صفحات كاملة، عناوين، وصف منتجات، SEO وترجمة.', 'blr-shop-companion' ); ?></p><a class="blrui-btn is-sm" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-ai' ) ); ?>"><?php esc_html_e( 'فتح المولّد', 'blr-shop-companion' ); ?></a></div>
			<div class="blrui-tile"><span class="blrui-ico">🧩</span><h3><?php esc_html_e( 'المواقع الجاهزة', 'blr-shop-companion' ); ?></h3><p><?php esc_html_e( 'استورد تصميماً كاملاً بنقرة ثم عدّله.', 'blr-shop-companion' ); ?></p><a class="blrui-btn is-sm" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-sites' ) ); ?>"><?php esc_html_e( 'تصفّح المواقع', 'blr-shop-companion' ); ?></a></div>
			<div class="blrui-tile"><span class="blrui-ico">⚙️</span><h3><?php esc_html_e( 'إعدادات الذكاء الاصطناعي', 'blr-shop-companion' ); ?></h3><p><?php esc_html_e( 'المزوّد والمفتاح والنموذج مع اختبار الاتصال.', 'blr-shop-companion' ); ?></p><a class="blrui-btn is-sm is-ghost" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-ai-settings' ) ); ?>"><?php esc_html_e( 'فتح الإعدادات', 'blr-shop-companion' ); ?></a></div>
		</div>

		<?php if ( $licensed && ! empty( $lic ) ) : ?>
			<div class="blrui-card"><div class="blrui-card__h"><span class="blrui-ico">🔑</span><div><h2><?php esc_html_e( 'الترخيص', 'blr-shop-companion' ); ?></h2><p><?php echo esc_html( ( ! empty( $lic['edition'] ) ? $lic['edition'] : 'Pro' ) . ' — ' . ( ! empty( $lic['domain'] ) ? $lic['domain'] : '' ) ); ?></p></div><span class="blrui-grow"></span><a class="blrui-btn is-sm is-ghost" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-license' ) ); ?>"><?php esc_html_e( 'عرض الشهادة', 'blr-shop-companion' ); ?></a></div></div>
		<?php endif; ?>
	</div>
	<?php
}
