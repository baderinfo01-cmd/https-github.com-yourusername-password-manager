<?php
/**
 * قالب Canvas — صفحة هبوط كاملة مستقلة عن قالب الموقع.
 *
 * @package blr-landing-pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$blrlp_id = get_queried_object_id();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class( 'blrlp-canvas' ); ?>>
<?php
wp_body_open();
echo blrlp_render_page( $blrlp_id, null, array( 'preview' => is_preview() ) ); // phpcs:ignore WordPress.Security.EscapeOutput
wp_footer();
?>
</body>
</html>
