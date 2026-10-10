<?php
/**
 * صفحة البدء: خطوات الإعداد مع شريط تقدّم.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_onboarding_menu() {
	add_theme_page( __( 'مرحباً بك في BLR Shop Pro', 'blr-shop-pro' ), __( 'بدء الاستخدام', 'blr-shop-pro' ), 'edit_theme_options', 'baderlr-welcome', 'baderlr_welcome_page' );
}
add_action( 'admin_menu', 'baderlr_onboarding_menu' );

function baderlr_welcome_page() {
	$companion = baderlr_has_companion();
	$licensed  = function_exists( 'baderlr_licensed' ) && baderlr_licensed();
	$woo       = class_exists( 'WooCommerce' );
	$slider    = shortcode_exists( 'blr_slider' );
	$ai        = function_exists( 'baderlr_ai_ready' ) && baderlr_ai_ready();
	$styled    = null !== get_theme_mod( 'baderlr_variant', null );
	$home_set  = 'page' === get_option( 'show_on_front' );

	$steps = array(
		array( __( 'تفعيل الترخيص', 'blr-shop-pro' ), __( 'يفتح استيراد المواقع الجاهزة ويزيل سطر الحقوق.', 'blr-shop-pro' ), $licensed, admin_url( 'admin.php?page=baderlr-license' ), $licensed ? __( 'مُفعَّل', 'blr-shop-pro' ) : __( 'تفعيل الآن', 'blr-shop-pro' ) ),
		array( __( 'تثبيت ووكومرس', 'blr-shop-pro' ), __( 'أساس المتجر: المنتجات والسلة والدفع.', 'blr-shop-pro' ), $woo, admin_url( 'plugin-install.php?s=woocommerce&tab=search&type=term' ), $woo ? __( 'مثبّت', 'blr-shop-pro' ) : __( 'تثبيت', 'blr-shop-pro' ) ),
		array( __( 'إضافة BLR Shop Companion', 'blr-shop-pro' ), __( 'كاتب المنتجات، مساعد التسوق، مولّد صفحات الهبوط، والمواقع الجاهزة.', 'blr-shop-pro' ), $companion, $companion ? admin_url( 'admin.php?page=baderlr-dashboard' ) : admin_url( 'plugins.php' ), $companion ? __( 'مثبّتة', 'blr-shop-pro' ) : __( 'تثبيت الإضافة', 'blr-shop-pro' ) ),
		array( __( 'مفتاح الذكاء الاصطناعي', 'blr-shop-pro' ), __( 'اختر المزوّد (Claude / OpenAI) وأضف مفتاحك.', 'blr-shop-pro' ), $ai, $companion ? admin_url( 'admin.php?page=baderlr-ai-settings' ) : admin_url( 'plugins.php' ), $ai ? __( 'جاهز', 'blr-shop-pro' ) : __( 'إضافة المفتاح', 'blr-shop-pro' ) ),
		array( __( 'إضافة BLR Slider Pro', 'blr-shop-pro' ), __( 'سلايدر الرئيسية بتأثيرات حديثة وصور للجوال.', 'blr-shop-pro' ), $slider, $slider ? admin_url( 'edit.php?post_type=blr_slider' ) : admin_url( 'plugins.php' ), $slider ? __( 'مثبّتة', 'blr-shop-pro' ) : __( 'تثبيت الإضافة', 'blr-shop-pro' ) ),
		array( __( 'اختيار النمط والألوان', 'blr-shop-pro' ), __( 'Aurora / Onyx / Verdant مع ألوان وخطوط وأقسام الرئيسية.', 'blr-shop-pro' ), $styled, admin_url( 'customize.php' ), __( 'فتح المخصّص', 'blr-shop-pro' ) ),
		array( __( 'استيراد موقع جاهز', 'blr-shop-pro' ), __( 'ابنِ الرئيسية والقائمة بنقرة (يتطلب Companion + ترخيص).', 'blr-shop-pro' ), $home_set, $companion ? admin_url( 'admin.php?page=baderlr-sites' ) : admin_url( 'plugins.php' ), __( 'المواقع الجاهزة', 'blr-shop-pro' ) ),
		array( __( 'صفحة هبوط إعلانية', 'blr-shop-pro' ), __( 'أنشئ صفحة بقالب «BLR — صفحة هبوط إعلانية» وولّدها بالذكاء الاصطناعي.', 'blr-shop-pro' ), false, admin_url( 'post-new.php?post_type=page' ), __( 'صفحة جديدة', 'blr-shop-pro' ) ),
	);
	$done = count( array_filter( array_column( $steps, 2 ) ) );
	$pct  = (int) round( $done / count( $steps ) * 100 );
	?>
	<div class="wrap blrui" dir="rtl">
		<div class="blrui-top">
			<span class="blrui-mark">B</span>
			<div><h1><?php esc_html_e( 'مرحباً بك في BLR Shop Pro', 'blr-shop-pro' ); ?> 🎉</h1><small>v<?php echo esc_html( BADERLR_VERSION ); ?></small></div>
			<span class="blrui-grow"></span>
			<span class="blrui-chip <?php echo $licensed ? 'pro' : 'warn'; ?>"><?php echo $licensed ? 'PRO ✓' : esc_html__( 'غير مرخّص', 'blr-shop-pro' ); ?></span>
		</div>

		<div class="blrui-hero">
			<div>
				<h2><?php esc_html_e( 'جهّز متجرك في دقائق', 'blr-shop-pro' ); ?></h2>
				<p><?php echo esc_html( sprintf( /* translators: 1: done 2: total */ __( 'أُنجز %1$d من %2$d خطوات. أكمل الباقي لتفتح كل إمكانات القالب.', 'blr-shop-pro' ), $done, count( $steps ) ) ); ?></p>
				<div class="blrui-prog" style="background:rgba(255,255,255,.25);max-width:420px"><i style="width:<?php echo (int) $pct; ?>%;background:#fff"></i></div>
			</div>
			<a class="blrui-btn" href="<?php echo esc_url( admin_url( 'customize.php' ) ); ?>"><?php esc_html_e( 'فتح المخصّص', 'blr-shop-pro' ); ?></a>
		</div>

		<div class="blrui-steps">
			<?php foreach ( $steps as $i => $st ) : ?>
				<div class="blrui-step <?php echo $st[2] ? 'is-done' : ''; ?>">
					<span class="blrui-num"><?php echo $st[2] ? '✓' : (int) ( $i + 1 ); ?></span>
					<div>
						<h3><?php echo esc_html( $st[0] ); ?></h3>
						<p><?php echo esc_html( $st[1] ); ?></p>
						<a class="blrui-btn is-sm <?php echo $st[2] ? 'is-ghost' : ''; ?>" href="<?php echo esc_url( $st[3] ); ?>"><?php echo esc_html( $st[4] ); ?></a>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
	<?php
}
