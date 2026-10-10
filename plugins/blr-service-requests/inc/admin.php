<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bisr_statuses() {
	return array(
		'new'       => array( 'جديد', 'warn' ),
		'contacted' => array( 'تم التواصل', '' ),
		'quoted'    => array( 'أُرسل عرض سعر', '' ),
		'won'       => array( 'تم الاتفاق', 'ok' ),
		'lost'      => array( 'لم يتم', '' ),
		'spam'      => array( 'مزعج', '' ),
	);
}

add_action( 'admin_menu', function () {
	global $wpdb;
	$new = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}bisr_requests WHERE status='new'" ); // phpcs:ignore
	$bubble = $new ? ' <span class="awaiting-mod">' . $new . '</span>' : '';
	add_menu_page( 'طلبات الخدمات', 'طلبات الخدمات' . $bubble, 'manage_options', 'bisr', 'bisr_page_list', 'dashicons-email-alt', 26 );
	add_submenu_page( 'bisr', 'الإعدادات', 'الإعدادات', 'manage_options', 'bisr-settings', 'bisr_page_settings' );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( false === strpos( $hook, 'bisr' ) ) {
		return;
	}
	wp_enqueue_style( 'blrui', BISR_URL . 'assets/blr-ui.css', array(), bisr_ver( 'assets/blr-ui.css' ) );
} );

add_action( 'admin_init', function () {
	register_setting( 'bisr_group', 'bisr_settings', array( 'sanitize_callback' => 'bisr_sanitize_settings' ) );
} );

function bisr_sanitize_settings( $in ) {
	$in  = is_array( $in ) ? $in : array();
	$out = array();
	foreach ( array( 'notify', 'public_email' ) as $k ) {
		$out[ $k ] = isset( $in[ $k ] ) ? sanitize_email( $in[ $k ] ) : '';
	}
	foreach ( array( 'phone', 'whatsapp', 'addr', 'addr_ar', 'addr_en', 'addr_fr', 'hours', 'hours_ar', 'hours_en', 'hours_fr' ) as $k ) {
		$out[ $k ] = isset( $in[ $k ] ) ? sanitize_text_field( $in[ $k ] ) : '';
	}
	$out['autoreply'] = ! empty( $in['autoreply'] ) ? '1' : '0';
	$out['rate']      = isset( $in['rate'] ) ? max( 1, min( 100, (int) $in['rate'] ) ) : 6;
	$out['wipe']      = ! empty( $in['wipe'] ) ? '1' : '0';
	return $out;
}

function bisr_top( $title, $sub = '' ) {
	echo '<div class="blrui-top"><span class="blrui-mark">✉</span><div><h1>' . esc_html( $title ) . '</h1><small>' . esc_html( $sub ) . '</small></div></div>';
}

function bisr_where( &$args ) {
	global $wpdb;
	$w = array( '1=1' );
	if ( ! empty( $_GET['status'] ) ) { // phpcs:ignore
		$w[] = $wpdb->prepare( 'status=%s', sanitize_key( wp_unslash( $_GET['status'] ) ) ); // phpcs:ignore
	}
	if ( ! empty( $_GET['kind'] ) ) { // phpcs:ignore
		$w[] = $wpdb->prepare( 'kind=%s', 'contact' === $_GET['kind'] ? 'contact' : 'request' ); // phpcs:ignore
	}
	if ( ! empty( $_GET['s'] ) ) { // phpcs:ignore
		$l   = '%' . $wpdb->esc_like( sanitize_text_field( wp_unslash( $_GET['s'] ) ) ) . '%'; // phpcs:ignore
		$w[] = $wpdb->prepare( '(name LIKE %s OR email LIKE %s OR phone LIKE %s OR service_label LIKE %s)', $l, $l, $l, $l );
	}
	return implode( ' AND ', $w );
}

function bisr_page_list() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	global $wpdb;
	$t = $wpdb->prefix . 'bisr_requests';
	if ( ! empty( $_GET['view'] ) ) { // phpcs:ignore
		bisr_page_view( (int) $_GET['view'] ); // phpcs:ignore
		return;
	}
	$args  = array();
	$where = bisr_where( $args );
	$per   = 25;
	$pg    = max( 1, isset( $_GET['paged'] ) ? (int) $_GET['paged'] : 1 ); // phpcs:ignore
	$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE {$where}" ); // phpcs:ignore
	$rows  = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$t} WHERE {$where} ORDER BY id DESC LIMIT %d OFFSET %d", $per, ( $pg - 1 ) * $per ) ); // phpcs:ignore
	$st    = bisr_statuses();
	$base  = admin_url( 'admin.php?page=bisr' );
	$counts = $wpdb->get_results( "SELECT status, COUNT(*) c FROM {$t} GROUP BY status", OBJECT_K ); // phpcs:ignore
	echo '<div class="wrap blrui">';
	bisr_top( 'طلبات الخدمات والرسائل', 'كل ما يصل من نماذج الموقع في مكان واحد.' );
	echo '<div class="blrui-card"><div class="blrui-card__b">';
	echo '<form method="get" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><input type="hidden" name="page" value="bisr">';
	echo '<select name="status" class="blrui-in" style="max-width:190px"><option value="">كل الحالات</option>';
	foreach ( $st as $k => $v ) {
		printf( '<option value="%s"%s>%s%s</option>', esc_attr( $k ), selected( isset( $_GET['status'] ) ? $_GET['status'] : '', $k, false ), esc_html( $v[0] ), isset( $counts[ $k ] ) ? ' (' . (int) $counts[ $k ]->c . ')' : '' ); // phpcs:ignore
	}
	echo '</select><select name="kind" class="blrui-in" style="max-width:170px"><option value="">الكل</option>';
	printf( '<option value="request"%s>طلبات خدمة</option><option value="contact"%s>رسائل اتصال</option>', selected( isset( $_GET['kind'] ) ? $_GET['kind'] : '', 'request', false ), selected( isset( $_GET['kind'] ) ? $_GET['kind'] : '', 'contact', false ) ); // phpcs:ignore
	echo '</select><input type="search" name="s" class="blrui-in" style="max-width:240px" placeholder="بحث بالاسم / البريد / الهاتف / الخدمة" value="' . esc_attr( isset( $_GET['s'] ) ? wp_unslash( $_GET['s'] ) : '' ) . '"> '; // phpcs:ignore
	echo '<button class="blrui-btn is-sm">تصفية</button>';
	$exp = wp_nonce_url( admin_url( 'admin-post.php?action=bisr_export&status=' . rawurlencode( isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '' ) ), 'bisr_export' ); // phpcs:ignore
	echo ' <a class="blrui-btn is-ghost is-sm" href="' . esc_url( $exp ) . '">⬇ تصدير CSV</a></form></div></div>';

	echo '<div class="blrui-card"><div class="blrui-card__b" style="overflow:auto">';
	if ( ! $rows ) {
		echo '<p>لا توجد طلبات بعد. ستظهر هنا فور وصولها.</p>';
	} else {
		echo '<table class="widefat striped" style="border:0"><thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>الخدمة</th><th>الاسم</th><th>التواصل</th><th>اللغة</th><th>الحالة</th><th></th></tr></thead><tbody>';
		foreach ( $rows as $r ) {
			$s = isset( $st[ $r->status ] ) ? $st[ $r->status ] : array( $r->status, '' );
			printf(
				'<tr><td>%d</td><td>%s</td><td>%s</td><td>%s</td><td><b>%s</b></td><td dir="ltr" style="text-align:start">%s<br>%s</td><td>%s</td><td><span class="blrui-chip %s">%s</span></td><td><a class="button" href="%s">عرض</a></td></tr>',
				(int) $r->id,
				esc_html( mysql2date( 'Y-m-d H:i', $r->created ) ),
				'contact' === $r->kind ? 'رسالة' : 'طلب خدمة',
				esc_html( $r->service_label ?: '—' ),
				esc_html( $r->name ),
				esc_html( $r->email ),
				esc_html( $r->phone ),
				esc_html( strtoupper( $r->lang ) ),
				esc_attr( $s[1] ),
				esc_html( $s[0] ),
				esc_url( add_query_arg( 'view', $r->id, $base ) )
			);
		}
		echo '</tbody></table>';
		$pages = (int) ceil( $total / $per );
		if ( $pages > 1 ) {
			echo '<p style="margin-top:14px">' . wp_kses_post( paginate_links( array( 'base' => add_query_arg( 'paged', '%#%' ), 'format' => '', 'total' => $pages, 'current' => $pg ) ) ) . '</p>';
		}
	}
	echo '</div></div></div>';
}

function bisr_page_view( $id ) {
	global $wpdb;
	$t = $wpdb->prefix . 'bisr_requests';
	$r = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE id=%d", $id ) ); // phpcs:ignore
	echo '<div class="wrap blrui">';
	if ( ! $r ) {
		bisr_top( 'الطلب غير موجود' );
		echo '</div>';
		return;
	}
	$st   = bisr_statuses();
	$rows = json_decode( (string) $r->data, true );
	$rows = is_array( $rows ) ? $rows : array();
	bisr_top( ( 'contact' === $r->kind ? 'رسالة #' : 'طلب خدمة #' ) . $r->id, $r->service_label );
	if ( ! empty( $_GET['saved'] ) ) { // phpcs:ignore
		echo '<div class="notice notice-success inline"><p>تم الحفظ.</p></div>';
	}
	echo '<p><a href="' . esc_url( admin_url( 'admin.php?page=bisr' ) ) . '">→ العودة للقائمة</a></p>';
	echo '<div class="blrui-card"><div class="blrui-card__h"><span class="blrui-ico">📋</span><div><h2>تفاصيل الطلب</h2><p>' . esc_html( mysql2date( 'Y-m-d H:i', $r->created ) ) . ' · اللغة: ' . esc_html( strtoupper( $r->lang ) ) . '</p></div></div><div class="blrui-card__b">';
	foreach ( $rows as $x ) {
		echo '<div class="blrui-row"><span class="blrui-lab">' . esc_html( $x['l'] ) . '</span><div>' . nl2br( esc_html( $x['v'] ) ) . '</div></div>';
	}
	$wa = preg_replace( '/\D+/', '', (string) $r->phone );
	echo '<div class="blrui-row"><span class="blrui-lab">رد سريع</span><div>';
	if ( $r->email ) {
		echo '<a class="blrui-btn is-sm" href="mailto:' . esc_attr( $r->email ) . '">✉ بريد</a> ';
	}
	if ( $wa ) {
		echo '<a class="blrui-btn is-ghost is-sm" target="_blank" rel="noopener" href="https://wa.me/' . esc_attr( $wa ) . '">💬 واتساب</a>';
	}
	echo '</div></div></div></div>';

	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="blrui-card"><div class="blrui-card__b">';
	wp_nonce_field( 'bisr_update_' . $r->id );
	echo '<input type="hidden" name="action" value="bisr_update"><input type="hidden" name="id" value="' . (int) $r->id . '">';
	echo '<div class="blrui-row"><label for="bisr-st">الحالة</label><div><select id="bisr-st" class="blrui-in" name="status">';
	foreach ( $st as $k => $v ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $r->status, $k, false ), esc_html( $v[0] ) );
	}
	echo '</select></div></div><div class="blrui-row"><label for="bisr-note">ملاحظات داخلية<small>لا تظهر للعميل.</small></label><div><textarea id="bisr-note" class="blrui-in" rows="4" name="note">' . esc_textarea( (string) $r->note ) . '</textarea></div></div>';
	echo '<button class="blrui-btn">حفظ</button> ';
	$del = wp_nonce_url( admin_url( 'admin-post.php?action=bisr_delete&id=' . (int) $r->id ), 'bisr_delete_' . $r->id );
	echo '<a class="blrui-btn is-ghost" style="color:#b32d2e" href="' . esc_url( $del ) . '" onclick="return confirm(\'حذف نهائي؟\')">حذف</a>';
	echo '</div></form></div>';
}

add_action( 'admin_post_bisr_update', function () {
	$id = isset( $_POST['id'] ) ? (int) $_POST['id'] : 0;
	check_admin_referer( 'bisr_update_' . $id );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'forbidden' );
	}
	global $wpdb;
	$st = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : 'new';
	$wpdb->update( $wpdb->prefix . 'bisr_requests', array( 'status' => isset( bisr_statuses()[ $st ] ) ? $st : 'new', 'note' => isset( $_POST['note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['note'] ) ) : '' ), array( 'id' => $id ) );
	wp_safe_redirect( admin_url( 'admin.php?page=bisr&view=' . $id . '&saved=1' ) );
	exit;
} );

add_action( 'admin_post_bisr_delete', function () {
	$id = isset( $_GET['id'] ) ? (int) $_GET['id'] : 0;
	check_admin_referer( 'bisr_delete_' . $id );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'forbidden' );
	}
	global $wpdb;
	$wpdb->delete( $wpdb->prefix . 'bisr_requests', array( 'id' => $id ) );
	wp_safe_redirect( admin_url( 'admin.php?page=bisr' ) );
	exit;
} );

add_action( 'admin_post_bisr_export', function () {
	check_admin_referer( 'bisr_export' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'forbidden' );
	}
	global $wpdb;
	$t  = $wpdb->prefix . 'bisr_requests';
	$st = isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : '';
	$rs = $st ? $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$t} WHERE status=%s ORDER BY id DESC", $st ) ) : $wpdb->get_results( "SELECT * FROM {$t} ORDER BY id DESC" ); // phpcs:ignore
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="requests-' . gmdate( 'Y-m-d' ) . '.csv"' );
	$o = fopen( 'php://output', 'w' );
	fwrite( $o, "\xEF\xBB\xBF" );
	fputcsv( $o, array( 'id', 'date', 'kind', 'lang', 'service', 'name', 'email', 'phone', 'status', 'details', 'note' ) );
	foreach ( $rs as $r ) {
		$d = json_decode( (string) $r->data, true );
		$flat = array();
		foreach ( is_array( $d ) ? $d : array() as $x ) {
			$flat[] = $x['l'] . ': ' . $x['v'];
		}
		// حماية من حقن معادلات الإكسل.
		$cell = function ( $v ) { return ( '' !== $v && false !== strpos( "=+-@\t\r", $v[0] ) ) ? "'" . $v : $v; };
		fputcsv( $o, array_map( $cell, array( $r->id, $r->created, $r->kind, $r->lang, $r->service_label, $r->name, $r->email, $r->phone, $r->status, implode( ' | ', $flat ), (string) $r->note ) ) );
	}
	fclose( $o );
	exit;
} );

function bisr_page_settings() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$o = get_option( 'bisr_settings', array() );
	$g = function ( $k, $d = '' ) use ( $o ) { return esc_attr( isset( $o[ $k ] ) ? $o[ $k ] : $d ); };
	$row = function ( $label, $help, $field ) { echo '<div class="blrui-row"><label>' . esc_html( $label ) . '<small>' . esc_html( $help ) . '</small></label><div>' . $field . '</div></div>'; }; // phpcs:ignore
	echo '<div class="wrap blrui">';
	bisr_top( 'إعدادات النماذج', 'الإشعارات وبيانات التواصل التي تظهر في صفحة اتصل بنا.' );
	echo '<form method="post" action="options.php">';
	settings_fields( 'bisr_group' );
	echo '<div class="blrui-card"><div class="blrui-card__h"><span class="blrui-ico">🔔</span><div><h2>الإشعارات</h2><p>إلى أين تصل الطلبات؟</p></div></div><div class="blrui-card__b">';
	$row( 'بريد استلام الطلبات', 'يصله بريد عند كل طلب/رسالة. الافتراضي: بريد مدير الموقع.', '<input class="blrui-in is-ltr" type="email" name="bisr_settings[notify]" value="' . $g( 'notify' ) . '" placeholder="' . esc_attr( get_option( 'admin_email' ) ) . '">' );
	$row( 'رد تلقائي للعميل', 'يُرسل للعميل ملخص طلبه بلغته.', '<label class="blrui-sw"><input type="checkbox" name="bisr_settings[autoreply]" value="1" ' . checked( isset( $o['autoreply'] ) ? $o['autoreply'] : '1', '1', false ) . '><i></i>مفعّل</label>' );
	$row( 'حد الإرسال لكل ساعة', 'أقصى عدد طلبات من نفس الجهاز في الساعة (حماية من الإزعاج).', '<input class="blrui-in" style="max-width:120px" type="number" min="1" max="100" name="bisr_settings[rate]" value="' . $g( 'rate', 6 ) . '">' );
	echo '</div></div>';
	echo '<div class="blrui-card"><div class="blrui-card__h"><span class="blrui-ico">📞</span><div><h2>بيانات التواصل العامة</h2><p>تظهر عبر الاختصار <code>[bi_contact_info]</code>. اترك الحقل فارغاً لإخفائه.</p></div></div><div class="blrui-card__b">';
	$row( 'الهاتف', 'بالصيغة الدولية.', '<input class="blrui-in is-ltr" type="text" name="bisr_settings[phone]" value="' . $g( 'phone' ) . '" placeholder="+213 000 00 00 00">' );
	$row( 'واتساب', 'الرقم بالصيغة الدولية بلا صفر أو +.', '<input class="blrui-in is-ltr" type="text" name="bisr_settings[whatsapp]" value="' . $g( 'whatsapp' ) . '" placeholder="213xxxxxxxxx">' );
	$row( 'البريد الظاهر للزوار', 'قد يختلف عن بريد الاستلام.', '<input class="blrui-in is-ltr" type="email" name="bisr_settings[public_email]" value="' . $g( 'public_email' ) . '">' );
	foreach ( array( 'ar' => 'العربية', 'en' => 'English', 'fr' => 'Français' ) as $l => $n ) {
		$row( 'العنوان — ' . $n, 'اختياري.', '<input class="blrui-in" type="text" name="bisr_settings[addr_' . $l . ']" value="' . $g( 'addr_' . $l ) . '">' );
	}
	foreach ( array( 'ar' => 'العربية', 'en' => 'English', 'fr' => 'Français' ) as $l => $n ) {
		$row( 'ساعات العمل — ' . $n, 'مثال: 9:00 – 17:00', '<input class="blrui-in" type="text" name="bisr_settings[hours_' . $l . ']" value="' . $g( 'hours_' . $l ) . '">' );
	}
	echo '</div></div>';
	echo '<div class="blrui-card"><div class="blrui-card__b">';
	$row( 'حذف البيانات عند إزالة الإضافة', 'الطلبات المسجلة والإعدادات. غير قابل للتراجع.', '<label class="blrui-sw"><input type="checkbox" name="bisr_settings[wipe]" value="1" ' . checked( isset( $o['wipe'] ) ? $o['wipe'] : '0', '1', false ) . '><i></i>احذف كل شيء</label>' );
	echo '</div></div><button class="blrui-btn">حفظ الإعدادات</button></form></div>';
}
