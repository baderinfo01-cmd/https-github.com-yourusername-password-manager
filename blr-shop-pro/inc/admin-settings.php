<?php
/**
 * Admin settings page: BLR Shop Pro.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', 'blr_admin_menu' );
function blr_admin_menu() {
	add_menu_page( 'BLR Shop Pro', 'BLR Shop Pro', 'manage_options', 'blr-shop-pro', 'blr_settings_page', 'dashicons-store', 58 );
	add_submenu_page( 'blr-shop-pro', __( 'الإعدادات والترخيص', 'blr-shop-pro' ), __( 'الإعدادات والترخيص', 'blr-shop-pro' ), 'manage_options', 'blr-shop-pro', 'blr_settings_page' );
	add_submenu_page( 'blr-shop-pro', __( 'صفحة هبوط جديدة (AI)', 'blr-shop-pro' ), __( 'صفحة هبوط جديدة (AI)', 'blr-shop-pro' ), 'edit_pages', 'blr-new-landing', 'blr_new_landing_redirect' );
}

add_action( 'admin_init', 'blr_register_settings' );
function blr_register_settings() {
	register_setting( 'blr_settings_group', 'blr_settings', array( 'sanitize_callback' => 'blr_sanitize_settings' ) );
}

function blr_sanitize_settings( $in ) {
	$old = get_option( 'blr_settings', array() );
	$out = is_array( $old ) ? $old : array();
	$in  = is_array( $in ) ? $in : array();

	$text = array( 'ai_provider', 'ai_model', 'ai_lang', 'ai_brand', 'license_server' );
	foreach ( $text as $k ) {
		if ( isset( $in[ $k ] ) ) {
			$out[ $k ] = sanitize_text_field( $in[ $k ] );
		}
	}
	if ( isset( $in['ai_base'] ) ) {
		$out['ai_base'] = esc_url_raw( $in['ai_base'] );
	}
	// المفتاح لا يُستبدل إذا ترك الحقل فارغاً.
	if ( ! empty( $in['ai_key'] ) ) {
		$out['ai_key'] = sanitize_text_field( $in['ai_key'] );
	}
	$out['ai_chat']     = empty( $in['ai_chat'] ) ? 0 : 1;
	$out['ai_chat_cap'] = isset( $in['ai_chat_cap'] ) ? max( 10, min( 5000, absint( $in['ai_chat_cap'] ) ) ) : 300;
	return $out;
}

function blr_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$lic = blr_license_data();
	?>
	<div class="wrap blr-admin">
		<h1>BLR Shop Pro <small>v<?php echo esc_html( BLR_VERSION ); ?></small></h1>

		<h2><?php esc_html_e( 'الترخيص', 'blr-shop-pro' ); ?></h2>
		<table class="form-table">
			<tr>
				<th><?php esc_html_e( 'الحالة', 'blr-shop-pro' ); ?></th>
				<td>
					<strong id="blr-lic-status" class="blr-lic blr-lic-<?php echo esc_attr( $lic['status'] ); ?>">
						<?php echo esc_html( blr_license_status_label( $lic['status'] ) ); ?>
					</strong>
					<?php if ( ! empty( $lic['expires'] ) ) : ?>
						<span> — <?php echo esc_html( sprintf( __( 'ينتهي: %s', 'blr-shop-pro' ), $lic['expires'] ) ); ?></span>
					<?php endif; ?>
				</td>
			</tr>
			<tr>
				<th><label for="blr-lic-key"><?php esc_html_e( 'مفتاح الترخيص', 'blr-shop-pro' ); ?></label></th>
				<td>
					<input type="text" id="blr-lic-key" class="regular-text code" value="<?php echo esc_attr( $lic['key'] ); ?>" placeholder="BLR-XXXX-XXXX-XXXX-XXXX" autocomplete="off">
					<button type="button" class="button button-primary" data-blr-lic="activate"><?php esc_html_e( 'تفعيل', 'blr-shop-pro' ); ?></button>
					<button type="button" class="button" data-blr-lic="deactivate"><?php esc_html_e( 'إلغاء التفعيل', 'blr-shop-pro' ); ?></button>
					<p class="description" id="blr-lic-msg"></p>
					<p class="description"><?php esc_html_e( 'الترخيص مرتبط بنطاق موقعك. يفتح ميزات الذكاء الاصطناعي ومنشئ صفحات الهبوط والتحديثات التلقائية.', 'blr-shop-pro' ); ?></p>
				</td>
			</tr>
		</table>

		<form method="post" action="options.php">
			<?php settings_fields( 'blr_settings_group' ); ?>
			<h2><?php esc_html_e( 'الذكاء الاصطناعي', 'blr-shop-pro' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><?php esc_html_e( 'المزوّد', 'blr-shop-pro' ); ?></th>
					<td>
						<select name="blr_settings[ai_provider]">
							<option value="anthropic" <?php selected( blr_opt( 'ai_provider', 'anthropic' ), 'anthropic' ); ?>>Anthropic (Claude)</option>
							<option value="openai" <?php selected( blr_opt( 'ai_provider', 'anthropic' ), 'openai' ); ?>>OpenAI / متوافق مع OpenAI</option>
						</select>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'مفتاح API', 'blr-shop-pro' ); ?></th>
					<td>
						<input type="password" class="regular-text" name="blr_settings[ai_key]" value="" autocomplete="new-password" placeholder="<?php echo blr_opt( 'ai_key' ) ? esc_attr__( '•••••• محفوظ — اتركه فارغاً للإبقاء عليه', 'blr-shop-pro' ) : ''; ?>">
						<p class="description"><?php esc_html_e( 'يُخزَّن في قاعدة بياناتك ويُستخدم من الخادم فقط، ولا يظهر للزوار أبداً.', 'blr-shop-pro' ); ?></p>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'النموذج', 'blr-shop-pro' ); ?></th>
					<td><input type="text" class="regular-text code" name="blr_settings[ai_model]" value="<?php echo esc_attr( blr_opt( 'ai_model', 'claude-sonnet-5-5' ) ); ?>"></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'رابط API (لـ OpenAI المتوافق فقط)', 'blr-shop-pro' ); ?></th>
					<td><input type="url" class="regular-text code" name="blr_settings[ai_base]" value="<?php echo esc_attr( blr_opt( 'ai_base', 'https://api.openai.com/v1' ) ); ?>"></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'اسم المتجر / وصف النشاط', 'blr-shop-pro' ); ?></th>
					<td><input type="text" class="large-text" name="blr_settings[ai_brand]" value="<?php echo esc_attr( blr_opt( 'ai_brand', get_bloginfo( 'name' ) ) ); ?>"></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'لغة المحتوى', 'blr-shop-pro' ); ?></th>
					<td><input type="text" name="blr_settings[ai_lang]" value="<?php echo esc_attr( blr_opt( 'ai_lang', 'العربية' ) ); ?>"></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'مساعد التسوق للزوار', 'blr-shop-pro' ); ?></th>
					<td>
						<label><input type="checkbox" name="blr_settings[ai_chat]" value="1" <?php checked( blr_opt( 'ai_chat', 0 ), 1 ); ?>> <?php esc_html_e( 'تفعيل نافذة المحادثة في الواجهة', 'blr-shop-pro' ); ?></label><br>
						<label><?php esc_html_e( 'الحد اليومي لرسائل الزوار:', 'blr-shop-pro' ); ?> <input type="number" min="10" max="5000" name="blr_settings[ai_chat_cap]" value="<?php echo esc_attr( blr_opt( 'ai_chat_cap', 300 ) ); ?>"></label>
					</td>
				</tr>
			</table>

			<h2><?php esc_html_e( 'خادم الترخيص', 'blr-shop-pro' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><?php esc_html_e( 'رابط REST الخاص بخادم الترخيص', 'blr-shop-pro' ); ?></th>
					<td>
						<input type="url" class="large-text code" name="blr_settings[license_server]" value="<?php echo esc_attr( blr_license_server() ); ?>">
						<p class="description"><?php esc_html_e( 'مثال: https://your-domain.com/wp-json/blr-license/v1 (من إضافة BLR License Server).', 'blr-shop-pro' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/**
 * Creates a draft page using the landing template and opens it.
 */
function blr_new_landing_redirect() {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_die( esc_html__( 'غير مسموح.', 'blr-shop-pro' ) );
	}
	$id = wp_insert_post(
		array(
			'post_type'   => 'page',
			'post_status' => 'draft',
			'post_title'  => __( 'صفحة هبوط جديدة', 'blr-shop-pro' ),
		)
	);
	if ( $id && ! is_wp_error( $id ) ) {
		update_post_meta( $id, '_wp_page_template', 'template-landing.php' );
		wp_safe_redirect( get_edit_post_link( $id, 'raw' ) );
		exit;
	}
	wp_safe_redirect( admin_url( 'edit.php?post_type=page' ) );
	exit;
}

add_action( 'admin_enqueue_scripts', 'blr_admin_assets' );
function blr_admin_assets( $hook ) {
	wp_enqueue_style( 'blr-admin', BLR_URI . '/assets/css/admin.css', array(), BLR_VERSION );
	wp_enqueue_script( 'blr-admin', BLR_URI . '/assets/js/admin.js', array(), BLR_VERSION, true );
	wp_localize_script(
		'blr-admin',
		'BLRA',
		array(
			'ajax'  => admin_url( 'admin-ajax.php' ),
			'nonce' => wp_create_nonce( 'blr_admin' ),
			'wait'  => __( 'جارٍ العمل…', 'blr-shop-pro' ),
		)
	);
}

add_action( 'admin_notices', 'blr_license_notice' );
function blr_license_notice() {
	if ( ! current_user_can( 'manage_options' ) || blr_is_licensed() ) {
		return;
	}
	$screen = get_current_screen();
	if ( $screen && 'toplevel_page_blr-shop-pro' === $screen->id ) {
		return;
	}
	printf(
		'<div class="notice notice-warning"><p><strong>BLR Shop Pro:</strong> %s <a href="%s">%s</a></p></div>',
		esc_html__( 'فعّل الترخيص لفتح ميزات الذكاء الاصطناعي ومنشئ الصفحات والتحديثات.', 'blr-shop-pro' ),
		esc_url( admin_url( 'admin.php?page=blr-shop-pro' ) ),
		esc_html__( 'تفعيل الآن', 'blr-shop-pro' )
	);
}
