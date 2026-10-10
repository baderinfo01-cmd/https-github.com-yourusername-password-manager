<?php
/**
 * WooCommerce integration: physical · digital · subscription · services.
 *
 * @package BLR_Shop_Pro
 */

if ( ! defined( 'ABSPATH' ) || ! class_exists( 'WooCommerce' ) ) {
	return;
}

/* ---------------------------------------------------------------
 * أنواع المنتجات
 * ------------------------------------------------------------- */
function blr_product_kinds() {
	return array(
		'physical'     => __( 'منتج مادي', 'blr-shop-pro' ),
		'digital'      => __( 'منتج رقمي', 'blr-shop-pro' ),
		'subscription' => __( 'اشتراك', 'blr-shop-pro' ),
		'service'      => __( 'خدمة', 'blr-shop-pro' ),
	);
}

function blr_product_kind_label( $kind ) {
	$k = blr_product_kinds();
	return $k[ $kind ] ?? $k['physical'];
}

/**
 * Resolve the kind: explicit meta wins, then WC type / flags.
 */
function blr_product_kind( $product ) {
	$product = wc_get_product( $product );
	if ( ! $product ) {
		return 'physical';
	}
	$meta = $product->get_meta( '_blr_ptype' );
	if ( $meta && isset( blr_product_kinds()[ $meta ] ) ) {
		return $meta;
	}
	if ( false !== strpos( $product->get_type(), 'subscription' ) ) {
		return 'subscription';
	}
	if ( $product->is_downloadable() ) {
		return 'digital';
	}
	return $product->is_virtual() ? 'service' : 'physical';
}

/* ---------- لوحة بيانات المنتج ---------- */
add_filter( 'woocommerce_product_data_tabs', function ( $tabs ) {
	$tabs['blr'] = array( 'label' => 'BLR Pro', 'target' => 'blr_product_data', 'class' => array(), 'priority' => 80 );
	return $tabs;
} );

add_action( 'woocommerce_product_data_panels', function () {
	echo '<div id="blr_product_data" class="panel woocommerce_options_panel">';
	woocommerce_wp_select( array( 'id' => '_blr_ptype', 'label' => __( 'نوع المنتج (للعرض)', 'blr-shop-pro' ), 'options' => array( '' => __( 'تلقائي', 'blr-shop-pro' ) ) + blr_product_kinds() ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_file_format', 'label' => __( 'صيغة الملف', 'blr-shop-pro' ), 'placeholder' => 'ZIP, PDF, PSD' ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_file_size', 'label' => __( 'حجم الملف', 'blr-shop-pro' ), 'placeholder' => '24 MB' ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_version', 'label' => __( 'الإصدار', 'blr-shop-pro' ), 'placeholder' => '1.0.0' ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_demo_url', 'label' => __( 'رابط المعاينة', 'blr-shop-pro' ), 'type' => 'url' ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_requirements', 'label' => __( 'المتطلبات', 'blr-shop-pro' ), 'placeholder' => 'WordPress 6.2+, PHP 7.4+' ) );
	woocommerce_wp_textarea_input( array( 'id' => '_blr_changelog', 'label' => __( 'سجل التغييرات', 'blr-shop-pro' ) ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_period_note', 'label' => __( 'ملاحظة الاشتراك', 'blr-shop-pro' ), 'placeholder' => __( 'يمكن الإلغاء في أي وقت', 'blr-shop-pro' ) ) );
	woocommerce_wp_checkbox( array( 'id' => '_blr_issue_license', 'label' => __( 'إصدار مفتاح ترخيص عند اكتمال الطلب', 'blr-shop-pro' ), 'description' => __( 'يتطلب إضافة BLR License Server.', 'blr-shop-pro' ) ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_license_plan', 'label' => __( 'اسم خطة الترخيص', 'blr-shop-pro' ), 'placeholder' => 'pro' ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_license_sites', 'label' => __( 'عدد المواقع المسموحة', 'blr-shop-pro' ), 'type' => 'number', 'placeholder' => '1' ) );
	woocommerce_wp_text_input( array( 'id' => '_blr_license_days', 'label' => __( 'مدة الترخيص (أيام، 0 = دائم)', 'blr-shop-pro' ), 'type' => 'number', 'placeholder' => '365' ) );
	echo '<div class="options_group"><p class="form-field"><strong>SEO</strong></p>';
	woocommerce_wp_text_input( array( 'id' => 'blr_seo_title', 'name' => 'blr_seo_title', 'value' => get_post_meta( get_the_ID(), '_blr_seo_title', true ), 'label' => __( 'عنوان SEO', 'blr-shop-pro' ) ) );
	woocommerce_wp_text_input( array( 'id' => 'blr_seo_desc', 'name' => 'blr_seo_desc', 'value' => get_post_meta( get_the_ID(), '_blr_seo_desc', true ), 'label' => __( 'وصف SEO', 'blr-shop-pro' ) ) );
	echo '</div></div>';
} );

add_action( 'woocommerce_process_product_meta', function ( $id ) {
	$fields = array( '_blr_ptype', '_blr_file_format', '_blr_file_size', '_blr_version', '_blr_requirements', '_blr_period_note', '_blr_license_plan' );
	foreach ( $fields as $f ) {
		if ( isset( $_POST[ $f ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			update_post_meta( $id, $f, sanitize_text_field( wp_unslash( $_POST[ $f ] ) ) ); // phpcs:ignore
		}
	}
	update_post_meta( $id, '_blr_demo_url', isset( $_POST['_blr_demo_url'] ) ? esc_url_raw( wp_unslash( $_POST['_blr_demo_url'] ) ) : '' ); // phpcs:ignore
	update_post_meta( $id, '_blr_changelog', isset( $_POST['_blr_changelog'] ) ? sanitize_textarea_field( wp_unslash( $_POST['_blr_changelog'] ) ) : '' ); // phpcs:ignore
	update_post_meta( $id, '_blr_issue_license', isset( $_POST['_blr_issue_license'] ) ? 'yes' : 'no' ); // phpcs:ignore
	update_post_meta( $id, '_blr_license_sites', absint( $_POST['_blr_license_sites'] ?? 1 ) ); // phpcs:ignore
	update_post_meta( $id, '_blr_license_days', absint( $_POST['_blr_license_days'] ?? 365 ) ); // phpcs:ignore
}, 5 );

/* زر الذكاء الاصطناعي يحتاج نوع المنتج الحالي */
add_action( 'admin_footer-post.php', function () {
	global $post;
	if ( $post && 'product' === $post->post_type ) {
		echo '<script>window.BLR_PRODUCT_KIND=' . wp_json_encode( blr_product_kind( $post->ID ) ) . ';</script>';
	}
} );

/* ---------------------------------------------------------------
 * بطاقة المنتج: شارات وأزرار
 * ------------------------------------------------------------- */
add_filter( 'loop_shop_columns', function () {
	return max( 2, min( 5, absint( get_theme_mod( 'blr_shop_cols', 4 ) ) ) );
} );
add_filter( 'loop_shop_per_page', function () {
	return 12;
} );

// نستبدل شارة التخفيض الافتراضية بنسبة الخصم.
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_show_product_loop_sale_flash', 10 );
remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_sale_flash', 10 );

add_action( 'woocommerce_before_shop_loop_item_title', 'blr_badges', 9 );
add_action( 'woocommerce_before_single_product_summary', 'blr_badges', 9 );
function blr_badges() {
	global $product;
	if ( ! $product ) {
		return;
	}
	$out  = '';
	$kind = blr_product_kind( $product );
	if ( $product->is_on_sale() && ! $product->is_type( 'variable' ) ) {
		$reg = (float) $product->get_regular_price();
		if ( $reg > 0 ) {
			$out .= '<span class="blr-badge blr-badge--sale">-' . round( ( $reg - (float) $product->get_sale_price() ) / $reg * 100 ) . '%</span>';
		}
	} elseif ( $product->is_on_sale() ) {
		$out .= '<span class="blr-badge blr-badge--sale">' . esc_html__( 'عرض', 'blr-shop-pro' ) . '</span>';
	}
	if ( 'digital' === $kind ) {
		$out .= '<span class="blr-badge blr-badge--digital">' . blr_icon( 'bolt', 12 ) . esc_html__( 'تسليم فوري', 'blr-shop-pro' ) . '</span>';
	} elseif ( 'subscription' === $kind ) {
		$out .= '<span class="blr-badge blr-badge--sub">' . blr_icon( 'repeat', 12 ) . esc_html__( 'اشتراك', 'blr-shop-pro' ) . '</span>';
	}
	if ( ! $product->is_in_stock() ) {
		$out .= '<span class="blr-badge blr-badge--out">' . esc_html__( 'نفدت الكمية', 'blr-shop-pro' ) . '</span>';
	}
	if ( $out ) {
		echo '<div class="blr-badges">' . $out . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}

// أزرار الإجراءات السريعة + عدّاد العرض.
add_action( 'woocommerce_before_shop_loop_item_title', 'blr_card_actions', 20 );
function blr_card_actions() {
	global $product;
	$id  = $product->get_id();
	$out = '<div class="blr-actions">';
	if ( get_theme_mod( 'blr_wishlist', true ) ) {
		$out .= '<button type="button" data-blr-wish="' . $id . '" aria-label="' . esc_attr__( 'المفضلة', 'blr-shop-pro' ) . '">' . blr_icon( 'heart', 18 ) . '</button>';
		$out .= '<button type="button" data-blr-cmp="' . $id . '" aria-label="' . esc_attr__( 'مقارنة', 'blr-shop-pro' ) . '">' . blr_icon( 'compare', 18 ) . '</button>';
	}
	if ( get_theme_mod( 'blr_quickview', true ) ) {
		$out .= '<button type="button" data-blr-qv="' . $id . '" aria-label="' . esc_attr__( 'معاينة سريعة', 'blr-shop-pro' ) . '">' . blr_icon( 'eye', 18 ) . '</button>';
	}
	echo $out . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
}

add_action( 'woocommerce_after_shop_loop_item_title', function () {
	global $product;
	$to = $product->get_date_on_sale_to();
	if ( $product->is_on_sale() && $to ) {
		echo blr_countdown_html( $to->getTimestamp() ); // phpcs:ignore WordPress.Security.EscapeOutput
	}
}, 15 );

// نص الزر حسب نوع المنتج.
add_filter( 'woocommerce_product_add_to_cart_text', 'blr_cta_text', 20, 2 );
add_filter( 'woocommerce_product_single_add_to_cart_text', 'blr_cta_text', 20, 2 );
function blr_cta_text( $text, $product ) {
	if ( ! $product->is_purchasable() || ! $product->is_in_stock() || $product->is_type( 'variable' ) || $product->is_type( 'grouped' ) || $product->is_type( 'external' ) ) {
		return $text;
	}
	switch ( blr_product_kind( $product ) ) {
		case 'digital':
			return __( 'اشترِ وحمّل', 'blr-shop-pro' );
		case 'subscription':
			return __( 'اشترك الآن', 'blr-shop-pro' );
		case 'service':
			return __( 'اطلب الخدمة', 'blr-shop-pro' );
	}
	return $text;
}

/* ---------------------------------------------------------------
 * صفحة المنتج
 * ------------------------------------------------------------- */
add_action( 'woocommerce_single_product_summary', function () {
	global $product;
	$kind = blr_product_kind( $product );
	$to   = $product->get_date_on_sale_to();
	if ( $product->is_on_sale() && $to ) {
		echo '<div class="blr-sale-timer"><span>' . esc_html__( 'ينتهي العرض خلال', 'blr-shop-pro' ) . '</span>' . blr_countdown_html( $to->getTimestamp() ) . '</div>'; // phpcs:ignore
	}
	if ( 'subscription' === $kind && $product->get_meta( '_blr_period_note' ) ) {
		echo '<p class="blr-period-note">' . blr_icon( 'repeat', 16 ) . ' ' . esc_html( $product->get_meta( '_blr_period_note' ) ) . '</p>'; // phpcs:ignore
	}
}, 11 );

add_action( 'woocommerce_single_product_summary', 'blr_trust_box', 45 );
function blr_trust_box() {
	global $product;
	$kind  = blr_product_kind( $product );
	$items = array(
		'physical'     => array( array( 'truck', __( 'شحن سريع وتتبع للشحنة', 'blr-shop-pro' ) ), array( 'refresh', __( 'إرجاع خلال 14 يوماً', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
		'digital'      => array( array( 'bolt', __( 'تسليم فوري بعد الدفع', 'blr-shop-pro' ) ), array( 'download', __( 'روابط تحميل في حسابك', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
		'subscription' => array( array( 'repeat', __( 'تجديد تلقائي — ألغِ متى شئت', 'blr-shop-pro' ) ), array( 'bolt', __( 'تفعيل فوري', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
		'service'      => array( array( 'check', __( 'تنفيذ احترافي', 'blr-shop-pro' ) ), array( 'refresh', __( 'مراجعات حسب الاتفاق', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
	);
	echo '<ul class="blr-trust">';
	foreach ( $items[ $kind ] as $i ) {
		echo '<li>' . blr_icon( $i[0], 18 ) . '<span>' . esc_html( $i[1] ) . '</span></li>'; // phpcs:ignore
	}
	echo '</ul>';
	if ( 'digital' === $kind && $product->get_meta( '_blr_demo_url' ) ) {
		echo '<p><a class="blr-btn blr-btn--ghost" target="_blank" rel="noopener" href="' . esc_url( $product->get_meta( '_blr_demo_url' ) ) . '">' . esc_html__( 'معاينة مباشرة', 'blr-shop-pro' ) . '</a></p>';
	}
}

// تبويب "تفاصيل رقمية".
add_filter( 'woocommerce_product_tabs', function ( $tabs ) {
	global $product;
	if ( ! $product ) {
		return $tabs;
	}
	$has = false;
	foreach ( array( '_blr_file_format', '_blr_file_size', '_blr_version', '_blr_requirements', '_blr_changelog' ) as $k ) {
		$has = $has || $product->get_meta( $k );
	}
	if ( $has ) {
		$tabs['blr_digital'] = array(
			'title'    => __( 'التفاصيل التقنية', 'blr-shop-pro' ),
			'priority' => 15,
			'callback' => function () use ( $product ) {
				$rows = array(
					__( 'الصيغة', 'blr-shop-pro' )    => '_blr_file_format',
					__( 'الحجم', 'blr-shop-pro' )     => '_blr_file_size',
					__( 'الإصدار', 'blr-shop-pro' )   => '_blr_version',
					__( 'المتطلبات', 'blr-shop-pro' ) => '_blr_requirements',
				);
				echo '<table class="blr-spec"><tbody>';
				foreach ( $rows as $label => $key ) {
					if ( $product->get_meta( $key ) ) {
						echo '<tr><th>' . esc_html( $label ) . '</th><td>' . esc_html( $product->get_meta( $key ) ) . '</td></tr>';
					}
				}
				echo '</tbody></table>';
				if ( $product->get_meta( '_blr_changelog' ) ) {
					echo '<h4>' . esc_html__( 'سجل التغييرات', 'blr-shop-pro' ) . '</h4><pre class="blr-changelog">' . esc_html( $product->get_meta( '_blr_changelog' ) ) . '</pre>';
				}
			},
		);
	}
	return $tabs;
} );

// شريط شراء ثابت.
add_action( 'woocommerce_after_single_product', function () {
	if ( ! get_theme_mod( 'blr_sticky_atc', true ) ) {
		return;
	}
	global $product;
	if ( ! $product || ! $product->is_purchasable() ) {
		return;
	}
	echo '<div class="blr-sticky-atc" id="blr-sticky-atc" hidden><div class="blr-wrap"><div class="blr-sticky-atc__info"><strong>' . esc_html( $product->get_name() ) . '</strong><span>' . wp_kses_post( $product->get_price_html() ) . '</span></div><button type="button" class="blr-btn" data-blr-sticky-buy>' . esc_html( $product->single_add_to_cart_text() ) . '</button></div></div>';
}, 20 );

// المنتجات التي شوهدت مؤخراً.
add_shortcode( 'blr_recent', function () {
	$ids = isset( $_COOKIE['woocommerce_recently_viewed'] ) ? array_filter( array_map( 'absint', explode( '|', wp_unslash( $_COOKIE['woocommerce_recently_viewed'] ) ) ) ) : array(); // phpcs:ignore
	if ( ! $ids ) {
		return '';
	}
	$q = new WP_Query( array( 'post_type' => 'product', 'post__in' => array_slice( array_reverse( $ids ), 0, 8 ), 'orderby' => 'post__in', 'no_found_rows' => true ) );
	ob_start();
	echo '<div class="blr-row-wrap"><ul class="blr-row products">';
	while ( $q->have_posts() ) {
		$q->the_post();
		wc_get_template_part( 'content', 'product' );
	}
	echo '</ul></div>';
	wp_reset_postdata();
	return ob_get_clean();
} );

/* ---------------------------------------------------------------
 * السلة: عدّاد + شريط الشحن المجاني
 * ------------------------------------------------------------- */
add_filter( 'woocommerce_add_to_cart_fragments', function ( $f ) {
	$f['span.blr-cart-count'] = '<span class="blr-cart-count">' . (int) WC()->cart->get_cart_contents_count() . '</span>';
	return $f;
} );

function blr_free_ship_bar() {
	$min = (int) get_theme_mod( 'blr_free_ship', 0 );
	if ( $min <= 0 || ! WC()->cart || ! WC()->cart->needs_shipping() ) {
		return;
	}
	$total = (float) WC()->cart->get_displayed_subtotal();
	$left  = max( 0, $min - $total );
	$pct   = min( 100, round( $total / $min * 100 ) );
	$msg   = $left > 0
		? sprintf( /* translators: %s: amount */ __( 'أضف %s للحصول على شحن مجاني!', 'blr-shop-pro' ), wc_price( $left ) )
		: __( '🎉 حصلت على شحن مجاني!', 'blr-shop-pro' );
	echo '<div class="blr-ship"><p>' . wp_kses_post( $msg ) . '</p><div class="blr-ship__bar"><i style="width:' . (int) $pct . '%"></i></div></div>';
}
add_action( 'woocommerce_before_cart', 'blr_free_ship_bar' );
add_action( 'woocommerce_before_checkout_form', 'blr_free_ship_bar', 5 );
add_action( 'woocommerce_before_mini_cart', 'blr_free_ship_bar' );

// أعمدة وغلاف المحتوى.
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
add_action( 'woocommerce_before_main_content', function () {
	echo '<main id="main" class="blr-wrap blr-shop">';
}, 10 );
add_action( 'woocommerce_after_main_content', function () {
	echo '</main>';
}, 10 );
add_filter( 'woocommerce_show_page_title', '__return_true' );

/* ---------------------------------------------------------------
 * AJAX: معاينة سريعة + قوائم المفضلة والمقارنة
 * ------------------------------------------------------------- */
add_action( 'wp_ajax_blr_qv', 'blr_ajax_qv' );
add_action( 'wp_ajax_nopriv_blr_qv', 'blr_ajax_qv' );
function blr_ajax_qv() {
	check_ajax_referer( 'blr_front', 'nonce' );
	$p = wc_get_product( absint( $_GET['id'] ?? 0 ) );
	if ( ! $p || 'publish' !== get_post_status( $p->get_id() ) ) {
		wp_send_json_error();
	}
	ob_start();
	?>
	<div class="blr-qv">
		<div class="blr-qv__img"><?php echo wp_kses_post( $p->get_image( 'woocommerce_single' ) ); ?></div>
		<div class="blr-qv__body">
			<h3><?php echo esc_html( $p->get_name() ); ?></h3>
			<div class="price"><?php echo wp_kses_post( $p->get_price_html() ); ?></div>
			<div><?php echo wp_kses_post( wpautop( $p->get_short_description() ) ); ?></div>
			<p>
				<?php if ( $p->is_type( 'simple' ) && $p->is_purchasable() && $p->is_in_stock() ) : ?>
					<a class="blr-btn ajax_add_to_cart add_to_cart_button" data-product_id="<?php echo esc_attr( $p->get_id() ); ?>" data-quantity="1" href="<?php echo esc_url( $p->add_to_cart_url() ); ?>" rel="nofollow"><?php echo esc_html( $p->add_to_cart_text() ); ?></a>
				<?php endif; ?>
				<a class="blr-btn blr-btn--ghost" href="<?php echo esc_url( $p->get_permalink() ); ?>"><?php esc_html_e( 'التفاصيل الكاملة', 'blr-shop-pro' ); ?></a>
			</p>
		</div>
	</div>
	<?php
	wp_send_json_success( array( 'html' => ob_get_clean() ) );
}

add_action( 'wp_ajax_blr_list', 'blr_ajax_list' );
add_action( 'wp_ajax_nopriv_blr_list', 'blr_ajax_list' );
function blr_ajax_list() {
	check_ajax_referer( 'blr_front', 'nonce' );
	$mode = ( isset( $_GET['mode'] ) && 'compare' === $_GET['mode'] ) ? 'compare' : 'wish';
	$ids  = array_slice( array_filter( array_map( 'absint', explode( ',', sanitize_text_field( wp_unslash( $_GET['ids'] ?? '' ) ) ) ) ), 0, 12 );
	if ( ! $ids ) {
		wp_send_json_success( array( 'html' => '' ) );
	}
	$products = array_filter( array_map( 'wc_get_product', $ids ), function ( $p ) {
		return $p && 'publish' === get_post_status( $p->get_id() );
	} );
	ob_start();
	if ( 'wish' === $mode ) {
		echo '<ul class="blr-wl">';
		foreach ( $products as $p ) {
			echo '<li><a href="' . esc_url( $p->get_permalink() ) . '">' . wp_kses_post( $p->get_image( 'thumbnail' ) ) . '</a><div><a href="' . esc_url( $p->get_permalink() ) . '">' . esc_html( $p->get_name() ) . '</a><div class="price">' . wp_kses_post( $p->get_price_html() ) . '</div></div><button type="button" data-blr-wish="' . (int) $p->get_id() . '" aria-label="remove">×</button></li>';
		}
		echo '</ul>';
	} else {
		$rows = array(
			__( 'السعر', 'blr-shop-pro' )   => function ( $p ) {
				return wp_kses_post( $p->get_price_html() );
			},
			__( 'النوع', 'blr-shop-pro' )   => function ( $p ) {
				return esc_html( blr_product_kind_label( blr_product_kind( $p ) ) );
			},
			__( 'التوفر', 'blr-shop-pro' )  => function ( $p ) {
				return $p->is_in_stock() ? esc_html__( 'متوفر', 'blr-shop-pro' ) : esc_html__( 'نفد', 'blr-shop-pro' );
			},
			__( 'التقييم', 'blr-shop-pro' ) => function ( $p ) {
				return esc_html( $p->get_average_rating() ?: '—' );
			},
			__( 'الوصف', 'blr-shop-pro' )   => function ( $p ) {
				return esc_html( wp_trim_words( wp_strip_all_tags( $p->get_short_description() ?: $p->get_description() ), 18 ) );
			},
		);
		echo '<div class="blr-cmp-scroll"><table class="blr-cmp"><thead><tr><th></th>';
		foreach ( $products as $p ) {
			echo '<th><a href="' . esc_url( $p->get_permalink() ) . '">' . wp_kses_post( $p->get_image( 'thumbnail' ) ) . '<br>' . esc_html( $p->get_name() ) . '</a><button type="button" data-blr-cmp="' . (int) $p->get_id() . '" aria-label="remove">×</button></th>';
		}
		echo '</tr></thead><tbody>';
		foreach ( $rows as $label => $fn ) {
			echo '<tr><th>' . esc_html( $label ) . '</th>';
			foreach ( $products as $p ) {
				echo '<td>' . $fn( $p ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside callbacks.
			}
			echo '</tr>';
		}
		echo '</tbody></table></div>';
	}
	wp_send_json_success( array( 'html' => ob_get_clean() ) );
}
