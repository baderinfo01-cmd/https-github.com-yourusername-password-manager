<?php
/**
 * المواقع الجاهزة: عرض واستيراد تصاميم كاملة بنقرة.
 *
 * @package baderlr-companion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * قراءة قائمة الديمو من مجلّد demos/.
 */
function baderlr_starter_demos() {
	$demos = array();
	foreach ( glob( BADERLR_COMPANION_DIR . 'demos/*.json' ) as $file ) {
		$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore
		if ( is_array( $data ) && ! empty( $data['slug'] ) ) {
			$demos[ $data['slug'] ] = $data;
		}
	}
	return $demos;
}

function baderlr_starter_licensed() {
	return function_exists( 'baderlr_licensed' ) ? baderlr_licensed() : false;
}

/* ================= صفحة العرض ================= */

function baderlr_c_sites_page() {
	if ( ! current_user_can( 'edit_pages' ) ) {
		return;
	}
	$demos    = baderlr_starter_demos();
	$licensed = baderlr_starter_licensed();
	?>
	<div class="wrap baderlr-c" dir="rtl">
		<h1>🧩 <?php esc_html_e( 'المواقع الجاهزة', 'baderlr-companion' ); ?></h1>
		<p class="description"><?php esc_html_e( 'اختر تصميماً وابنِ موقعك بنقرة. ينشئ الاستيراد الصفحات والقائمة ويضبط الرئيسية والنمط.', 'baderlr-companion' ); ?></p>
		<?php if ( ! $licensed ) : ?>
			<div class="notice notice-warning"><p>
				<?php esc_html_e( 'استيراد المواقع ميزة مدفوعة — فعّل ترخيص القالب أولاً.', 'baderlr-companion' ); ?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=baderlr-license' ) ); ?>"><?php esc_html_e( 'تفعيل الترخيص', 'baderlr-companion' ); ?></a>
			</p></div>
		<?php endif; ?>
		<div class="blrc-sites">
			<?php foreach ( $demos as $slug => $d ) : ?>
				<div class="blrc-site" style="--v:<?php echo esc_attr( isset( $d['accent'] ) ? $d['accent'] : '#2F5BFF' ); ?>">
					<div class="blrc-site__cover"><span><?php echo esc_html( isset( $d['emoji'] ) ? $d['emoji'] : '🌐' ); ?></span></div>
					<div class="blrc-site__body">
						<h3><?php echo esc_html( $d['name'] ); ?></h3>
						<p><?php echo esc_html( isset( $d['desc'] ) ? $d['desc'] : '' ); ?></p>
						<button class="button button-primary blrc-import" data-demo="<?php echo esc_attr( $slug ); ?>" <?php disabled( ! $licensed ); ?>><?php esc_html_e( 'استيراد الموقع', 'baderlr-companion' ); ?></button>
						<span class="blrc-import-msg"></span>
					</div>
				</div>
			<?php endforeach; ?>
			<?php if ( ! $demos ) : ?><p><?php esc_html_e( 'لا توجد مواقع جاهزة.', 'baderlr-companion' ); ?></p><?php endif; ?>
		</div>
	</div>
	<?php
}

/* ================= REST: استيراد ================= */

add_action( 'rest_api_init', function () {
	register_rest_route( 'baderlr/v1', '/import', array(
		'methods'             => 'POST',
		'callback'            => 'baderlr_starter_rest_import',
		'permission_callback' => function () {
			return current_user_can( 'manage_options' );
		},
	) );
} );

function baderlr_starter_rest_import( WP_REST_Request $req ) {
	if ( ! baderlr_starter_licensed() ) {
		return new WP_REST_Response( array( 'error' => __( 'يتطلب ترخيصاً مفعّلاً.', 'baderlr-companion' ) ), 403 );
	}
	$slug  = sanitize_title( (string) $req->get_param( 'demo' ) );
	$demos = baderlr_starter_demos();
	if ( ! isset( $demos[ $slug ] ) ) {
		return new WP_REST_Response( array( 'error' => __( 'الموقع غير موجود.', 'baderlr-companion' ) ), 404 );
	}
	$result = baderlr_starter_import( $demos[ $slug ] );
	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response( array( 'error' => $result->get_error_message() ), 500 );
	}
	return new WP_REST_Response( $result, 200 );
}

/**
 * تنفيذ الاستيراد: إنشاء الصفحات، القائمة، الرئيسية، النمط.
 */
function baderlr_starter_import( $demo ) {
	$map = array();

	foreach ( (array) ( $demo['pages'] ?? array() ) as $page ) {
		$slug = sanitize_title( $page['slug'] ?? $page['title'] );
		$exist = get_page_by_path( $slug );
		if ( $exist ) {
			$map[ $slug ] = $exist->ID;
			continue;
		}
		$id = wp_insert_post( array(
			'post_title'   => sanitize_text_field( $page['title'] ?? 'Page' ),
			'post_name'    => $slug,
			'post_content' => (string) ( $page['content'] ?? '' ),
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'page_template'=> ! empty( $page['template'] ) ? sanitize_text_field( $page['template'] ) : '',
		) );
		if ( is_wp_error( $id ) ) {
			return $id;
		}
		$map[ $slug ] = $id;
	}

	// الصفحة الرئيسية.
	if ( ! empty( $demo['front'] ) && isset( $map[ $demo['front'] ] ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $map[ $demo['front'] ] );
		if ( ! empty( $demo['blog'] ) && isset( $map[ $demo['blog'] ] ) ) {
			update_option( 'page_for_posts', $map[ $demo['blog'] ] );
		}
	}

	// القائمة الرئيسية.
	if ( ! empty( $demo['menu'] ) ) {
		$menu_name = $demo['name'] . ' — Menu';
		$menu_id   = wp_create_nav_menu( $menu_name );
		if ( ! is_wp_error( $menu_id ) ) {
			foreach ( (array) $demo['menu'] as $slug ) {
				if ( isset( $map[ $slug ] ) ) {
					wp_update_nav_menu_item( $menu_id, 0, array(
						'menu-item-title'     => get_the_title( $map[ $slug ] ),
						'menu-item-object'    => 'page',
						'menu-item-object-id' => $map[ $slug ],
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
					) );
				}
			}
			$locations            = get_theme_mod( 'nav_menu_locations', array() );
			$locations['primary'] = $menu_id;
			set_theme_mod( 'nav_menu_locations', $locations );
		}
	}

	// النمط.
	if ( ! empty( $demo['variant'] ) ) {
		set_theme_mod( 'baderlr_variant', sanitize_text_field( $demo['variant'] ) );
	}

	return array( 'ok' => true, 'url' => home_url( '/' ), 'pages' => count( $map ) );
}
