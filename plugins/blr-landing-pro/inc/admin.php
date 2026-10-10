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
	wp_enqueue_style( 'blrui', BLRLP_URL . 'assets/css/blr-ui.css', array(), blrlp_ver( 'assets/css/blr-ui.css' ) );
	wp_enqueue_style( 'blrlp-admin', BLRLP_URL . 'assets/css/admin.css', array( 'blrui' ), blrlp_ver( 'assets/css/admin.css' ) );
	$s = get_current_screen();
	if ( 'blr_landing' === $s->post_type && 'post' === $s->base ) {
		wp_enqueue_media();
		wp_enqueue_script( 'blrlp-editor', BLRLP_URL . 'assets/js/editor.js', array(), blrlp_ver( 'assets/js/editor.js' ), true );
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
		. '<link rel="stylesheet" href="' . esc_url( BLRLP_URL . 'assets/css/front.css?ver=' . blrlp_ver( 'assets/css/front.css' ) ) . '">'
		. '<script>window.BLRLP={preview:true,rest:"",i18n:{d:"يوم",h:"ساعة",m:"دقيقة",s:"ثانية",sending:"…",error:"",invalid:""}};</script>'
		. '<script src="' . esc_url( BLRLP_URL . 'assets/js/front.js?ver=' . blrlp_ver( 'assets/js/front.js' ) ) . '" defer></script>'
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
	if ( 'activate' === $do ) {
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


/** بطاقة الترخيص: شهادة عند التفعيل، وصفحة تفعيل جذّابة قبله. */
function blrlp_license_card( $notice = null ) {
	$lic  = blrlp_license_get();
	$pro  = blrlp_is_pro();
	echo '<div class="blrl">';
	if ( $notice ) {
		echo '<div class="blrl-msg ' . ( $notice[0] ? 'ok' : 'err' ) . '">' . esc_html( $notice[1] ) . '</div>';
	}
	if ( $pro ) {
		$from = ! empty( $lic['issued_at'] ) ? (int) $lic['issued_at'] : ( ! empty( $lic['activated_at'] ) ? (int) $lic['activated_at'] : 0 );
		$to   = ! empty( $lic['expires_at'] ) ? date_i18n( 'd-m-Y', (int) $lic['expires_at'] ) : '';
		$valid = $to ? ( $from ? sprintf( /* translators: 1: from 2: to */ __( 'من %1$s إلى %2$s', 'blr-landing-pro' ), date_i18n( 'd-m-Y', $from ), $to ) : $to ) : __( 'مدى الحياة', 'blr-landing-pro' );
		$edition = ! empty( $lic['edition'] ) ? $lic['edition'] : 'Pro';
		$lid     = ! empty( $lic['lid'] ) ? $lic['lid'] : '—';
		$key     = ! empty( $lic['key'] ) ? substr( $lic['key'], 0, 7 ) . '••••••••' . substr( $lic['key'], -4 ) : '—';
		$days    = ! empty( $lic['expires_at'] ) ? (int) floor( ( (int) $lic['expires_at'] - time() ) / DAY_IN_SECONDS ) : null;
		echo '<div class="blrl-card blrl-cert"><div>';
		echo '<span class="blrl-badge">✓ ' . esc_html__( 'ترخيص Pro مفعّل', 'blr-landing-pro' ) . '</span>';
		echo '<h2>' . esc_html( ! empty( $lic['holder'] ) ? $lic['holder'] : get_bloginfo( 'name' ) ) . '</h2>';
		if ( ! empty( $lic['company'] ) ) {
			echo '<p>' . esc_html( $lic['company'] ) . '</p>';
		}
		echo '<dl class="blrl-dl">';
		$rows = array(
			array( __( 'رقم الترخيص', 'blr-landing-pro' ), $lid, true ),
			array( __( 'الخطة', 'blr-landing-pro' ), $edition, false ),
			array( __( 'النطاق', 'blr-landing-pro' ), ! empty( $lic['domain'] ) ? $lic['domain'] : blrlp_license_domain(), true ),
			array( __( 'الصلاحية', 'blr-landing-pro' ), $valid, false ),
			array( __( 'المفتاح', 'blr-landing-pro' ), $key, true ),
		);
		foreach ( $rows as $r ) {
			echo '<div><dt>' . esc_html( $r[0] ) . '</dt><dd' . ( $r[2] ? ' dir="ltr" style="text-align:end"' : '' ) . '>' . esc_html( $r[1] ) . '</dd></div>';
		}
		echo '</dl>';
		if ( null !== $days && $days <= 30 ) {
			echo '<div class="blrl-note">' . esc_html( $days >= 0 ? sprintf( /* translators: %d: days */ _n( 'ينتهي ترخيصك خلال %d يوم — جدّده لتبقى ميزات Pro فعّالة.', 'ينتهي ترخيصك خلال %d يوماً — جدّده لتبقى ميزات Pro فعّالة.', $days, 'blr-landing-pro' ), $days ) : __( 'انتهى ترخيصك.', 'blr-landing-pro' ) ) . '</div>';
		}
		echo '<form class="blrl-actions" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" onsubmit="return confirm(\'' . esc_js( __( 'إلغاء تفعيل الترخيص على هذا الموقع؟', 'blr-landing-pro' ) ) . '\')">';
		wp_nonce_field( 'blrlp_license' );
		echo '<input type="hidden" name="action" value="blrlp_license_do"><input type="hidden" name="do" value="deactivate"><button class="blrl-btn is-ghost">' . esc_html__( 'إلغاء التفعيل', 'blr-landing-pro' ) . '</button></form>';
		echo '</div><div class="blrl-seal"><img class="blrl-sealimg" src="' . esc_url( BLRLP_URL . 'assets/img/seal.png' ) . '" alt=""><div class="blrl-stamp"><b>' . esc_html__( 'ترخيص أصلي', 'blr-landing-pro' ) . '</b><small>' . esc_html( strtoupper( $edition ) ) . '</small><small>' . esc_html( $lid ) . '</small></div></div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	} else {
		echo '<div class="blrl-card blrl-hero"><div class="blrl-ic"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div><div>';
		echo '<h2>' . esc_html__( 'فعّل BLR Landing Pro', 'blr-landing-pro' ) . '</h2><p>' . esc_html__( 'أدخل مفتاح الترخيص لفتح كل الميزات الاحترافية على موقعك.', 'blr-landing-pro' ) . '</p>';
		echo '<ul class="blrl-feat"><li>' . esc_html__( 'توليد الصفحات بالذكاء الاصطناعي', 'blr-landing-pro' ) . '</li><li>' . esc_html__( 'اختبار A/B', 'blr-landing-pro' ) . '</li><li>' . esc_html__( 'كل القوالب الجاهزة', 'blr-landing-pro' ) . '</li><li>' . esc_html__( 'Webhook وتصدير العملاء', 'blr-landing-pro' ) . '</li><li>' . esc_html__( 'إزالة شارة «صُنعت بواسطة»', 'blr-landing-pro' ) . '</li><li>' . esc_html__( 'دعم فني بأولوية', 'blr-landing-pro' ) . '</li></ul>';
		echo '<div class="blrl-domain">' . esc_html__( 'دومين موقعك', 'blr-landing-pro' ) . ' <code dir="ltr">' . esc_html( blrlp_license_domain() ) . '</code></div>';
		echo '<form class="blrl-form" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		wp_nonce_field( 'blrlp_license' );
		echo '<input type="hidden" name="action" value="blrlp_license_do"><input type="hidden" name="do" value="activate"><input type="text" name="key" placeholder="BT-XXXX-XXXX-XXXX" autocomplete="off" required value="' . esc_attr( isset( $lic['key'] ) ? $lic['key'] : '' ) . '"><button class="blrl-btn">' . esc_html__( 'تفعيل الترخيص', 'blr-landing-pro' ) . '</button></form>';
		echo '<p class="blrl-help">' . esc_html__( 'لا تملك ترخيصاً؟', 'blr-landing-pro' ) . ' <a href="' . esc_url( BLRLP_BUY_URL ) . '" target="_blank" rel="noopener">' . esc_html__( 'احصل على BLR Landing Pro', 'blr-landing-pro' ) . '</a></p>';
		if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
			echo '<div class="blrl-msg err">' . esc_html__( 'امتداد Sodium غير متوفر في PHP على استضافتك — فعّله ثم أعد المحاولة.', 'blr-landing-pro' ) . '</div>';
		}
		echo '</div></div>';
	}
	echo '</div>';
}

function blrlp_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$notice = get_transient( 'blrlp_notice_' . get_current_user_id() );
	if ( $notice ) {
		delete_transient( 'blrlp_notice_' . get_current_user_id() );
	}
	$o        = get_option( 'blrlp_settings', array() );
	$provider = isset( $o['ai_provider'] ) ? $o['ai_provider'] : 'anthropic';
	$has_key  = ! empty( $o['ai_key'] );
	?>
	<div class="wrap blrui blrlp-admin" id="blrlp-settings">
		<?php blrlp_admin_header( __( 'الإعدادات والترخيص', 'blr-landing-pro' ) ); ?>

		<div class="blrui-tabs" role="tablist">
			<button type="button" class="is-on" data-tab="license">🔑 <?php esc_html_e( 'الترخيص', 'blr-landing-pro' ); ?></button>
			<button type="button" data-tab="ai">✨ <?php esc_html_e( 'الذكاء الاصطناعي', 'blr-landing-pro' ); ?></button>
			<button type="button" data-tab="general">⚙️ <?php esc_html_e( 'عام', 'blr-landing-pro' ); ?></button>
		</div>

		<div class="blrui-pane" data-pane="license"><?php blrlp_license_card( $notice ); ?></div>

		<form method="post" action="options.php">
			<?php settings_fields( 'blrlp_settings_group' ); ?>

			<div class="blrui-pane" data-pane="ai" hidden>
				<div class="blrui-card">
					<div class="blrui-card__h"><span class="blrui-ico">✨</span><div><h2><?php esc_html_e( 'مزوّد الذكاء الاصطناعي', 'blr-landing-pro' ); ?> <?php echo blrlp_is_pro() ? '' : '<span class="blrui-chip pro">PRO</span>'; // phpcs:ignore ?></h2><p><?php esc_html_e( 'يُستعمل لتوليد الصفحات وإعادة كتابة الأقسام واقتراح العناوين وSEO. المفتاح يبقى على خادمك ولا يصل للمتصفح.', 'blr-landing-pro' ); ?></p></div><span class="blrui-grow"></span><span class="blrui-chip <?php echo $has_key ? 'ok' : 'warn'; ?>"><?php echo $has_key ? esc_html__( 'المفتاح محفوظ', 'blr-landing-pro' ) : esc_html__( 'لا يوجد مفتاح', 'blr-landing-pro' ); ?></span></div>
					<div class="blrui-card__b">
						<div class="blrui-row"><label for="blrlp-provider"><?php esc_html_e( 'المزوّد', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'Claude أو OpenAI أو أي خدمة متوافقة.', 'blr-landing-pro' ); ?></small></label>
							<div><select id="blrlp-provider" class="blrui-in" name="blrlp_settings[ai_provider]"><?php foreach ( array( 'anthropic' => 'Anthropic (Claude)', 'openai' => 'OpenAI', 'custom' => 'مخصّص (متوافق مع OpenAI)' ) as $k => $l ) { printf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $provider, $k, false ), esc_html( $l ) ); } ?></select></div></div>
						<div class="blrui-row"><label for="blrlp-key"><?php esc_html_e( 'مفتاح API', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'اتركه فارغاً للإبقاء على المفتاح المحفوظ.', 'blr-landing-pro' ); ?></small></label>
							<div><input id="blrlp-key" class="blrui-in is-ltr" type="password" name="blrlp_settings[ai_key]" autocomplete="new-password" placeholder="<?php echo $has_key ? '••••••••••••••••' : 'sk-…'; ?>"></div></div>
						<div class="blrui-row"><label for="blrlp-model"><?php esc_html_e( 'النموذج', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'اتركه فارغاً للنموذج الافتراضي.', 'blr-landing-pro' ); ?></small></label>
							<div><input id="blrlp-model" class="blrui-in is-ltr" type="text" name="blrlp_settings[ai_model]" value="<?php echo esc_attr( isset( $o['ai_model'] ) ? $o['ai_model'] : '' ); ?>" placeholder="claude-sonnet-5-5 / gpt-4o-mini"></div></div>
						<div class="blrui-row" id="blrlp-base-row"><label for="blrlp-base"><?php esc_html_e( 'رابط المزوّد المخصّص', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'للمزوّد «مخصّص» فقط.', 'blr-landing-pro' ); ?></small></label>
							<div><input id="blrlp-base" class="blrui-in is-ltr" type="url" name="blrlp_settings[ai_base]" value="<?php echo esc_attr( isset( $o['ai_base'] ) ? $o['ai_base'] : '' ); ?>" placeholder="https://…/v1/chat/completions"></div></div>
					</div>
					<div class="blrui-card__f"><button type="button" class="blrui-btn is-ghost is-sm" id="blrlp-test"><?php esc_html_e( 'اختبار الاتصال', 'blr-landing-pro' ); ?></button><span class="blrui-test" id="blrlp-test-msg"></span><span class="blrui-help"><?php esc_html_e( 'احفظ الإعدادات أولاً ثم اختبر.', 'blr-landing-pro' ); ?></span></div>
				</div>
			</div>

			<div class="blrui-pane" data-pane="general" hidden>
				<div class="blrui-card">
					<div class="blrui-card__h"><span class="blrui-ico">⚙️</span><div><h2><?php esc_html_e( 'الإعدادات العامة', 'blr-landing-pro' ); ?></h2><p><?php esc_html_e( 'الإشعارات والروابط وسلوك صفحات الهبوط.', 'blr-landing-pro' ); ?></p></div></div>
					<div class="blrui-card__b">
						<div class="blrui-row"><label for="blrlp-notify"><?php esc_html_e( 'بريد إشعار العملاء المحتملين', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'يصله بريد عند كل نموذج جديد.', 'blr-landing-pro' ); ?></small></label>
							<div><input id="blrlp-notify" class="blrui-in is-ltr" type="email" name="blrlp_settings[notify]" value="<?php echo esc_attr( isset( $o['notify'] ) ? $o['notify'] : '' ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>"></div></div>
						<div class="blrui-row"><label for="blrlp-slug"><?php esc_html_e( 'بادئة روابط الصفحات', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'مثال: /lp/اسم-الصفحة', 'blr-landing-pro' ); ?></small></label>
							<div><code><?php echo esc_html( home_url( '/' ) ); ?></code> <input id="blrlp-slug" class="blrui-in is-ltr" style="width:140px" type="text" name="blrlp_settings[slug]" value="<?php echo esc_attr( blrlp_opt( 'slug', 'lp' ) ); ?>"></div></div>
						<div class="blrui-row"><span class="blrui-lab"><?php esc_html_e( 'عزل أنماط القالب', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'يمنع تنسيقات قالب الموقع من إفساد تصميم صفحة الهبوط (موصى به).', 'blr-landing-pro' ); ?></small></span>
							<div><label class="blrui-sw"><input type="checkbox" name="blrlp_settings[isolate]" value="1" <?php checked( blrlp_opt( 'isolate', '1' ), '1' ); ?>><i></i><?php esc_html_e( 'مفعّل', 'blr-landing-pro' ); ?></label></div></div>
						<div class="blrui-row"><span class="blrui-lab"><?php esc_html_e( 'حذف البيانات عند إزالة الإضافة', 'blr-landing-pro' ); ?><small><?php esc_html_e( 'الصفحات والعملاء والإحصاءات والإعدادات. غير قابل للتراجع.', 'blr-landing-pro' ); ?></small></span>
							<div><label class="blrui-sw"><input type="checkbox" name="blrlp_settings[wipe]" value="1" <?php checked( blrlp_opt( 'wipe', '0' ), '1' ); ?>><i></i><?php esc_html_e( 'احذف كل شيء', 'blr-landing-pro' ); ?></label></div></div>
					</div>
				</div>
			</div>

			<div class="blrui-pane-save" id="blrlp-save" hidden><button class="blrui-btn"><?php esc_html_e( 'حفظ الإعدادات', 'blr-landing-pro' ); ?></button></div>
		</form>
	</div>
	<script>
	(function(){
		var root=document.getElementById('blrlp-settings'),tabs=root.querySelectorAll('.blrui-tabs button'),panes=root.querySelectorAll('.blrui-pane'),save=document.getElementById('blrlp-save');
		function show(t){tabs.forEach(function(b){b.classList.toggle('is-on',b.dataset.tab===t)});panes.forEach(function(p){p.hidden=p.dataset.pane!==t});save.hidden=(t==='license');try{sessionStorage.setItem('blrlpTab',t)}catch(e){}}
		tabs.forEach(function(b){b.addEventListener('click',function(){show(b.dataset.tab)})});
		var last='license';try{last=sessionStorage.getItem('blrlpTab')||'license'}catch(e){}
		if(<?php echo isset( $_GET['settings-updated'] ) ? 'true' : 'false'; // phpcs:ignore ?>&&last==='license'){last='ai';}
		show(last);
		var prov=document.getElementById('blrlp-provider'),row=document.getElementById('blrlp-base-row');
		function pv(){row.style.display=prov.value==='custom'?'':'none'}prov.addEventListener('change',pv);pv();
		var tb=document.getElementById('blrlp-test'),tm=document.getElementById('blrlp-test-msg');
		tb.addEventListener('click',function(){tb.disabled=true;tm.className='blrui-test';tm.textContent='…';
			fetch(ajaxurl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'action=blrlp_ai_test&nonce=<?php echo esc_js( wp_create_nonce( 'blrlp_admin' ) ); ?>'}).then(function(r){return r.json()}).then(function(r){tb.disabled=false;tm.className='blrui-test '+(r.success?'ok':'err');tm.textContent=(r.success?'✓ ':'✗ ')+((r.data&&r.data.message)||'')}).catch(function(){tb.disabled=false;tm.className='blrui-test err';tm.textContent='✗ network'});});
	})();
	</script>
	<?php
}

add_action( 'wp_ajax_blrlp_ai_test', function () {
	check_ajax_referer( 'blrlp_admin', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => __( 'غير مسموح.', 'blr-landing-pro' ) ), 403 );
	}
	if ( '' === blrlp_ai_key() ) {
		wp_send_json_error( array( 'message' => __( 'لا يوجد مفتاح محفوظ.', 'blr-landing-pro' ) ) );
	}
	$r = blrlp_ai_call( 'Reply with the single word: OK', 'ping', 20 );
	if ( is_wp_error( $r ) ) {
		wp_send_json_error( array( 'message' => $r->get_error_message() ) );
	}
	wp_send_json_success( array( 'message' => __( 'الاتصال يعمل.', 'blr-landing-pro' ) ) );
} );

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
	wp_enqueue_script( 'blrlp-block', BLRLP_URL . 'assets/js/block.js', array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor' ), blrlp_ver( 'assets/js/block.js' ), true );
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
