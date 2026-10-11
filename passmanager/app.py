"""Tkinter GUI. Run with: python -m passmanager"""
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

from .vault import Vault, VaultError, WrongPassword, generate_password

AUTO_LOCK_MS = 5 * 60 * 1000


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("مدير كلمات المرور")
        self.geometry("720x420")
        self.vault = Vault()
        self._lock_job = None
        self._build()
        self.bind_all("<Key>", self._reset_timer)
        self.bind_all("<Button>", self._reset_timer)
        self.after(100, self._login)

    def _build(self):
        top = ttk.Frame(self, padding=6)
        top.pack(fill="x")
        self.q = tk.StringVar()
        self.q.trace_add("write", lambda *_: self._refresh())
        ttk.Label(top, text="بحث:").pack(side="left")
        ttk.Entry(top, textvariable=self.q).pack(side="left", fill="x", expand=True, padx=6)
        for text, cmd in [("إضافة", self._add), ("تعديل", self._edit), ("حذف", self._delete),
                          ("نسخ كلمة المرور", self._copy), ("قفل", self._lock)]:
            ttk.Button(top, text=text, command=cmd).pack(side="left", padx=2)
        self.tree = ttk.Treeview(self, columns=("site", "user"), show="headings")
        self.tree.heading("site", text="الموقع")
        self.tree.heading("user", text="اسم المستخدم")
        self.tree.pack(fill="both", expand=True, padx=6, pady=6)
        self.tree.bind("<Double-1>", lambda _e: self._edit())

    def _login(self):
        while True:
            if self.vault.exists():
                pw = simpledialog.askstring("فتح الخزنة", "كلمة المرور الرئيسية:", show="*", parent=self)
                if pw is None:
                    return self.destroy()
                try:
                    self.vault.unlock(pw)
                    break
                except WrongPassword:
                    messagebox.showerror("خطأ", "كلمة المرور غير صحيحة")
                except VaultError as e:
                    messagebox.showerror("خطأ", str(e))
                    return self.destroy()
            else:
                pw = simpledialog.askstring("إنشاء خزنة", "اختر كلمة مرور رئيسية:", show="*", parent=self)
                if pw is None:
                    return self.destroy()
                if len(pw) < 8:
                    messagebox.showerror("خطأ", "يجب ألا تقل عن 8 أحرف")
                    continue
                self.vault.create(pw)
                break
        self._refresh()
        self._reset_timer()

    def _reset_timer(self, _e=None):
        if self._lock_job:
            self.after_cancel(self._lock_job)
        self._lock_job = self.after(AUTO_LOCK_MS, self._lock)

    def _lock(self):
        self.vault.lock()
        self.tree.delete(*self.tree.get_children())
        self._login()

    def _refresh(self):
        self.tree.delete(*self.tree.get_children())
        for i, e in self.vault.search(self.q.get()):
            self.tree.insert("", "end", iid=str(i), values=(e["site"], e["username"]))

    def _selected(self):
        sel = self.tree.selection()
        return int(sel[0]) if sel else None

    def _form(self, entry=None):
        entry = entry or {"site": "", "username": "", "password": "", "notes": ""}
        win = tk.Toplevel(self)
        win.transient(self)
        win.grab_set()
        vars_ = {}
        for r, (k, label) in enumerate([("site", "الموقع"), ("username", "اسم المستخدم"),
                                         ("password", "كلمة المرور"), ("notes", "ملاحظات")]):
            ttk.Label(win, text=label).grid(row=r, column=0, padx=6, pady=4, sticky="e")
            vars_[k] = tk.StringVar(value=entry[k])
            ttk.Entry(win, textvariable=vars_[k], width=36,
                      show="*" if k == "password" else "").grid(row=r, column=1, padx=6)
        ttk.Button(win, text="توليد", command=lambda: vars_["password"].set(generate_password(20))
                   ).grid(row=2, column=2, padx=6)
        result = {}

        def ok():
            result.update({k: v.get() for k, v in vars_.items()})
            win.destroy()
        ttk.Button(win, text="حفظ", command=ok).grid(row=4, column=1, pady=8)
        self.wait_window(win)
        return result or None

    def _add(self):
        data = self._form()
        if data:
            try:
                self.vault.add(**data)
            except VaultError as e:
                return messagebox.showerror("خطأ", str(e))
            self._refresh()

    def _edit(self):
        i = self._selected()
        if i is None:
            return
        data = self._form(self.vault.entries[i])
        if data:
            self.vault.update(i, **data)
            self._refresh()

    def _delete(self):
        i = self._selected()
        if i is not None and messagebox.askyesno("تأكيد", "حذف هذا الإدخال؟"):
            self.vault.delete(i)
            self._refresh()

    def _copy(self):
        i = self._selected()
        if i is None:
            return
        self.clipboard_clear()
        self.clipboard_append(self.vault.entries[i]["password"])
        self.after(20_000, self.clipboard_clear)
        messagebox.showinfo("تم", "تم النسخ، وسيُمسح من الحافظة بعد 20 ثانية")


def main():
    App().mainloop()
