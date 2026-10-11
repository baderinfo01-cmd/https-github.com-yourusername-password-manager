# خادم Bader Sync

خادم صغير (PHP + SQLite) يحفظ بيانات **مشفّرة** للمزامنة بين أجهزتك. لا يستطيع قراءة بياناتك.

1. ارفع هذا المجلد إلى `public_html/bader-sync/`
2. انسخ `config.sample.php` إلى `config.php` وغيّر `register_key`
3. اجعل `data/` قابلاً للكتابة
4. افتح `https://موقعك/bader-sync/api.php` — يجب أن يظهر `{"ok":false,"error":"method_not_allowed"}`

الشرح الكامل: `docs/ANDROID-SYNC-AR.md`
