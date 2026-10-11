<?php
/**
 * Texts of the landing page. One JSON file per language in includes/lang/ (ar, en, fr, es, de, tr, pt, it).
 * Edit freely, but keep the structure identical in every file. {days} is replaced by the trial length.
 * To add a language: add its JSON file, then add its code to blr_languages() in blr-landing.php.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$blr_all = array();
foreach ( blr_languages() as $blr_code ) {
	$blr_file = BLR_DIR . 'includes/lang/' . $blr_code . '.json';
	if ( is_readable( $blr_file ) ) {
		$blr_data = json_decode( (string) file_get_contents( $blr_file ), true );
		if ( is_array( $blr_data ) ) {
			$blr_all[ $blr_code ] = $blr_data;
		}
	}
}
return $blr_all;
