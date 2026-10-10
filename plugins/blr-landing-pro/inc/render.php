<?php
/**
 * العرض: الأقسام، المتغيّرات اللونية، Schema، شورتكود وكتلة.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** لون نص مناسب فوق لون معيّن. */
function blrlp_on_color( $hex ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	if ( 6 !== strlen( $hex ) ) {
		return '#ffffff';
	}
	$l = 0.299 * hexdec( substr( $hex, 0, 2 ) ) + 0.587 * hexdec( substr( $hex, 2, 2 ) ) + 0.114 * hexdec( substr( $hex, 4, 2 ) );
	return $l > 165 ? '#12100A' : '#ffffff';
}

/** سلسلة style بمتغيّرات التصميم. */
function blrlp_css_vars( $design ) {
	$pal  = blrlp_palettes();
	$p    = $pal[ isset( $pal[ $design['preset'] ] ) ? $design['preset'] : 'aurora' ];
	$v    = $p['v'];
	$dark = $p['dark'];
	if ( 'dark' === $design['mode'] ) {
		$dark = true;
		$v    = array_merge( $v, $pal['onyx']['v'], array( 'primary' => $p['v']['primary'], 'primary2' => $p['v']['primary2'], 'on' => $p['v']['on'] ) );
	} elseif ( 'light' === $design['mode'] && $dark ) {
		$dark = false;
		$v    = array_merge( $v, $pal['aurora']['v'], array( 'primary' => $p['v']['primary'], 'primary2' => $p['v']['primary2'], 'on' => $p['v']['on'] ) );
	}
	if ( ! empty( $design['primary'] ) ) {
		$v['primary'] = $design['primary'];
		$v['on']      = blrlp_on_color( $design['primary'] );
		if ( empty( $design['primary2'] ) ) {
			$v['primary2'] = $design['primary'];
		}
	}
	if ( ! empty( $design['primary2'] ) ) {
		$v['primary2'] = $design['primary2'];
	}
	$font = 'system' === $design['font']
		? "system-ui,-apple-system,'Segoe UI','Noto Sans Arabic',Tahoma,sans-serif"
		: "'El Messiri',system-ui,'Segoe UI',Tahoma,sans-serif";
	$css = '';
	foreach ( $v as $k => $val ) {
		$css .= '--lp-' . $k . ':' . $val . ';';
	}
	$css .= '--lp-radius:' . (int) $design['radius'] . 'px;--lp-font:' . $font . ';';
	return array( 'css' => $css, 'dark' => $dark );
}

function blrlp_btn( $text, $url, $style = 'primary', $extra = '' ) {
	if ( '' === trim( (string) $text ) ) {
		return '';
	}
	$url = blrlp_url( $url );
	$cls = '';
	foreach ( explode( ' ', $style ) as $part ) {
		$cls .= ' blrlp-btn--' . sanitize_html_class( $part );
	}
	return '<a class="blrlp-btn' . esc_attr( $cls ) . '" href="' . esc_attr( '' !== $url ? $url : '#' ) . '" data-blrlp-cta ' . $extra . '>' . esc_html( $text ) . '</a>';
}

function blrlp_img( $url, $alt = '', $class = '', $eager = false ) {
	if ( ! $url ) {
		return '';
	}
	return '<img class="' . esc_attr( $class ) . '" src="' . esc_url( $url ) . '" alt="' . esc_attr( $alt ) . '" ' . ( $eager ? 'fetchpriority="high"' : 'loading="lazy"' ) . ' decoding="async">';
}

function blrlp_head( $d, $tag = 'h2' ) {
	if ( empty( $d['title'] ) && empty( $d['subtitle'] ) ) {
		return '';
	}
	return '<header class="blrlp-head blrlp-rv">' . ( ! empty( $d['title'] ) ? '<' . $tag . '>' . esc_html( $d['title'] ) . '</' . $tag . '>' : '' ) . ( ! empty( $d['subtitle'] ) ? '<p>' . esc_html( $d['subtitle'] ) . '</p>' : '' ) . '</header>';
}

/* ---------------------------- الأقسام ---------------------------- */

function blrlp_r_hero( $d ) {
	$split = 'split' === $d['layout'];
	$o     = '<div class="blrlp-hero ' . ( $split ? 'is-split' : 'is-center' ) . '"><div class="blrlp-hero__txt blrlp-rv">';
	if ( $d['badge'] ) {
		$o .= '<span class="blrlp-badge">' . blrlp_icon( 'spark', 15 ) . esc_html( $d['badge'] ) . '</span>';
	}
	$o .= '<h1>' . esc_html( $d['title'] ) . '</h1><p class="blrlp-lead">' . esc_html( $d['subtitle'] ) . '</p>';
	if ( ! empty( $d['bullets'] ) ) {
		$o .= '<ul class="blrlp-checks">';
		foreach ( $d['bullets'] as $b ) {
			if ( $b['text'] ) {
				$o .= '<li>' . blrlp_icon( 'check', 18 ) . esc_html( $b['text'] ) . '</li>';
			}
		}
		$o .= '</ul>';
	}
	$o .= '<div class="blrlp-actions">' . blrlp_btn( $d['btn1'], $d['url1'], 'primary lg' ) . blrlp_btn( $d['btn2'], $d['url2'], 'ghost lg' ) . '</div>';
	if ( $d['note'] ) {
		$o .= '<p class="blrlp-note">' . esc_html( $d['note'] ) . '</p>';
	}
	$o .= '</div>';
	if ( $split ) {
		$o .= '<div class="blrlp-hero__art blrlp-rv">';
		$o .= $d['image'] ? blrlp_img( $d['image'], $d['title'], '', true ) : '<div class="blrlp-orb" aria-hidden="true"><i></i><i></i><i></i><span>' . blrlp_icon( 'rocket', 64 ) . '</span></div>';
		$o .= '</div>';
	}
	return $o . '</div>';
}

function blrlp_r_logos( $d ) {
	$o = '<div class="blrlp-logos blrlp-rv">' . ( $d['title'] ? '<p>' . esc_html( $d['title'] ) . '</p>' : '' ) . '<div>';
	foreach ( $d['items'] as $i ) {
		$o .= '<span class="blrlp-logo">' . ( $i['image'] ? blrlp_img( $i['image'], $i['name'] ) : esc_html( $i['name'] ) ) . '</span>';
	}
	return $o . '</div></div>';
}

function blrlp_r_stats( $d ) {
	$o = '<div class="blrlp-stats">';
	foreach ( $d['items'] as $i ) {
		$o .= '<div class="blrlp-stat blrlp-rv"><b data-count>' . esc_html( $i['num'] ) . '</b><span>' . esc_html( $i['label'] ) . '</span></div>';
	}
	return $o . '</div>';
}

function blrlp_r_features( $d ) {
	$cols = in_array( (string) $d['cols'], array( '2', '3', '4' ), true ) ? $d['cols'] : '3';
	$o    = blrlp_head( $d ) . '<div class="blrlp-grid blrlp-c' . esc_attr( $cols ) . '">';
	foreach ( $d['items'] as $i ) {
		$o .= '<article class="blrlp-card blrlp-rv"><span class="blrlp-ico">' . blrlp_icon( $i['icon'], 26 ) . '</span><h3>' . esc_html( $i['title'] ) . '</h3><p>' . esc_html( $i['text'] ) . '</p></article>';
	}
	return $o . '</div>';
}

function blrlp_r_split( $d ) {
	$o = '<div class="blrlp-split ' . ( 'start' === $d['side'] ? 'is-rev' : '' ) . '"><div class="blrlp-split__txt blrlp-rv">';
	$o .= ( $d['title'] ? '<h2>' . esc_html( $d['title'] ) . '</h2>' : '' ) . ( $d['text'] ? '<p>' . nl2br( esc_html( $d['text'] ) ) . '</p>' : '' );
	if ( ! empty( $d['bullets'] ) ) {
		$o .= '<ul class="blrlp-checks">';
		foreach ( $d['bullets'] as $b ) {
			$o .= '<li>' . blrlp_icon( 'check', 18 ) . esc_html( $b['text'] ) . '</li>';
		}
		$o .= '</ul>';
	}
	$o .= blrlp_btn( $d['btn'], $d['url'], 'primary' ) . '</div><div class="blrlp-split__img blrlp-rv">';
	$o .= $d['image'] ? blrlp_img( $d['image'], $d['title'] ) : '<div class="blrlp-orb is-sm" aria-hidden="true"><i></i><i></i><span>' . blrlp_icon( 'layers', 54 ) . '</span></div>';
	return $o . '</div></div>';
}

function blrlp_r_steps( $d ) {
	$o = blrlp_head( $d ) . '<ol class="blrlp-steps">';
	foreach ( $d['items'] as $i ) {
		$o .= '<li class="blrlp-rv"><h3>' . esc_html( $i['title'] ) . '</h3><p>' . esc_html( $i['text'] ) . '</p></li>';
	}
	return $o . '</ol>';
}

function blrlp_r_pricing( $d ) {
	$o = blrlp_head( $d ) . '<div class="blrlp-grid blrlp-c' . min( 4, max( 1, count( $d['items'] ) ) ) . ' blrlp-plans">';
	foreach ( $d['items'] as $p ) {
		$o .= '<article class="blrlp-plan blrlp-rv' . ( $p['highlight'] ? ' is-hot' : '' ) . '">';
		if ( $p['badge'] ) {
			$o .= '<span class="blrlp-plan__badge">' . esc_html( $p['badge'] ) . '</span>';
		}
		$o .= '<h3>' . esc_html( $p['name'] ) . '</h3>' . ( $p['desc'] ? '<p class="blrlp-plan__desc">' . esc_html( $p['desc'] ) . '</p>' : '' );
		$o .= '<div class="blrlp-price"><b>' . esc_html( $p['price'] ) . '</b><small>' . esc_html( $p['period'] ) . '</small></div><ul>';
		foreach ( preg_split( '/\r\n|\r|\n/', (string) $p['features'] ) as $li ) {
			if ( '' !== trim( $li ) ) {
				$o .= '<li>' . blrlp_icon( 'check', 18 ) . esc_html( trim( $li ) ) . '</li>';
			}
		}
		$o .= '</ul>' . blrlp_btn( $p['btn'], $p['url'], $p['highlight'] ? 'primary' : 'ghost' ) . '</article>';
	}
	return $o . '</div>';
}

function blrlp_r_testimonials( $d ) {
	$o = blrlp_head( $d ) . '<div class="blrlp-grid blrlp-c3">';
	foreach ( $d['items'] as $i ) {
		$r  = max( 1, min( 5, (int) $i['rating'] ) );
		$o .= '<figure class="blrlp-quote blrlp-rv"><div class="blrlp-stars" aria-label="' . (int) $r . '/5">' . str_repeat( '★', $r ) . str_repeat( '☆', 5 - $r ) . '</div><blockquote>' . esc_html( $i['text'] ) . '</blockquote><figcaption>';
		$o .= $i['avatar'] ? blrlp_img( $i['avatar'], $i['name'], 'blrlp-av' ) : '<span class="blrlp-av blrlp-av--ph">' . esc_html( mb_substr( $i['name'], 0, 1 ) ) . '</span>';
		$o .= '<span><b>' . esc_html( $i['name'] ) . '</b><small>' . esc_html( $i['role'] ) . '</small></span></figcaption></figure>';
	}
	return $o . '</div>';
}

function blrlp_r_faq( $d ) {
	$o = blrlp_head( $d ) . '<div class="blrlp-faq">';
	foreach ( $d['items'] as $i ) {
		$o .= '<details class="blrlp-rv"><summary>' . esc_html( $i['q'] ) . '</summary><p>' . nl2br( esc_html( $i['a'] ) ) . '</p></details>';
	}
	return $o . '</div>';
}

function blrlp_r_cta( $d ) {
	return '<div class="blrlp-cta blrlp-rv"><h2>' . esc_html( $d['title'] ) . '</h2>' . ( $d['text'] ? '<p>' . esc_html( $d['text'] ) . '</p>' : '' ) . '<div class="blrlp-actions">' . blrlp_btn( $d['btn1'], $d['url1'], 'light lg' ) . blrlp_btn( $d['btn2'], $d['url2'], 'ghostlight lg' ) . '</div></div>';
}

function blrlp_r_form( $d, $ctx ) {
	$ts = time();
	$o  = '<div class="blrlp-formbox blrlp-rv"><div class="blrlp-formbox__txt"><h2>' . esc_html( $d['title'] ) . '</h2>' . ( $d['text'] ? '<p>' . esc_html( $d['text'] ) . '</p>' : '' ) . '</div>';
	$o .= '<form class="blrlp-form" data-blrlp-form data-success="' . esc_attr( $d['success'] ) . '" data-wa="' . esc_attr( preg_replace( '/\D/', '', (string) $d['wa'] ) ) . '" novalidate>';
	$o .= '<input type="hidden" name="landing" value="' . (int) $ctx['id'] . '"><input type="hidden" name="ts" value="' . (int) $ts . '"><input type="hidden" name="sig" value="' . esc_attr( blrlp_form_sig( $ctx['id'], $ts ) ) . '">';
	$o .= '<input type="text" name="website" class="blrlp-hp" tabindex="-1" autocomplete="off" aria-hidden="true">';
	if ( $d['name'] ) {
		$o .= '<label><span>' . esc_html__( 'الاسم', 'blr-landing-pro' ) . '</span><input type="text" name="name" required maxlength="120" autocomplete="name"></label>';
	}
	$o .= '<label><span>' . esc_html__( 'البريد الإلكتروني', 'blr-landing-pro' ) . '</span><input type="email" name="email" required maxlength="190" autocomplete="email" dir="ltr"></label>';
	if ( $d['phone'] ) {
		$o .= '<label><span>' . esc_html__( 'الهاتف', 'blr-landing-pro' ) . '</span><input type="tel" name="phone" maxlength="40" autocomplete="tel" dir="ltr"></label>';
	}
	if ( $d['message'] ) {
		$o .= '<label><span>' . esc_html__( 'رسالتك', 'blr-landing-pro' ) . '</span><textarea name="message" rows="3" maxlength="1500"></textarea></label>';
	}
	if ( $d['consent'] ) {
		$o .= '<label class="blrlp-consent"><input type="checkbox" name="consent" value="1" required><span>' . esc_html( $d['consent'] ) . '</span></label>';
	}
	$o .= '<button type="submit" class="blrlp-btn blrlp-btn--primary lg">' . esc_html( $d['btn'] ) . '</button><p class="blrlp-form__msg" role="status" aria-live="polite"></p></form></div>';
	return $o;
}

function blrlp_video_embed( $url ) {
	$url = (string) $url;
	if ( preg_match( '~(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([A-Za-z0-9_\-]{11})~', $url, $m ) ) {
		return array( 'embed', 'https://www.youtube-nocookie.com/embed/' . $m[1] . '?autoplay=1&rel=0' );
	}
	if ( preg_match( '~vimeo\.com/(?:video/)?(\d+)~', $url, $m ) ) {
		return array( 'embed', 'https://player.vimeo.com/video/' . $m[1] . '?autoplay=1' );
	}
	if ( preg_match( '~\.(mp4|webm|ogg)(\?.*)?$~i', $url ) ) {
		return array( 'file', $url );
	}
	return array( '', '' );
}

function blrlp_r_video( $d ) {
	$o = blrlp_head( $d );
	list( $kind, $src ) = blrlp_video_embed( $d['url'] );
	$o .= '<div class="blrlp-video blrlp-rv">';
	if ( 'file' === $kind ) {
		$o .= '<video controls preload="none" playsinline' . ( $d['poster'] ? ' poster="' . esc_url( $d['poster'] ) . '"' : '' ) . ' src="' . esc_url( $src ) . '"></video>';
	} elseif ( 'embed' === $kind ) {
		$o .= '<button type="button" class="blrlp-video__play" data-embed="' . esc_url( $src ) . '" aria-label="' . esc_attr__( 'تشغيل الفيديو', 'blr-landing-pro' ) . '">' . ( $d['poster'] ? blrlp_img( $d['poster'], $d['title'] ) : '' ) . '<span>' . blrlp_icon( 'play', 34 ) . '</span></button>';
	}
	return $o . '</div>';
}

function blrlp_r_countdown( $d ) {
	$end = 0;
	if ( $d['end'] ) {
		try {
			$dt  = new DateTime( $d['end'], wp_timezone() );
			$end = $dt->getTimestamp();
		} catch ( Exception $e ) {
			$end = 0;
		}
	}
	$o = '<div class="blrlp-countbox blrlp-rv"><h2>' . esc_html( $d['title'] ) . '</h2>' . ( $d['text'] ? '<p>' . esc_html( $d['text'] ) . '</p>' : '' );
	$o .= '<div class="blrlp-count" data-end="' . (int) $end . '" data-evergreen="' . (float) $d['evergreen'] . '"></div>' . blrlp_btn( $d['btn'], $d['url'], 'primary lg' ) . '</div>';
	return $o;
}

function blrlp_r_gallery( $d ) {
	$o = ( $d['title'] ? '<header class="blrlp-head blrlp-rv"><h2>' . esc_html( $d['title'] ) . '</h2></header>' : '' ) . '<div class="blrlp-gal">';
	foreach ( $d['items'] as $i ) {
		if ( $i['image'] ) {
			$o .= '<figure class="blrlp-rv">' . blrlp_img( $i['image'], $i['caption'] ) . ( $i['caption'] ? '<figcaption>' . esc_html( $i['caption'] ) . '</figcaption>' : '' ) . '</figure>';
		}
	}
	return $o . '</div>';
}

function blrlp_r_products( $d ) {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return current_user_can( 'edit_posts' ) ? '<p class="blrlp-note">' . esc_html__( 'فعّل ووكومرس لعرض المنتجات.', 'blr-landing-pro' ) . '</p>' : '';
	}
	$args = array( 'status' => 'publish', 'limit' => max( 1, min( 12, (int) $d['limit'] ) ) );
	$ids  = array_filter( array_map( 'absint', explode( ',', (string) $d['ids'] ) ) );
	if ( $ids ) {
		$args['include'] = $ids;
	} elseif ( $d['category'] ) {
		$args['category'] = array( sanitize_title( $d['category'] ) );
	}
	$o = blrlp_head( $d ) . '<div class="blrlp-grid blrlp-c4 blrlp-products">';
	foreach ( wc_get_products( $args ) as $p ) {
		$o .= '<article class="blrlp-card blrlp-prod blrlp-rv"><a href="' . esc_url( $p->get_permalink() ) . '" class="blrlp-prod__img">' . wp_kses_post( $p->get_image( 'woocommerce_thumbnail' ) ) . '</a><h3><a href="' . esc_url( $p->get_permalink() ) . '">' . esc_html( $p->get_name() ) . '</a></h3><div class="blrlp-prod__price">' . wp_kses_post( $p->get_price_html() ) . '</div>';
		$o .= '<a class="blrlp-btn blrlp-btn--primary" data-blrlp-cta href="' . esc_url( $p->is_purchasable() && $p->is_type( 'simple' ) ? $p->add_to_cart_url() : $p->get_permalink() ) . '">' . esc_html( $p->add_to_cart_text() ) . '</a></article>';
	}
	return $o . '</div>';
}

function blrlp_r_text( $d ) {
	return '<div class="blrlp-prose blrlp-rv">' . wp_kses_post( $d['html'] ) . '</div>';
}

/* ---------------------------- الصفحة ---------------------------- */

/** غلاف قسم + المحتوى. */
function blrlp_render_section( $sec, $ctx ) {
	if ( empty( $sec['on'] ) ) {
		return '';
	}
	$fn = 'blrlp_r_' . $sec['id'];
	if ( ! function_exists( $fn ) || ! isset( blrlp_sections()[ $sec['id'] ] ) ) {
		return '';
	}
	$d  = array_merge( blrlp_section_defaults( $sec['id'] ), isset( $sec['data'] ) && is_array( $sec['data'] ) ? $sec['data'] : array() );
	$st = array_merge( blrlp_style_defaults(), isset( $sec['style'] ) && is_array( $sec['style'] ) ? $sec['style'] : array() );
	$bg = $st['bg'];
	if ( 'cta' === $sec['id'] ) {
		$bg = 'cta';
	} elseif ( 'hero' === $sec['id'] && 'default' === $bg ) {
		$bg = 'hero';
	}
	$cls = 'blrlp-sec blrlp-s-' . $sec['id'] . ' blrlp-bg-' . $bg . ' blrlp-pad-' . $st['pad'] . ( 'center' === $st['align'] ? ' is-center' : '' ) . ( $st['hide'] ? ' blrlp-hide-' . $st['hide'] : '' );
	$id  = $st['anchor'] ? ' id="' . esc_attr( $st['anchor'] ) . '"' : ( in_array( $sec['id'], array( 'features', 'pricing', 'faq', 'cta', 'steps' ), true ) ? ' id="' . esc_attr( 'cta' === $sec['id'] ? 'cta' : $sec['id'] ) . '"' : '' );
	$inner = call_user_func( $fn, $d, $ctx );
	return '<section' . $id . ' class="' . esc_attr( $cls ) . '" data-sec="' . esc_attr( $sec['id'] ) . '" data-uid="' . esc_attr( isset( $sec['uid'] ) ? $sec['uid'] : '' ) . '"><div class="blrlp-wrap">' . $inner . '</div></section>'; // phpcs:ignore
}

/**
 * يعرض صفحة هبوط كاملة (بدون html/head).
 *
 * @param array $opts embed(bool) preview(bool).
 */
function blrlp_render_page( $post_id, $data = null, $opts = array() ) {
	$opts = array_merge( array( 'embed' => false, 'preview' => false ), $opts );
	$data = $data ? $data : blrlp_get_data( $post_id );
	$des  = $data['design'];
	$vars = blrlp_css_vars( $des );
	$ctx  = array( 'id' => (int) $post_id, 'preview' => $opts['preview'] );

	$cls = 'blrlp' . ( $vars['dark'] ? ' blrlp--dark' : '' ) . ( $des['anim'] ? ' blrlp--anim' : '' ) . ( $opts['embed'] ? ' is-embed' : '' );
	$o   = '<div class="' . esc_attr( $cls ) . '" style="' . esc_attr( $vars['css'] ) . '" data-blrlp-id="' . (int) $post_id . '"' . ( $opts['preview'] ? ' data-preview="1"' : '' ) . '>';

	if ( ! empty( $des['announce']['on'] ) && $des['announce']['text'] ) {
		$t  = esc_html( $des['announce']['text'] );
		$o .= '<div class="blrlp-announce">' . ( $des['announce']['url'] ? '<a href="' . esc_attr( $des['announce']['url'] ) . '" data-blrlp-cta>' . $t . '</a>' : $t ) . '</div>';
	}
	foreach ( $data['sections'] as $sec ) {
		$o .= blrlp_render_section( $sec, $ctx );
	}
	if ( ! empty( $des['sticky']['on'] ) && $des['sticky']['btn'] ) {
		$o .= '<div class="blrlp-sticky" hidden><span>' . esc_html( $des['sticky']['text'] ) . '</span>' . blrlp_btn( $des['sticky']['btn'], $des['sticky']['url'], 'primary' ) . '</div>';
	}
	if ( ! empty( $des['exit']['on'] ) && $des['exit']['title'] ) {
		$o .= '<div class="blrlp-exit" hidden role="dialog" aria-modal="true"><div class="blrlp-exit__box"><button type="button" class="blrlp-exit__x" aria-label="' . esc_attr__( 'إغلاق', 'blr-landing-pro' ) . '">×</button><h3>' . esc_html( $des['exit']['title'] ) . '</h3><p>' . esc_html( $des['exit']['text'] ) . '</p>' . blrlp_btn( $des['exit']['btn'], $des['exit']['url'], 'primary lg' ) . '</div></div>';
	}
	if ( $des['wa'] ) {
		$o .= '<a class="blrlp-wa" href="' . esc_url( 'https://wa.me/' . $des['wa'] ) . '" target="_blank" rel="noopener" data-blrlp-cta aria-label="WhatsApp">' . blrlp_icon( 'whatsapp', 28 ) . '</a>';
	}
	if ( ! blrlp_is_pro() && ! $opts['embed'] ) {
		$o .= '<p class="blrlp-credit"><a href="https://baderinfo.com/blr-landing-pro" target="_blank" rel="noopener">' . esc_html__( 'صُنعت بواسطة BLR Landing Pro', 'blr-landing-pro' ) . '</a></p>';
	}
	return $o . '</div>';
}

/** بيانات منظّمة: FAQPage + WebPage. */
function blrlp_schema( $post_id, $data ) {
	$graph = array( array( '@type' => 'WebPage', 'name' => get_the_title( $post_id ), 'url' => get_permalink( $post_id ) ) );
	$qa    = array();
	foreach ( $data['sections'] as $s ) {
		if ( 'faq' === $s['id'] && ! empty( $s['on'] ) ) {
			foreach ( isset( $s['data']['items'] ) ? $s['data']['items'] : array() as $i ) {
				if ( ! empty( $i['q'] ) ) {
					$qa[] = array( '@type' => 'Question', 'name' => $i['q'], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $i['a'] ) );
				}
			}
		}
	}
	if ( $qa ) {
		$graph[] = array( '@type' => 'FAQPage', 'mainEntity' => $qa );
	}
	return '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>';
}

/** روابط الخط والأنماط. */
function blrlp_font_link( $data ) {
	if ( 'system' === $data['design']['font'] ) {
		return '';
	}
	return '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap">';
}

/* ---------------------------- شورتكود + كتلة ---------------------------- */
function blrlp_enqueue_front() {
	wp_enqueue_style( 'blrlp-front', BLRLP_URL . 'assets/css/front.css', array(), blrlp_ver( 'assets/css/front.css' ) );
	wp_enqueue_script( 'blrlp-front', BLRLP_URL . 'assets/js/front.js', array(), blrlp_ver( 'assets/js/front.js' ), array( 'strategy' => 'defer', 'in_footer' => true ) );
	wp_localize_script( 'blrlp-front', 'BLRLP', array(
		'rest' => esc_url_raw( rest_url( 'blrlp/v1/' ) ),
		'i18n' => array(
			'sending' => __( 'جارٍ الإرسال…', 'blr-landing-pro' ),
			'error'   => __( 'تعذّر الإرسال، حاول مجدداً.', 'blr-landing-pro' ),
			'invalid' => __( 'تحقّق من الحقول المطلوبة.', 'blr-landing-pro' ),
			'd'       => __( 'يوم', 'blr-landing-pro' ),
			'h'       => __( 'ساعة', 'blr-landing-pro' ),
			'm'       => __( 'دقيقة', 'blr-landing-pro' ),
			's'       => __( 'ثانية', 'blr-landing-pro' ),
		),
	) );
}

function blrlp_embed( $id ) {
	$id = absint( $id );
	if ( ! $id || 'blr_landing' !== get_post_type( $id ) || 'publish' !== get_post_status( $id ) ) {
		return current_user_can( 'edit_posts' ) ? '<p><em>BLR Landing: صفحة غير موجودة أو غير منشورة.</em></p>' : '';
	}
	blrlp_enqueue_front();
	$data = blrlp_get_data( $id );
	if ( 'system' !== $data['design']['font'] ) {
		add_action( 'wp_footer', function () use ( $data ) {
			echo blrlp_font_link( $data ); // phpcs:ignore
		} );
	}
	return blrlp_render_page( $id, $data, array( 'embed' => true ) );
}

add_shortcode( 'blr_landing', function ( $a ) {
	$a = shortcode_atts( array( 'id' => 0 ), $a );
	return blrlp_embed( $a['id'] );
} );

add_action( 'init', function () {
	register_block_type( 'blrlp/landing', array(
		'api_version'     => 3,
		'attributes'      => array( 'id' => array( 'type' => 'number', 'default' => 0 ) ),
		'render_callback' => function ( $a ) {
			return blrlp_embed( isset( $a['id'] ) ? $a['id'] : 0 );
		},
	) );
} );
