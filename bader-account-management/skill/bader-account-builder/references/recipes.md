# Recipes: recreate the real app's modules in a new program

All commands assume `APP=~/dev/<slug>` made by `new_app.py`. Wording is Arabic-first; adjust labels. Secret fields are `password` type.

## Cards (بطاقات)
```bash
python3 scripts/add_module.py --app $APP --kind cards --type Card --ar "البطاقات" --en "Cards" --fr "Cartes" --ar1 بطاقة --en1 Card --fr1 Carte --icon CreditCard \
 --field "holderName|text|اسم صاحب البطاقة|Card holder|Titulaire" \
 --field "type|select(bank=بطاقة بنكية/Bank card/Carte bancaire,membership=بطاقة عضوية/Membership/Adhésion,shopping=بطاقة شراء/Shopping/Achats,other=أخرى/Other/Autre)|النوع|Type|Type" \
 --field "issuerBank|text|البنك|Bank|Banque" \
 --field "cardNumber|password|رقم البطاقة|Card number|N° de carte" \
 --field "expiryDate|date|تاريخ الانتهاء|Expiry|Expiration" \
 --field "pinCode|password|الرمز السري|PIN|Code PIN" \
 --field "cvv|password|CVV|CVV|CVV" \
 --field "iban|text|IBAN|IBAN|IBAN" \
 --field "notes|textarea|ملاحظات|Notes|Notes"
```
Then add an expiry radar tool (names + `expiryDate` only; see data-model.md) if the owner wants "تنبيه قبل الانتهاء". Printouts mask the card number (`maskCard` in `printReport.ts`): adapt the generated `printCard` to use it.

## Documents (الوثائق الشخصية)
```bash
python3 scripts/add_module.py --app $APP --kind documents --type Doc --ar "الوثائق" --en "Documents" --fr "Documents" --ar1 وثيقة --en1 Document --fr1 Document --icon FileText \
 --field "holderName|text|اسم صاحب الوثيقة|Holder|Titulaire" \
 --field "type|select(national_id=بطاقة التعريف الوطنية/National ID/Carte d’identité,passport=جواز السفر/Passport/Passeport,driving_license=رخصة السياقة/Driving licence/Permis,other=أخرى/Other/Autre)|النوع|Type|Type" \
 --field "documentNumber|password|رقم الوثيقة|Document no.|N° du document" \
 --field "issueDate|date|تاريخ الإصدار|Issue date|Date d’émission" \
 --field "expiryDate|date|تاريخ الانتهاء|Expiry|Expiration" \
 --field "issuePlace|text|مكان الإصدار|Issued at|Lieu d’émission" \
 --field "notes|textarea|ملاحظات|Notes|Notes"
```
(Document type "Doc" avoids clashing with the DOM `Document` type in TypeScript: the real app imports it as `Document` and shadows the global; avoid that.)

## Contacts (بيانات الاتصال)
```bash
python3 scripts/add_module.py --app $APP --kind contacts --type Contact --ar "جهات الاتصال" --en "Contacts" --fr "Contacts" --ar1 "جهة اتصال" --en1 Contact --fr1 Contact --icon Phone \
 --field "fullName|text|الاسم الكامل|Full name|Nom complet" \
 --field "category|select(family=الأهل/Family/Famille,friends=الأصدقاء/Friends/Amis,work=العمل/Work/Travail,other=أخرى/Other/Autre)|التصنيف|Category|Catégorie" \
 --field "phone1|tel|الهاتف 1|Phone 1|Téléphone 1" --field "phone2|tel|الهاتف 2|Phone 2|Téléphone 2" \
 --field "email|email|البريد|Email|E-mail" --field "city|text|المدينة|City|Ville" --field "notes|textarea|ملاحظات|Notes|Notes"
```

## Subscriptions (الاشتراكات)
```bash
python3 scripts/add_module.py --app $APP --kind subscriptions --type Subscription --ar "الاشتراكات" --en "Subscriptions" --fr "Abonnements" --ar1 اشتراك --en1 Subscription --fr1 Abonnement --icon Crown \
 --field "name|text|اسم الخدمة|Service|Service" \
 --field "status|select(active=نشط/Active/Actif,expired=منتهٍ/Expired/Expiré,frozen=مجمّد/Frozen/Gelé)|الحالة|Status|Statut" \
 --field "endDate|date|تاريخ الانتهاء|End date|Date de fin" --field "price|number|السعر|Price|Prix" --field "currency|text|العملة|Currency|Devise" \
 --field "username|text|اسم المستخدم|Username|Nom d’utilisateur" --field "password|password|كلمة المرور|Password|Mot de passe" \
 --field "notes|textarea|ملاحظات|Notes|Notes"
```
Add the radar (`buildRadar`) and the dashboard "ends in <= 30 days" warning by copying from the real `aiTools.ts` / `dashboard/page.tsx`.

## Bigger real pages (copy by reading; they are not generic)
- `analytics/page.tsx` (recharts): add `recharts` to devDependencies and keep the chart code client-only; wrap in `AppLayout`; no external data.
- `my-info` / `my-account` (profile + CV sections), `setup-profile` (first-run wizard gated by `localStorage["bader-first-setup-completed-v1"]` in `AppLayout`): only if the new program needs a person profile. The wizard flag is a plain localStorage key (not secret).
- `developer` and `contact` pages: static contact cards from `branding.developer`; the template shows the same support block at the bottom of `license-info`.
- Header features of the real app (global search, notification bell built from expiring items, colour theme popover, clock): optional polish; the template Header only has language, dark mode, lock.
