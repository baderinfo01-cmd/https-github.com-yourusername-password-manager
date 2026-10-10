<?php
/**
 * Plugin Name: BLR License Server
 * Description: خادم تراخيص لقالب BLR Shop Pro ومنتجاتك الرقمية: توليد مفاتيح، تفعيل بحسب النطاق، انتهاء صلاحية، إلغاء، تحديثات محمية، وربط مع ووكومرس (إصدار المفتاح عند اكتمال الطلب).
 * Version: 1.0.0
 * Author: BLR
 * Text Domain: blr-license-server
 * License: GPL-2.0-or-later
 * Requires PHP: 7.4
 *
 * ثبّت هذه الإضافة على موقع البيع (وليس على مواقع العملاء).
 *
 * @package BLR_License_Server
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BLRLS_VER', '1.0.0' );

/* ---------------------------------------------------------------
 * قاعدة البيانات
 * ------------------------------------------------------------- */
register_activation_hook( __FILE__, 'blrls_install' );
function blrls_install() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$c = $wpdb->get_charset_collate();
	dbDelta( "CREATE TABLE {$wpdb->prefix}blr_licenses (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		license_key VARCHAR(40) NOT NULL,
		email VARCHAR(190) NOT NULL DEFAULT '',
		product VARCHAR(60) NOT NULL DEFAULT 'blr-shop-pro',
		plan VARCHAR(40) NOT NULL DEFAULT 'pro',
		max_sites SMALLINT UNSIGNED NOT NULL DEFAULT 1,
		status VARCHAR(12) NOT NULL DEFAULT 'active',
		expires DATETIME NULL,
		order_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
		created DATETIME NOT NULL,
		PRIMARY KEY  (id),
		UNIQUE KEY license_key (license_key),
		KEY email (email)
	) $c;" );
	dbDelta( "CREATE TABLE {$wpdb->prefix}blr_activations (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		license_id BIGINT UNSIGNED NOT NULL,
		domain VARCHAR(190) NOT NULL,
		created DATETIME NOT NULL,
		PRIMARY KEY  (id),
		UNIQUE KEY lic_domain (license_id,domain)
	) $c;" );
}

/* ---------------------------------------------------------------
 * منطق التراخيص
 * ------------------------------------------------------------- */
function blrls_generate_key() {
	$raw = strtoupper( bin2hex( random_bytes( 8 ) ) );
	return 'BLR-' . implode( '-', str_split( $raw, 4 ) );
}

/**
 * Create a license.
 *
 * @return string|false The key.
 */
function blrls_create( $args ) {
	global $wpdb;
	$args = wp_parse_args(
		$args,
		array( 'email' => '', 'product' => 'blr-shop-pro', 'plan' => 'pro', 'max_sites' => 1, 'days' => 365, 'order_id' => 0 )
	);
	$key  = blrls_generate_key();
	$ok   = $wpdb->insert(
		"{$wpdb->prefix}blr_licenses",
		array(
			'license_key' => $key,
			'email'       => sanitize_email( $args['email'] ),
			'product'     => sanitize_key( $args['product'] ),
			'plan'        => sanitize_key( $args['plan'] ),
			'max_sites'   => max( 1, absint( $args['max_sites'] ) ),
			'status'      => 'active',
			'expires'     => absint( $args['days'] ) ? gmdate( 'Y-m-d H:i:s', time() + absint( $args['days'] ) * DAY_IN_SECONDS ) : null,
			'order_id'    => absint( $args['order_id'] ),
			'created'     => gmdate( 'Y-m-d H:i:s' ),
		)
	);
	return $ok ? $key : false;
}

function blrls_get( $key ) {
	global $wpdb;
	return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}blr_licenses WHERE license_key = %s", strtoupper( trim( $key ) ) ) );
}

function blrls_state( $lic ) {
	if ( ! $lic ) {
		return 'invalid';
	}
	if ( 'active' !== $lic->status ) {
		return $lic->status;
	}
	if ( $lic->expires && strtotime( $lic->expires . ' UTC' ) < time() ) {
		return 'expired';
	}
	return 'active';
}

function blrls_domain( $d ) {
	$d = strtolower( trim( (string) $d ) );
	$d = preg_replace( '#^https?://#', '', $d );
	$d = preg_replace( '#^www\.#', '', $d );
	return preg_replace( '#[^a-z0-9.\-:]#', '', strtok( $d, '/' ) );
}

/* ---------------------------------------------------------------
 * REST API: /wp-json/blr-license/v1/{activate|deactivate|validate|update}
 * ------------------------------------------------------------- */
add_action( 'rest_api_init', function () {
	foreach ( array( 'activate', 'deactivate', 'validate', 'update' ) as $route ) {
		register_rest_route(
			'blr-license/v1',
			'/' . $route,
			array(
				'methods'             => 'POST',
				'callback'            => function ( WP_REST_Request $r ) use ( $route ) {
					return blrls_handle( $route, $r );
				},
				'permission_callback' => '__return_true', // مصادقة بمفتاح الترخيص نفسه.
			)
		);
	}
} );

function blrls_handle( $route, WP_REST_Request $r ) {
	global $wpdb;

	// تحديد معدل الطلبات: 30 طلباً/ساعة لكل IP.
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '0';
	$rk = 'blrls_rl_' . md5( $ip );
	$n  = (int) get_transient( $rk );
	if ( $n > 30 ) {
		return new WP_REST_Response( array( 'success' => false, 'message' => 'Too many requests.' ), 429 );
	}
	set_transient( $rk, $n + 1, HOUR_IN_SECONDS );

	$lic    = blrls_get( (string) $r->get_param( 'key' ) );
	$domain = blrls_domain( $r->get_param( 'domain' ) );
	$state  = blrls_state( $lic );
	$fail   = function ( $msg, $status = null ) use ( $state ) {
		return array( 'success' => false, 'status' => $status ?: $state, 'message' => $msg );
	};

	if ( ! $lic || '' === $domain ) {
		return $fail( 'مفتاح الترخيص غير صالح.', 'invalid' );
	}
	if ( sanitize_key( (string) $r->get_param( 'product' ) ) !== $lic->product ) {
		return $fail( 'هذا المفتاح لمنتج آخر.', 'invalid' );
	}
	$tbl    = "{$wpdb->prefix}blr_activations";
	$exists = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM $tbl WHERE license_id = %d AND domain = %s", $lic->id, $domain ) );
	$count  = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $tbl WHERE license_id = %d", $lic->id ) );
	$ok     = array( 'success' => true, 'status' => 'active', 'plan' => $lic->plan, 'expires' => $lic->expires ? gmdate( 'Y-m-d', strtotime( $lic->expires . ' UTC' ) ) : '' );

	switch ( $route ) {
		case 'activate':
			if ( 'active' !== $state ) {
				return $fail( 'الترخيص ' . ( 'expired' === $state ? 'منتهي' : 'غير فعّال' ) . '.' );
			}
			if ( ! $exists ) {
				if ( $count >= (int) $lic->max_sites ) {
					return $fail( 'تم الوصول للحد الأقصى من المواقع (' . (int) $lic->max_sites . '). ألغِ التفعيل من موقع آخر أولاً.' );
				}
				$wpdb->insert( $tbl, array( 'license_id' => $lic->id, 'domain' => $domain, 'created' => gmdate( 'Y-m-d H:i:s' ) ) );
			}
			return $ok;

		case 'deactivate':
			$wpdb->delete( $tbl, array( 'license_id' => $lic->id, 'domain' => $domain ) );
			return array( 'success' => true );

		case 'validate':
			if ( 'active' !== $state || ! $exists ) {
				return $fail( 'الترخيص غير مفعّل لهذا النطاق.', 'active' !== $state ? $state : 'inactive' );
			}
			return $ok;

		case 'update':
			if ( 'active' !== $state || ! $exists ) {
				return $fail( 'الترخيص غير مفعّل لهذا النطاق.' );
			}
			$info = get_option( 'blrls_release', array() );
			if ( empty( $info['version'] ) || empty( $info['file'] ) ) {
				return $fail( 'لا يوجد إصدار منشور.' );
			}
			// رابط تحميل موقّع صالح 15 دقيقة.
			$exp = time() + 900;
			$sig = hash_hmac( 'sha256', $lic->license_key . '|' . $domain . '|' . $exp, wp_salt( 'auth' ) );
			return array(
				'success' => true,
				'version' => $info['version'],
				'url'     => $info['url'] ?? '',
				'package' => add_query_arg( array( 'blr_dl' => 1, 'k' => $lic->license_key, 'd' => $domain, 'e' => $exp, 's' => $sig ), home_url( '/' ) ),
			);
	}
	return $fail( 'طلب غير معروف.' );
}

/* تنزيل الحزمة بعد التحقق من التوقيع. الملف يُحفظ خارج الويب (أو مجلد محمي). */
add_action( 'template_redirect', function () {
	if ( empty( $_GET['blr_dl'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return;
	}
	$k = isset( $_GET['k'] ) ? sanitize_text_field( wp_unslash( $_GET['k'] ) ) : ''; // phpcs:ignore
	$d = isset( $_GET['d'] ) ? blrls_domain( wp_unslash( $_GET['d'] ) ) : ''; // phpcs:ignore
	$e = isset( $_GET['e'] ) ? absint( $_GET['e'] ) : 0; // phpcs:ignore
	$s = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; // phpcs:ignore
	$ok = $e > time() && hash_equals( hash_hmac( 'sha256', $k . '|' . $d . '|' . $e, wp_salt( 'auth' ) ), $s );
	$info = get_option( 'blrls_release', array() );
	$file = isset( $info['file'] ) ? realpath( $info['file'] ) : false;
	if ( ! $ok || ! $file || ! is_readable( $file ) ) {
		wp_die( 'رابط غير صالح أو منتهٍ.', '', array( 'response' => 403 ) );
	}
	header( 'Content-Type: application/zip' );
	header( 'Content-Disposition: attachment; filename="blr-shop-pro.zip"' );
	header( 'Content-Length: ' . filesize( $file ) );
	readfile( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	exit;
} );

/* ---------------------------------------------------------------
 * لوحة الإدارة
 * ------------------------------------------------------------- */
add_action( 'admin_menu', function () {
	add_menu_page( 'BLR Licenses', 'BLR Licenses', 'manage_options', 'blr-licenses', 'blrls_admin_page', 'dashicons-admin-network', 59 );
} );

add_action( 'admin_post_blrls_action', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'blrls_action' ) ) {
		wp_die( 'غير مسموح.' );
	}
	global $wpdb;
	$do  = isset( $_POST['do'] ) ? sanitize_key( $_POST['do'] ) : '';
	$msg = '';
	if ( 'create' === $do ) {
		$key = blrls_create(
			array(
				'email'     => sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ),
				'plan'      => sanitize_key( $_POST['plan'] ?? 'pro' ),
				'max_sites' => absint( $_POST['sites'] ?? 1 ),
				'days'      => absint( $_POST['days'] ?? 365 ),
			)
		);
		$msg = $key ? 'created:' . $key : '';
	} elseif ( in_array( $do, array( 'revoke', 'restore', 'delete' ), true ) ) {
		$id = absint( $_POST['id'] ?? 0 );
		if ( 'delete' === $do ) {
			$wpdb->delete( "{$wpdb->prefix}blr_licenses", array( 'id' => $id ) );
			$wpdb->delete( "{$wpdb->prefix}blr_activations", array( 'license_id' => $id ) );
		} else {
			$wpdb->update( "{$wpdb->prefix}blr_licenses", array( 'status' => 'revoke' === $do ? 'revoked' : 'active' ), array( 'id' => $id ) );
		}
	} elseif ( 'release' === $do ) {
		$file = sanitize_text_field( wp_unslash( $_POST['file'] ?? '' ) );
		update_option(
			'blrls_release',
			array(
				'version' => sanitize_text_field( wp_unslash( $_POST['version'] ?? '' ) ),
				'file'    => $file,
				'url'     => esc_url_raw( wp_unslash( $_POST['url'] ?? '' ) ),
			),
			false
		);
	}
	wp_safe_redirect( add_query_arg( 'blrmsg', rawurlencode( $msg ), admin_url( 'admin.php?page=blr-licenses' ) ) );
	exit;
} );

function blrls_admin_page() {
	global $wpdb;
	$rows = $wpdb->get_results( "SELECT l.*, (SELECT COUNT(*) FROM {$wpdb->prefix}blr_activations a WHERE a.license_id = l.id) AS used FROM {$wpdb->prefix}blr_licenses l ORDER BY l.id DESC LIMIT 200" );
	$rel  = get_option( 'blrls_release', array() );
	$msg  = isset( $_GET['blrmsg'] ) ? sanitize_text_field( wp_unslash( $_GET['blrmsg'] ) ) : ''; // phpcs:ignore
	?>
	<div class="wrap">
		<h1>BLR Licenses</h1>
		<?php if ( 0 === strpos( $msg, 'created:' ) ) : ?>
			<div class="notice notice-success"><p>تم إنشاء المفتاح: <code><?php echo esc_html( substr( $msg, 8 ) ); ?></code></p></div>
		<?php endif; ?>

		<h2>إنشاء ترخيص</h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="blrls_action"><input type="hidden" name="do" value="create">
			<?php wp_nonce_field( 'blrls_action' ); ?>
			<input type="email" name="email" placeholder="بريد العميل" required>
			<input type="text" name="plan" value="pro" size="8" title="الخطة">
			<input type="number" name="sites" value="1" min="1" style="width:70px" title="عدد المواقع">
			<input type="number" name="days" value="365" min="0" style="width:80px" title="الأيام (0 = دائم)">
			<?php submit_button( 'إنشاء', 'primary', 'submit', false ); ?>
		</form>

		<h2>الإصدار المنشور للتحديثات</h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="blrls_action"><input type="hidden" name="do" value="release">
			<?php wp_nonce_field( 'blrls_action' ); ?>
			<input type="text" name="version" value="<?php echo esc_attr( $rel['version'] ?? '' ); ?>" placeholder="1.0.1" size="8">
			<input type="text" name="file" value="<?php echo esc_attr( $rel['file'] ?? '' ); ?>" placeholder="/المسار/المطلق/blr-shop-pro.zip" size="50">
			<input type="url" name="url" value="<?php echo esc_attr( $rel['url'] ?? '' ); ?>" placeholder="رابط صفحة الإصدار (اختياري)" size="30">
			<?php submit_button( 'حفظ', 'secondary', 'submit', false ); ?>
			<p class="description">ضع ملف ZIP خارج مجلد الويب العام إن أمكن. التحميل يتم عبر رابط موقّع مؤقت لكل ترخيص مفعّل.</p>
		</form>

		<h2>التراخيص (آخر 200)</h2>
		<table class="widefat striped">
			<thead><tr><th>المفتاح</th><th>البريد</th><th>الخطة</th><th>المواقع</th><th>الحالة</th><th>ينتهي</th><th>طلب</th><th></th></tr></thead>
			<tbody>
			<?php foreach ( $rows as $r ) : $st = blrls_state( $r ); ?>
				<tr>
					<td><code><?php echo esc_html( $r->license_key ); ?></code></td>
					<td><?php echo esc_html( $r->email ); ?></td>
					<td><?php echo esc_html( $r->plan ); ?></td>
					<td><?php echo (int) $r->used . ' / ' . (int) $r->max_sites; ?></td>
					<td><?php echo esc_html( $st ); ?></td>
					<td><?php echo esc_html( $r->expires ? gmdate( 'Y-m-d', strtotime( $r->expires . ' UTC' ) ) : '∞' ); ?></td>
					<td><?php echo $r->order_id ? '#' . (int) $r->order_id : '—'; ?></td>
					<td>
						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline">
							<input type="hidden" name="action" value="blrls_action"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>">
							<?php wp_nonce_field( 'blrls_action' ); ?>
							<button class="button" name="do" value="<?php echo 'revoked' === $r->status ? 'restore' : 'revoke'; ?>"><?php echo 'revoked' === $r->status ? 'استعادة' : 'إلغاء'; ?></button>
							<button class="button-link-delete" name="do" value="delete" onclick="return confirm('حذف نهائي؟')">حذف</button>
						</form>
					</td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}

/* ---------------------------------------------------------------
 * ربط ووكومرس: إصدار مفتاح عند اكتمال الطلب
 * (يُفعَّل من حقل «إصدار مفتاح ترخيص» في تبويب BLR Pro داخل المنتج)
 * ------------------------------------------------------------- */
add_action( 'woocommerce_order_status_completed', function ( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( ! $order || $order->get_meta( '_blr_licenses_issued' ) ) {
		return;
	}
	$issued = array();
	foreach ( $order->get_items() as $item ) {
		$product = $item->get_product();
		if ( ! $product ) {
			continue;
		}
		$pid = $product->get_parent_id() ?: $product->get_id();
		if ( 'yes' !== get_post_meta( $pid, '_blr_issue_license', true ) ) {
			continue;
		}
		for ( $q = 0; $q < max( 1, (int) $item->get_quantity() ); $q++ ) {
			$key = blrls_create(
				array(
					'email'     => $order->get_billing_email(),
					'plan'      => get_post_meta( $pid, '_blr_license_plan', true ) ?: 'pro',
					'max_sites' => (int) get_post_meta( $pid, '_blr_license_sites', true ) ?: 1,
					'days'      => (int) get_post_meta( $pid, '_blr_license_days', true ),
					'order_id'  => $order_id,
				)
			);
			if ( $key ) {
				$issued[] = array( 'name' => $item->get_name(), 'key' => $key );
			}
		}
	}
	if ( $issued ) {
		$order->update_meta_data( '_blr_licenses_issued', $issued );
		$order->add_order_note( 'تم إصدار ' . count( $issued ) . ' مفتاح ترخيص.' );
		$order->save();
	}
}, 20 );

function blrls_print_keys( $order ) {
	$keys = $order->get_meta( '_blr_licenses_issued' );
	if ( empty( $keys ) || ! is_array( $keys ) ) {
		return;
	}
	echo '<h2>مفاتيح الترخيص</h2><table class="shop_table" cellspacing="0" style="width:100%;border:1px solid #e5e5e5;margin-bottom:20px"><tbody>';
	foreach ( $keys as $k ) {
		echo '<tr><td style="padding:8px">' . esc_html( $k['name'] ) . '</td><td style="padding:8px"><code>' . esc_html( $k['key'] ) . '</code></td></tr>';
	}
	echo '</tbody></table>';
}
add_action( 'woocommerce_email_after_order_table', function ( $order, $sent_to_admin, $plain ) {
	if ( ! $plain ) {
		blrls_print_keys( $order );
	}
}, 10, 3 );
add_action( 'woocommerce_order_details_after_order_table', 'blrls_print_keys' );
