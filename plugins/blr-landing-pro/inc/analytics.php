<?php
/**
 * إحصاءات: مشاهدات، زوار فريدون، نقرات، عملاء محتملون، ونسبة التحويل.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function blrlp_stats_since( $days ) {
	return gmdate( 'Y-m-d', current_time( 'timestamp' ) - max( 1, (int) $days - 1 ) * DAY_IN_SECONDS ); // phpcs:ignore WordPress.DateTime
}

function blrlp_stats_totals( $days = 30, $landing = 0 ) {
	global $wpdb;
	$t   = "{$wpdb->prefix}blrlp_stats";
	$sql = "SELECT COALESCE(SUM(views),0) v, COALESCE(SUM(uniques),0) u, COALESCE(SUM(clicks),0) c, COALESCE(SUM(leads),0) l FROM $t WHERE day >= %s" . ( $landing ? ' AND landing_id = %d' : '' );
	$row = $wpdb->get_row( $wpdb->prepare( $sql, $landing ? array( blrlp_stats_since( $days ), $landing ) : array( blrlp_stats_since( $days ) ) ), ARRAY_A ); // phpcs:ignore WordPress.DB
	return array_map( 'intval', $row ? $row : array( 'v' => 0, 'u' => 0, 'c' => 0, 'l' => 0 ) );
}

function blrlp_stats_by_landing( $days = 30 ) {
	global $wpdb;
	return $wpdb->get_results( $wpdb->prepare( // phpcs:ignore WordPress.DB
		"SELECT landing_id, SUM(views) v, SUM(uniques) u, SUM(clicks) c, SUM(leads) l FROM {$wpdb->prefix}blrlp_stats WHERE day >= %s GROUP BY landing_id ORDER BY v DESC LIMIT 50",
		blrlp_stats_since( $days )
	), ARRAY_A );
}

function blrlp_stats_daily( $days = 14 ) {
	global $wpdb;
	$rows = $wpdb->get_results( $wpdb->prepare( "SELECT day, SUM(views) v, SUM(leads) l FROM {$wpdb->prefix}blrlp_stats WHERE day >= %s GROUP BY day", blrlp_stats_since( $days ) ), OBJECT_K ); // phpcs:ignore WordPress.DB
	$out  = array();
	for ( $i = $days - 1; $i >= 0; $i-- ) {
		$d     = gmdate( 'Y-m-d', current_time( 'timestamp' ) - $i * DAY_IN_SECONDS ); // phpcs:ignore WordPress.DateTime
		$out[] = array( 'd' => $d, 'v' => isset( $rows[ $d ] ) ? (int) $rows[ $d ]->v : 0, 'l' => isset( $rows[ $d ] ) ? (int) $rows[ $d ]->l : 0 );
	}
	return $out;
}

function blrlp_rate( $leads, $base ) {
	return $base > 0 ? round( $leads / $base * 100, 1 ) . '%' : '—';
}

/** رسم أعمدة SVG للمشاهدات مع نقاط للعملاء. */
function blrlp_chart_svg( $series ) {
	$w   = 640;
	$h   = 160;
	$max = max( 1, max( array_column( $series, 'v' ) ) );
	$n   = count( $series );
	$bw  = $w / $n;
	$o   = '<svg class="blrlp-chart" viewBox="0 0 ' . $w . ' ' . ( $h + 24 ) . '" role="img" aria-label="' . esc_attr__( 'المشاهدات اليومية', 'blr-landing-pro' ) . '">';
	foreach ( $series as $i => $p ) {
		$bh = round( $p['v'] / $max * $h );
		$x  = $i * $bw + 4;
		$o .= '<rect x="' . round( $x, 1 ) . '" y="' . ( $h - $bh ) . '" width="' . round( $bw - 8, 1 ) . '" height="' . max( 2, $bh ) . '" rx="5" fill="url(#blrlpg)"><title>' . esc_attr( $p['d'] . ': ' . $p['v'] . ' / ' . $p['l'] ) . '</title></rect>';
		if ( 0 === $i % 2 ) {
			$o .= '<text x="' . round( $x + ( $bw - 8 ) / 2, 1 ) . '" y="' . ( $h + 16 ) . '" text-anchor="middle" font-size="10" fill="#6B7A92">' . esc_html( substr( $p['d'], 5 ) ) . '</text>';
		}
	}
	return $o . '<defs><linearGradient id="blrlpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22C3F0"/><stop offset="1" stop-color="#2F5BFF"/></linearGradient></defs></svg>';
}

function blrlp_dashboard_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	$days   = 30;
	$tot    = blrlp_stats_totals( $days );
	$by     = blrlp_stats_by_landing( $days );
	$series = blrlp_stats_daily( 14 );
	$tpls   = blrlp_templates_meta();
	?>
	<div class="wrap blrlp-admin">
		<?php blrlp_admin_header( __( 'لوحة التحكم', 'blr-landing-pro' ) ); ?>

		<?php if ( ! blrlp_is_pro() ) : ?>
			<div class="blrlp-upsell">
				<div><strong><?php esc_html_e( 'أنت تستخدم النسخة المجانية', 'blr-landing-pro' ); ?></strong>
				<p><?php esc_html_e( 'فعّل Pro لفتح الذكاء الاصطناعي، اختبار A/B، تصدير العملاء وWebhook، كل القوالب، وإزالة شارة «صُنعت بواسطة».', 'blr-landing-pro' ); ?></p></div>
				<a class="button button-primary button-hero" href="<?php echo esc_url( admin_url( 'admin.php?page=blr-landing-settings' ) ); ?>"><?php esc_html_e( 'تفعيل الترخيص', 'blr-landing-pro' ); ?></a>
			</div>
		<?php endif; ?>

		<div class="blrlp-kpis">
			<?php
			$k = array(
				array( __( 'المشاهدات', 'blr-landing-pro' ), $tot['v'], 'eye' ),
				array( __( 'زوار فريدون', 'blr-landing-pro' ), $tot['u'], 'users' ),
				array( __( 'نقرات الأزرار', 'blr-landing-pro' ), $tot['c'], 'bolt' ),
				array( __( 'عملاء محتملون', 'blr-landing-pro' ), $tot['l'], 'mail' ),
				array( __( 'نسبة التحويل', 'blr-landing-pro' ), blrlp_rate( $tot['l'], $tot['u'] ? $tot['u'] : $tot['v'] ), 'target' ),
			);
			foreach ( $k as $c ) {
				echo '<div class="blrlp-kpi"><span class="blrlp-kpi__i">' . blrlp_icon( 'eye' === $c[2] ? 'globe' : $c[2], 22 ) . '</span><b>' . esc_html( is_numeric( $c[1] ) ? number_format_i18n( $c[1] ) : $c[1] ) . '</b><small>' . esc_html( $c[0] ) . '</small></div>'; // phpcs:ignore
			}
			?>
		</div>

		<div class="blrlp-grid2">
			<div class="blrlp-panel">
				<h2><?php esc_html_e( 'المشاهدات — آخر 14 يوماً', 'blr-landing-pro' ); ?></h2>
				<?php echo blrlp_chart_svg( $series ); // phpcs:ignore ?>
			</div>
			<div class="blrlp-panel">
				<h2><?php esc_html_e( 'ابدأ صفحة جديدة', 'blr-landing-pro' ); ?></h2>
				<div class="blrlp-tpl-mini">
					<?php foreach ( $tpls as $slug => $m ) : ?>
						<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=blrlp_new&tpl=' . $slug ), 'blrlp_new' ) ); ?>" class="<?php echo ( $m['pro'] && ! blrlp_is_pro() ) ? 'is-locked' : ''; ?>"><span><?php echo esc_html( $m['emoji'] ); ?></span><?php echo esc_html( $m['name'] ); ?><?php echo $m['pro'] ? blrlp_pro_badge() : ''; // phpcs:ignore ?></a>
					<?php endforeach; ?>
				</div>
			</div>
		</div>

		<div class="blrlp-panel">
			<h2><?php esc_html_e( 'الأداء حسب الصفحة (30 يوماً)', 'blr-landing-pro' ); ?></h2>
			<table class="widefat striped blrlp-table">
				<thead><tr><th><?php esc_html_e( 'الصفحة', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'مشاهدات', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'فريدون', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'نقرات', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'عملاء', 'blr-landing-pro' ); ?></th><th><?php esc_html_e( 'التحويل', 'blr-landing-pro' ); ?></th><th></th></tr></thead>
				<tbody>
				<?php foreach ( $by as $r ) : ?>
					<tr>
						<td><a href="<?php echo esc_url( get_edit_post_link( $r['landing_id'] ) ); ?>"><?php echo esc_html( get_the_title( $r['landing_id'] ) ? get_the_title( $r['landing_id'] ) : '#' . $r['landing_id'] ); ?></a><?php echo ( blrlp_get_data( $r['landing_id'] )['settings']['ab_partner'] ) ? ' <span class="blrlp-chip">A/B</span>' : ''; // phpcs:ignore ?></td>
						<td><?php echo (int) $r['v']; ?></td><td><?php echo (int) $r['u']; ?></td><td><?php echo (int) $r['c']; ?></td><td><?php echo (int) $r['l']; ?></td>
						<td><b><?php echo esc_html( blrlp_rate( (int) $r['l'], (int) $r['u'] ? (int) $r['u'] : (int) $r['v'] ) ); ?></b></td>
						<td><a href="<?php echo esc_url( get_permalink( $r['landing_id'] ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'عرض', 'blr-landing-pro' ); ?></a></td>
					</tr>
				<?php endforeach; ?>
				<?php if ( ! $by ) : ?><tr><td colspan="7"><?php esc_html_e( 'ستظهر الإحصاءات بعد أول زيارة لصفحاتك المنشورة.', 'blr-landing-pro' ); ?></td></tr><?php endif; ?>
				</tbody>
			</table>
		</div>
	</div>
	<?php
}

/* أعمدة قائمة الصفحات */
add_filter( 'manage_blr_landing_posts_columns', function ( $c ) {
	return array( 'cb' => $c['cb'], 'title' => $c['title'], 'blrlp_sc' => __( 'الشورتكود', 'blr-landing-pro' ), 'blrlp_v' => __( 'مشاهدات 30ي', 'blr-landing-pro' ), 'blrlp_l' => __( 'عملاء', 'blr-landing-pro' ), 'blrlp_cr' => __( 'التحويل', 'blr-landing-pro' ), 'date' => $c['date'] );
} );
add_action( 'manage_blr_landing_posts_custom_column', function ( $col, $id ) {
	if ( 'blrlp_sc' === $col ) {
		echo '<code>[blr_landing id="' . (int) $id . '"]</code>';
		return;
	}
	$t = blrlp_stats_totals( 30, $id );
	if ( 'blrlp_v' === $col ) {
		echo (int) $t['v'];
	} elseif ( 'blrlp_l' === $col ) {
		echo (int) $t['l'];
	} elseif ( 'blrlp_cr' === $col ) {
		echo esc_html( blrlp_rate( $t['l'], $t['u'] ? $t['u'] : $t['v'] ) );
	}
}, 10, 2 );
