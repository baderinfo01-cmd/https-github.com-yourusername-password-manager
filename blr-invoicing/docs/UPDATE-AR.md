# تحديث BLR Fatourati لاحقًا — دليل المطوّر

هذا الملف المضغوط يحتوي **كود المصدر الكامل** للنسخة 1.0.0 (بدون `node_modules` و`out` و`dist`، تُنشأ تلقائيًا).

## 1) تجهيز بيئة العمل (مرة واحدة)
1. ثبّت **Node.js 22 LTS** من https://nodejs.org
2. فك الضغط في مسار قصير بعيد عن OneDrive، مثل `C:\dev\blr`.
3. افتح PowerShell داخل المجلد ثم:
```
npm install
npm test            # 19 اختبارًا: قاعدة البيانات، الحسابات، الترخيص
npm run electron:dev   # يشغّل البرنامج للتجربة (بدون طلب ترخيص)
```

## 2) خريطة الكود (أين أعدّل؟)
| أريد تعديل… | الملف |
|---|---|
| قاعدة البيانات، المستخدمون، كلمة المرور والاسترجاع، النسخ الاحتياطي | `electron/db.js` |
| الطباعة وPDF والملفات والنوافذ | `electron/main.js` |
| الذكاء الاصطناعي (Claude) | `electron/ai.js` |
| جسر الأمان بين الواجهة والنظام | `electron/preload.js` |
| الترخيص (الخادم، المفتاح العام، معرّف المنتج) | `bader-license/license-config.js` |
| منطق الفواتير والمخزون والدفعات | `src/store/data.ts` |
| حسابات الضرائب والمجاميع | `src/lib/calc.ts` |
| تصميم الفاتورة المطبوعة | `src/lib/invoiceHtml.ts` |
| تصميم الإيصال / شهادة الترخيص | `src/lib/receiptHtml.ts`, `src/lib/licenseHtml.ts` |
| كل النصوص (عربي/إنجليزي/فرنسي) | `src/lib/dict.ts` |
| الصفحات | `src/app/**/page.tsx` |
| القوائم والشريط العلوي وشاشة الدخول | `src/components/Shell.tsx` |
| الألوان والخط والأزرار | `src/app/globals.css`, `src/components/ui.tsx` |
| اسمك ومعلوماتك (المطوّر) | `src/lib/brand.ts` |
| الشعار والأيقونة | `public/brand/` و`build/icon.png` |
| الافتراضيات (الضرائب، الترقيم، العملة) | `src/lib/defaults.ts` |

> أضف أي نص جديد في `dict.ts` بالصيغ الثلاث `["عربي","English","Français"]` ثم استعمله بـ `t("المفتاح")`.

## 3) إصدار نسخة جديدة
1. عدّل الكود وجرّبه بـ `npm run electron:dev`.
2. ارفع الرقم في `package.json` ← `"version": "1.0.1"`.
3. `npm test` ثم `npm run dist` ← الناتج `dist\BLR Fatourati-Setup-1.0.1.exe`.
4. أرسل المثبّت للزبون؛ يُثبَّت فوق القديم وتبقى بياناته وترخيصه (في `%APPDATA%\blr-invoicing`).

### بناء تلقائي على GitHub
الملف `.github/workflows/build-blr-windows.yml` (في جذر المستودع الأصلي) يبني المثبّت على خوادم ويندوز وينشره في «Releases» مع هذا الملف المضغوط. شغّله من تبويب Actions.

## 4) الترخيص
- المنتج في لوحتك: المعرّف `blr-invoicing` (نوع «برنامج .exe»). يجب أن يطابق `product_id` في `license-config.js`.
- `public_key` و`server_url` في `license-config.js` يجب أن يطابقا لوحتك (`npm run license:doctor` يتحقق).
- المفتاح **الخاص** للتوقيع يبقى في لوحتك فقط، ولا يوجد في هذا الكود.

## 5) ملاحظات مهمة
- بيانات الزبون في `%APPDATA%\blr-invoicing\data\blr.sqlite`. عند تغيير بنية البيانات أضف ترحيلًا (migration) ولا تحذف حقولًا قديمة.
- كلمات مرور المستخدمين وملف مفتاح الاسترجاع مخزّنة مجزّأة فقط؛ لا تضف أي كود يطبعها أو يرسلها.
- مفتاح Anthropic يضعه الزبون بنفسه ويُخزَّن مشفّرًا بحماية ويندوز.
- ملف التثبيت غير موقّع؛ للتخلص من تحذير SmartScreen اشترِ شهادة Code Signing وعيّن `CSC_LINK` و`CSC_KEY_PASSWORD`.
- صفحة الدعاية: `landing/` (ثابتة) و`wordpress/blr-landing.zip` (إضافة ووردبريس).
