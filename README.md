# مدير كلمات المرور (Desktop Password Manager)

برنامج مكتبي بـ Python/Tkinter. تُحفظ البيانات مشفّرة (Fernet + PBKDF2-SHA256) في `~/.passmanager/vault.json`.

```
pip install -r requirements.txt
python -m passmanager      # تشغيل البرنامج (يتطلب tkinter)
python -m pytest tests     # الاختبارات
```

المزايا: خزنة مشفّرة بكلمة مرور رئيسية، إضافة/تعديل/حذف/بحث، مولّد كلمات مرور، نسخ مع مسح الحافظة تلقائياً، قفل تلقائي بعد 5 دقائق.
