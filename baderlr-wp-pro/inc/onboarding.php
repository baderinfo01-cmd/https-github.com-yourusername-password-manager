<?php
/**
 * صفحة ترحيب وإعداد سريع للقالب.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function baderlr_onboarding_menu() {
	add_theme_page( __( 'مرحباً بك في BaderLR WP', 'baderlr-wp' ), __( 'بدء الاستخدام', 'baderlr-wp' ), 'edit_theme_options', 'baderlr-welcome', 'baderlr_welcome_page' );
}
add_action( 'admin_menu', 'baderlr_onboarding_menu' );

function baderlr_welcome_page() {
	$companion = baderlr_has_companion();
	$licensed  = function_exists( 'baderlr_licensed' ) && baderlr_licensed();
	?>
	<div class="wrap" dir="rtl" style="max-width:900px">
		<h1 style="font-size:26px"><?php esc_html_e( 'مرحباً بك في BaderLR WP', 'baderlr-wp' ); ?> 🎉</h1>
		<p style="font-size:15px;color:#50575e;max-width:70ch"><?php esc_html_e( 'قالب احترافي مدفوع مُعزَّز بالذكاء الاصطناعي. أكمل الخطوات التالية لتجهيز موقعك في دقائق.', 'baderlr-wp' ); ?></p>
		<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:20px">
			<?php
			baderlr_welcome_card( '1 — ' . __( 'تفعيل الترخيص', 'baderlr-wp' ), __( 'فعّل مفتاحك لإتاحة كل المزايا وإزالة سطر الحقوق.', 'baderlr-wp' ), admin_url( 'admin.php?page=baderlr-license' ), $licensed ? __( 'مُفعَّل ✓', 'baderlr-wp' ) : __( 'تفعيل الآن', 'baderlr-wp' ), $licensed );
			baderlr_welcome_card( '2 — ' . __( 'إضافة Companion', 'baderlr-wp' ), __( 'ثبّت إضافة BaderLR Companion لمولّد المحتوى بالذكاء الاصطناعي واستيراد المواقع الجاهزة.', 'baderlr-wp' ), $companion ? admin_url( 'admin.php?page=baderlr-ai' ) : admin_url( 'plugins.php' ), $companion ? __( 'مثبّتة ✓', 'baderlr-wp' ) : __( 'تثبيت الإضافة', 'baderlr-wp' ), $companion );
			baderlr_welcome_card( '3 — ' . __( 'اختر النمط', 'baderlr-wp' ), __( 'بدّل بين Aurora / Onyx / Verdant واضبط الألوان والرأس والتذييل.', 'baderlr-wp' ), admin_url( 'customize.php' ), __( 'فتح المخصّص', 'baderlr-wp' ), false );
			baderlr_welcome_card( '4 — ' . __( 'استورد موقعاً جاهزاً', 'baderlr-wp' ), __( 'اختر تصميماً جاهزاً وابنِ موقعك بنقرة (يتطلب Companion + ترخيص).', 'baderlr-wp' ), $companion ? admin_url( 'admin.php?page=baderlr-sites' ) : '#', __( 'المواقع الجاهزة', 'baderlr-wp' ), false );
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
