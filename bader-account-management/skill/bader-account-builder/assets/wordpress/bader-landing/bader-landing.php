<?php
/**
 * Plugin Name:       Bader Landing — صفحة بيع Template App
 * Description:       صفحة إعلانية احترافية متعددة اللغات (العربية / English / Français) لبيع برنامج Template App. أضف الرمز القصير [bader_landing] لأي صفحة، وعدّل السعر ومعلومات الاتصال من الإعدادات.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Baderinfo
 * Author URI:        https://baderinfo.com
 * License:           GPL-2.0-or-later
 * Text Domain:       bader-landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BAL_VERSION', '1.0.0' );
define( 'BAL_DIR', plugin_dir_path( __FILE__ ) );
define( 'BAL_URL', plugin_dir_url( __FILE__ ) );
define( 'BAL_OPTION', 'bal_settings' );

/* ------------------------------------------------------------------ settings */

function bal_defaults() {
	return array(
		'price_amount'   => '49',
		'price_old'      => '79',
		'price_currency' => 'USD',
		'price_period'   => 'once',
		'price_badge_ar' => 'عرض الإطلاق',
		'price_badge_en' => 'Launch offer',
		'price_badge_fr' => 'Offre de lancement',
		'trial_enabled'  => '1',
		'trial_days'     => '2',
		'trial_url'      => '',
		'buy_url'        => 'https://baderinfo.com/',
		'download_url'   => '',
		'email'          => 'template@example.com',
		'phone'          => '0000000000',
		'whatsapp'       => '0000000000',
		'telegram'       => '',
		'website'        => 'https://baderinfo.com',
		'address_ar'     => '',
		'address_en'     => '',
		'address_fr'     => '',
		'brand_color'    => '#0ea5e9',
		'default_lang'   => 'auto',
		'full_width'     => '0',
		'hero_title_ar'  => '', 'hero_title_en' => '', 'hero_title_fr' => '',
		'hero_text_ar'   => '', 'hero_text_en'  => '', 'hero_text_fr'  => '',
	);
}

function bal_settings() {
	$saved = get_option( BAL_OPTION, array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), bal_defaults() );
}

function bal_sanitize( $in ) {
	$d   = bal_defaults();
	$out = array();
	$in  = is_array( $in ) ? $in : array();
	foreach ( $d as $key => $default ) {
		$v = isset( $in[ $key ] ) ? wp_unslash( $in[ $key ] ) : '';
		switch ( $key ) {
			case 'price_amount':
			case 'price_old':
				$v = preg_replace( '/[^0-9.]/', '', (string) $v );
				break;
			case 'price_currency':
				$v = strtoupper( preg_replace( '/[^A-Za-z]/', '', (string) $v ) );
				$v = substr( $v, 0, 5 );
				break;
			case 'price_period':
				$v = in_array( $v, array( 'once', 'year', 'month' ), true ) ? $v : 'once';
				break;
			case 'trial_enabled':
			case 'full_width':
				$v = empty( $v ) ? '0' : '1';
				break;
			case 'trial_days':
				$v = (string) max( 1, min( 60, (int) $v ) );
				break;
			case 'trial_url':
			case 'buy_url':
			case 'download_url':
			case 'website':
				$v = esc_url_raw( trim( (string) $v ) );
				break;
			case 'email':
				$v = sanitize_email( $v );
				break;
			case 'whatsapp':
				$v = preg_replace( '/\D/', '', (string) $v );
				break;
			case 'telegram':
				$v = preg_replace( '/[^A-Za-z0-9_]/', '', ltrim( (string) $v, '@' ) );
				break;
			case 'phone':
				$v = preg_replace( '/[^0-9+\s().-]/', '', (string) $v );
				break;
			case 'brand_color':
				$v = sanitize_hex_color( $v ) ?: $default;
				break;
			case 'default_lang':
				$v = in_array( $v, array( 'auto', 'ar', 'en', 'fr' ), true ) ? $v : 'auto';
				break;
			case 'hero_text_ar':
			case 'hero_text_en':
			case 'hero_text_fr':
				$v = sanitize_textarea_field( $v );
				break;
			default:
				$v = sanitize_text_field( $v );
		}
		$out[ $key ] = $v;
	}
	return $out;
}

add_action( 'admin_init', function () {
	register_setting( 'bal_group', BAL_OPTION, array( 'type' => 'array', 'sanitize_callback' => 'bal_sanitize', 'default' => bal_defaults() ) );
} );

add_action( 'admin_menu', function () {
	add_options_page( 'Bader Landing', 'Bader Landing', 'manage_options', 'bader-landing', 'bal_admin_page' );
} );

add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), function ( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=bader-landing' ) ) . '">الإعدادات</a>' );
	return $links;
} );

function bal_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s = bal_settings();

	$field = function ( $key, $label, $type = 'text', $hint = '', $extra = '' ) use ( $s ) {
		$name = BAL_OPTION . '[' . $key . ']';
		echo '<tr><th scope="row"><label for="bal_' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( 'checkbox' === $type ) {
			echo '<label><input type="checkbox" id="bal_' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" value="1" ' . checked( $s[ $key ], '1', false ) . '> ' . esc_html( $hint ) . '</label>';
			$hint = '';
		} elseif ( 'textarea' === $type ) {
			echo '<textarea id="bal_' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" rows="3" class="large-text">' . esc_textarea( $s[ $key ] ) . '</textarea>';
		} else {
			echo '<input type="' . esc_attr( $type ) . '" id="bal_' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $s[ $key ] ) . '" class="regular-text" ' . $extra . '>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		if ( $hint ) {
			echo '<p class="description">' . esc_html( $hint ) . '</p>';
		}
		echo '</td></tr>';
	};
	?>
	<div class="wrap" dir="rtl" style="text-align:right">
		<h1>Bader Landing — صفحة بيع البرنامج</h1>
		<p>أنشئ صفحة جديدة وأضف إليها الرمز القصير: <code>[bader_landing]</code> — أو بلغة محددة: <code>[bader_landing lang="en"]</code>.</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'bal_group' ); ?>

			<h2>السعر</h2>
			<table class="form-table" role="presentation">
				<?php
				$field( 'price_amount', 'السعر الحالي', 'text', 'مثال: 49' );
				$field( 'price_old', 'السعر قبل الخصم', 'text', 'اتركه فارغاً أو 0 لإخفائه' );
				$field( 'price_currency', 'رمز العملة', 'text', 'USD أو EUR أو DZD أو SAR أو MAD أو EGP أو AED...' );
				?>
				<tr><th scope="row"><label for="bal_price_period">نوع الدفع</label></th><td>
					<select id="bal_price_period" name="<?php echo esc_attr( BAL_OPTION ); ?>[price_period]">
						<option value="once" <?php selected( $s['price_period'], 'once' ); ?>>دفعة واحدة (مدى الحياة)</option>
						<option value="year" <?php selected( $s['price_period'], 'year' ); ?>>سنوي</option>
						<option value="month" <?php selected( $s['price_period'], 'month' ); ?>>شهري</option>
					</select></td></tr>
				<?php
				$field( 'price_badge_ar', 'شارة العرض (عربي)' );
				$field( 'price_badge_en', 'شارة العرض (English)' );
				$field( 'price_badge_fr', 'شارة العرض (Français)' );
				?>
			</table>

			<h2>النسخة التجريبية والروابط</h2>
			<table class="form-table" role="presentation">
				<?php
				$field( 'trial_enabled', 'إظهار زر التجربة', 'checkbox', 'إظهار "جرّب مجاناً" في الصفحة' );
				$field( 'trial_days', 'مدة التجربة (أيام)', 'number', '', 'min="1" max="60"' );
				$field( 'trial_url', 'رابط طلب التجربة', 'url', 'اختياري. إن تُرك فارغاً يُستعمل واتساب ثم البريد.' );
				$field( 'buy_url', 'رابط الشراء', 'url', 'صفحة الدفع أو الطلب' );
				$field( 'download_url', 'رابط التحميل', 'url', 'اختياري. إن تُرك فارغاً يُخفى زر التحميل.' );
				?>
			</table>

			<h2>معلومات الاتصال</h2>
			<p class="description">أي حقل تتركه فارغاً لا يظهر في الصفحة.</p>
			<table class="form-table" role="presentation">
				<?php
				$field( 'email', 'البريد الإلكتروني', 'email' );
				$field( 'phone', 'الهاتف', 'text', 'مثال: +213 555 00 00 00' );
				$field( 'whatsapp', 'واتساب', 'text', 'أرقام فقط مع رمز الدولة، مثال: 213555000000' );
				$field( 'telegram', 'تيليجرام', 'text', 'اسم المستخدم بدون @' );
				$field( 'website', 'الموقع', 'url' );
				$field( 'address_ar', 'العنوان (عربي)' );
				$field( 'address_en', 'العنوان (English)' );
				$field( 'address_fr', 'العنوان (Français)' );
				?>
			</table>

			<h2>المظهر واللغة</h2>
			<table class="form-table" role="presentation">
				<?php $field( 'brand_color', 'اللون الرئيسي', 'color' ); ?>
				<tr><th scope="row"><label for="bal_default_lang">اللغة الافتراضية</label></th><td>
					<select id="bal_default_lang" name="<?php echo esc_attr( BAL_OPTION ); ?>[default_lang]">
						<option value="auto" <?php selected( $s['default_lang'], 'auto' ); ?>>تلقائي (حسب لغة الموقع)</option>
						<option value="ar" <?php selected( $s['default_lang'], 'ar' ); ?>>العربية</option>
						<option value="en" <?php selected( $s['default_lang'], 'en' ); ?>>English</option>
						<option value="fr" <?php selected( $s['default_lang'], 'fr' ); ?>>Français</option>
					</select>
					<p class="description">يستطيع الزائر تغيير اللغة من أزرار الصفحة، ويتذكر المتصفح اختياره.</p></td></tr>
				<?php $field( 'full_width', 'عرض كامل', 'checkbox', 'تمديد الصفحة لعرض الشاشة (يعمل أفضل مع قالب "عرض كامل" في قالبك)' ); ?>
			</table>

			<h2>تخصيص النصوص الرئيسية (اختياري)</h2>
			<p class="description">اتركها فارغة لاستعمال النص الجاهز. باقي النصوص في الملف <code>includes/strings.php</code>.</p>
			<table class="form-table" role="presentation">
				<?php
				$field( 'hero_title_ar', 'العنوان الرئيسي (عربي)' );
				$field( 'hero_text_ar', 'الوصف (عربي)', 'textarea' );
				$field( 'hero_title_en', 'Main title (English)' );
				$field( 'hero_text_en', 'Description (English)', 'textarea' );
				$field( 'hero_title_fr', 'Titre principal (Français)' );
				$field( 'hero_text_fr', 'Description (Français)', 'textarea' );
				?>
			</table>

			<?php submit_button( 'حفظ التغييرات' ); ?>
		</form>
	</div>
	<?php
}

/* ------------------------------------------------------------------ helpers */

function bal_strings() {
	static $strings = null;
	if ( null === $strings ) {
		$strings = require BAL_DIR . 'includes/strings.php';
	}
	return $strings;
}

/** Trial length as text, e.g. "يومين" / "2 days". */
function bal_days_text( $days, $lang ) {
	$S = bal_strings();
	$d = $S[ $lang ]['days'];
	if ( 1 === $days ) {
		return $d['one'];
	}
	if ( 2 === $days ) {
		return $d['two'];
	}
	if ( 'ar' === $lang ) {
		return sprintf( ( $days >= 3 && $days <= 10 ) ? $d['few'] : $d['many'], $days );
	}
	return sprintf( $d['few'], $days );
}

function bal_price_text( $s, $lang ) {
	$amount = (float) $s['price_amount'];
	$cur    = $s['price_currency'];
	$names  = array(
		'ar' => array( 'DZD' => 'دج', 'SAR' => 'ر.س', 'AED' => 'د.إ', 'EGP' => 'ج.م', 'MAD' => 'د.م', 'TND' => 'د.ت', 'KWD' => 'د.ك', 'QAR' => 'ر.ق', 'JOD' => 'د.أ', 'LYD' => 'د.ل', 'IQD' => 'د.ع' ),
		'en' => array(),
		'fr' => array( 'DZD' => 'DA', 'MAD' => 'MAD', 'TND' => 'DT' ),
	);
	$prefix = array( 'USD' => '$', 'EUR' => '€', 'GBP' => '£' );
	$fmt    = function ( $n ) use ( $cur, $names, $prefix, $lang ) {
		$num = ( floor( $n ) == $n ) ? number_format( $n, 0, '.', 'fr' === $lang ? ' ' : ',' ) : number_format( $n, 2, 'fr' === $lang ? ',' : '.', 'fr' === $lang ? ' ' : ',' );
		if ( isset( $prefix[ $cur ] ) ) {
			return 'fr' === $lang ? $num . ' ' . $prefix[ $cur ] : $prefix[ $cur ] . $num;
		}
		$label = isset( $names[ $lang ][ $cur ] ) ? $names[ $lang ][ $cur ] : $cur;
		return $num . ' ' . $label;
	};
	$old = (float) $s['price_old'];
	return array(
		'now' => $fmt( $amount ),
		'old' => ( $old > $amount ) ? $fmt( $old ) : '',
	);
}

/** Flat dictionary of every translatable string of one language. */
function bal_dict( $lang, $s ) {
	$S   = bal_strings();
	$T   = $S[ $lang ];
	$day = bal_days_text( (int) $s['trial_days'], $lang );
	$out = array();
	$walk = function ( $node, $prefix ) use ( &$walk, &$out, $day ) {
		foreach ( $node as $k => $v ) {
			$key = '' === $prefix ? (string) $k : $prefix . '.' . $k;
			if ( is_array( $v ) ) {
				$walk( $v, $key );
			} else {
				$out[ $key ] = str_replace( '{days}', $day, (string) $v );
			}
		}
	};
	$walk( $T, '' );

	if ( '' !== trim( $s[ 'hero_title_' . $lang ] ) ) {
		$out['hero.title'] = $s[ 'hero_title_' . $lang ];
	}
	if ( '' !== trim( $s[ 'hero_text_' . $lang ] ) ) {
		$out['hero.text'] = $s[ 'hero_text_' . $lang ];
	}

	$p                = bal_price_text( $s, $lang );
	$out['price.now'] = $p['now'];
	$out['price.old'] = $p['old'];
	$out['price.per'] = $T['pricing'][ 'once' === $s['price_period'] ? 'once' : $s['price_period'] ];
	$out['price.badge'] = $s[ 'price_badge_' . $lang ];
	$out['contact.addressValue'] = $s[ 'address_' . $lang ];
	return $out;
}

function bal_detect_lang( $s, $atts_lang ) {
	$allowed = array( 'ar', 'en', 'fr' );
	if ( in_array( $atts_lang, $allowed, true ) ) {
		return $atts_lang;
	}
	if ( isset( $_GET['bal_lang'] ) && in_array( $_GET['bal_lang'], $allowed, true ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return $_GET['bal_lang']; // phpcs:ignore
	}
	if ( in_array( $s['default_lang'], $allowed, true ) ) {
		return $s['default_lang'];
	}
	$loc = strtolower( substr( determine_locale(), 0, 2 ) );
	return in_array( $loc, $allowed, true ) ? $loc : 'ar';
}

/* ------------------------------------------------------------------ shortcode */

add_shortcode( 'bader_landing', 'bal_shortcode' );

function bal_shortcode( $atts ) {
	$atts = shortcode_atts( array( 'lang' => '' ), $atts, 'bader_landing' );
	$s    = bal_settings();
	$S    = bal_strings();
	$lang = bal_detect_lang( $s, $atts['lang'] );

	wp_enqueue_style( 'bader-landing', BAL_URL . 'assets/landing.css', array(), BAL_VERSION );
	wp_enqueue_script( 'bader-landing', BAL_URL . 'assets/landing.js', array(), BAL_VERSION, true );

	$dicts = array();
	foreach ( array_keys( $S ) as $l ) {
		$dicts[ $l ] = bal_dict( $l, $s );
	}
	$D = $dicts[ $lang ];

	// text with data-i so the language switcher can translate it without reloading
	$t  = function ( $key ) use ( $D ) {
		return isset( $D[ $key ] ) ? $D[ $key ] : '';
	};
	$e  = function ( $tag, $key, $class = '', $extra = '' ) use ( $t ) {
		return '<' . $tag . ( $class ? ' class="' . esc_attr( $class ) . '"' : '' ) . ' data-i="' . esc_attr( $key ) . '"' . $extra . '>' . esc_html( $t( $key ) ) . '</' . $tag . '>'; // phpcs:ignore
	};

	// links
	$buy      = $s['buy_url'];
	$trial    = '';
	if ( '1' === $s['trial_enabled'] ) {
		if ( $s['trial_url'] ) {
			$trial = $s['trial_url'];
		} elseif ( $s['whatsapp'] ) {
			$trial = 'https://wa.me/' . $s['whatsapp'];
		} elseif ( $s['email'] ) {
			$trial = 'mailto:' . $s['email'] . '?subject=' . rawurlencode( 'Trial / تجربة / Essai — Template App' );
		}
	}
	$download = $s['download_url'];

	$btn = function ( $href, $key, $class ) use ( $e ) {
		return $href ? '<a class="bal-btn ' . esc_attr( $class ) . '" href="' . esc_url( $href ) . '" rel="noopener">' . $e( 'span', $key ) . '</a>' : '';
	};

	$style = '--bal:' . esc_attr( $s['brand_color'] ) . ';';
	$wrap  = 'bal' . ( '1' === $s['full_width'] ? ' bal--full' : '' );

	ob_start();
	?>
<div class="<?php echo esc_attr( $wrap ); ?>" id="bal-top" lang="<?php echo esc_attr( $lang ); ?>" dir="<?php echo esc_attr( $S[ $lang ]['dir'] ); ?>" style="<?php echo esc_attr( $style ); ?>" data-lang="<?php echo esc_attr( $lang ); ?>">

	<header class="bal-bar">
		<div class="bal-wrap bal-bar__in">
			<a class="bal-logo" href="#bal-top"><img src="<?php echo esc_url( BAL_URL . 'assets/logo.png' ); ?>" alt="" width="34" height="34"><span>Template App</span></a>
			<nav class="bal-nav" aria-label="Sections">
				<?php foreach ( array( 'features', 'security', 'ai', 'pricing', 'faq', 'contact' ) as $n ) : ?>
					<a href="#bal-<?php echo esc_attr( $n ); ?>" data-i="nav.<?php echo esc_attr( $n ); ?>"><?php echo esc_html( $t( 'nav.' . $n ) ); ?></a>
				<?php endforeach; ?>
			</nav>
			<div class="bal-lang" role="group" aria-label="Language">
				<?php foreach ( $S as $code => $row ) : ?>
					<button type="button" data-set-lang="<?php echo esc_attr( $code ); ?>" class="<?php echo $code === $lang ? 'is-on' : ''; ?>"><?php echo esc_html( $row['name'] ); ?></button>
				<?php endforeach; ?>
			</div>
		</div>
	</header>

	<section class="bal-hero">
		<div class="bal-wrap">
			<?php echo $e( 'span', 'hero.badge', 'bal-pill' ); // phpcs:ignore ?>
			<?php echo $e( 'h1', 'hero.title' ); // phpcs:ignore ?>
			<?php echo $e( 'p', 'hero.text', 'bal-lead' ); // phpcs:ignore ?>
			<div class="bal-cta">
				<?php
				echo $btn( $buy, 'hero.buy', 'bal-btn--primary' ); // phpcs:ignore
				echo $btn( $trial, 'hero.trial', 'bal-btn--accent' ); // phpcs:ignore
				echo $btn( $download, 'hero.download', 'bal-btn--ghost' ); // phpcs:ignore
				?>
				<a class="bal-btn bal-btn--ghost" href="#bal-features"><span data-i="hero.more"><?php echo esc_html( $t( 'hero.more' ) ); ?></span></a>
			</div>
			<ul class="bal-trust">
				<?php foreach ( $S[ $lang ]['trust'] as $i => $_ ) : ?>
					<li data-i="trust.<?php echo (int) $i; ?>"><?php echo esc_html( $t( 'trust.' . $i ) ); ?></li>
				<?php endforeach; ?>
			</ul>
		</div>
	</section>

	<section class="bal-sec" id="bal-why">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'why.title' ); echo $e( 'p', 'why.sub', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-grid bal-grid--3">
				<?php foreach ( $S[ $lang ]['why']['items'] as $i => $it ) : ?>
					<div class="bal-card">
						<div class="bal-ic"><?php echo esc_html( $it[0] ); ?></div>
						<?php echo $e( 'h3', "why.items.$i.1" ); echo $e( 'p', "why.items.$i.2" ); // phpcs:ignore ?>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="bal-sec bal-sec--alt" id="bal-features">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'features.title' ); echo $e( 'p', 'features.sub', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-grid bal-grid--4">
				<?php foreach ( $S[ $lang ]['features']['items'] as $i => $it ) : ?>
					<div class="bal-card">
						<div class="bal-ic"><?php echo esc_html( $it[0] ); ?></div>
						<?php echo $e( 'h3', "features.items.$i.1" ); echo $e( 'p', "features.items.$i.2" ); // phpcs:ignore ?>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="bal-sec bal-dark" id="bal-security">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'security.title' ); echo $e( 'p', 'security.sub', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-grid bal-grid--4">
				<?php foreach ( $S[ $lang ]['security']['items'] as $i => $it ) : ?>
					<div class="bal-card">
						<div class="bal-ic">🔒</div>
						<?php echo $e( 'h3', "security.items.$i.0" ); echo $e( 'p', "security.items.$i.1" ); // phpcs:ignore ?>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="bal-sec" id="bal-ai">
		<div class="bal-wrap bal-split">
			<div>
				<?php echo $e( 'h2', 'ai.title', 'bal-left' ); echo $e( 'p', 'ai.text', 'bal-muted' ); // phpcs:ignore ?>
				<ul class="bal-checks">
					<?php foreach ( $S[ $lang ]['ai']['items'] as $i => $_ ) : ?>
						<li data-i="ai.items.<?php echo (int) $i; ?>"><?php echo esc_html( $t( 'ai.items.' . $i ) ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<div class="bal-mock" aria-hidden="true">
				<div class="bal-score"><b>92</b></div>
				<?php echo $e( 'div', 'ai.card', 'bal-mock__t' ); // phpcs:ignore ?>
				<div class="bal-bars"><i style="--w:92%"></i><i style="--w:70%"></i><i style="--w:84%"></i></div>
			</div>
		</div>
	</section>

	<section class="bal-sec bal-sec--alt" id="bal-steps">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'steps.title' ); echo $e( 'p', 'steps.sub', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-grid bal-grid--3">
				<?php foreach ( $S[ $lang ]['steps']['items'] as $i => $it ) : ?>
					<div class="bal-card bal-step">
						<div class="bal-num"><?php echo esc_html( $it[0] ); ?></div>
						<?php echo $e( 'h3', "steps.items.$i.1" ); echo $e( 'p', "steps.items.$i.2" ); // phpcs:ignore ?>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="bal-sec" id="bal-pricing">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'pricing.title' ); echo $e( 'p', 'pricing.sub', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-card bal-price">
				<?php if ( $t( 'price.badge' ) ) : ?>
					<?php echo $e( 'span', 'price.badge', 'bal-badge' ); // phpcs:ignore ?>
				<?php endif; ?>
				<div class="bal-amount">
					<?php if ( $t( 'price.old' ) ) : ?>
						<?php echo $e( 'span', 'price.old', 'bal-old' ); // phpcs:ignore ?>
					<?php endif; ?>
					<?php echo $e( 'span', 'price.now', 'bal-now' ); // phpcs:ignore ?>
				</div>
				<?php echo $e( 'div', 'price.per', 'bal-per' ); // phpcs:ignore ?>
				<ul class="bal-checks">
					<?php foreach ( $S[ $lang ]['pricing']['list'] as $i => $_ ) : ?>
						<li data-i="pricing.list.<?php echo (int) $i; ?>"><?php echo esc_html( $t( 'pricing.list.' . $i ) ); ?></li>
					<?php endforeach; ?>
				</ul>
				<div class="bal-cta bal-cta--col">
					<?php
					echo $btn( $buy, 'pricing.buy', 'bal-btn--primary' ); // phpcs:ignore
					echo $btn( $trial, 'pricing.trial', 'bal-btn--accent' ); // phpcs:ignore
					?>
				</div>
			</div>
		</div>
	</section>

	<section class="bal-sec bal-sec--alt" id="bal-faq">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'faq.title' ); // phpcs:ignore ?>
			<div class="bal-faq">
				<?php foreach ( $S[ $lang ]['faq']['items'] as $i => $_ ) : ?>
					<details>
						<summary data-i="faq.items.<?php echo (int) $i; ?>.0"><?php echo esc_html( $t( "faq.items.$i.0" ) ); ?></summary>
						<p data-i="faq.items.<?php echo (int) $i; ?>.1"><?php echo esc_html( $t( "faq.items.$i.1" ) ); ?></p>
					</details>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="bal-sec" id="bal-contact">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'contact.title' ); echo $e( 'p', 'contact.sub', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-card bal-contact">
				<?php
				$rows = array();
				if ( $s['email'] ) {
					$rows[] = array( 'email', $s['email'], 'mailto:' . $s['email'] );
				}
				if ( $s['phone'] ) {
					$rows[] = array( 'phone', $s['phone'], 'tel:' . preg_replace( '/[^+\d]/', '', $s['phone'] ) );
				}
				if ( $s['whatsapp'] ) {
					$rows[] = array( 'whatsapp', '+' . $s['whatsapp'], 'https://wa.me/' . $s['whatsapp'] );
				}
				if ( $s['telegram'] ) {
					$rows[] = array( 'telegram', '@' . $s['telegram'], 'https://t.me/' . $s['telegram'] );
				}
				if ( $s['website'] ) {
					$rows[] = array( 'website', preg_replace( '#^https?://#', '', $s['website'] ), $s['website'] );
				}
				foreach ( $rows as $r ) :
					?>
					<div class="bal-row"><span data-i="contact.<?php echo esc_attr( $r[0] ); ?>"><?php echo esc_html( $t( 'contact.' . $r[0] ) ); ?></span>
						<a href="<?php echo esc_url( $r[2] ); ?>" rel="noopener" dir="ltr"><?php echo esc_html( $r[1] ); ?></a></div>
				<?php endforeach; ?>
				<?php if ( $s['address_ar'] || $s['address_en'] || $s['address_fr'] ) : ?>
					<div class="bal-row"><span data-i="contact.address"><?php echo esc_html( $t( 'contact.address' ) ); ?></span>
						<b data-i="contact.addressValue"><?php echo esc_html( $t( 'contact.addressValue' ) ); ?></b></div>
				<?php endif; ?>
			</div>
		</div>
	</section>

	<section class="bal-final">
		<div class="bal-wrap">
			<?php echo $e( 'h2', 'cta.title' ); echo $e( 'p', 'cta.text', 'bal-sub' ); // phpcs:ignore ?>
			<div class="bal-cta">
				<?php
				echo $btn( $buy, 'hero.buy', 'bal-btn--light' ); // phpcs:ignore
				echo $btn( $trial, 'hero.trial', 'bal-btn--outline' ); // phpcs:ignore
				?>
			</div>
		</div>
	</section>

	<footer class="bal-foot">
		<div class="bal-wrap">© <?php echo esc_html( gmdate( 'Y' ) ); ?> Template App — <span data-i="footer"><?php echo esc_html( $t( 'footer' ) ); ?></span></div>
	</footer>

	<script type="application/json" class="bal-dict"><?php echo wp_json_encode( $dicts, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE ); // phpcs:ignore ?></script>
	<script type="application/ld+json"><?php
	echo wp_json_encode(
		array(
			'@context'            => 'https://schema.org',
			'@type'               => 'SoftwareApplication',
			'name'                => 'Template App',
			'applicationCategory' => 'SecurityApplication',
			'operatingSystem'     => 'Windows 10, Windows 11',
			'offers'              => array(
				'@type'         => 'Offer',
				'price'         => (string) (float) $s['price_amount'],
				'priceCurrency' => $s['price_currency'],
				'url'           => $buy,
			),
		),
		JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
	); // phpcs:ignore
	?></script>
</div>
	<?php
	return ob_get_clean();
}
