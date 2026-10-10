<?php
/**
 * Template Name: BLR — صفحة هبوط
 * Template Post Type: page
 *
 * @package BLR_Shop_Pro
 */

get_header();
the_post();
$d = blr_landing_data( get_the_ID() );
$h = $d['hero'] ?? array();
?>
<main id="main" class="blr-landing">

	<?php if ( $h ) : ?>
	<section class="lp-hero">
		<div class="blr-wrap lp-hero__grid">
			<div>
				<?php if ( ! empty( $h['badge'] ) ) : ?><span class="lp-badge"><?php echo esc_html( $h['badge'] ); ?></span><?php endif; ?>
				<h1><?php echo esc_html( $h['title'] ?? get_the_title() ); ?></h1>
				<p class="lp-sub"><?php echo esc_html( $h['sub'] ?? '' ); ?></p>
				<div class="lp-actions">
					<?php if ( ! empty( $h['cta'] ) ) : ?><a class="blr-btn blr-btn--lg" href="<?php echo blr_landing_url( $h['url'] ?? '#' ); // phpcs:ignore ?>"><?php echo esc_html( $h['cta'] ); ?></a><?php endif; ?>
					<?php if ( ! empty( $h['cta2'] ) ) : ?><a class="blr-btn blr-btn--ghost blr-btn--lg" href="<?php echo blr_landing_url( $h['url2'] ?? '#' ); // phpcs:ignore ?>"><?php echo esc_html( $h['cta2'] ); ?></a><?php endif; ?>
				</div>
			</div>
			<div class="lp-hero__media">
				<?php
				if ( ! empty( $h['image'] ) ) {
					echo '<img src="' . esc_url( $h['image'] ) . '" alt="" loading="eager" decoding="async">';
				} elseif ( has_post_thumbnail() ) {
					the_post_thumbnail( 'large' );
				} else {
					echo '<div class="lp-orb" aria-hidden="true"></div>';
				}
				?>
			</div>
		</div>
	</section>
	<?php endif; ?>

	<?php if ( ! empty( $d['stats'] ) ) : ?>
	<section class="lp-stats"><div class="blr-wrap lp-stats__grid">
		<?php foreach ( $d['stats'] as $s ) : ?>
			<div><strong><?php echo esc_html( $s['n'] ?? '' ); ?></strong><span><?php echo esc_html( $s['l'] ?? '' ); ?></span></div>
		<?php endforeach; ?>
	</div></section>
	<?php endif; ?>

	<?php if ( ! empty( $d['features'] ) ) : ?>
	<section class="lp-sec" id="features"><div class="blr-wrap">
		<h2 class="lp-h"><?php esc_html_e( 'المزايا', 'blr-shop-pro' ); ?></h2>
		<div class="lp-grid">
			<?php foreach ( $d['features'] as $f ) : ?>
				<article class="lp-card">
					<span class="lp-ico"><?php echo blr_icon( sanitize_key( $f['icon'] ?? 'check' ), 26 ) ?: blr_icon( 'check', 26 ); // phpcs:ignore ?></span>
					<h3><?php echo esc_html( $f['title'] ?? '' ); ?></h3>
					<p><?php echo esc_html( $f['text'] ?? '' ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
	</div></section>
	<?php endif; ?>

	<?php if ( ! empty( $d['steps'] ) ) : ?>
	<section class="lp-sec lp-sec--alt"><div class="blr-wrap">
		<h2 class="lp-h"><?php esc_html_e( 'كيف يعمل؟', 'blr-shop-pro' ); ?></h2>
		<ol class="lp-steps">
			<?php foreach ( $d['steps'] as $s ) : ?>
				<li><h3><?php echo esc_html( $s['title'] ?? '' ); ?></h3><p><?php echo esc_html( $s['text'] ?? '' ); ?></p></li>
			<?php endforeach; ?>
		</ol>
	</div></section>
	<?php endif; ?>

	<?php if ( ! empty( $d['pricing'] ) ) : ?>
	<section class="lp-sec" id="pricing"><div class="blr-wrap">
		<h2 class="lp-h"><?php esc_html_e( 'الأسعار', 'blr-shop-pro' ); ?></h2>
		<div class="lp-grid lp-grid--price">
			<?php foreach ( $d['pricing'] as $p ) : ?>
				<article class="lp-card lp-price<?php echo ! empty( $p['highlight'] ) ? ' is-hot' : ''; ?>">
					<h3><?php echo esc_html( $p['name'] ?? '' ); ?></h3>
					<div class="lp-amount"><strong><?php echo esc_html( $p['price'] ?? '' ); ?></strong> <small><?php echo esc_html( $p['period'] ?? '' ); ?></small></div>
					<ul>
						<?php foreach ( (array) ( $p['features'] ?? array() ) as $li ) : ?>
							<li><?php echo blr_icon( 'check', 18 ); // phpcs:ignore ?> <?php echo esc_html( $li ); ?></li>
						<?php endforeach; ?>
					</ul>
					<a class="blr-btn<?php echo empty( $p['highlight'] ) ? ' blr-btn--ghost' : ''; ?>" href="<?php echo blr_landing_url( $p['url'] ?? '#' ); // phpcs:ignore ?>"><?php echo esc_html( $p['cta'] ?? '' ); ?></a>
				</article>
			<?php endforeach; ?>
		</div>
	</div></section>
	<?php endif; ?>

	<?php if ( ! empty( $d['testimonials'] ) ) : ?>
	<section class="lp-sec lp-sec--alt"><div class="blr-wrap">
		<h2 class="lp-h"><?php esc_html_e( 'آراء العملاء', 'blr-shop-pro' ); ?></h2>
		<div class="lp-grid">
			<?php foreach ( $d['testimonials'] as $t ) : ?>
				<figure class="lp-card">
					<blockquote>“<?php echo esc_html( $t['text'] ?? '' ); ?>”</blockquote>
					<figcaption><strong><?php echo esc_html( $t['name'] ?? '' ); ?></strong> <span><?php echo esc_html( $t['role'] ?? '' ); ?></span></figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
	</div></section>
	<?php endif; ?>

	<?php if ( ! empty( $d['faq'] ) ) : ?>
	<section class="lp-sec"><div class="blr-wrap blr-wrap--narrow">
		<h2 class="lp-h"><?php esc_html_e( 'الأسئلة الشائعة', 'blr-shop-pro' ); ?></h2>
		<?php foreach ( $d['faq'] as $q ) : ?>
			<details class="lp-faq"><summary><?php echo esc_html( $q['q'] ?? '' ); ?></summary><p><?php echo esc_html( $q['a'] ?? '' ); ?></p></details>
		<?php endforeach; ?>
	</div></section>
	<?php endif; ?>

	<?php if ( ! empty( $d['cta'] ) ) : ?>
	<section class="lp-cta"><div class="blr-wrap">
		<h2><?php echo esc_html( $d['cta']['title'] ?? '' ); ?></h2>
		<p><?php echo esc_html( $d['cta']['text'] ?? '' ); ?></p>
		<a class="blr-btn blr-btn--light blr-btn--lg" href="<?php echo blr_landing_url( $d['cta']['url'] ?? '#' ); // phpcs:ignore ?>"><?php echo esc_html( $d['cta']['btn'] ?? '' ); ?></a>
	</div></section>
	<?php endif; ?>

	<?php if ( trim( get_the_content() ) ) : ?>
		<section class="lp-sec"><div class="blr-wrap blr-wrap--narrow blr-content"><?php the_content(); ?></div></section>
	<?php endif; ?>

	<?php
	// بيانات منظّمة للأسئلة الشائعة (FAQPage).
	if ( ! empty( $d['faq'] ) ) {
		$entities = array();
		foreach ( $d['faq'] as $q ) {
			$entities[] = array( '@type' => 'Question', 'name' => $q['q'] ?? '', 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $q['a'] ?? '' ) );
		}
		echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $entities ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>';
	}
	?>
</main>
<?php
get_footer();
