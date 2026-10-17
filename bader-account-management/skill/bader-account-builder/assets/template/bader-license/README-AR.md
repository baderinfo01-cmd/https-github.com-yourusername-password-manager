# حماية برنامجك بترخيص — Bader License for Electron

هذه المكتبة تحمي برنامجك (الذي ستحوّله إلى ملف `.exe` بـ Electron) بترخيص يرتبط **بجهاز الزبون**. الكود المفعّل على جهاز لا يعمل على أي جهاز آخر.

## كيف تعمل باختصار

- عند أول تشغيل، يحسب البرنامج **بصمة جهاز** الزبون ويرسلها مع الكود إلى لوحتك على baderinfo.com. اللوحة تربط الكود بهذا الجهاز نهائياً وترسل ترخيصاً موقّعاً.
- في كل تشغيل، يتحقق البرنامج من التوقيع **محلياً** (بدون إنترنت). نسخ الملف `.exe` إلى حاسوب آخر لا يعمل، لأن البصمة مختلفة.
- كل 12 ساعة يسأل البرنامج اللوحة: هل أُلغي الترخيص أو مُدّد أو نُقل؟ وإذا انقطع الإنترنت أكثر من 14 يوماً يتوقف البرنامج.
- **أثناء التطوير** (`npm run dev`): البرنامج يعمل بدون ترخيص حتى لا يعطّلك. الحماية تعمل فقط في ملف `.exe` النهائي.

## الملفات

| الملف | ماذا تفعل به |
|---|---|
| `device-id.js` | بصمة الجهاز. **لا تعدّله أبداً.** تعديله يُبطل تراخيص كل الزبائن. |
| `license.js` | قلب الترخيص. لا تعدّله. |
| `guard.js` | دالة واحدة تحمي البرنامج كله. |
| `preload.js` و `activation.html` | صفحة التفعيل التي تظهر للزبون. |
| `license-config.js` | **الملف الوحيد الذي تعدّله.** إعدادات برنامجك. |

## خطوات الدمج (بعد أن تنتهي من تطوير البرنامج)

### 1. حوّل برنامج Next.js إلى Electron
إن لم تكن فعلت بعد، هذه أبسط طريقة لبرنامج Next.js:

```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

في `next.config.ts` اجعل الإخراج ثابتاً حتى يعمل داخل Electron:
```ts
const nextConfig = { output: 'export', images: { unoptimized: true } };
export default nextConfig;
```

### 2. ضع مجلد `bader-license` بجانب ملف main process
انسخ مجلد `bader-license` كاملاً إلى جذر مشروعك.

### 3. أنشئ ملف `electron-main.js` في جذر المشروع

```js
const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { guardApp } = require('./bader-license/guard');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280, height: 800,
        webPreferences: { contextIsolation: true },
    });
    // بعد البناء، صفحات Next.js تكون في مجلد out/
    win.loadFile(path.join(__dirname, 'out', 'index.html'));
}

app.whenReady().then(() => {
    guardApp({ ipcMain, BrowserWindow, createWindow });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
```

### 4. عدّل `package.json`

```json
{
  "main": "electron-main.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "electron:dev": "concurrently \"next dev\" \"wait-on http://localhost:3000 && electron .\"",
    "dist": "next build && electron-builder"
  },
  "build": {
    "appId": "com.example.templateapp",
    "productName": "Template App",
    "files": ["electron-main.js", "bader-license/**/*", "out/**/*"],
    "win": { "target": "nsis" }
  }
}
```

### 5. اكتب معرّف المنتج في `bader-license/license-config.js`
افتح لوحة التراخيص، أضف المنتج من صفحة **المنتجات** واختر نوع الربط **«برنامج (.exe)»**، ثم انسخ **معرّف المنتج** وضعه في `product_id`. باقي القيم (عنوان الخادم والمفتاح العام) جاهزة.

### 6. ابنِ ملف .exe

```bash
npm run dist
```

يظهر الملف في مجلد `dist/`. عند أول تشغيل تظهر صفحة التفعيل.

## التحقق من خطة الزبون (Basic / Pro)

إذا أردت إخفاء ميزة عن خطة Basic (مثل الإحصائيات):

```js
const { getLicense } = require('./bader-license/guard');

// في المعالج الرئيسي
ipcMain.handle('can-use-stats', async () => {
    return await getLicense().hasEdition('pro');
});
```

ثم في الواجهة، أظهر الميزة فقط إذا رجعت `true`. **المهم**: ضع هذا التحقق في المعالج الرئيسي (main)، لا في الواجهة وحدها، حتى لا يتجاوزه الزبون.

## أسئلة شائعة

**هل تعديلاتي على البرنامج تؤثر على الترخيص؟**
لا. عدّل برنامجك بحرية. فقط لا تلمس `device-id.js` و `license.js`.

**الزبون غيّر حاسوبه، ماذا يفعل؟**
افتح الكود في اللوحة، اضغط **«نقل إلى جهاز جديد»**، ثم يدخل الزبون نفس الكود في الحاسوب الجديد.

**هل بصمة الجهاز تتغير عند تحديث ويندوز أو إعادة تثبيت البرنامج؟**
لا. البصمة مبنية على مكونات الحاسوب (المعالج، اللوحة الأم، القرص)، فتبقى ثابتة.

**ماذا لو فشلت قراءة البصمة؟**
نادر جداً. تطلب الصفحة من الزبون تشغيل البرنامج كمسؤول (Run as administrator) مرة واحدة عند التفعيل.
