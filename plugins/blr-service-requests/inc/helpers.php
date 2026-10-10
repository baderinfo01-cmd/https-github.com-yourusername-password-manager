<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bisr_opt( $key, $default = '' ) {
	$o = get_option( 'bisr_settings', array() );
	return isset( $o[ $key ] ) && '' !== $o[ $key ] ? $o[ $key ] : $default;
}

function bisr_lang( $lang ) {
	return in_array( $lang, array( 'ar', 'en', 'fr' ), true ) ? $lang : 'ar';
}

/** كتالوج الخدمات والحقول (يُولَّد من site-content/build_site.py). */
function bisr_catalog() {
	static $c = null;
	if ( null === $c ) {
		$f = BISR_DIR . 'data/catalog.json';
		$c = is_readable( $f ) ? json_decode( (string) file_get_contents( $f ), true ) : array();
		if ( ! is_array( $c ) ) {
			$c = array();
		}
	}
	return $c;
}

function bisr_find_service( $sid ) {
	$cat = bisr_catalog();
	foreach ( isset( $cat['groups'] ) ? $cat['groups'] : array() as $g ) {
		foreach ( $g['services'] as $s ) {
			if ( $s['id'] === $sid ) {
				return $s + array( 'group' => $g['id'] );
			}
		}
	}
	return null;
}

/** نصوص واجهة الزائر. */
function bisr_strings() {
	return array(
		'ar' => array(
			'dir' => 'rtl', 'choose' => 'اختر الخدمة المطلوبة', 'pick' => '— اختر الخدمة —', 'your' => 'بياناتك', 'svc' => 'تفاصيل الخدمة', 'proj' => 'الميزانية والمدة',
			'send' => 'إرسال الطلب', 'sending' => 'جارٍ الإرسال…', 'req' => 'هذا الحقل مطلوب', 'mail' => 'بريد إلكتروني غير صحيح', 'sel' => '— اختر —', 'selected' => 'الخدمة المختارة',
			'ok' => 'تم استلام طلبك بنجاح. رقم الطلب: ', 'ok2' => 'سنراجع التفاصيل ونرد عليك قريباً.', 'err' => 'تعذر الإرسال. حاول مرة أخرى أو تواصل معنا مباشرة.', 'fix' => 'يرجى تصحيح الحقول المظللة.',
			'c_name' => 'الاسم الكامل', 'c_email' => 'البريد الإلكتروني', 'c_phone' => 'الهاتف / واتساب (اختياري)', 'c_subject' => 'الموضوع', 'c_msg' => 'رسالتك', 'c_send' => 'إرسال الرسالة', 'c_ok' => 'تم إرسال رسالتك. شكراً لتواصلك.',
			'info' => 'بيانات التواصل', 'phone' => 'الهاتف', 'wa' => 'واتساب', 'email' => 'البريد', 'addr' => 'العنوان', 'hours' => 'ساعات العمل', 'soon' => 'لم تُضبط بيانات التواصل بعد.',
			'noshop' => 'ستظهر المنتجات هنا عند تفعيل ووكومرس وإضافة منتجات.', 'noposts' => 'لا توجد مقالات بعد.', 'noworks' => 'لم تُضف أعمال بعد.', 'open' => 'عرض', 'all' => 'الكل', 'read' => 'اقرأ المزيد',
		),
		'en' => array(
			'dir' => 'ltr', 'choose' => 'Choose the service you need', 'pick' => '— Select a service —', 'your' => 'Your details', 'svc' => 'Service details', 'proj' => 'Budget and timeline',
			'send' => 'Send request', 'sending' => 'Sending…', 'req' => 'This field is required', 'mail' => 'Invalid email address', 'sel' => '— Select —', 'selected' => 'Selected service',
			'ok' => 'Your request was received. Reference: ', 'ok2' => 'We will review the details and reply soon.', 'err' => 'Could not send. Please try again or contact us directly.', 'fix' => 'Please fix the highlighted fields.',
			'c_name' => 'Full name', 'c_email' => 'Email', 'c_phone' => 'Phone / WhatsApp (optional)', 'c_subject' => 'Subject', 'c_msg' => 'Your message', 'c_send' => 'Send message', 'c_ok' => 'Your message was sent. Thank you.',
			'info' => 'Contact details', 'phone' => 'Phone', 'wa' => 'WhatsApp', 'email' => 'Email', 'addr' => 'Address', 'hours' => 'Working hours', 'soon' => 'Contact details are not configured yet.',
			'noshop' => 'Products will appear here once WooCommerce is active and products are added.', 'noposts' => 'No posts yet.', 'noworks' => 'No works added yet.', 'open' => 'View', 'all' => 'All', 'read' => 'Read more',
		),
		'fr' => array(
			'dir' => 'ltr', 'choose' => 'Choisissez le service souhaité', 'pick' => '— Choisir un service —', 'your' => 'Vos coordonnées', 'svc' => 'Détails du service', 'proj' => 'Budget et délai',
			'send' => 'Envoyer la demande', 'sending' => 'Envoi en cours…', 'req' => 'Ce champ est obligatoire', 'mail' => 'Adresse e-mail invalide', 'sel' => '— Choisir —', 'selected' => 'Service choisi',
			'ok' => 'Votre demande a été reçue. Référence : ', 'ok2' => 'Nous étudions les détails et vous répondons rapidement.', 'err' => 'Envoi impossible. Réessayez ou contactez-nous directement.', 'fix' => 'Veuillez corriger les champs signalés.',
			'c_name' => 'Nom complet', 'c_email' => 'E-mail', 'c_phone' => 'Téléphone / WhatsApp (facultatif)', 'c_subject' => 'Objet', 'c_msg' => 'Votre message', 'c_send' => 'Envoyer le message', 'c_ok' => 'Votre message a été envoyé. Merci.',
			'info' => 'Coordonnées', 'phone' => 'Téléphone', 'wa' => 'WhatsApp', 'email' => 'E-mail', 'addr' => 'Adresse', 'hours' => 'Horaires', 'soon' => 'Les coordonnées ne sont pas encore configurées.',
			'noshop' => 'Les produits s’afficheront ici lorsque WooCommerce sera actif.', 'noposts' => 'Aucun article pour le moment.', 'noworks' => 'Aucune réalisation ajoutée.', 'open' => 'Voir', 'all' => 'Tous', 'read' => 'Lire la suite',
		),
	);
}

function bisr_s( $lang, $key ) {
	$s = bisr_strings();
	$lang = bisr_lang( $lang );
	return isset( $s[ $lang ][ $key ] ) ? $s[ $lang ][ $key ] : '';
}

function bisr_ver( $rel ) {
	$f = BISR_DIR . $rel;
	return file_exists( $f ) ? BISR_VER . '.' . filemtime( $f ) : BISR_VER;
}
