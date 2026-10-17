# Template App

برنامج مكتبي لويندوز (Electron + Next.js) بثلاث لغات (العربية / English / Français) — صنعه Baderinfo. بياناته مشفّرة محلياً (AES-256-GCM) بكلمة مرور رئيسية، ويعمل دون إنترنت، وبترخيص لجهاز واحد.

## أدلة
| الدليل | الموضوع |
|---|---|
| [`docs/BUILD-EXE-AR.md`](docs/BUILD-EXE-AR.md) | بناء ملف التثبيت `.exe` |
| [`docs/LICENSE-AR.md`](docs/LICENSE-AR.md) | الترخيص مع لوحة BaderProgLicense |
| [`docs/WORDPRESS-AR.md`](docs/WORDPRESS-AR.md) | صفحة البيع على ووردبريس (`wordpress/`) |
| [`landing/README-AR.md`](landing/README-AR.md) | صفحة دعاية مستقلة (`landing/`) |

## التشغيل
```
npm install            # Node 22 أو أحدث
npm run electron:dev   # تشغيل للتطوير (لا يطلب ترخيصاً)
npm run typecheck && npm test && npm run build
npm run dist           # ملف التثبيت داخل dist/ (على ويندوز أو عبر GitHub Actions)
```

## ملاحظات صادقة
- لا يوجد استرجاع لكلمة المرور الرئيسية: إن نُسيت فُقدت البيانات (هذا ثمن التشفير الحقيقي). النسخ الاحتياطي `.bbak` مشفّر بكلمة مرور خاصة.
- التشفير لا يحمي من برنامج خبيث يعمل على الجهاز والبرنامج مفتوح؛ استعمل القفل عند الابتعاد.
- ملف التثبيت غير موقّع رقمياً افتراضياً (تحذير SmartScreen).
