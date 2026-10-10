<?php
/**
 * Template Name: BLR — صفحة هبوط إعلانية (بنّاء JSON)
 * Template Post Type: page
 *
 * @package blr-shop-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$d = bshop_landing_data( get_the_ID() );
$h = isset( $d['hero'] ) ? $d['hero'] : array();
?>
<article class="bs-landing">

<?php if ( $h ) : ?>
	<section class="blr-hero">
		<div class="blr-container"><div class="blr-hero__grid">
			<div class="blr-reveal is-in">
				<?php if ( ! empty( $h['badge'] ) ) : ?><span class="blr-eyebrow"><?php echo baderlr_icon( 'spark', 15 ); // phpcs:ignore ?> <?php echo esc_html( $h['badge'] ); ?></span><?php endif; ?>
				<h1><?php echo esc_html( isset( $h['title'] ) ? $h['title'] : get_the_title() ); ?></h1>
				<p class="blr-lead"><?php echo esc_html( isset( $h['sub'] ) ? $h['sub'] : '' ); ?></p>
				<div class="blr-hero__cta">
					<?php if ( ! empty( $h['cta'] ) ) : ?><a class="blr-btn blr-btn--primary blr-btn--lg" href="<?php echo bshop_landing_url( isset( $h['url'] ) ? $h['url'] : '#' ); // phpcs:ignore ?>"><?php echo esc_html( $h['cta'] ); ?> <?php echo baderlr_icon( 'arrow', 18 ); // phpcs:ignore ?></a><?php endif; ?>
					<?php if ( ! empty( $h['cta2'] ) ) : ?><a class="blr-btn blr-btn--ghost blr-btn--lg" href="<?php echo bshop_landing_url( isset( $h['url2'] ) ? $h['url2'] : '#' ); // phpcs:ignore ?>"><?php echo esc_html( $h['cta2'] ); ?></a><?php endif; ?>
				</div>
			</div>
			<div class="blr-hero__art blr-reveal is-in">
				<?php
				if ( ! empty( $h['image'] ) ) {
					echo '<img src="' . esc_url( $h['image'] ) . '" alt="" decoding="async">';
				} elseif ( has_post_thumbnail() ) {
					the_post_thumbnail( 'baderlr-wide' );
				} else {
					echo '<div style="display:grid;place-items:center;height:100%;color:var(--accent);opacity:.8">' . baderlr_icon( 'layers', 96 ) . '</div>'; // phpcs:ignore
				}
				?>
			</div>
		</div></div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $d['stats'] ) ) : ?>
	<section class="blr-section blr-section--tight" style="background:var(--bg-2)"><div class="blr-container"><div class="blr-stats">
		<?php foreach ( $d['stats'] as $s ) : ?>
			<div class="blr-stat"><b><?php echo esc_html( isset( $s['n'] ) ? $s['n'] : '' ); ?></b><span><?php echo esc_html( isset( $s['l'] ) ? $s['l'] : '' ); ?></span></div>
		<?php endforeach; ?>
	</div></div></section>
<?php endif; ?>

<?php if ( ! empty( $d['features'] ) ) : ?>
	<section class="blr-section" id="features"><div class="blr-container">
		<div class="blr-sec-head"><h2><?php esc_html_e( 'المزايا', 'blr-shop-pro' ); ?></h2></div>
		<div class="blr-grid blr-grid--3">
			<?php foreach ( $d['features'] as $f ) : ?>
				<div class="blr-card">
					<div class="blr-card__icon"><?php echo baderlr_icon( sanitize_key( isset( $f['icon'] ) ? $f['icon'] : 'check' ), 28 ); // phpcs:ignore ?></div>
					<h3><?php echo esc_html( isset( $f['title'] ) ? $f['title'] : '' ); ?></h3>
					<p><?php echo esc_html( isset( $f['text'] ) ? $f['text'] : '' ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $d['steps'] ) ) : ?>
	<section class="blr-section" style="background:var(--bg-2)"><div class="blr-container">
		<div class="blr-sec-head"><h2><?php esc_html_e( 'كيف يعمل؟', 'blr-shop-pro' ); ?></h2></div>
		<ol class="bs-steps">
			<?php foreach ( $d['steps'] as $s ) : ?>
				<li><h3><?php echo esc_html( isset( $s['title'] ) ? $s['title'] : '' ); ?></h3><p><?php echo esc_html( isset( $s['text'] ) ? $s['text'] : '' ); ?></p></li>
			<?php endforeach; ?>
		</ol>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $d['pricing'] ) ) : ?>
	<section class="blr-section" id="pricing"><div class="blr-container">
		<div class="blr-sec-head"><h2><?php esc_html_e( 'الأسعار', 'blr-shop-pro' ); ?></h2></div>
		<div class="blr-grid blr-grid--3">
			<?php foreach ( $d['pricing'] as $p ) : $hot = ! empty( $p['highlight'] ); ?>
				<div class="blr-plan<?php echo $hot ? ' blr-plan--pop' : ''; ?>" <?php echo $hot ? 'data-badge="' . esc_attr__( 'الأكثر طلباً', 'blr-shop-pro' ) . '"' : ''; ?>>
					<h3><?php echo esc_html( isset( $p['name'] ) ? $p['name'] : '' ); ?></h3>
					<div class="blr-plan__price"><?php echo esc_html( isset( $p['price'] ) ? $p['price'] : '' ); ?> <small style="font-size:.9rem;color:var(--muted)"><?php echo esc_html( isset( $p['period'] ) ? $p['period'] : '' ); ?></small></div>
					<ul>
						<?php foreach ( (array) ( isset( $p['features'] ) ? $p['features'] : array() ) as $li ) : ?>
							<li><?php echo baderlr_icon( 'check', 18 ); // phpcs:ignore ?> <?php echo esc_html( $li ); ?></li>
						<?php endforeach; ?>
					</ul>
					<a class="blr-btn <?php echo $hot ? 'blr-btn--primary' : 'blr-btn--ghost'; ?>" href="<?php echo bshop_landing_url( isset( $p['url'] ) ? $p['url'] : '#' ); // phpcs:ignore ?>"><?php echo esc_html( isset( $p['cta'] ) ? $p['cta'] : '' ); ?></a>
				</div>
			<?php endforeach; ?>
		</div>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $d['testimonials'] ) ) : ?>
	<section class="blr-section" style="background:var(--bg-2)"><div class="blr-container">
		<div class="blr-sec-head"><h2><?php esc_html_e( 'آراء العملاء', 'blr-shop-pro' ); ?></h2></div>
		<div class="blr-grid blr-grid--3">
			<?php foreach ( $d['testimonials'] as $t ) : ?>
				<div class="blr-quote"><p>“<?php echo esc_html( isset( $t['text'] ) ? $t['text'] : '' ); ?>”</p>
					<div class="blr-quote__who"><div><b><?php echo esc_html( isset( $t['name'] ) ? $t['name'] : '' ); ?></b><span><?php echo esc_html( isset( $t['role'] ) ? $t['role'] : '' ); ?></span></div></div></div>
			<?php endforeach; ?>
		</div>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $d['faq'] ) ) : ?>
	<section class="blr-section"><div class="blr-container blr-narrow">
		<div class="blr-sec-head"><h2><?php esc_html_e( 'الأسئلة الشائعة', 'blr-shop-pro' ); ?></h2></div>
		<?php foreach ( $d['faq'] as $q ) : ?>
			<details class="bs-faq"><summary><?php echo esc_html( isset( $q['q'] ) ? $q['q'] : '' ); ?></summary><p><?php echo esc_html( isset( $q['a'] ) ? $q['a'] : '' ); ?></p></details>
		<?php endforeach; ?>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $d['cta'] ) ) : ?>
	<section class="blr-section"><div class="blr-container"><div class="blr-cta">
		<h2><?php echo esc_html( isset( $d['cta']['title'] ) ? $d['cta']['title'] : '' ); ?></h2>
		<p style="max-width:52ch;margin-inline:auto"><?php echo esc_html( isset( $d['cta']['text'] ) ? $d['cta']['text'] : '' ); ?></p>
		<div style="margin-top:22px"><a class="blr-btn blr-btn--primary blr-btn--lg" href="<?php echo bshop_landing_url( isset( $d['cta']['url'] ) ? $d['cta']['url'] : '#' ); // phpcs:ignore ?>"><?php echo esc_html( isset( $d['cta']['btn'] ) ? $d['cta']['btn'] : '' ); ?></a></div>
	</div></div></section>
<?php endif; ?>

<?php if ( trim( get_the_content() ) ) : ?>
	<section class="blr-section"><div class="blr-container blr-narrow blr-entry"><?php the_content(); ?></div></section>
<?php endif; ?>

<?php
if ( ! empty( $d['faq'] ) ) {
	$entities = array();
	foreach ( $d['faq'] as $q ) {
		$entities[] = array( '@type' => 'Question', 'name' => isset( $q['q'] ) ? $q['q'] : '', 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => isset( $q['a'] ) ? $q['a'] : '' ) );
	}
	echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $entities ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>';
}
?>
</article>
<?php
get_footer();
