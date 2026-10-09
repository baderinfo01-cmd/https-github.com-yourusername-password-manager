<?php
/**
 * لوحة الإضافة: القوائم، لوحة البداية، تحميل الأصول.
 *
 * @package baderlr-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_c_menu() {
	add_menu_page(
		__( 'BaderLR', 'baderlr-companion' ),
		__( 'BaderLR', 'baderlr-companion' ),
		'edit_pages',
		'baderlr-dashboard',
		'baderlr_c_dashboard_page',
		'dashicons-superhero',
		58
	);
	add_submenu_page( 'baderlr-dashboard', __( 'لوحة البداية', 'baderlr-companion' ), __( 'لوحة البداية', 'baderlr-companion' ), 'edit_pages', 'baderlr-dashboard', 'baderlr_c_dashboard_page' );
	add_submenu_page( 'baderlr-dashboard', __( 'مولّد الذكاء الاصطناعي', 'baderlr-companion' ), __( 'الذكاء الاصطناعي', 'baderlr-companion' ), 'edit_posts', 'baderlr-ai', 'baderlr_c_ai_page' );
	add_submenu_page( 'baderlr-dashboard', __( 'المواقع الجاهزة', 'baderlr-companion' ), __( 'المواقع الجاهزة', 'baderlr-companion' ), 'edit_pages', 'baderlr-sites', 'baderlr_c_sites_page' );
	add_submenu_page( 'baderlr-dashboard', __( 'إعدادات الذكاء الاصطناعي', 'baderlr-companion' ), __( 'إعدادات AI', 'baderlr-companion' ), 'manage_options', 'baderlr-ai-settings', 'baderlr_c_ai_settings_page' );
}
add_action( 'admin_menu', 'baderlr_c_menu' );

function baderlr_c_assets( $hook ) {
	if ( false === strpos( (string) $hook, 'baderlr' ) ) {
		return;
	}
	wp_enqueue_style( 'baderlr-c-admin', BADERLR_COMPANION_URI . 'assets/admin.css', array(), BADERLR_COMPANION_VERSION );
	wp_enqueue_script( 'baderlr-c-admin', BADERLR_COMPANION_URI . 'assets/admin.js', array(), BADERLR_COMPANION_VERSION, true );
	wp_localize_script( 'baderlr-c-admin', 'BaderLRC', array(
		'root'  => esc_url_raw( rest_url( 'baderlr/v1/' ) ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'i18n'  => array(
			'generating' => __( 'جارٍ التوليد...', 'baderlr-companion' ),
			'copied'     => __( 'تم النسخ', 'baderlr-companion' ),
			'copy'       => __( 'نسخ', 'baderlr-companion' ),
			'error'      => __( 'حدث خطأ. تحقّق من مفتاح API في الإعدادات.', 'baderlr-companion' ),
			'importing'  => __( 'جارٍ الاستيراد...', 'baderlr-companion' ),
		),
	) );
}
add_action( 'admin_enqueue_scripts', 'baderlr_c_assets' );

function baderlr_c_dashboard_page() {
	$configured = (bool) baderlr_ai_get_key();
	$licensed   = function_exists( 'baderlr_licensed' ) && baderlr_licensed();
	?>
	<div class="wrap baderlr-c" dir="rtl">
		<div class="blrc-hero">
			<h1>✦ BaderLR Companion</h1>
			<p><?php esc_html_e( 'مولّد المحتوى بالذكاء الاصطناعي واستيراد المواقع الجاهزة لقالب BaderLR WP.', 'baderlr-companion' ); ?></p>
		</div>
		<div class="blrc-cards">
			<div class="blrc-card">
				<span class="blrc-ic">✨</span>
				<h2><?php esc_html_e( 'مولّد الذكاء الاصطناعي', 'baderlr-companion' ); ?></h2>
				<p><?php esc_html_e( 'اكتب فكرتك ليصوغ الذكاء الاصطناعي نصوص صفحاتك ومنتجاتك ووصف السيو.', 'baderlr-companion' ); ?></p>
				<a class="button button-primary" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-ai' ) ); ?>"><?php esc_html_e( 'ابدأ التوليد', 'baderlr-companion' ); ?></a>
				<span class="blrc-status <?php echo $configured ? 'is-ok' : 'is-off'; ?>"><?php echo $configured ? esc_html__( 'المزوّد مهيّأ ✓', 'baderlr-companion' ) : esc_html__( 'يحتاج إعداد مفتاح API', 'baderlr-companion' ); ?></span>
			</div>
			<div class="blrc-card">
				<span class="blrc-ic">🧩</span>
				<h2><?php esc_html_e( 'المواقع الجاهزة', 'baderlr-companion' ); ?></h2>
				<p><?php esc_html_e( 'اختر تصميماً كاملاً واستورده بنقرة، ثم عدّله كما تشاء.', 'baderlr-companion' ); ?></p>
				<a class="button button-primary" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-sites' ) ); ?>"><?php esc_html_e( 'تصفّح المواقع', 'baderlr-companion' ); ?></a>
				<span class="blrc-status <?php echo $licensed ? 'is-ok' : 'is-off'; ?>"><?php echo $licensed ? esc_html__( 'الترخيص مفعّل ✓', 'baderlr-companion' ) : esc_html__( 'يتطلب ترخيصاً مفعّلاً', 'baderlr-companion' ); ?></span>
			</div>
			<div class="blrc-card">
				<span class="blrc-ic">⚙️</span>
				<h2><?php esc_html_e( 'الإعدادات', 'baderlr-companion' ); ?></h2>
				<p><?php esc_html_e( 'اختر مزوّد الذكاء الاصطناعي (OpenAI / Anthropic / مخصّص) وأدخل مفتاحك.', 'baderlr-companion' ); ?></p>
				<a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-ai-settings' ) ); ?>"><?php esc_html_e( 'فتح الإعدادات', 'baderlr-companion' ); ?></a>
			</div>
		</div>
	</div>
	<?php
}
