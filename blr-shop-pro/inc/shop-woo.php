<?php
/**
 * متجر BLR Shop Pro — ووكومرس: منتجات مادية · رقمية · اشتراكات · خدمات.
 * أنواع المنتجات، الشارات، أزرار البطاقة، صفحة المنتج، السلة، المعاينة السريعة والمفضلة/المقارنة.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* يُحمَّل المتجر فقط عند تفعيل ووكومرس (ووكومرس يُحمَّل قبل القالب). */
if ( ! class_exists( 'WooCommerce' ) ) {
	return;
}

/* ===================================================================
 * أنواع المنتجات
 * =================================================================== */
function bshop_product_kinds() {
	return array(
		'physical'     => __( 'منتج مادي', 'blr-shop-pro' ),
		'digital'      => __( 'منتج رقمي', 'blr-shop-pro' ),
		'subscription' => __( 'اشتراك', 'blr-shop-pro' ),
		'service'      => __( 'خدمة', 'blr-shop-pro' ),
	);
}

function bshop_product_kind_label( $kind ) {
	$k = bshop_product_kinds();
	return isset( $k[ $kind ] ) ? $k[ $kind ] : $k['physical'];
}

/** النوع: الحقل اليدوي أولاً، ثم نوع ووكومرس/القابل للتنزيل/الافتراضي. */
function bshop_product_kind( $product = null ) {
	$product = $product ? wc_get_product( $product ) : wc_get_product( get_the_ID() );
	if ( ! $product ) {
		return 'physical';
	}
	$meta = $product->get_meta( '_bshop_ptype' );
	if ( $meta && isset( bshop_product_kinds()[ $meta ] ) ) {
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

/* ---------- تبويب «BLR Shop» في بيانات المنتج ---------- */
add_filter( 'woocommerce_product_data_tabs', function ( $tabs ) {
	$tabs['bshop'] = array( 'label' => 'BLR Shop', 'target' => 'bshop_product_data', 'class' => array(), 'priority' => 80 );
	return $tabs;
} );

add_action( 'woocommerce_product_data_panels', function () {
	echo '<div id="bshop_product_data" class="panel woocommerce_options_panel"><div class="options_group">';
	woocommerce_wp_select( array( 'id' => '_bshop_ptype', 'label' => __( 'نوع المنتج (للعرض)', 'blr-shop-pro' ), 'options' => array( '' => __( 'تلقائي', 'blr-shop-pro' ) ) + bshop_product_kinds() ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_file_format', 'label' => __( 'صيغة الملف', 'blr-shop-pro' ), 'placeholder' => 'ZIP, PDF, PSD' ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_file_size', 'label' => __( 'حجم الملف', 'blr-shop-pro' ), 'placeholder' => '24 MB' ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_version', 'label' => __( 'الإصدار', 'blr-shop-pro' ), 'placeholder' => '1.0.0' ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_demo_url', 'label' => __( 'رابط المعاينة', 'blr-shop-pro' ), 'type' => 'url' ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_requirements', 'label' => __( 'المتطلبات', 'blr-shop-pro' ), 'placeholder' => 'WordPress 6.2+, PHP 7.4+' ) );
	woocommerce_wp_textarea_input( array( 'id' => '_bshop_changelog', 'label' => __( 'سجل التغييرات', 'blr-shop-pro' ) ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_period_note', 'label' => __( 'ملاحظة الاشتراك', 'blr-shop-pro' ), 'placeholder' => __( 'يمكن الإلغاء في أي وقت', 'blr-shop-pro' ) ) );
	woocommerce_wp_text_input( array( 'id' => '_bshop_seo_desc', 'label' => __( 'وصف SEO', 'blr-shop-pro' ), 'description' => __( 'يُستعمل كوصف ميتا إن لم تكن إضافة SEO مفعّلة.', 'blr-shop-pro' ), 'desc_tip' => true ) );
	echo '</div></div>';
} );

add_action( 'woocommerce_process_product_meta', function ( $id ) {
	foreach ( array( '_bshop_ptype', '_bshop_file_format', '_bshop_file_size', '_bshop_version', '_bshop_requirements', '_bshop_period_note', '_bshop_seo_desc' ) as $f ) {
		if ( isset( $_POST[ $f ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification -- WooCommerce verifies.
			update_post_meta( $id, $f, sanitize_text_field( wp_unslash( $_POST[ $f ] ) ) ); // phpcs:ignore
		}
	}
	if ( isset( $_POST['_bshop_demo_url'] ) ) { // phpcs:ignore
		update_post_meta( $id, '_bshop_demo_url', esc_url_raw( wp_unslash( $_POST['_bshop_demo_url'] ) ) ); // phpcs:ignore
	}
	if ( isset( $_POST['_bshop_changelog'] ) ) { // phpcs:ignore
		update_post_meta( $id, '_bshop_changelog', sanitize_textarea_field( wp_unslash( $_POST['_bshop_changelog'] ) ) ); // phpcs:ignore
	}
} );

/* وصف ميتا للمنتج إن لم توجد إضافة SEO. */
add_action( 'wp_head', function () {
	if ( function_exists( 'baderlr_seo_active' ) && baderlr_seo_active() ) {
		return;
	}
	if ( is_singular( 'product' ) && ( $d = get_post_meta( get_the_ID(), '_bshop_seo_desc', true ) ) ) {
		echo '<meta name="description" content="' . esc_attr( $d ) . '">' . "\n";
	}
}, 4 );

/* ===================================================================
 * بطاقة المنتج
 * =================================================================== */
add_filter( 'loop_shop_columns', function () {
	return max( 2, min( 5, absint( get_theme_mod( 'bshop_cols', 3 ) ) ) );
} );
add_filter( 'loop_shop_per_page', function () {
	return 12;
} );

remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_show_product_loop_sale_flash', 10 );
remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_sale_flash', 10 );

add_action( 'woocommerce_before_shop_loop_item_title', 'bshop_badges', 9 );
add_action( 'woocommerce_before_single_product_summary', 'bshop_badges', 9 );
function bshop_badges() {
	global $product;
	if ( ! $product ) {
		return;
	}
	$out  = '';
	$kind = bshop_product_kind( $product );
	if ( $product->is_on_sale() ) {
		$reg = (float) $product->get_regular_price();
		if ( ! $product->is_type( 'variable' ) && $reg > 0 ) {
			$out .= '<span class="bs-badge bs-badge--sale">-' . (int) round( ( $reg - (float) $product->get_sale_price() ) / $reg * 100 ) . '%</span>';
		} else {
			$out .= '<span class="bs-badge bs-badge--sale">' . esc_html__( 'عرض', 'blr-shop-pro' ) . '</span>';
		}
	}
	if ( 'digital' === $kind ) {
		$out .= '<span class="bs-badge bs-badge--digital">' . baderlr_icon( 'bolt', 12 ) . esc_html__( 'تسليم فوري', 'blr-shop-pro' ) . '</span>'; // phpcs:ignore
	} elseif ( 'subscription' === $kind ) {
		$out .= '<span class="bs-badge bs-badge--sub">' . baderlr_icon( 'repeat', 12 ) . esc_html__( 'اشتراك', 'blr-shop-pro' ) . '</span>'; // phpcs:ignore
	}
	if ( ! $product->is_in_stock() ) {
		$out .= '<span class="bs-badge bs-badge--out">' . esc_html__( 'نفدت الكمية', 'blr-shop-pro' ) . '</span>';
	}
	if ( $out ) {
		echo '<div class="bs-badges">' . $out . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}

add_action( 'woocommerce_before_shop_loop_item_title', function () {
	global $product;
	$id  = (int) $product->get_id();
	$out = '<div class="bs-actions">';
	if ( get_theme_mod( 'bshop_wishlist', true ) ) {
		$out .= '<button type="button" data-bs-wish="' . $id . '" aria-label="' . esc_attr__( 'المفضلة', 'blr-shop-pro' ) . '">' . baderlr_icon( 'heart', 18 ) . '</button>';
		$out .= '<button type="button" data-bs-cmp="' . $id . '" aria-label="' . esc_attr__( 'مقارنة', 'blr-shop-pro' ) . '">' . baderlr_icon( 'compare', 18 ) . '</button>';
	}
	if ( get_theme_mod( 'bshop_quickview', true ) ) {
		$out .= '<button type="button" data-bs-qv="' . $id . '" aria-label="' . esc_attr__( 'معاينة سريعة', 'blr-shop-pro' ) . '">' . baderlr_icon( 'eye', 18 ) . '</button>';
	}
	echo $out . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
}, 20 );

add_action( 'woocommerce_after_shop_loop_item_title', function () {
	global $product;
	$to = $product->get_date_on_sale_to();
	if ( $product->is_on_sale() && $to ) {
		echo bshop_countdown_html( $to->getTimestamp() ); // phpcs:ignore WordPress.Security.EscapeOutput
	}
}, 15 );

add_filter( 'woocommerce_product_add_to_cart_text', 'bshop_cta_text', 20, 2 );
add_filter( 'woocommerce_product_single_add_to_cart_text', 'bshop_cta_text', 20, 2 );
function bshop_cta_text( $text, $product ) {
	if ( ! $product->is_purchasable() || ! $product->is_in_stock() || ! $product->is_type( 'simple' ) ) {
		return $text;
	}
	switch ( bshop_product_kind( $product ) ) {
		case 'digital':
			return __( 'اشترِ وحمّل', 'blr-shop-pro' );
		case 'subscription':
			return __( 'اشترك الآن', 'blr-shop-pro' );
		case 'service':
			return __( 'اطلب الخدمة', 'blr-shop-pro' );
	}
	return $text;
}

/* ===================================================================
 * صفحة المنتج
 * =================================================================== */
add_action( 'woocommerce_single_product_summary', function () {
	global $product;
	$to = $product->get_date_on_sale_to();
	if ( $product->is_on_sale() && $to ) {
		echo '<div class="bs-sale-timer"><span>' . esc_html__( 'ينتهي العرض خلال', 'blr-shop-pro' ) . '</span>' . bshop_countdown_html( $to->getTimestamp() ) . '</div>'; // phpcs:ignore
	}
	if ( 'subscription' === bshop_product_kind( $product ) && $product->get_meta( '_bshop_period_note' ) ) {
		echo '<p class="bs-note">' . baderlr_icon( 'repeat', 16 ) . ' ' . esc_html( $product->get_meta( '_bshop_period_note' ) ) . '</p>'; // phpcs:ignore
	}
}, 11 );

add_action( 'woocommerce_single_product_summary', function () {
	global $product;
	$kind  = bshop_product_kind( $product );
	$items = array(
		'physical'     => array( array( 'truck', __( 'شحن سريع وتتبّع للشحنة', 'blr-shop-pro' ) ), array( 'refresh', __( 'إرجاع خلال 14 يوماً', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
		'digital'      => array( array( 'bolt', __( 'تسليم فوري بعد الدفع', 'blr-shop-pro' ) ), array( 'download', __( 'روابط التحميل في حسابك', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
		'subscription' => array( array( 'repeat', __( 'تجديد تلقائي — ألغِ متى شئت', 'blr-shop-pro' ) ), array( 'bolt', __( 'تفعيل فوري', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
		'service'      => array( array( 'check', __( 'تنفيذ احترافي', 'blr-shop-pro' ) ), array( 'refresh', __( 'مراجعات حسب الاتفاق', 'blr-shop-pro' ) ), array( 'shield', __( 'دفع آمن 100%', 'blr-shop-pro' ) ) ),
	);
	echo '<ul class="bs-trust">';
	foreach ( $items[ $kind ] as $i ) {
		echo '<li>' . baderlr_icon( $i[0], 18 ) . '<span>' . esc_html( $i[1] ) . '</span></li>'; // phpcs:ignore
	}
	echo '</ul>';
	if ( $product->get_meta( '_bshop_demo_url' ) ) {
		echo '<p><a class="blr-btn blr-btn--ghost" target="_blank" rel="noopener" href="' . esc_url( $product->get_meta( '_bshop_demo_url' ) ) . '">' . esc_html__( 'معاينة مباشرة', 'blr-shop-pro' ) . '</a></p>';
	}
}, 45 );

add_filter( 'woocommerce_product_tabs', function ( $tabs ) {
	global $product;
	if ( ! $product ) {
		return $tabs;
	}
	$has = false;
	foreach ( array( '_bshop_file_format', '_bshop_file_size', '_bshop_version', '_bshop_requirements', '_bshop_changelog' ) as $k ) {
		$has = $has || $product->get_meta( $k );
	}
	if ( $has ) {
		$tabs['bshop_tech'] = array(
			'title'    => __( 'التفاصيل التقنية', 'blr-shop-pro' ),
			'priority' => 15,
			'callback' => function () use ( $product ) {
				$rows = array(
					__( 'الصيغة', 'blr-shop-pro' )    => '_bshop_file_format',
					__( 'الحجم', 'blr-shop-pro' )     => '_bshop_file_size',
					__( 'الإصدار', 'blr-shop-pro' )   => '_bshop_version',
					__( 'المتطلبات', 'blr-shop-pro' ) => '_bshop_requirements',
				);
				echo '<table class="bs-spec"><tbody>';
				foreach ( $rows as $label => $key ) {
					if ( $product->get_meta( $key ) ) {
						echo '<tr><th>' . esc_html( $label ) . '</th><td>' . esc_html( $product->get_meta( $key ) ) . '</td></tr>';
					}
				}
				echo '</tbody></table>';
				if ( $product->get_meta( '_bshop_changelog' ) ) {
					echo '<h4>' . esc_html__( 'سجل التغييرات', 'blr-shop-pro' ) . '</h4><pre class="bs-changelog">' . esc_html( $product->get_meta( '_bshop_changelog' ) ) . '</pre>';
				}
			},
		);
	}
	return $tabs;
} );

add_action( 'woocommerce_after_single_product', function () {
	if ( ! get_theme_mod( 'bshop_sticky_atc', true ) ) {
		return;
	}
	global $product;
	if ( ! $product || ! $product->is_purchasable() ) {
		return;
	}
	echo '<div class="bs-sticky" id="bs-sticky" hidden><div class="blr-container bs-sticky__in"><div class="bs-sticky__info"><strong>' . esc_html( $product->get_name() ) . '</strong><span>' . wp_kses_post( $product->get_price_html() ) . '</span></div><button type="button" class="blr-btn blr-btn--primary" data-bs-sticky-buy>' . esc_html( $product->single_add_to_cart_text() ) . '</button></div></div>';
}, 20 );

/* ===================================================================
 * السلة: عدّاد + شريط الشحن المجاني
 * =================================================================== */
add_filter( 'woocommerce_add_to_cart_fragments', function ( $f ) {
	$f['span.bs-cart-count'] = '<span class="blr-count bs-cart-count">' . (int) WC()->cart->get_cart_contents_count() . '</span>';
	return $f;
} );

function bshop_free_ship_bar() {
	$min = (int) get_theme_mod( 'bshop_free_ship', 0 );
	if ( $min <= 0 || ! WC()->cart || ! WC()->cart->needs_shipping() ) {
		return;
	}
	$total = (float) WC()->cart->get_displayed_subtotal();
	$left  = max( 0, $min - $total );
	$pct   = min( 100, (int) round( $total / $min * 100 ) );
	$msg   = $left > 0
		? sprintf( /* translators: %s: amount */ __( 'أضف %s للحصول على شحن مجاني!', 'blr-shop-pro' ), wc_price( $left ) )
		: __( '🎉 حصلت على شحن مجاني!', 'blr-shop-pro' );
	echo '<div class="bs-ship"><p>' . wp_kses_post( $msg ) . '</p><div class="bs-ship__bar"><i style="width:' . $pct . '%"></i></div></div>';
}
add_action( 'woocommerce_before_cart', 'bshop_free_ship_bar' );
add_action( 'woocommerce_before_checkout_form', 'bshop_free_ship_bar', 5 );
add_action( 'woocommerce_before_mini_cart', 'bshop_free_ship_bar' );

/* ===================================================================
 * AJAX: معاينة سريعة + قوائم المفضلة والمقارنة
 * =================================================================== */
add_action( 'wp_ajax_bshop_qv', 'bshop_ajax_qv' );
add_action( 'wp_ajax_nopriv_bshop_qv', 'bshop_ajax_qv' );
function bshop_ajax_qv() {
	check_ajax_referer( 'bshop', 'nonce' );
	$p = wc_get_product( absint( $_GET['id'] ?? 0 ) );
	if ( ! $p || 'publish' !== get_post_status( $p->get_id() ) ) {
		wp_send_json_error();
	}
	ob_start();
	?>
	<div class="bs-qv">
		<div class="bs-qv__img"><?php echo wp_kses_post( $p->get_image( 'woocommerce_single' ) ); ?></div>
		<div class="bs-qv__body">
			<h3><?php echo esc_html( $p->get_name() ); ?></h3>
			<div class="price"><?php echo wp_kses_post( $p->get_price_html() ); ?></div>
			<div><?php echo wp_kses_post( wpautop( $p->get_short_description() ) ); ?></div>
			<p class="bs-qv__btns">
				<?php if ( $p->is_type( 'simple' ) && $p->is_purchasable() && $p->is_in_stock() ) : ?>
					<a class="button ajax_add_to_cart add_to_cart_button" data-product_id="<?php echo esc_attr( $p->get_id() ); ?>" data-quantity="1" href="<?php echo esc_url( $p->add_to_cart_url() ); ?>" rel="nofollow"><?php echo esc_html( $p->add_to_cart_text() ); ?></a>
				<?php endif; ?>
				<a class="blr-btn blr-btn--ghost" href="<?php echo esc_url( $p->get_permalink() ); ?>"><?php esc_html_e( 'التفاصيل الكاملة', 'blr-shop-pro' ); ?></a>
			</p>
		</div>
	</div>
	<?php
	wp_send_json_success( array( 'html' => ob_get_clean() ) );
}

add_action( 'wp_ajax_bshop_list', 'bshop_ajax_list' );
add_action( 'wp_ajax_nopriv_bshop_list', 'bshop_ajax_list' );
function bshop_ajax_list() {
	check_ajax_referer( 'bshop', 'nonce' );
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
		echo '<ul class="bs-wl">';
		foreach ( $products as $p ) {
			echo '<li><a href="' . esc_url( $p->get_permalink() ) . '">' . wp_kses_post( $p->get_image( 'thumbnail' ) ) . '</a><div><a href="' . esc_url( $p->get_permalink() ) . '">' . esc_html( $p->get_name() ) . '</a><div class="price">' . wp_kses_post( $p->get_price_html() ) . '</div></div><button type="button" data-bs-wish="' . (int) $p->get_id() . '" aria-label="remove">×</button></li>';
		}
		echo '</ul>';
	} else {
		$rows = array(
			__( 'السعر', 'blr-shop-pro' )   => function ( $p ) {
				return wp_kses_post( $p->get_price_html() );
			},
			__( 'النوع', 'blr-shop-pro' )   => function ( $p ) {
				return esc_html( bshop_product_kind_label( bshop_product_kind( $p ) ) );
			},
			__( 'التوفر', 'blr-shop-pro' )  => function ( $p ) {
				return $p->is_in_stock() ? esc_html__( 'متوفر', 'blr-shop-pro' ) : esc_html__( 'نفد', 'blr-shop-pro' );
			},
			__( 'التقييم', 'blr-shop-pro' ) => function ( $p ) {
				return esc_html( $p->get_average_rating() ? $p->get_average_rating() : '—' );
			},
			__( 'الوصف', 'blr-shop-pro' )   => function ( $p ) {
				return esc_html( wp_trim_words( wp_strip_all_tags( $p->get_short_description() ? $p->get_short_description() : $p->get_description() ), 18 ) );
			},
		);
		echo '<div class="bs-cmp-scroll"><table class="bs-cmp"><thead><tr><th></th>';
		foreach ( $products as $p ) {
			echo '<th><a href="' . esc_url( $p->get_permalink() ) . '">' . wp_kses_post( $p->get_image( 'thumbnail' ) ) . '<br>' . esc_html( $p->get_name() ) . '</a><button type="button" data-bs-cmp="' . (int) $p->get_id() . '" aria-label="remove">×</button></th>';
		}
		echo '</tr></thead><tbody>';
		foreach ( $rows as $label => $fn ) {
			echo '<tr><th>' . esc_html( $label ) . '</th>';
			foreach ( $products as $p ) {
				echo '<td>' . $fn( $p ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in callbacks.
			}
			echo '</tr>';
		}
		echo '</tbody></table></div>';
	}
	wp_send_json_success( array( 'html' => ob_get_clean() ) );
}
