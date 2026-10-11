<?php
/**
 * Plugin Name:       BLR Fatourati Landing — صفحة بيع برنامج BLR Fatourati
 * Description:       صفحة إعلانية احترافية بثماني لغات (العربية / English / Français / Español / Deutsch / Türkçe / Português / Italiano) لبيع برنامج BLR Fatourati للفوترة وإدارة الأعمال. أضف الرمز القصير [blr_landing] لأي صفحة، وعدّل السعر ومعلومات الاتصال من الإعدادات.
 * Version:           1.1.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Baderinfo
 * Author URI:        https://baderinfo.com
 * License:           GPL-2.0-or-later
 * Text Domain:       blr-landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BLR_VERSION', '1.1.0' );
define( 'BLR_DIR', plugin_dir_path( __FILE__ ) );
define( 'BLR_URL', plugin_dir_url( __FILE__ ) );
define( 'BLR_OPTION', 'blr_settings' );

/** Supported languages, in switcher order. A matching includes/lang/{code}.json must exist. */
function blr_languages() {
	return array( 'ar', 'en', 'fr', 'es', 'de', 'tr', 'pt', 'it' );
}

/** Parse "code=text" lines (one per line) into array( code => text ). */
function blr_parse_extra( $text ) {
	$out = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) as $line ) {
		if ( preg_match( '/^\s*([a-z]{2})\s*[=:]\s*(.+?)\s*$/u', $line, $m ) ) {
			$out[ $m[1] ] = $m[2];
		}
	}
	return $out;
}

/* ------------------------------------------------------------------ settings */

function blr_defaults() {
	return array(
		'price_amount'   => '99',
		'price_old'      => '149',
		'price_currency' => 'USD',
		'price_period'   => 'once',
		'price_badge_ar' => 'عرض الإطلاق',
		'price_badge_en' => 'Launch offer',
		'price_badge_fr' => 'Offre de lancement',
		'price_badges_extra' => '',
		'trial_enabled'  => '1',
		'trial_days'     => '2',
		'trial_url'      => '',
		'buy_url'        => 'https://baderinfo.com/',
		'download_url'   => '',
		'email'          => 'baderinfo12@gmail.com',
		'phone'          => '0550896115',
		'whatsapp'       => '213550896115',
		'telegram'       => '',
		'website'        => 'https://baderinfo.com',
		'address_ar'     => '',
		'address_en'     => '',
		'address_fr'     => '',
		'address_extra'  => '',
		'brand_color'    => '#0a9f63',
		'default_lang'   => 'auto',
		'full_width'     => '0',
		'hero_title_ar'  => '', 'hero_title_en' => '', 'hero_title_fr' => '',
		'hero_text_ar'   => '', 'hero_text_en'  => '', 'hero_text_fr'  => '',
	);
}

function blr_settings() {
	$saved = get_option( BLR_OPTION, array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), blr_defaults() );
}

function blr_sanitize( $in ) {
	$d   = blr_defaults();
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
				$v = in_array( $v, array_merge( array( 'auto' ), blr_languages() ), true ) ? $v : 'auto';
				break;
			case 'price_badges_extra':
			case 'address_extra':
				$v = sanitize_textarea_field( $v );
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
	register_setting( 'blr_group', BLR_OPTION, array( 'type' => 'array', 'sanitize_callback' => 'blr_sanitize', 'default' => blr_defaults() ) );
} );

add_action( 'admin_menu', function () {
	add_options_page( 'BLR Fatourati Landing', 'BLR Fatourati Landing', 'manage_options', 'blr-landing', 'blr_admin_page' );
} );

add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), function ( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=blr-landing' ) ) . '">الإعدادات</a>' );
	return $links;
} );

function blr_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s = blr_settings();

	$field = function ( $key, $label, $type = 'text', $hint = '', $extra = '' ) use ( $s ) {
		$name = BLR_OPTION . '[' . $key . ']';
		echo '<tr><th scope="row"><label for="blr_' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( 'checkbox' === $type ) {
			echo '<label><input type="checkbox" id="blr_' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" value="1" ' . checked( $s[ $key ], '1', false ) . '> ' . esc_html( $hint ) . '</label>';
			$hint = '';
		} elseif ( 'textarea' === $type ) {
			echo '<textarea id="blr_' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" rows="3" class="large-text">' . esc_textarea( $s[ $key ] ) . '</textarea>';
		} else {
			echo '<input type="' . esc_attr( $type ) . '" id="blr_' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $s[ $key ] ) . '" class="regular-text" ' . $extra . '>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		if ( $hint ) {
			echo '<p class="description">' . esc_html( $hint ) . '</p>';
		}
		echo '</td></tr>';
	};
	?>
	<div class="wrap" dir="rtl" style="text-align:right">
		<h1>BLR Fatourati Landing — صفحة بيع البرنامج</h1>
		<p>أنشئ صفحة جديدة وأضف إليها الرمز القصير: <code>[blr_landing]</code> — أو بلغة محددة: <code>[blr_landing lang="en"]</code> (ar, en, fr, es, de, tr, pt, it). لقطات الشاشة: ضع الملفات dashboard.jpg وinvoice.jpg وpos.jpg وreports.jpg وcalendar.jpg وlicense.jpg (1360×850) في المجلد <code>assets/shots/</code>.</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'blr_group' ); ?>

			<h2>السعر</h2>
			<table class="form-table" role="presentation">
				<?php
				$field( 'price_amount', 'السعر الحالي', 'text', 'مثال: 99' );
				$field( 'price_old', 'السعر قبل الخصم', 'text', 'اتركه فارغاً أو 0 لإخفائه' );
				$field( 'price_currency', 'رمز العملة', 'text', 'USD أو EUR أو DZD أو SAR أو MAD أو EGP أو AED...' );
				?>
				<tr><th scope="row"><label for="blr_price_period">نوع الدفع</label></th><td>
					<select id="blr_price_period" name="<?php echo esc_attr( BLR_OPTION ); ?>[price_period]">
						<option value="once" <?php selected( $s['price_period'], 'once' ); ?>>دفعة واحدة (مدى الحياة)</option>
						<option value="year" <?php selected( $s['price_period'], 'year' ); ?>>سنوي</option>
						<option value="month" <?php selected( $s['price_period'], 'month' ); ?>>شهري</option>
					</select></td></tr>
				<?php
				$field( 'price_badge_ar', 'شارة العرض (عربي)' );
				$field( 'price_badge_en', 'شارة العرض (English)' );
				$field( 'price_badge_fr', 'شارة العرض (Français)' );
				$field( 'price_badges_extra', 'شارة العرض للغات الأخرى', 'textarea', "سطر لكل لغة بالصيغة: الرمز=النص. مثال: es=Oferta de lanzamiento (الرموز: es, de, tr, pt, it). إن تُرك فارغاً يُستعمل النص الجاهز." );
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
				$field( 'address_extra', 'العنوان باللغات الأخرى', 'textarea', 'سطر لكل لغة بالصيغة: الرمز=العنوان. مثال: es=Calle Mayor 1, Madrid' );
				?>
			</table>

			<h2>المظهر واللغة</h2>
			<table class="form-table" role="presentation">
				<?php $field( 'brand_color', 'اللون الرئيسي', 'color' ); ?>
				<tr><th scope="row"><label for="blr_default_lang">اللغة الافتراضية</label></th><td>
					<select id="blr_default_lang" name="<?php echo esc_attr( BLR_OPTION ); ?>[default_lang]">
						<option value="auto" <?php selected( $s['default_lang'], 'auto' ); ?>>تلقائي (لغة متصفح الزائر ثم لغة الموقع)</option>
						<option value="ar" <?php selected( $s['default_lang'], 'ar' ); ?>>العربية</option>
						<option value="en" <?php selected( $s['default_lang'], 'en' ); ?>>English</option>
						<option value="fr" <?php selected( $s['default_lang'], 'fr' ); ?>>Français</option>
						<option value="es" <?php selected( $s['default_lang'], 'es' ); ?>>Español</option>
						<option value="de" <?php selected( $s['default_lang'], 'de' ); ?>>Deutsch</option>
						<option value="tr" <?php selected( $s['default_lang'], 'tr' ); ?>>Türkçe</option>
						<option value="pt" <?php selected( $s['default_lang'], 'pt' ); ?>>Português</option>
						<option value="it" <?php selected( $s['default_lang'], 'it' ); ?>>Italiano</option>
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

function blr_strings() {
	static $strings = null;
	if ( null === $strings ) {
		$strings = require BLR_DIR . 'includes/strings.php';
	}
	return $strings;
}

/** Trial length as text, e.g. "يومين" / "2 days". */
function blr_days_text( $days, $lang ) {
	$S = blr_strings();
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

/** Price formatted for one language: separators, symbol position and currency label. */
function blr_price_text( $s, $lang ) {
	$amount = (float) $s['price_amount'];
	$cur    = $s['price_currency'];
	$nb     = "\xC2\xA0";
	$names  = array(
		'ar' => array( 'DZD' => 'دج', 'SAR' => 'ر.س', 'AED' => 'د.إ', 'EGP' => 'ج.م', 'MAD' => 'د.م', 'TND' => 'د.ت', 'KWD' => 'د.ك', 'QAR' => 'ر.ق', 'JOD' => 'د.أ', 'LYD' => 'د.ل', 'IQD' => 'د.ع' ),
		'fr' => array( 'DZD' => 'DA', 'TND' => 'DT' ),
		'es' => array( 'DZD' => 'DA' ),
		'pt' => array( 'DZD' => 'DA' ),
		'it' => array( 'DZD' => 'DA' ),
		'de' => array( 'DZD' => 'DA' ),
		'tr' => array(),
		'en' => array(),
	);
	// thousands separator, decimal separator, symbol before the number?
	$fmt_rules = array(
		'ar' => array( ',', '.', true ),
		'en' => array( ',', '.', true ),
		'fr' => array( $nb, ',', false ),
		'es' => array( '.', ',', false ),
		'de' => array( '.', ',', false ),
		'tr' => array( '.', ',', true ),
		'pt' => array( $nb, ',', false ),
		'it' => array( '.', ',', false ),
	);
	$rule   = isset( $fmt_rules[ $lang ] ) ? $fmt_rules[ $lang ] : $fmt_rules['en'];
	$prefix = array( 'USD' => '$', 'EUR' => '€', 'GBP' => '£' );
	$fmt    = function ( $n ) use ( $cur, $names, $prefix, $lang, $rule, $nb ) {
		$whole = ( floor( $n ) == $n );
		$num   = number_format( $n, $whole ? 0 : 2, $rule[1], $rule[0] );
		if ( isset( $prefix[ $cur ] ) ) {
			return $rule[2] ? $prefix[ $cur ] . $num : $num . $nb . $prefix[ $cur ];
		}
		$label = isset( $names[ $lang ][ $cur ] ) ? $names[ $lang ][ $cur ] : $cur;
		return $num . $nb . $label;
	};
	$old = (float) $s['price_old'];
	return array(
		'now' => $fmt( $amount ),
		'old' => ( $old > $amount ) ? $fmt( $old ) : '',
	);
}

/** Flat dictionary of every translatable string of one language. */
function blr_dict( $lang, $s ) {
	$S   = blr_strings();
	$T   = $S[ $lang ];
	$day = blr_days_text( (int) $s['trial_days'], $lang );
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

	// optional overrides from the settings page (ar / en / fr have dedicated fields)
	if ( isset( $s[ 'hero_title_' . $lang ] ) && '' !== trim( $s[ 'hero_title_' . $lang ] ) ) {
		$out['hero.title'] = $s[ 'hero_title_' . $lang ];
	}
	if ( isset( $s[ 'hero_text_' . $lang ] ) && '' !== trim( $s[ 'hero_text_' . $lang ] ) ) {
		$out['hero.text'] = $s[ 'hero_text_' . $lang ];
	}

	$p                = blr_price_text( $s, $lang );
	$out['price.now'] = $p['now'];
	$out['price.old'] = $p['old'];
	$out['price.per'] = $T['pricing'][ 'once' === $s['price_period'] ? 'once' : $s['price_period'] ];

	$badges = blr_parse_extra( $s['price_badges_extra'] );
	if ( isset( $s[ 'price_badge_' . $lang ] ) ) {
		$out['price.badge'] = $s[ 'price_badge_' . $lang ];
	} elseif ( isset( $badges[ $lang ] ) ) {
		$out['price.badge'] = $badges[ $lang ];
	} else {
		$out['price.badge'] = isset( $T['pricing']['badge'] ) ? $T['pricing']['badge'] : '';
	}

	$addr = blr_parse_extra( $s['address_extra'] );
	if ( isset( $s[ 'address_' . $lang ] ) ) {
		$out['contact.addressValue'] = $s[ 'address_' . $lang ];
	} else {
		$out['contact.addressValue'] = isset( $addr[ $lang ] ) ? $addr[ $lang ] : '';
	}
	return $out;
}

function blr_detect_lang( $s, $atts_lang ) {
	$allowed = blr_languages();
	if ( in_array( $atts_lang, $allowed, true ) ) {
		return $atts_lang;
	}
	if ( isset( $_GET['blr_lang'] ) && is_string( $_GET['blr_lang'] ) && in_array( $_GET['blr_lang'], $allowed, true ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return $_GET['blr_lang']; // phpcs:ignore
	}
	if ( in_array( $s['default_lang'], $allowed, true ) ) {
		return $s['default_lang'];
	}
	$loc = strtolower( substr( determine_locale(), 0, 2 ) );
	return in_array( $loc, $allowed, true ) ? $loc : 'ar';
}

/* ------------------------------------------------------------------ shortcode */

add_shortcode( 'blr_landing', 'blr_shortcode' );

function blr_shortcode( $atts ) {
	$atts = shortcode_atts( array( 'lang' => '' ), $atts, 'blr_landing' );
	$s    = blr_settings();
	$S    = blr_strings();
	$lang = blr_detect_lang( $s, $atts['lang'] );
	if ( ! isset( $S[ $lang ] ) ) {
		$lang = isset( $S['en'] ) ? 'en' : (string) key( $S );
	}
	// the browser language is used only when nothing forces a language
	$auto = ( 'auto' === $s['default_lang'] && '' === $atts['lang'] && ! isset( $_GET['blr_lang'] ) ) ? '1' : '0'; // phpcs:ignore WordPress.Security.NonceVerification

	wp_enqueue_style( 'blr-landing', BLR_URL . 'assets/landing.css', array(), BLR_VERSION );
	wp_enqueue_script( 'blr-landing', BLR_URL . 'assets/landing.js', array(), BLR_VERSION, true );

	$dicts = array();
	foreach ( array_keys( $S ) as $l ) {
		$dicts[ $l ] = blr_dict( $l, $s );
	}
	$D = $dicts[ $lang ];

	// text with data-i so the language switcher can translate it without reloading
	$t = function ( $key ) use ( $D ) {
		return isset( $D[ $key ] ) ? $D[ $key ] : '';
	};
	$e = function ( $tag, $key, $class = '', $extra = '' ) use ( $t ) {
		return '<' . $tag . ( $class ? ' class="' . esc_attr( $class ) . '"' : '' ) . ' data-i="' . esc_attr( $key ) . '"' . $extra . '>' . esc_html( $t( $key ) ) . '</' . $tag . '>'; // phpcs:ignore
	};
	// the same, for a list of numbered items
	$n = function ( $tag, $prefix, $count, $class = '' ) use ( $e ) {
		$html = '';
		for ( $i = 0; $i < $count; $i++ ) {
			$html .= $e( $tag, $prefix . '.' . $i, $class );
		}
		return $html;
	};

	// links
	$buy   = $s['buy_url'];
	$trial = '';
	if ( '1' === $s['trial_enabled'] ) {
		if ( $s['trial_url'] ) {
			$trial = $s['trial_url'];
		} elseif ( $s['whatsapp'] ) {
			$trial = 'https://wa.me/' . $s['whatsapp'];
		} elseif ( $s['email'] ) {
			$trial = 'mailto:' . $s['email'] . '?subject=' . rawurlencode( 'Trial / تجربة / Essai — BLR Fatourati' );
		}
	}
	$download = $s['download_url'];

	$btn = function ( $href, $key, $class ) use ( $e ) {
		return $href ? '<a class="blr-btn ' . esc_attr( $class ) . '" href="' . esc_url( $href ) . '" rel="noopener">' . $e( 'span', $key ) . '</a>' : '';
	};

	$group_icons = array( '🧾', '🖨️', '👥', '📦', '🛒', '💳', '📊', '🧰', '🔐', '🎨', '🔑' );
	$shot_files  = array( 'dashboard', 'invoice', 'pos', 'reports', 'calendar', 'license' );
	$nav         = array( 'features', 'gallery', 'ai', 'pricing', 'faq', 'contact' );
	$T           = $S[ $lang ];

	$style = '--blr:' . esc_attr( $s['brand_color'] ) . ';';
	$wrap  = 'blr' . ( '1' === $s['full_width'] ? ' blr--full' : '' );

	ob_start();
	?>
<div class="<?php echo esc_attr( $wrap ); ?>" id="blr-top" lang="<?php echo esc_attr( $lang ); ?>" dir="<?php echo esc_attr( $T['dir'] ); ?>" style="<?php echo esc_attr( $style ); ?>" data-lang="<?php echo esc_attr( $lang ); ?>" data-auto="<?php echo esc_attr( $auto ); ?>">

	<header class="blr-bar">
		<div class="blr-wrap blr-bar__in">
			<a class="blr-logo" href="#blr-top"><img src="<?php echo esc_url( BLR_URL . 'assets/logo.png' ); ?>" alt="" width="34" height="34"><span>BLR Fatourati</span></a>
			<nav class="blr-nav" aria-label="BLR Fatourati">
				<?php foreach ( $nav as $k ) : ?>
					<a href="#blr-<?php echo esc_attr( $k ); ?>" data-i="nav.<?php echo esc_attr( $k ); ?>"><?php echo esc_html( $t( 'nav.' . $k ) ); ?></a>
				<?php endforeach; ?>
			</nav>
			<div class="blr-tools">
				<?php if ( $buy ) : ?>
					<a class="blr-btn blr-btn--primary blr-btn--sm" href="<?php echo esc_url( $buy ); ?>" rel="noopener" data-i="ui.buyShort"><?php echo esc_html( $t( 'ui.buyShort' ) ); ?></a>
				<?php endif; ?>
				<div class="blr-lang" data-lang-menu>
					<button type="button" class="blr-lang__btn" aria-haspopup="true" aria-expanded="false" aria-label="<?php echo esc_attr( $t( 'ui.lang' ) ); ?>" data-iaria="ui.lang">
						<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9h17M3.5 15h17M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z"/></svg>
						<span class="blr-lang__cur"><?php echo esc_html( $T['name'] ); ?></span>
						<svg class="blr-lang__car" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
					</button>
					<ul class="blr-lang__list" hidden>
						<?php foreach ( $S as $code => $row ) : ?>
							<li><button type="button" lang="<?php echo esc_attr( $code ); ?>" dir="<?php echo esc_attr( $row['dir'] ); ?>" data-set-lang="<?php echo esc_attr( $code ); ?>" aria-pressed="<?php echo $code === $lang ? 'true' : 'false'; ?>" class="<?php echo $code === $lang ? 'is-on' : ''; ?>"><span><?php echo esc_html( $row['name'] ); ?></span><small><?php echo esc_html( $row['short'] ); ?></small></button></li>
						<?php endforeach; ?>
					</ul>
				</div>
			</div>
		</div>
	</header>

	<section class="blr-hero">
		<div class="blr-wrap">
			<?php echo $e( 'span', 'hero.badge', 'blr-pill' ); // phpcs:ignore ?>
			<?php echo $e( 'h1', 'hero.title' ); // phpcs:ignore ?>
			<?php echo $e( 'p', 'hero.text', 'blr-lead' ); // phpcs:ignore ?>
			<div class="blr-cta">
				<?php
				echo $btn( $buy, 'hero.buy', 'blr-btn--primary' ); // phpcs:ignore
				echo $btn( $trial, 'hero.trial', 'blr-btn--accent' ); // phpcs:ignore
				echo $btn( $download, 'hero.download', 'blr-btn--ghost' ); // phpcs:ignore
				?>
				<a class="blr-btn blr-btn--ghost" href="#blr-features"><span data-i="hero.more"><?php echo esc_html( $t( 'hero.more' ) ); ?></span></a>
			</div>
			<ul class="blr-trust">
				<?php echo $n( 'li', 'trust', count( $T['trust'] ) ); // phpcs:ignore ?>
			</ul>
		</div>
	</section>

	<section class="blr-sec" id="blr-why">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'why.title' ); echo $e( 'p', 'why.sub', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-grid blr-grid--3">
				<?php
				$why_icons = array( '🧾', '📦', '💸' );
				foreach ( $T['why']['items'] as $i => $it ) :
					?>
					<div class="blr-card">
						<div class="blr-ic" aria-hidden="true"><?php echo esc_html( $why_icons[ $i % 3 ] ); ?></div>
						<?php echo $e( 'h3', "why.items.$i.0" ); echo $e( 'p', "why.items.$i.1" ); // phpcs:ignore ?>
					</div>
				<?php endforeach; ?>
			</div>

			<h3 class="blr-h3c" data-i="why.compareTitle"><?php echo esc_html( $t( 'why.compareTitle' ) ); ?></h3>
			<div class="blr-compare">
				<div class="blr-compare__row blr-compare__head">
					<?php echo $e( 'div', 'why.head.0' ); echo $e( 'div', 'why.head.1' ); // phpcs:ignore ?>
				</div>
				<?php foreach ( $T['why']['rows'] as $i => $_ ) : ?>
					<div class="blr-compare__row">
						<div class="blr-no"><span aria-hidden="true">✕</span><?php echo $e( 'span', "why.rows.$i.0" ); // phpcs:ignore ?></div>
						<div class="blr-yes"><span aria-hidden="true">✓</span><?php echo $e( 'span', "why.rows.$i.1" ); // phpcs:ignore ?></div>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="blr-sec blr-sec--alt" id="blr-features">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'groups.title' ); echo $e( 'p', 'groups.sub', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-grid blr-grid--feat">
				<?php foreach ( $T['groups']['items'] as $i => $it ) : ?>
					<article class="blr-card blr-group">
						<div class="blr-ic" aria-hidden="true"><?php echo esc_html( isset( $group_icons[ $i ] ) ? $group_icons[ $i ] : '✨' ); ?></div>
						<?php echo $e( 'h3', "groups.items.$i.0" ); // phpcs:ignore ?>
						<ul class="blr-checks">
							<?php echo $n( 'li', "groups.items.$i.1", count( $it[1] ) ); // phpcs:ignore ?>
						</ul>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="blr-sec blr-dark" id="blr-ai">
		<div class="blr-wrap blr-split">
			<div>
				<?php echo $e( 'h2', 'ai.title', 'blr-left' ); echo $e( 'p', 'ai.text', 'blr-muted' ); // phpcs:ignore ?>
				<ul class="blr-checks">
					<?php echo $n( 'li', 'ai.items', count( $T['ai']['items'] ) ); // phpcs:ignore ?>
				</ul>
			</div>
			<div class="blr-mock" aria-hidden="true">
				<div class="blr-score"><b>AI</b></div>
				<?php echo $e( 'div', 'ai.card', 'blr-mock__t' ); // phpcs:ignore ?>
				<div class="blr-bars"><i style="--w:92%"></i><i style="--w:70%"></i><i style="--w:84%"></i></div>
			</div>
		</div>
	</section>

	<section class="blr-sec" id="blr-gallery" data-blr-gallery hidden>
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'shots.title' ); echo $e( 'p', 'shots.sub', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-shots">
				<?php foreach ( $shot_files as $i => $f ) : ?>
					<figure class="blr-shot" hidden>
						<button type="button" class="blr-shot__btn" data-full="<?php echo esc_url( BLR_URL . 'assets/shots/' . $f . '.jpg' ); ?>">
							<img src="<?php echo esc_url( BLR_URL . 'assets/shots/' . $f . '.jpg' ); ?>" alt="<?php echo esc_attr( $t( "shots.items.$i.1" ) ); ?>" data-ialt="shots.items.<?php echo (int) $i; ?>.1" width="1360" height="850" loading="lazy" decoding="async">
						</button>
						<?php echo $e( 'figcaption', "shots.items.$i.0" ); // phpcs:ignore ?>
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="blr-sec blr-sec--alt" id="blr-steps">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'steps.title' ); echo $e( 'p', 'steps.sub', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-grid blr-grid--3">
				<?php foreach ( $T['steps']['items'] as $i => $it ) : ?>
					<div class="blr-card blr-step">
						<div class="blr-num"><?php echo (int) ( $i + 1 ); ?></div>
						<?php echo $e( 'h3', "steps.items.$i.0" ); echo $e( 'p', "steps.items.$i.1" ); // phpcs:ignore ?>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="blr-sec" id="blr-pricing">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'pricing.title' ); echo $e( 'p', 'pricing.sub', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-card blr-price">
				<?php echo $e( 'span', 'price.badge', 'blr-badge', $t( 'price.badge' ) ? '' : ' hidden' ); // phpcs:ignore ?>
				<div class="blr-amount">
					<?php echo $e( 'span', 'price.old', 'blr-old', $t( 'price.old' ) ? '' : ' hidden' ); // phpcs:ignore ?>
					<?php echo $e( 'span', 'price.now', 'blr-now' ); // phpcs:ignore ?>
				</div>
				<?php echo $e( 'div', 'price.per', 'blr-per' ); // phpcs:ignore ?>
				<ul class="blr-checks">
					<?php echo $n( 'li', 'pricing.list', count( $T['pricing']['list'] ) ); // phpcs:ignore ?>
				</ul>
				<div class="blr-cta blr-cta--col">
					<?php
					echo $btn( $buy, 'pricing.buy', 'blr-btn--primary' ); // phpcs:ignore
					echo $btn( $trial, 'pricing.trial', 'blr-btn--accent' ); // phpcs:ignore
					?>
				</div>
			</div>
		</div>
	</section>

	<section class="blr-sec blr-sec--alt" id="blr-faq">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'faq.title' ); // phpcs:ignore ?>
			<div class="blr-faq">
				<?php foreach ( $T['faq']['items'] as $i => $_ ) : ?>
					<details>
						<?php echo $e( 'summary', "faq.items.$i.0" ); echo $e( 'p', "faq.items.$i.1" ); // phpcs:ignore ?>
					</details>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="blr-sec" id="blr-contact">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'contact.title' ); echo $e( 'p', 'contact.sub', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-card blr-contact">
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
					<div class="blr-row"><span data-i="contact.<?php echo esc_attr( $r[0] ); ?>"><?php echo esc_html( $t( 'contact.' . $r[0] ) ); ?></span>
						<a href="<?php echo esc_url( $r[2] ); ?>" rel="noopener" dir="ltr"><?php echo esc_html( $r[1] ); ?></a></div>
				<?php endforeach; ?>
				<?php if ( $s['address_ar'] || $s['address_en'] || $s['address_fr'] || '' !== trim( $s['address_extra'] ) ) : ?>
					<div class="blr-row"><span data-i="contact.address"><?php echo esc_html( $t( 'contact.address' ) ); ?></span>
						<b data-i="contact.addressValue"><?php echo esc_html( $t( 'contact.addressValue' ) ); ?></b></div>
				<?php endif; ?>
			</div>
		</div>
	</section>

	<section class="blr-final">
		<div class="blr-wrap">
			<?php echo $e( 'h2', 'cta.title' ); echo $e( 'p', 'cta.text', 'blr-sub' ); // phpcs:ignore ?>
			<div class="blr-cta">
				<?php
				echo $btn( $buy, 'hero.buy', 'blr-btn--light' ); // phpcs:ignore
				echo $btn( $trial, 'hero.trial', 'blr-btn--outline' ); // phpcs:ignore
				?>
			</div>
		</div>
	</section>

	<footer class="blr-foot">
		<div class="blr-wrap">© <?php echo esc_html( gmdate( 'Y' ) ); ?> BLR Fatourati — <span data-i="footer"><?php echo esc_html( $t( 'footer' ) ); ?></span></div>
	</footer>

	<div class="blr-lb" hidden role="dialog" aria-modal="true" aria-label="BLR Fatourati">
		<button type="button" class="blr-lb__x" data-lb="close" aria-label="<?php echo esc_attr( $t( 'ui.close' ) ); ?>" data-iaria="ui.close">×</button>
		<button type="button" class="blr-lb__nav blr-lb__prev" data-lb="prev" aria-label="<?php echo esc_attr( $t( 'ui.prev' ) ); ?>" data-iaria="ui.prev">‹</button>
		<figure class="blr-lb__fig"><img alt="" src=""><figcaption></figcaption></figure>
		<button type="button" class="blr-lb__nav blr-lb__next" data-lb="next" aria-label="<?php echo esc_attr( $t( 'ui.next' ) ); ?>" data-iaria="ui.next">›</button>
	</div>

	<script type="application/json" class="blr-dict"><?php echo wp_json_encode( $dicts, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE ); // phpcs:ignore ?></script>
	<script type="application/ld+json"><?php
	echo wp_json_encode(
		array(
			'@context'            => 'https://schema.org',
			'@type'               => 'SoftwareApplication',
			'name'                => 'BLR Fatourati',
			'applicationCategory' => 'BusinessApplication',
			'operatingSystem'     => 'Windows 10, Windows 11',
			'inLanguage'          => array_keys( $S ),
			'description'         => $D['hero.text'],
			'author'              => array( '@type' => 'Person', 'name' => 'Bader Eddine Hamidane', 'url' => 'https://baderinfo.com' ),
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
	<?php
	$faq_ld = array();
	foreach ( $T['faq']['items'] as $i => $_ ) {
		$faq_ld[] = array(
			'@type'          => 'Question',
			'name'           => $D[ "faq.items.$i.0" ],
			'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $D[ "faq.items.$i.1" ] ),
		);
	}
	?>
	<script type="application/ld+json"><?php
	echo wp_json_encode(
		array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'inLanguage' => $lang,
			'mainEntity' => $faq_ld,
		),
		JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
	); // phpcs:ignore
	?></script>
</div>
	<?php
	return ob_get_clean();
}
