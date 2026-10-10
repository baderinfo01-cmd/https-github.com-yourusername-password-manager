<?php
/**
 * دوال القوالب المساعدة.
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * أيقونات SVG (inline، بلا طلبات إضافية).
 */
function baderlr_icon( $name, $size = 24 ) {
	$p = array(
		'menu'      => '<path d="M4 7h16M4 12h16M4 17h16"/>',
		'close'     => '<path d="M6 6l12 12M18 6L6 18"/>',
		'search'    => '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
		'sun'       => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		'moon'      => '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
		'arrow-up'  => '<path d="M12 19V5M6 11l6-6 6 6"/>',
		'check'     => '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
		'star'      => '<path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.5l1.1-6L3.4 9.3l6-.8z"/>',
		'bolt'      => '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
		'shield'    => '<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/>',
		'spark'     => '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
		'layers'    => '<path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5"/>',
		'globe'     => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
		'cart'      => '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.4 12h11l1.6-8H6"/>',
		'heart'     => '<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>',
		'compare'   => '<path d="M8 3 4 7l4 4M4 7h12M16 21l4-4-4-4M20 17H8"/>',
		'eye'       => '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
		'truck'     => '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
		'refresh'   => '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
		'repeat'    => '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
		'download'  => '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>',
		'whatsapp'  => '<path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .7a4 4 0 0 1-2-2l.7-1-1-2z"/>',
		'bot'       => '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M2 14h2M20 14h2"/>',
		'send'      => '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
		'user'      => '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
		'arrow'     => '<path d="M5 12h14M13 6l6 6-6 6"/>',
	);
	$inner = isset( $p[ $name ] ) ? $p[ $name ] : $p['arrow'];
	return '<svg width="' . (int) $size . '" height="' . (int) $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $inner . '</svg>';
}

/**
 * شعار الموقع (صورة مخصّصة أو اسم نصي مع علامة متدرّجة).
 */
function baderlr_logo() {
	if ( has_custom_logo() ) {
		the_custom_logo();
		return;
	}
	$name = get_bloginfo( 'name' );
	$mark = function_exists( 'mb_substr' ) ? mb_substr( $name, 0, 1, 'UTF-8' ) : substr( $name, 0, 1 );
	echo '<a class="blr-logo" href="' . esc_url( home_url( '/' ) ) . '" rel="home">';
	echo '<span class="blr-logo__mark">' . esc_html( $mark ) . '</span><span>' . esc_html( $name ) . '</span></a>';
}

/**
 * ترقيم الصفحات.
 */
function baderlr_pagination() {
	$links = paginate_links( array(
		'type'      => 'array',
		'prev_text' => baderlr_icon( 'arrow', 18 ),
		'next_text' => baderlr_icon( 'arrow', 18 ),
	) );
	if ( ! $links ) {
		return;
	}
	echo '<nav class="blr-pagination" aria-label="' . esc_attr__( 'الصفحات', 'blr-shop-pro' ) . '">';
	foreach ( $links as $l ) {
		echo wp_kses_post( $l );
	}
	echo '</nav>';
}

/**
 * تاريخ وكاتب المقال.
 */
function baderlr_posted_on() {
	printf(
		'<span class="blr-posted">%s</span><span class="blr-author">%s %s</span>',
		esc_html( get_the_date() ),
		esc_html__( 'بقلم', 'blr-shop-pro' ),
		esc_html( get_the_author() )
	);
}

/**
 * بطاقة مقال (تُستعمل في المدونة والأرشيف والرئيسية).
 */
function baderlr_post_card() {
	?>
	<article <?php post_class( 'blr-post-card blr-reveal' ); ?>>
		<?php if ( has_post_thumbnail() ) : ?>
			<a class="blr-post-card__thumb" href="<?php the_permalink(); ?>"><?php the_post_thumbnail( 'baderlr-card' ); ?></a>
		<?php endif; ?>
		<div class="blr-post-card__body">
			<div class="blr-post-card__meta">
				<?php $cat = get_the_category(); if ( $cat ) : ?><span class="blr-badge"><?php echo esc_html( $cat[0]->name ); ?></span><?php endif; ?>
				<span><?php echo esc_html( get_the_date() ); ?></span>
			</div>
			<h3 style="margin:0 0 .4em"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
			<p style="color:var(--muted);margin:0"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 20 ) ); ?></p>
			<a href="<?php the_permalink(); ?>" class="blr-readmore" style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;font-weight:600;font-family:var(--font-head)"><?php esc_html_e( 'اقرأ المزيد', 'blr-shop-pro' ); ?> <?php echo baderlr_icon( 'arrow', 16 ); // phpcs:ignore ?></a>
		</div>
	</article>
	<?php
}
