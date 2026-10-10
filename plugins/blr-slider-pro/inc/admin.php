<?php
/**
 * لوحة BLR Slider Pro: الإعدادات والترخيص + دليل الاستخدام + الافتراضيات.
 *
 * @package blr-slider-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', function () {
	add_submenu_page( 'edit.php?post_type=blr_slider', __( 'الإعدادات والترخيص', 'blr-slider-pro' ), __( 'الإعدادات والترخيص', 'blr-slider-pro' ), 'manage_options', 'blr-slider-settings', 'blrs_settings_page' );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( 'blr_slider_page_blr-slider-settings' !== $hook ) {
		return;
	}
	wp_enqueue_style( 'blrs-font', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null ); // phpcs:ignore
	wp_enqueue_style( 'blrui', BLRS_URL . 'assets/blr-ui.css', array(), BLRS_VER . '.' . (int) @filemtime( BLRS_DIR . 'assets/blr-ui.css' ) );
} );

add_action( 'admin_init', function () {
	register_setting( 'blrs_defaults_group', 'blrs_defaults', array( 'sanitize_callback' => 'blrs_sanitize_defaults' ) );
} );

function blrs_sanitize_defaults( $in ) {
	$in  = is_array( $in ) ? $in : array();
	$out = array(
		'effect' => in_array( isset( $in['effect'] ) ? $in['effect'] : '', array( 'slide', 'fade', 'zoom', 'creative' ), true ) ? $in['effect'] : 'slide',
		'delay'  => max( 1500, absint( isset( $in['delay'] ) ? $in['delay'] : 5500 ) ),
		'height' => max( 200, absint( isset( $in['height'] ) ? $in['height'] : 520 ) ),
		'mheight' => max( 200, absint( isset( $in['mheight'] ) ? $in['mheight'] : 420 ) ),
	);
	foreach ( array( 'autoplay', 'loop', 'arrows', 'dots', 'progress', 'hover' ) as $k ) {
		$out[ $k ] = empty( $in[ $k ] ) ? 0 : 1;
	}
	return $out;
}

function blrs_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$notice = get_transient( 'blrs_notice_' . get_current_user_id() );
	if ( $notice ) {
		delete_transient( 'blrs_notice_' . get_current_user_id() );
	}
	$d    = blrs_defaults();
	$pro  = blrs_is_pro();
	$list = get_posts( array( 'post_type' => 'blr_slider', 'numberposts' => 20, 'post_status' => 'any' ) );
	?>
	<div class="wrap blrui" id="blrs-settings">
		<div class="blrui-top">
			<span class="blrui-mark">B</span>
			<div><h1><?php esc_html_e( 'BLR Slider Pro — الإعدادات والترخيص', 'blr-slider-pro' ); ?></h1><small>v<?php echo esc_html( BLRS_VER ); ?></small></div>
			<span class="blrui-grow"></span>
			<span class="blrui-chip <?php echo $pro ? 'pro' : ''; ?>"><?php echo $pro ? 'PRO ✓' : 'FREE'; ?></span>
		</div>

		<div class="blrui-tabs" role="tablist">
			<button type="button" class="is-on" data-tab="license">🔑 <?php esc_html_e( 'الترخيص', 'blr-slider-pro' ); ?></button>
			<button type="button" data-tab="defaults">🎛 <?php esc_html_e( 'الافتراضيات', 'blr-slider-pro' ); ?></button>
			<button type="button" data-tab="usage">📘 <?php esc_html_e( 'دليل الاستخدام', 'blr-slider-pro' ); ?></button>
		</div>

		<div class="blrui-pane" data-pane="license"><?php blrs_license_card( $notice ); ?></div>

		<div class="blrui-pane" data-pane="defaults" hidden>
			<form method="post" action="options.php">
				<?php settings_fields( 'blrs_defaults_group' ); ?>
				<div class="blrui-card">
					<div class="blrui-card__h"><span class="blrui-ico">🎛</span><div><h2><?php esc_html_e( 'القيم الافتراضية للسلايدرات الجديدة', 'blr-slider-pro' ); ?></h2><p><?php esc_html_e( 'تُطبَّق على أي سلايدر لم تُحفظ له إعدادات، ويمكن تغييرها لكل سلايدر على حدة.', 'blr-slider-pro' ); ?></p></div></div>
					<div class="blrui-card__b">
						<div class="blrui-row"><label for="blrs-effect"><?php esc_html_e( 'التأثير', 'blr-slider-pro' ); ?><small><?php esc_html_e( 'تأثيرا Ken Burns وثلاثي الأبعاد ضمن Pro.', 'blr-slider-pro' ); ?></small></label>
							<div><select id="blrs-effect" class="blrui-in" name="blrs_defaults[effect]"><?php foreach ( array( 'slide' => 'انزلاق', 'fade' => 'تلاشي', 'zoom' => 'Ken Burns (Pro)', 'creative' => 'ثلاثي الأبعاد (Pro)' ) as $k => $l ) { printf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $d['effect'], $k, false ), esc_html( $l ) ); } ?></select></div></div>
						<div class="blrui-row"><label for="blrs-delay"><?php esc_html_e( 'مدة الشريحة (مللي ثانية)', 'blr-slider-pro' ); ?></label><div><input id="blrs-delay" class="blrui-in" type="number" min="1500" step="100" name="blrs_defaults[delay]" value="<?php echo (int) $d['delay']; ?>"></div></div>
						<div class="blrui-row"><label for="blrs-h"><?php esc_html_e( 'الارتفاع — حاسوب (px)', 'blr-slider-pro' ); ?></label><div><input id="blrs-h" class="blrui-in" type="number" min="200" name="blrs_defaults[height]" value="<?php echo (int) $d['height']; ?>"></div></div>
						<div class="blrui-row"><label for="blrs-mh"><?php esc_html_e( 'الارتفاع — جوال (px)', 'blr-slider-pro' ); ?></label><div><input id="blrs-mh" class="blrui-in" type="number" min="200" name="blrs_defaults[mheight]" value="<?php echo (int) $d['mheight']; ?>"></div></div>
						<?php foreach ( array( 'autoplay' => 'التشغيل التلقائي', 'loop' => 'التكرار', 'arrows' => 'الأسهم', 'dots' => 'النقاط', 'progress' => 'شريط التقدم', 'hover' => 'الإيقاف عند المرور' ) as $k => $l ) : ?>
							<div class="blrui-row"><span class="blrui-lab"><?php echo esc_html( $l ); ?></span><div><label class="blrui-sw"><input type="checkbox" name="blrs_defaults[<?php echo esc_attr( $k ); ?>]" value="1" <?php checked( ! empty( $d[ $k ] ) ); ?>><i></i><?php esc_html_e( 'مفعّل', 'blr-slider-pro' ); ?></label></div></div>
						<?php endforeach; ?>
					</div>
					<div class="blrui-card__f"><button class="blrui-btn"><?php esc_html_e( 'حفظ الافتراضيات', 'blr-slider-pro' ); ?></button></div>
				</div>
			</form>
		</div>

		<div class="blrui-pane" data-pane="usage" hidden>
			<div class="blrui-grid">
				<div class="blrui-tile"><span class="blrui-ico">[ ]</span><h3><?php esc_html_e( 'الشورتكود', 'blr-slider-pro' ); ?></h3><p><?php esc_html_e( 'ضعه في أي صفحة أو مقال أو ودجت نص:', 'blr-slider-pro' ); ?></p><code>[blr_slider id="123"]</code></div>
				<div class="blrui-tile"><span class="blrui-ico">🧱</span><h3><?php esc_html_e( 'كتلة Gutenberg', 'blr-slider-pro' ); ?></h3><p><?php esc_html_e( 'ابحث عن «BLR Slider» في محرر الكتل واختر السلايدر.', 'blr-slider-pro' ); ?></p></div>
				<div class="blrui-tile"><span class="blrui-ico">🏠</span><h3><?php esc_html_e( 'قالب BLR Shop Pro', 'blr-slider-pro' ); ?></h3><p><?php esc_html_e( 'أدخل رقم السلايدر من المخصّص ← BLR Shop لعرضه في الرئيسية.', 'blr-slider-pro' ); ?></p></div>
			</div>
			<div class="blrui-card">
				<div class="blrui-card__h"><span class="blrui-ico">🖼</span><div><h2><?php esc_html_e( 'سلايدراتك', 'blr-slider-pro' ); ?></h2></div><span class="blrui-grow"></span><a class="blrui-btn is-sm" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=blr_slider' ) ); ?>">+ <?php esc_html_e( 'سلايدر جديد', 'blr-slider-pro' ); ?></a></div>
				<div class="blrui-card__b"><ul class="blrui-list">
					<?php foreach ( $list as $p ) : ?>
						<li><a href="<?php echo esc_url( get_edit_post_link( $p->ID ) ); ?>"><?php echo esc_html( $p->post_title ? $p->post_title : '#' . $p->ID ); ?></a><small>[blr_slider id="<?php echo (int) $p->ID; ?>"]</small></li>
					<?php endforeach; ?>
					<?php if ( ! $list ) : ?><li><?php esc_html_e( 'لا توجد سلايدرات بعد.', 'blr-slider-pro' ); ?></li><?php endif; ?>
				</ul></div>
			</div>
		</div>
	</div>
	<script>
	(function(){var r=document.getElementById('blrs-settings'),t=r.querySelectorAll('.blrui-tabs button'),p=r.querySelectorAll('.blrui-pane');
	function s(x){t.forEach(function(b){b.classList.toggle('is-on',b.dataset.tab===x)});p.forEach(function(e){e.hidden=e.dataset.pane!==x});try{sessionStorage.setItem('blrsTab',x)}catch(e){}}
	t.forEach(function(b){b.addEventListener('click',function(){s(b.dataset.tab)})});var l='license';try{l=sessionStorage.getItem('blrsTab')||'license'}catch(e){}s(l);})();
	</script>
	<?php
}

add_filter( 'plugin_action_links_' . plugin_basename( BLRS_DIR . 'blr-slider-pro.php' ), function ( $l ) {
	array_unshift( $l, '<a href="' . esc_url( admin_url( 'edit.php?post_type=blr_slider&page=blr-slider-settings' ) ) . '">' . esc_html__( 'الإعدادات', 'blr-slider-pro' ) . '</a>' );
	return $l;
} );
