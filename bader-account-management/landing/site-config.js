/**
 * ملف إعدادات صفحة الدعاية — هذا هو الملف الوحيد الذي تحتاج لتعديله.
 * Landing-page settings — the only file you need to edit.
 * بعد التعديل احفظ الملف وارفع مجلد landing إلى موقعك (أو افتح index.html للمعاينة).
 */
window.SITE_CONFIG = {
  // ---------- السعر / Price ----------
  price: {
    amount: 49,            // السعر الحالي
    oldAmount: 79,         // السعر قبل الخصم (ضع 0 لإخفائه)
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
    email: "contact@baderinfo.com",
    phone: "",                               // مثال: +213 555 00 00 00
    whatsapp: "",                            // أرقام فقط مع رمز الدولة، مثال: 213555000000
    telegram: "",                            // اسم المستخدم بدون @
    website: "https://baderinfo.com",
    address: { ar: "", en: "", fr: "" },     // اختياري
  },

  // ---------- العلامة / Brand ----------
  brand: {
    name: "Bader Account Management",
    version: "3.0.0",
    primaryColor: "#0ea5e9",                 // لون الصفحة الرئيسي
  },

  defaultLang: "ar",                         // ar | en | fr
};
