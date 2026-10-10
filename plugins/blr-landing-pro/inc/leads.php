<?php
/**
 * العملاء المحتملون: جداول، استقبال النماذج (REST)، بريد، Webhook، تصدير CSV.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blrlp_install_tables() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$c = $wpdb->get_charset_collate();
	dbDelta( "CREATE TABLE {$wpdb->prefix}blrlp_leads (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		landing_id BIGINT UNSIGNED NOT NULL,
		name VARCHAR(190) NOT NULL DEFAULT '',
		email VARCHAR(190) NOT NULL DEFAULT '',
		phone VARCHAR(60) NOT NULL DEFAULT '',
		message TEXT NULL,
		ip_hash VARCHAR(32) NOT NULL DEFAULT '',
		created DATETIME NOT NULL,
		PRIMARY KEY  (id),
		KEY landing_id (landing_id),
		KEY email (email)
	) $c;" );
	dbDelta( "CREATE TABLE {$wpdb->prefix}blrlp_stats (
		landing_id BIGINT UNSIGNED NOT NULL,
		day DATE NOT NULL,
		views INT UNSIGNED NOT NULL DEFAULT 0,
		uniques INT UNSIGNED NOT NULL DEFAULT 0,
		clicks INT UNSIGNED NOT NULL DEFAULT 0,
		leads INT UNSIGNED NOT NULL DEFAULT 0,
		PRIMARY KEY  (landing_id,day)
	) $c;" );
}

function blrlp_form_sig( $landing_id, $ts ) {
	return substr( hash_hmac( 'sha256', (int) $landing_id . '|' . (int) $ts, wp_salt( 'nonce' ) ), 0, 20 );
}

/** زيادة عدّاد يومي. */
function blrlp_bump( $landing_id, $field ) {
	global $wpdb;
	if ( ! in_array( $field, array( 'views', 'uniques', 'clicks', 'leads' ), true ) ) {
		return;
	}
	$wpdb->query( $wpdb->prepare( // phpcs:ignore WordPress.DB
		"INSERT INTO {$wpdb->prefix}blrlp_stats (landing_id, day, $field) VALUES (%d, %s, 1) ON DUPLICATE KEY UPDATE $field = $field + 1",
		$landing_id,
		current_time( 'Y-m-d' )
	) );
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'blrlp/v1', '/lead', array(
		'methods'             => 'POST',
		'callback'            => 'blrlp_rest_lead',
		'permission_callback' => '__return_true', // عام؛ محمي بتوقيع + honeypot + حدّ معدّل.
	) );
	register_rest_route( 'blrlp/v1', '/track', array(
		'methods'             => 'POST',
		'callback'            => 'blrlp_rest_track',
		'permission_callback' => '__return_true',
	) );
} );

function blrlp_rest_lead( WP_REST_Request $r ) {
	$id  = absint( $r->get_param( 'landing' ) );
	$ts  = absint( $r->get_param( 'ts' ) );
	$sig = (string) $r->get_param( 'sig' );
	$err = function ( $m, $c = 400 ) {
		return new WP_REST_Response( array( 'ok' => false, 'error' => $m ), $c );
	};

	if ( ! $id || 'blr_landing' !== get_post_type( $id ) || 'publish' !== get_post_status( $id ) ) {
		return $err( __( 'صفحة غير صالحة.', 'blr-landing-pro' ) );
	}
	if ( $r->get_param( 'website' ) ) { // honeypot: نرد بنجاح وهمي.
		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}
	$now = time();
	if ( ! hash_equals( blrlp_form_sig( $id, $ts ), $sig ) || $now - $ts > 30 * DAY_IN_SECONDS || $now - $ts < 2 ) {
		return $err( __( 'انتهت صلاحية النموذج، حدّث الصفحة وأعد المحاولة.', 'blr-landing-pro' ) );
	}
	$rk = 'blrlp_rl_' . blrlp_client_ip_hash();
	$n  = (int) get_transient( $rk );
	if ( $n >= 5 ) {
		return $err( __( 'محاولات كثيرة، حاول لاحقاً.', 'blr-landing-pro' ), 429 );
	}
	set_transient( $rk, $n + 1, 10 * MINUTE_IN_SECONDS );

	$email = sanitize_email( (string) $r->get_param( 'email' ) );
	if ( ! is_email( $email ) ) {
		return $err( __( 'بريد إلكتروني غير صالح.', 'blr-landing-pro' ) );
	}
	$name    = mb_substr( sanitize_text_field( (string) $r->get_param( 'name' ) ), 0, 190 );
	$phone   = mb_substr( preg_replace( '/[^0-9+\-\s()]/', '', (string) $r->get_param( 'phone' ) ), 0, 60 );
	$message = mb_substr( sanitize_textarea_field( (string) $r->get_param( 'message' ) ), 0, 1500 );

	global $wpdb;
	$wpdb->insert( "{$wpdb->prefix}blrlp_leads", array(
		'landing_id' => $id,
		'name'       => $name,
		'email'      => $email,
		'phone'      => $phone,
		'message'    => $message,
		'ip_hash'    => blrlp_client_ip_hash(),
		'created'    => current_time( 'mysql' ),
	) );
	blrlp_bump( $id, 'leads' );

	$data = blrlp_get_data( $id );
	$to   = $data['settings']['notify'] ? $data['settings']['notify'] : ( blrlp_opt( 'notify' ) ? blrlp_opt( 'notify' ) : get_option( 'admin_email' ) );
	$body = sprintf( "%s: %s\n%s: %s\n%s: %s\n%s: %s\n\n%s", __( 'الصفحة', 'blr-landing-pro' ), get_the_title( $id ), __( 'الاسم', 'blr-landing-pro' ), $name, __( 'البريد', 'blr-landing-pro' ), $email, __( 'الهاتف', 'blr-landing-pro' ), $phone, $message );
	wp_mail( $to, '[' . get_bloginfo( 'name' ) . '] ' . __( 'عميل محتمل جديد', 'blr-landing-pro' ), $body, array( 'Reply-To: ' . $email ) );

	if ( blrlp_is_pro() && $data['settings']['webhook'] ) {
		wp_remote_post( $data['settings']['webhook'], array(
			'timeout'  => 5,
			'blocking' => false,
			'headers'  => array( 'Content-Type' => 'application/json' ),
			'body'     => wp_json_encode( array( 'landing' => get_the_title( $id ), 'landing_id' => $id, 'name' => $name, 'email' => $email, 'phone' => $phone, 'message' => $message, 'time' => gmdate( 'c' ) ) ),
		) );
	}
	return new WP_REST_Response( array( 'ok' => true, 'redirect' => $data['settings']['redirect'] ), 200 );
}

function blrlp_rest_track( WP_REST_Request $r ) {
	$id   = absint( $r->get_param( 'id' ) );
	$type = (string) $r->get_param( 'type' );
	if ( ! $id || 'blr_landing' !== get_post_type( $id ) || 'publish' !== get_post_status( $id ) || blrlp_is_bot() ) {
		return new WP_REST_Response( array( 'ok' => false ), 200 );
	}
	if ( 'view' === $type ) {
		blrlp_bump( $id, 'views' );
		if ( $r->get_param( 'u' ) ) {
			blrlp_bump( $id, 'uniques' );
		}
	} elseif ( 'click' === $type ) {
		$rk = 'blrlp_ck_' . blrlp_client_ip_hash() . $id;
		if ( ! get_transient( $rk ) ) { // نقرة واحدة لكل زائر/دقيقة.
			set_transient( $rk, 1, MINUTE_IN_SECONDS );
			blrlp_bump( $id, 'clicks' );
		}
	}
	return new WP_REST_Response( array( 'ok' => true ), 200 );
}

/* ---------- صفحة العملاء المحتملين ---------- */
function blrlp_csv_cell( $v ) {
	$v = (string) $v;
	if ( '' !== $v && in_array( $v[0], array( '=', '+', '-', '@' ), true ) ) {
		$v = "'" . $v; // منع حقن الصيغ في Excel.
	}
	return '"' . str_replace( '"', '""', $v ) . '"';
}

add_action( 'admin_post_blrlp_leads_export', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'blrlp_leads' ) ) {
		wp_die( esc_html__( 'غير مسموح.', 'blr-landing-pro' ) );
	}
	if ( ! blrlp_is_pro() ) {
		wp_die( esc_html__( 'التصدير ميزة Pro.', 'blr-landing-pro' ) );
	}
	global $wpdb;
	$rows = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}blrlp_leads ORDER BY id DESC LIMIT 20000", ARRAY_A ); // phpcs:ignore WordPress.DB
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="leads-' . gmdate( 'Ymd' ) . '.csv"' );
	echo "\xEF\xBB\xBF" . 'id,landing,name,email,phone,message,created' . "\n"; // phpcs:ignore
	foreach ( $rows as $r ) {
		echo implode( ',', array( (int) $r['id'], blrlp_csv_cell( get_the_title( $r['landing_id'] ) ), blrlp_csv_cell( $r['name'] ), blrlp_csv_cell( $r['email'] ), blrlp_csv_cell( $r['phone'] ), blrlp_csv_cell( $r['message'] ), blrlp_csv_cell( $r['created'] ) ) ) . "\n"; // phpcs:ignore
	}
	exit;
} );

add_action( 'admin_post_blrlp_lead_delete', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'blrlp_leads' ) ) {
		wp_die( esc_html__( 'غير مسموح.', 'blr-landing-pro' ) );
	}
	global $wpdb;
	$wpdb->delete( "{$wpdb->prefix}blrlp_leads", array( 'id' => absint( $_POST['id'] ?? 0 ) ) );
	wp_safe_redirect( admin_url( 'admin.php?page=blr-landing-leads' ) );
	exit;
} );

function blrlp_leads_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	global $wpdb;
	$t     = "{$wpdb->prefix}blrlp_leads";
	$paged = max( 1, absint( $_GET['paged'] ?? 1 ) ); // phpcs:ignore
	$s     = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; // phpcs:ignore
	$per   = 25;
	$where = '';
	$args  = array();
	if ( $s ) {
		$like  = '%' . $wpdb->esc_like( $s ) . '%';
		$where = 'WHERE name LIKE %s OR email LIKE %s OR phone LIKE %s';
		$args  = array( $like, $like, $like );
	}
	$total = (int) ( $args ? $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t $where", $args ) ) : $wpdb->get_var( "SELECT COUNT(*) FROM $t" ) ); // phpcs:ignore WordPress.DB
	$q     = "SELECT * FROM $t $where ORDER BY id DESC LIMIT %d OFFSET %d";
	$rows  = $wpdb->get_results( $wpdb->prepare( $q, array_merge( $args, array( $per, ( $paged - 1 ) * $per ) ) ) ); // phpcs:ignore WordPress.DB
	?>
	<div class="wrap blrlp-admin">
		<?php blrlp_admin_header( __( 'العملاء المحتملون', 'blr-landing-pro' ) ); ?>
		<form method="get" class="blrlp-bar">
			<input type="hidden" name="page" value="blr-landing-leads">
			<input type="search" name="s" value="<?php echo esc_attr( $s ); ?>" placeholder="<?php esc_attr_e( 'بحث بالاسم أو البريد أو الهاتف', 'blr-landing-pro' ); ?>">
			<button class="button"><?php esc_html_e( 'بحث', 'blr-landing-pro' ); ?></button>
			<span class="blrlp-grow"></span>
			<?php if ( blrlp_is_pro() ) : ?>
				<a class="button button-primary" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=blrlp_leads_export' ), 'blrlp_leads' ) ); ?>"><?php esc_html_e( 'تصدير CSV', 'blr-landing-pro' ); ?></a>
			<?php else : ?>
				<span class="button disabled" title="Pro"><?php esc_html_e( 'تصدير CSV', 'blr-landing-pro' ); ?> <?php echo blrlp_pro_badge(); // phpcs:ignore ?></span>
			<?php endif; ?>
		</form>
		<table class="widefat striped blrlp-table">
			<thead><tr><th><?php esc_html_e( 'الاسم', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'البريد', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'الهاتف', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'الصفحة', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'الرسالة', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'التاريخ', 'blr-landing-pro' ); ?></th><th></th></tr></thead>
			<tbody>
			<?php foreach ( $rows as $r ) : ?>
				<tr>
					<td><?php echo esc_html( $r->name ); ?></td>
					<td dir="ltr"><a href="mailto:<?php echo esc_attr( $r->email ); ?>"><?php echo esc_html( $r->email ); ?></a></td>
					<td dir="ltr"><?php echo esc_html( $r->phone ); ?></td>
					<td><?php echo esc_html( get_the_title( $r->landing_id ) ); ?></td>
					<td><?php echo esc_html( wp_trim_words( $r->message, 12 ) ); ?></td>
					<td><?php echo esc_html( $r->created ); ?></td>
					<td><form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'حذف؟', 'blr-landing-pro' ) ); ?>')"><?php wp_nonce_field( 'blrlp_leads' ); ?><input type="hidden" name="action" value="blrlp_lead_delete"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>"><button class="button-link-delete">×</button></form></td>
				</tr>
			<?php endforeach; ?>
			<?php if ( ! $rows ) : ?><tr><td colspan="7"><?php esc_html_e( 'لا يوجد عملاء محتملون بعد.', 'blr-landing-pro' ); ?></td></tr><?php endif; ?>
			</tbody>
		</table>
		<?php
		echo wp_kses_post( paginate_links( array( 'base' => add_query_arg( 'paged', '%#%' ), 'format' => '', 'current' => $paged, 'total' => max( 1, (int) ceil( $total / $per ) ), 'type' => 'plain' ) ) );
		?>
	</div>
	<?php
}
