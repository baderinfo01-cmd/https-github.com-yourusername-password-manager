<?php
/**
 * الصفحة الرئيسية الافتراضية — تصميم جاهز يظهر عند عدم تعيين صفحة رئيسية.
 * إن عيّن المستخدم «صفحة ثابتة» كرئيسية، يُعرض محتواها بدلاً من ذلك.
 *
 * @package baderlr-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

// إذا كانت الرئيسية صفحة ثابتة بمحتوى، اعرض المحتوى.
if ( 'page' === get_option( 'show_on_front' ) && get_the_ID() && get_post( get_the_ID() ) && trim( (string) get_post_field( 'post_content', get_the_ID() ) ) !== '' ) :
	while ( have_posts() ) :
		the_post();
		echo '<div class="blr-section"><div class="blr-container blr-entry">';
		the_content();
		echo '</div></div>';
	endwhile;
else :
	$cta_url = get_theme_mod( 'baderlr_cta_url', '#' );
	?>
	<!-- Hero -->
	<section class="blr-hero">
		<div class="blr-container">
			<div class="blr-hero__grid">
				<div class="blr-reveal is-in">
					<span class="blr-eyebrow"><?php echo baderlr_icon( 'spark', 15 ); // phpcs:ignore ?> <?php esc_html_e( 'قالب احترافي بالذكاء الاصطناعي', 'baderlr-wp' ); ?></span>
					<h1><?php esc_html_e( 'موقع شركتك الاحترافي يبدأ من هنا', 'baderlr-wp' ); ?></h1>
					<p class="blr-lead"><?php esc_html_e( 'تصميم عصري سريع، ثلاثة أنماط جاهزة، مولّد محتوى ذكي، واستيراد مواقع جاهزة بنقرة. أطلق موقعاً يليق بعلامتك في وقت قياسي.', 'baderlr-wp' ); ?></p>
					<div class="blr-hero__cta">
						<a class="blr-btn blr-btn--primary blr-btn--lg" href="<?php echo esc_url( $cta_url ); ?>"><?php esc_html_e( 'ابدأ الآن', 'baderlr-wp' ); ?> <?php echo baderlr_icon( 'arrow', 18 ); // phpcs:ignore ?></a>
						<a class="blr-btn blr-btn--ghost blr-btn--lg" href="#services"><?php esc_html_e( 'خدماتنا', 'baderlr-wp' ); ?></a>
					</div>
					<div class="blr-hero__badges">
						<div><b>500+</b> <?php esc_html_e( 'عميل', 'baderlr-wp' ); ?></div>
						<div><b>99%</b> <?php esc_html_e( 'رضا', 'baderlr-wp' ); ?></div>
						<div><b>24/7</b> <?php esc_html_e( 'دعم', 'baderlr-wp' ); ?></div>
					</div>
				</div>
				<div class="blr-hero__art blr-reveal is-in">
					<div style="display:grid;place-items:center;height:100%;color:var(--accent);opacity:.8"><?php echo baderlr_icon( 'layers', 96 ); // phpcs:ignore ?></div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="blr-section" id="services">
		<div class="blr-container">
			<div class="blr-sec-head blr-reveal">
				<span class="blr-eyebrow"><?php esc_html_e( 'مزايا القالب', 'baderlr-wp' ); ?></span>
				<h2><?php esc_html_e( 'كل ما تحتاجه لموقع ناجح', 'baderlr-wp' ); ?></h2>
				<p><?php esc_html_e( 'أدوات احترافية متكاملة تجعل بناء موقعك وإدارته أسهل وأسرع.', 'baderlr-wp' ); ?></p>
			</div>
			<div class="blr-grid blr-grid--3">
				<?php
				$feats = array(
					array( 'spark', __( 'مولّد بالذكاء الاصطناعي', 'baderlr-wp' ), __( 'اكتب فكرتك ودع الذكاء الاصطناعي يصيغ نصوص صفحاتك ومنتجاتك.', 'baderlr-wp' ) ),
					array( 'bolt', __( 'أداء فائق', 'baderlr-wp' ), __( 'كود نظيف وتحميل سريع يرفع ترتيبك في محركات البحث.', 'baderlr-wp' ) ),
					array( 'layers', __( 'مواقع جاهزة', 'baderlr-wp' ), __( 'استورد تصميماً كاملاً بنقرة وعدّله كما تشاء.', 'baderlr-wp' ) ),
					array( 'globe', __( 'متعدّد اللغات + RTL', 'baderlr-wp' ), __( 'دعم كامل للعربية والفرنسية والإنجليزية باتجاه صحيح.', 'baderlr-wp' ) ),
					array( 'cart', __( 'متجر WooCommerce', 'baderlr-wp' ), __( 'تصميم متجر أنيق وصفحات منتجات محسّنة للبيع.', 'baderlr-wp' ) ),
					array( 'shield', __( 'ترخيص وتحديثات', 'baderlr-wp' ), __( 'ترخيص موقّع رقمياً وتحديثات ودعم فني متواصل.', 'baderlr-wp' ) ),
				);
				foreach ( $feats as $f ) :
					?>
					<div class="blr-card blr-reveal">
						<div class="blr-card__icon"><?php echo baderlr_icon( $f[0], 28 ); // phpcs:ignore ?></div>
						<h3><?php echo esc_html( $f[1] ); ?></h3>
						<p><?php echo esc_html( $f[2] ); ?></p>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<!-- Stats -->
	<section class="blr-section blr-section--tight" style="background:var(--bg-2)">
		<div class="blr-container">
			<div class="blr-stats blr-reveal">
				<div class="blr-stat"><b>500+</b><span><?php esc_html_e( 'مشروع منجز', 'baderlr-wp' ); ?></span></div>
				<div class="blr-stat"><b>12</b><span><?php esc_html_e( 'سنة خبرة', 'baderlr-wp' ); ?></span></div>
				<div class="blr-stat"><b>99%</b><span><?php esc_html_e( 'نسبة الرضا', 'baderlr-wp' ); ?></span></div>
				<div class="blr-stat"><b>24/7</b><span><?php esc_html_e( 'دعم فني', 'baderlr-wp' ); ?></span></div>
			</div>
		</div>
	</section>

	<!-- Latest posts -->
	<?php
	$recent = new WP_Query( array( 'posts_per_page' => 3, 'ignore_sticky_posts' => true ) );
	if ( $recent->have_posts() ) :
		?>
		<section class="blr-section">
			<div class="blr-container">
				<div class="blr-sec-head blr-reveal"><h2><?php esc_html_e( 'أحدث المقالات', 'baderlr-wp' ); ?></h2></div>
				<div class="blr-grid blr-grid--3">
					<?php while ( $recent->have_posts() ) : $recent->the_post(); baderlr_post_card(); endwhile; ?>
				</div>
			</div>
		</section>
		<?php wp_reset_postdata(); endif; ?>

	<!-- CTA -->
	<section class="blr-section">
		<div class="blr-container">
			<div class="blr-cta blr-reveal">
				<h2><?php esc_html_e( 'جاهز لإطلاق موقعك؟', 'baderlr-wp' ); ?></h2>
				<p style="max-width:52ch;margin-inline:auto"><?php esc_html_e( 'ابدأ اليوم واحصل على موقع احترافي سريع يعكس هوية علامتك التجارية.', 'baderlr-wp' ); ?></p>
				<div style="margin-top:22px"><a class="blr-btn blr-btn--primary blr-btn--lg" href="<?php echo esc_url( $cta_url ); ?>"><?php esc_html_e( 'تواصل معنا', 'baderlr-wp' ); ?></a></div>
			</div>
		</div>
	</section>
	<?php
endif;

get_footer();
