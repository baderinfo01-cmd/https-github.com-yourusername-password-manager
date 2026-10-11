/**
 * ملف إعدادات صفحة الدعاية — هذا هو الملف الوحيد الذي تحتاج لتعديله.
 * Landing-page settings — the only file you need to edit.
 * بعد التعديل احفظ الملف وارفع مجلد landing إلى موقعك (أو افتح index.html للمعاينة).
 */
window.SITE_CONFIG = {
  // ---------- السعر / Price ----------
  price: {
    amount: 99,            // السعر الحالي
    oldAmount: 149,         // السعر قبل الخصم (ضع 0 لإخفائه)
    currency: "USD",       // رمز العملة: USD, EUR, DZD, SAR ...
    // "once" = دفعة واحدة مدى الحياة | "year" = سنوي | "month" = شهري
    period: "once",
    // نص الشارة فوق السعر (اتركه فارغاً لإخفائه) — لكل لغة
    badge: { ar: "عرض الإطلاق", en: "Launch offer", fr: "Offre de lancement" },
  },

  // ---------- الروابط / Links ----------
  links: {
    buy: "https://baderinfo.com/",          // رابط الشراء (صفحة الدفع أو الطلب)
    download: "",                            // رابط تحميل التجربة/النسخة (اتركه فارغاً لإخفاء الزر)
    privacy: "",                             // رابط سياسة الخصوصية (اختياري)
  },

  // ---------- معلومات الاتصال / Contact ----------
  contact: {
    email: "baderinfo12@gmail.com",
    phone: "0550896115",                     // مثال: +213 555 00 00 00
    whatsapp: "213550896115",                // أرقام فقط مع رمز الدولة (الرقم نفسه واتساب)
    telegram: "",                            // اسم المستخدم بدون @
    website: "https://baderinfo.com",
    address: { ar: "", en: "", fr: "" },     // اختياري
  },

  // ---------- العلامة / Brand ----------
  brand: {
    name: "BLR Fatourati",
    version: "1.0.0",
    primaryColor: "#0284c7",                 // لون الصفحة الرئيسي
  },

  defaultLang: "ar",                         // ar | en | fr
};
