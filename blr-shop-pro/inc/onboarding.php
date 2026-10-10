<?php
/**
 * صفحة ترحيب وإعداد سريع للقالب.
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
	?>
	<div class="wrap" dir="rtl" style="max-width:900px">
		<h1 style="font-size:26px"><?php esc_html_e( 'مرحباً بك في BLR Shop Pro', 'blr-shop-pro' ); ?> 🎉</h1>
		<p style="font-size:15px;color:#50575e;max-width:70ch"><?php esc_html_e( 'قالب احترافي مدفوع مُعزَّز بالذكاء الاصطناعي. أكمل الخطوات التالية لتجهيز موقعك في دقائق.', 'blr-shop-pro' ); ?></p>
		<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:20px">
			<?php
			baderlr_welcome_card( '1 — ' . __( 'تفعيل الترخيص', 'blr-shop-pro' ), __( 'فعّل مفتاحك لإتاحة كل المزايا وإزالة سطر الحقوق.', 'blr-shop-pro' ), admin_url( 'admin.php?page=baderlr-license' ), $licensed ? __( 'مُفعَّل ✓', 'blr-shop-pro' ) : __( 'تفعيل الآن', 'blr-shop-pro' ), $licensed );
			baderlr_welcome_card( '2 — ' . __( 'إضافة Companion', 'blr-shop-pro' ), __( 'ثبّت إضافة BLR Shop Companion لمولّد المحتوى بالذكاء الاصطناعي واستيراد المواقع الجاهزة.', 'blr-shop-pro' ), $companion ? admin_url( 'admin.php?page=baderlr-ai' ) : admin_url( 'plugins.php' ), $companion ? __( 'مثبّتة ✓', 'blr-shop-pro' ) : __( 'تثبيت الإضافة', 'blr-shop-pro' ), $companion );
			baderlr_welcome_card( '3 — ' . __( 'اختر النمط', 'blr-shop-pro' ), __( 'بدّل بين Aurora / Onyx / Verdant واضبط الألوان والرأس والتذييل.', 'blr-shop-pro' ), admin_url( 'customize.php' ), __( 'فتح المخصّص', 'blr-shop-pro' ), false );
			baderlr_welcome_card( '4 — ' . __( 'استورد موقعاً جاهزاً', 'blr-shop-pro' ), __( 'اختر تصميماً جاهزاً وابنِ موقعك بنقرة (يتطلب Companion + ترخيص).', 'blr-shop-pro' ), $companion ? admin_url( 'admin.php?page=baderlr-sites' ) : '#', __( 'المواقع الجاهزة', 'blr-shop-pro' ), false );
			baderlr_welcome_card( '5 — ' . __( 'السلايدر وأنواع المنتجات', 'blr-shop-pro' ), __( 'ثبّت إضافة BLR Slider Pro لبانر الرئيسية. وفي كل منتج افتح تبويب «BLR Shop» لتحديد النوع (رقمي/مادي/اشتراك/خدمة) وتفاصيل الملف.', 'blr-shop-pro' ), admin_url( 'plugins.php' ), __( 'الإضافات', 'blr-shop-pro' ), shortcode_exists( 'blr_slider' ) );
			baderlr_welcome_card( '6 — ' . __( 'صفحة هبوط إعلانية', 'blr-shop-pro' ), __( 'أنشئ صفحة بقالب «BLR — صفحة هبوط إعلانية» واكتب وصف منتجك ليولّد الذكاء الاصطناعي كل الأقسام.', 'blr-shop-pro' ), admin_url( 'post-new.php?post_type=page' ), __( 'صفحة جديدة', 'blr-shop-pro' ), false );
			?>
		</div>
	</div>
	<?php
}

function baderlr_welcome_card( $title, $desc, $url, $btn, $done ) {
	echo '<div class="card" style="padding:20px;max-width:none">';
	echo '<h2 style="margin-top:0;font-size:16px">' . esc_html( $title ) . '</h2>';
	echo '<p style="color:#50575e;min-height:3em">' . esc_html( $desc ) . '</p>';
	echo '<a class="button ' . ( $done ? '' : 'button-primary' ) . '" href="' . esc_url( $url ) . '">' . esc_html( $btn ) . '</a>';
	echo '</div>';
}
