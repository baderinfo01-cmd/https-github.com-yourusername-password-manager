<?php
/**
 * لوحة الإدارة: القوائم، المحرّر (بنّاء الأقسام)، المعاينة الحيّة، الإعدادات والترخيص.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', function () {
	add_menu_page( 'BLR Landing', 'BLR Landing', 'edit_posts', 'blr-landing', 'blrlp_dashboard_page', 'dashicons-layout', 56 );
	add_submenu_page( 'blr-landing', __( 'لوحة التحكم', 'blr-landing-pro' ), __( 'لوحة التحكم', 'blr-landing-pro' ), 'edit_posts', 'blr-landing', 'blrlp_dashboard_page' );
}, 5 );

add_action( 'admin_menu', function () {
	add_submenu_page( 'blr-landing', __( 'القوالب', 'blr-landing-pro' ), __( 'القوالب', 'blr-landing-pro' ), 'edit_posts', 'blr-landing-templates', 'blrlp_templates_page' );
	add_submenu_page( 'blr-landing', __( 'العملاء المحتملون', 'blr-landing-pro' ), __( 'العملاء المحتملون', 'blr-landing-pro' ), 'manage_options', 'blr-landing-leads', 'blrlp_leads_page' );
	add_submenu_page( 'blr-landing', __( 'الإعدادات والترخيص', 'blr-landing-pro' ), __( 'الإعدادات والترخيص', 'blr-landing-pro' ), 'manage_options', 'blr-landing-settings', 'blrlp_settings_page' );
}, 20 );

function blrlp_admin_header( $title ) {
	?>
	<div class="blrlp-top">
		<span class="blrlp-mark">B</span>
		<div><h1><?php echo esc_html( $title ); ?></h1><small>BLR Landing Pro · v<?php echo esc_html( BLRLP_VERSION ); ?></small></div>
		<span class="blrlp-grow"></span>
		<span class="blrlp-chip <?php echo blrlp_is_pro() ? 'is-pro' : ''; ?>"><?php echo blrlp_is_pro() ? 'PRO ✓' : 'FREE'; ?></span>
	</div>
	<?php
}

function blrlp_is_our_screen() {
	$s = get_current_screen();
	return $s && ( 'blr_landing' === $s->post_type || false !== strpos( (string) $s->id, 'blr-landing' ) );
}

add_action( 'admin_enqueue_scripts', function () {
	if ( ! blrlp_is_our_screen() ) {
		return;
	}
	wp_enqueue_style( 'blrlp-font', 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap', array(), null ); // phpcs:ignore
	wp_enqueue_style( 'blrlp-admin', BLRLP_URL . 'assets/css/admin.css', array(), BLRLP_VERSION );
	$s = get_current_screen();
	if ( 'blr_landing' === $s->post_type && 'post' === $s->base ) {
		wp_enqueue_media();
		wp_enqueue_script( 'blrlp-editor', BLRLP_URL . 'assets/js/editor.js', array(), BLRLP_VERSION, true );
		global $post;
		$landings = array();
		foreach ( get_posts( array( 'post_type' => 'blr_landing', 'numberposts' => 100, 'post_status' => array( 'publish', 'draft' ), 'exclude' => array( $post ? $post->ID : 0 ) ) ) as $p ) {
			$landings[] = array( 'id' => $p->ID, 'title' => $p->post_title ? $p->post_title : '#' . $p->ID );
		}
		wp_localize_script( 'blrlp-editor', 'BLRLP_ED', array(
			'ajax'     => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'blrlp_admin' ),
			'postId'   => $post ? (int) $post->ID : 0,
			'sections' => blrlp_sections(),
			'icons'    => blrlp_icons(),
			'palettes' => array_map( function ( $p ) {
				return array( 'label' => $p['label'], 'primary' => $p['v']['primary'], 'primary2' => $p['v']['primary2'] );
			}, blrlp_palettes() ),
			'data'     => $post ? blrlp_get_data( $post->ID ) : blrlp_get_data( 0 ),
			'pro'      => blrlp_is_pro(),
			'ai'       => blrlp_ai_ready(),
			'landings' => $landings,
			'settingsUrl' => admin_url( 'admin.php?page=blr-landing-settings' ),
			'designDefaults' => blrlp_design_defaults(),
			'styleDefaults'  => blrlp_style_defaults(),
		) );
	}
} );

/* مخرج المحرّر تحت العنوان مباشرة. */
add_action( 'edit_form_after_title', function ( $post ) {
	if ( 'blr_landing' !== $post->post_type ) {
		return;
	}
	wp_nonce_field( 'blrlp_save', 'blrlp_nonce' );
	echo '<input type="hidden" name="blrlp_data" id="blrlp-data" value="">';
	echo '<div id="blrlp-app" class="blrlp-admin" dir="rtl"><p style="padding:20px">' . esc_html__( 'جارٍ تحميل المحرّر…', 'blr-landing-pro' ) . '</p></div>';
	echo '<noscript><p>' . esc_html__( 'يحتاج المحرّر إلى JavaScript.', 'blr-landing-pro' ) . '</p></noscript>';
} );

/* لا نحتاج صناديق إضافية في شاشة التحرير. */
add_action( 'add_meta_boxes_blr_landing', function () {
	remove_meta_box( 'slugdiv', 'blr_landing', 'normal' );
}, 99 );

/* ---------- المعاينة الحيّة ---------- */
add_action( 'wp_ajax_blrlp_preview', function () {
	check_ajax_referer( 'blrlp_admin', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( null, 403 );
	}
	$raw  = json_decode( wp_unslash( $_POST['data'] ?? '' ), true ); // phpcs:ignore
	$data = blrlp_sanitize_data( is_array( $raw ) ? $raw : array() );
	$data['design'] = array_replace_recursive( blrlp_design_defaults(), $data['design'] );
	$id   = absint( $_POST['id'] ?? 0 ); // phpcs:ignore
	$body = blrlp_render_page( $id, $data, array( 'preview' => true ) );
	$html = '<!doctype html><html lang="' . esc_attr( get_bloginfo( 'language' ) ) . '" dir="' . ( is_rtl() ? 'rtl' : 'ltr' ) . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">'
		. blrlp_font_link( $data )
		. '<link rel="stylesheet" href="' . esc_url( BLRLP_URL . 'assets/css/front.css?ver=' . BLRLP_VERSION ) . '">'
		. '<script>window.BLRLP={preview:true,rest:"",i18n:{d:"يوم",h:"ساعة",m:"دقيقة",s:"ثانية",sending:"…",error:"",invalid:""}};</script>'
		. '<script src="' . esc_url( BLRLP_URL . 'assets/js/front.js?ver=' . BLRLP_VERSION ) . '" defer></script>'
		. '</head><body class="blrlp-canvas">' . $body . '</body></html>';
	wp_send_json_success( array( 'html' => $html ) );
} );

/* ---------- صفحة القوالب ---------- */
function blrlp_templates_page() {
	?>
	<div class="wrap blrlp-admin">
		<?php blrlp_admin_header( __( 'مكتبة القوالب', 'blr-landing-pro' ) ); ?>
		<div class="blrlp-tpls">
			<?php foreach ( blrlp_templates_meta() as $slug => $m ) : $locked = $m['pro'] && ! blrlp_is_pro(); ?>
				<div class="blrlp-tpl <?php echo $locked ? 'is-locked' : ''; ?>">
					<div class="blrlp-tpl__cover blrlp-tpl--<?php echo esc_attr( $m['preset'] ); ?>"><span><?php echo esc_html( $m['emoji'] ); ?></span><?php echo $m['pro'] ? blrlp_pro_badge() : ''; // phpcs:ignore ?></div>
					<div class="blrlp-tpl__body">
						<h3><?php echo esc_html( $m['name'] ); ?></h3>
						<p><?php echo esc_html( $m['desc'] ); ?></p>
						<a class="button <?php echo $locked ? '' : 'button-primary'; ?>" href="<?php echo esc_url( $locked ? admin_url( 'admin.php?page=blr-landing-settings' ) : wp_nonce_url( admin_url( 'admin-post.php?action=blrlp_new&tpl=' . $slug ), 'blrlp_new' ) ); ?>"><?php echo $locked ? esc_html__( 'يتطلب Pro', 'blr-landing-pro' ) : esc_html__( 'استخدم القالب', 'blr-landing-pro' ); ?></a>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
	<?php
}

/* ---------- الإعدادات ---------- */
add_action( 'admin_init', function () {
	register_setting( 'blrlp_settings_group', 'blrlp_settings', array( 'sanitize_callback' => 'blrlp_sanitize_settings' ) );
} );

function blrlp_sanitize_settings( $in ) {
	$old = get_option( 'blrlp_settings', array() );
	$out = is_array( $old ) ? $old : array();
	$in  = is_array( $in ) ? $in : array();
	$out['ai_provider'] = in_array( isset( $in['ai_provider'] ) ? $in['ai_provider'] : '', array( 'anthropic', 'openai', 'custom' ), true ) ? $in['ai_provider'] : 'anthropic';
	$out['ai_model']    = sanitize_text_field( isset( $in['ai_model'] ) ? $in['ai_model'] : '' );
	$out['ai_base']     = esc_url_raw( isset( $in['ai_base'] ) ? $in['ai_base'] : '' );
	if ( ! empty( $in['ai_key'] ) ) {
		$out['ai_key'] = sanitize_text_field( $in['ai_key'] );
	}
	$out['notify']  = sanitize_email( isset( $in['notify'] ) ? $in['notify'] : '' );
	$slug           = sanitize_title( isset( $in['slug'] ) ? $in['slug'] : 'lp' );
	$out['slug']    = $slug ? $slug : 'lp';
	$out['isolate'] = empty( $in['isolate'] ) ? '0' : '1';
	$out['wipe']    = empty( $in['wipe'] ) ? '0' : '1';
	if ( ( isset( $old['slug'] ) ? $old['slug'] : 'lp' ) !== $out['slug'] ) {
		update_option( 'blrlp_flush', 1 );
	}
	return $out;
}

add_action( 'init', function () {
	if ( get_option( 'blrlp_flush' ) ) {
		delete_option( 'blrlp_flush' );
		flush_rewrite_rules();
	}
}, 99 );

add_action( 'admin_post_blrlp_license_do', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'blrlp_license' ) ) {
		wp_die( esc_html__( 'غير مسموح.', 'blr-landing-pro' ) );
	}
	$do  = sanitize_key( $_POST['do'] ?? '' );
	$msg = '';
	$ok  = true;
	if ( 'cfg' === $do ) {
		update_option( 'blrlp_license_cfg', array(
			'server'  => esc_url_raw( wp_unslash( $_POST['cfg_server'] ?? '' ) ),
			'pubkey'  => preg_replace( '/\s+/', '', sanitize_text_field( wp_unslash( $_POST['cfg_pubkey'] ?? '' ) ) ),
			'product' => sanitize_key( wp_unslash( $_POST['cfg_product'] ?? '' ) ),
		) );
		$msg = __( 'تم حفظ إعدادات السيرفر.', 'blr-landing-pro' );
	} elseif ( 'activate' === $do ) {
		$r = blrlp_license_activate( sanitize_text_field( wp_unslash( $_POST['key'] ?? '' ) ) );
		if ( is_wp_error( $r ) ) {
			$msg = $r->get_error_message();
			$ok  = false;
		} else {
			$msg = __( '✓ تم تفعيل Pro بنجاح.', 'blr-landing-pro' );
		}
	} elseif ( 'deactivate' === $do ) {
		delete_option( 'blrlp_license' );
		$msg = __( 'تم إلغاء التفعيل على هذا الموقع.', 'blr-landing-pro' );
	}
	set_transient( 'blrlp_notice_' . get_current_user_id(), array( $ok, $msg ), 60 );
	wp_safe_redirect( admin_url( 'admin.php?page=blr-landing-settings' ) );
	exit;
} );

function blrlp_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$lic    = blrlp_license_get();
	$pro    = blrlp_is_pro();
	$notice = get_transient( 'blrlp_notice_' . get_current_user_id() );
	if ( $notice ) {
		delete_transient( 'blrlp_notice_' . get_current_user_id() );
	}
	$o = get_option( 'blrlp_settings', array() );
	?>
	<div class="wrap blrlp-admin">
		<?php blrlp_admin_header( __( 'الإعدادات والترخيص', 'blr-landing-pro' ) ); ?>
		<?php if ( $notice ) : ?><div class="notice notice-<?php echo $notice[0] ? 'success' : 'error'; ?>"><p><?php echo esc_html( $notice[1] ); ?></p></div><?php endif; ?>

		<div class="blrlp-grid2">
			<div class="blrlp-panel">
				<h2><?php esc_html_e( 'الترخيص', 'blr-landing-pro' ); ?></h2>
				<?php if ( $pro ) : ?>
					<p class="blrlp-ok">✓ <?php esc_html_e( 'Pro مفعّل', 'blr-landing-pro' ); ?></p>
					<table class="widefat striped">
						<tr><td><?php esc_html_e( 'الدومين', 'blr-landing-pro' ); ?></td><td dir="ltr"><?php echo esc_html( $lic['domain'] ); ?></td></tr>
						<tr><td><?php esc_html_e( 'المفتاح', 'blr-landing-pro' ); ?></td><td dir="ltr"><?php echo esc_html( $lic['key'] ); ?></td></tr>
						<tr><td><?php esc_html_e( 'ينتهي', 'blr-landing-pro' ); ?></td><td><?php echo esc_html( ! empty( $lic['expires_at'] ) ? date_i18n( 'Y-m-d', (int) $lic['expires_at'] ) : __( 'مدى الحياة', 'blr-landing-pro' ) ); ?></td></tr>
					</table>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin-top:14px"><?php wp_nonce_field( 'blrlp_license' ); ?><input type="hidden" name="action" value="blrlp_license_do"><input type="hidden" name="do" value="deactivate"><button class="button"><?php esc_html_e( 'إلغاء التفعيل', 'blr-landing-pro' ); ?></button></form>
				<?php else : ?>
					<p><?php esc_html_e( 'أدخل مفتاح الترخيص لفتح ميزات Pro. دومين موقعك:', 'blr-landing-pro' ); ?> <code dir="ltr"><?php echo esc_html( blrlp_license_domain() ); ?></code></p>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"><?php wp_nonce_field( 'blrlp_license' ); ?><input type="hidden" name="action" value="blrlp_license_do"><input type="hidden" name="do" value="activate">
						<input type="text" name="key" class="regular-text" dir="ltr" placeholder="BT-XXXX-XXXX-XXXX" value="<?php echo esc_attr( isset( $lic['key'] ) ? $lic['key'] : '' ); ?>" required>
						<p><button class="button button-primary button-hero"><?php esc_html_e( 'تفعيل Pro', 'blr-landing-pro' ); ?></button></p>
					</form>
				<?php endif; ?>

				<h3><?php esc_html_e( 'إعدادات سيرفر الترخيص', 'blr-landing-pro' ); ?></h3>
				<?php if ( ! blrlp_pubkey_ok() ) : ?><div class="notice notice-error inline"><p><strong><?php esc_html_e( 'المفتاح العام غير مضبوط — لن ينجح التفعيل قبل إدخاله.', 'blr-landing-pro' ); ?></strong></p></div><?php endif; ?>
				<?php if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) : ?><div class="notice notice-error inline"><p><?php esc_html_e( 'امتداد Sodium غير متوفر في PHP.', 'blr-landing-pro' ); ?></p></div><?php endif; ?>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"><?php wp_nonce_field( 'blrlp_license' ); ?><input type="hidden" name="action" value="blrlp_license_do"><input type="hidden" name="do" value="cfg">
					<p><label><?php esc_html_e( 'رابط السيرفر (مجلد api.php)', 'blr-landing-pro' ); ?><br><input type="url" name="cfg_server" class="large-text" dir="ltr" value="<?php echo esc_attr( blrlp_lic_cfg( 'server' ) ); ?>"></label></p>
					<p><label><?php esc_html_e( 'المفتاح العام (base64)', 'blr-landing-pro' ); ?><br><input type="text" name="cfg_pubkey" class="large-text" dir="ltr" style="font-family:monospace" value="<?php echo esc_attr( blrlp_pubkey_ok() ? blrlp_lic_cfg( 'pubkey' ) : '' ); ?>"></label></p>
					<p><label><?php esc_html_e( 'معرّف المنتج في السيرفر', 'blr-landing-pro' ); ?><br><input type="text" name="cfg_product" class="regular-text" dir="ltr" value="<?php echo esc_attr( blrlp_lic_cfg( 'product' ) ); ?>"></label></p>
					<button class="button"><?php esc_html_e( 'حفظ إعدادات السيرفر', 'blr-landing-pro' ); ?></button>
				</form>
			</div>

			<div class="blrlp-panel">
				<h2><?php esc_html_e( 'الإعدادات العامة والذكاء الاصطناعي', 'blr-landing-pro' ); ?></h2>
				<form method="post" action="options.php"><?php settings_fields( 'blrlp_settings_group' ); ?>
					<h3><?php esc_html_e( 'الذكاء الاصطناعي', 'blr-landing-pro' ); ?> <?php echo blrlp_pro_badge(); // phpcs:ignore ?></h3>
					<p><label><?php esc_html_e( 'المزوّد', 'blr-landing-pro' ); ?><br>
						<select name="blrlp_settings[ai_provider]"><?php foreach ( array( 'anthropic' => 'Anthropic (Claude)', 'openai' => 'OpenAI', 'custom' => 'مخصّص (متوافق مع OpenAI)' ) as $k => $l ) { printf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( isset( $o['ai_provider'] ) ? $o['ai_provider'] : 'anthropic', $k, false ), esc_html( $l ) ); } ?></select></label></p>
					<p><label><?php esc_html_e( 'مفتاح API', 'blr-landing-pro' ); ?><br><input type="password" name="blrlp_settings[ai_key]" class="regular-text" dir="ltr" autocomplete="new-password" placeholder="<?php echo ! empty( $o['ai_key'] ) ? esc_attr__( '•••• محفوظ — اتركه فارغاً للإبقاء عليه', 'blr-landing-pro' ) : 'sk-…'; ?>"></label></p>
					<p><label><?php esc_html_e( 'النموذج (اتركه فارغاً للافتراضي)', 'blr-landing-pro' ); ?><br><input type="text" name="blrlp_settings[ai_model]" class="regular-text" dir="ltr" value="<?php echo esc_attr( isset( $o['ai_model'] ) ? $o['ai_model'] : '' ); ?>" placeholder="claude-sonnet-5-5 / gpt-4o-mini"></label></p>
					<p><label><?php esc_html_e( 'رابط المزوّد المخصّص', 'blr-landing-pro' ); ?><br><input type="url" name="blrlp_settings[ai_base]" class="large-text" dir="ltr" value="<?php echo esc_attr( isset( $o['ai_base'] ) ? $o['ai_base'] : '' ); ?>" placeholder="https://…/v1/chat/completions"></label></p>
					<h3><?php esc_html_e( 'عام', 'blr-landing-pro' ); ?></h3>
					<p><label><?php esc_html_e( 'بريد إشعار العملاء المحتملين', 'blr-landing-pro' ); ?><br><input type="email" name="blrlp_settings[notify]" class="regular-text" dir="ltr" value="<?php echo esc_attr( isset( $o['notify'] ) ? $o['notify'] : '' ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>"></label></p>
					<p><label><?php esc_html_e( 'بادئة الروابط', 'blr-landing-pro' ); ?><br><code dir="ltr"><?php echo esc_html( home_url( '/' ) ); ?></code><input type="text" name="blrlp_settings[slug]" size="8" dir="ltr" value="<?php echo esc_attr( blrlp_opt( 'slug', 'lp' ) ); ?>"></label></p>
					<p><label><input type="checkbox" name="blrlp_settings[isolate]" value="1" <?php checked( blrlp_opt( 'isolate', '1' ), '1' ); ?>> <?php esc_html_e( 'عزل أنماط القالب عن صفحات الهبوط (موصى به)', 'blr-landing-pro' ); ?></label></p>
					<p><label><input type="checkbox" name="blrlp_settings[wipe]" value="1" <?php checked( blrlp_opt( 'wipe', '0' ), '1' ); ?>> <?php esc_html_e( 'حذف كل البيانات عند حذف الإضافة', 'blr-landing-pro' ); ?></label></p>
					<?php submit_button(); ?>
				</form>
			</div>
		</div>
	</div>
	<?php
}

add_filter( 'plugin_action_links_' . plugin_basename( BLRLP_FILE ), function ( $l ) {
	array_unshift( $l, '<a href="' . esc_url( admin_url( 'admin.php?page=blr-landing-settings' ) ) . '">' . esc_html__( 'الإعدادات', 'blr-landing-pro' ) . '</a>' );
	return $l;
} );

/* كتلة Gutenberg لتضمين صفحة هبوط. */
add_action( 'enqueue_block_editor_assets', function () {
	$list = array();
	foreach ( get_posts( array( 'post_type' => 'blr_landing', 'numberposts' => 100, 'post_status' => 'publish' ) ) as $p ) {
		$list[] = array( 'value' => $p->ID, 'label' => $p->post_title ? $p->post_title : '#' . $p->ID );
	}
	wp_enqueue_script( 'blrlp-block', BLRLP_URL . 'assets/js/block.js', array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor' ), BLRLP_VERSION, true );
	wp_localize_script( 'blrlp-block', 'BLRLP_LANDINGS', $list );
} );

add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) || blrlp_is_pro() ) {
		return;
	}
	$s = get_current_screen();
	if ( ! $s || false !== strpos( (string) $s->id, 'blr-landing' ) || 'blr_landing' === $s->post_type || 'plugins' !== $s->base ) {
		return;
	}
	echo '<div class="notice notice-info"><p><strong>BLR Landing Pro:</strong> ' . esc_html__( 'فعّل الترخيص لفتح الذكاء الاصطناعي واختبار A/B وكل القوالب.', 'blr-landing-pro' ) . ' <a href="' . esc_url( admin_url( 'admin.php?page=blr-landing-settings' ) ) . '">' . esc_html__( 'تفعيل', 'blr-landing-pro' ) . '</a></p></div>';
} );
