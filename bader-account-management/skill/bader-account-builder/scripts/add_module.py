#!/usr/bin/env python3
"""Add a new CRUD module (data + page + navigation + 3 languages + backup + print) to an app made from assets/template.

  python3 add_module.py --app ~/dev/my-vault --kind clients --type Client \
      --ar "العملاء" --en "Clients" --fr "Clients"  --ar1 "عميل" --en1 "Client" --fr1 "Client" \
      --icon Users \
      --field "name|text|الاسم|Name|Nom" \
      --field "phone|tel|الهاتف|Phone|Téléphone" \
      --field "portalPassword|password|كلمة مرور البوابة|Portal password|Mot de passe du portail" \
      --field "since|date|عميل منذ|Client since|Client depuis" \
      --field "balance|number|الرصيد|Balance|Solde" \
      --field "status|select(active=نشط/Active/Actif,paused=متوقف/Paused/En pause)|الحالة|Status|Statut" \
      --field "notes|textarea|ملاحظات|Notes|Notes"

  --field "key|type|ar|en|fr"   (repeat). The FIRST field is the title (type text, required). Types:
      text textarea tel email url password number date  select(value=ar/en/fr,value2=ar/en/fr)
      `password` fields are secrets: masked in the page, copy button (auto-clears the clipboard),
      hidden on printouts unless the user agrees. Never add a secret field to anything sent to the AI.
  Without --field you get: name (text) + notes (textarea).

What it changes (all with markers that the template contains; run `git diff` afterwards):
  src/types/index.ts            + interface <Type>
  src/store/useStore.ts         + state, actions, backup export/import/clear lines at the `// @module-*` markers
  src/app/[locale]/<route>/page.tsx   (new)
  src/components/layout/Sidebar.tsx   + menu entry at `// @nav`
  src/app/[locale]/dashboard/page.tsx + counter card
  src/lib/reports.ts            + print<Type>()
  messages/{ar,en,fr}.json      + nav.<kind> and a "<kind>" namespace
Then:  npm run typecheck && npm test && npm run build
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MOD = HERE.parent / "assets" / "module"
TYPES = {"text", "textarea", "tel", "email", "url", "password", "number", "date", "select"}
RESERVED = {"accounts", "myInfo", "activityLog", "generatedPasswords", "settings", "security", "dashboard", "ai",
            "generator", "licenseInfo", "theme", "aiApiKey", "license"}


def die(m):
    print("ERROR: " + m, file=sys.stderr)
    sys.exit(1)


def kebab(s):
    return re.sub(r"(?<!^)(?=[A-Z])", "-", s).lower()


def js(s):
    return json.dumps(s, ensure_ascii=False)


def insert_before(text, marker, lines):
    """Insert `lines` (str, no indentation) before the line holding `marker`, keeping the marker's indentation."""
    m = re.search(r"^([ \t]*)" + re.escape(marker), text, re.M)
    if not m:
        die(f"marker '{marker}' not found: the file was edited too much (restore the marker or add the code by hand)")
    ind = m.group(1)
    block = "".join(ind + ln + "\n" if ln.strip() else "\n" for ln in lines.rstrip("\n").split("\n"))
    return text[: m.start()] + block + text[m.start():]


def add_lucide(text, icon):
    m = re.search(r'import\s*\{([^}]*)\}\s*from\s*"lucide-react";', text, re.S)
    if not m:
        die("no lucide-react import found")
    names = [x.strip() for x in m.group(1).split(",") if x.strip()]
    if icon in names:
        return text
    names.append(icon)
    multi = "\n" in m.group(1)
    body = ("\n  " + ",\n  ".join(names) + ",\n") if multi else " " + ", ".join(names) + " "
    return text[: m.start(1)] + body + text[m.end(1):]


def parse_field(spec):
    parts = spec.split("|")
    if len(parts) != 5:
        die(f'--field "{spec}": expected key|type|ar|en|fr')
    key, typ, ar, en, fr = [p.strip() for p in parts]
    opts = []
    mm = re.fullmatch(r"select\((.*)\)", typ)
    if mm:
        typ = "select"
        for o in mm.group(1).split(","):
            v, _, labels = o.partition("=")
            ls = labels.split("/")
            if not v.strip() or len(ls) != 3:
                die(f'select option "{o}": expected value=ar/en/fr')
            opts.append((v.strip(), *[x.strip() for x in ls]))
    if not re.fullmatch(r"[a-z][a-zA-Z0-9]{0,24}", key):
        die(f"field key '{key}' must match [a-z][a-zA-Z0-9]*")
    if key in ("id", "isFavorite", "createdAt", "updatedAt"):
        die(f"field key '{key}' is reserved")
    if typ not in TYPES:
        die(f"field type '{typ}' unknown (use {', '.join(sorted(TYPES))})")
    if typ == "select" and not opts:
        die("select needs options: select(a=ar/en/fr,b=ar/en/fr)")
    return {"key": key, "type": typ, "ar": ar, "en": en, "fr": fr, "opts": opts}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--app", required=True)
    ap.add_argument("--kind", required=True, help="plural camelCase id: store slice, nav key, messages namespace (e.g. clients, bankCards)")
    ap.add_argument("--type", required=True, help="PascalCase singular TypeScript interface (e.g. Client)")
    for l in ("ar", "en", "fr"):
        ap.add_argument(f"--{l}", required=True, help=f"plural title ({l})")
        ap.add_argument(f"--{l}1", required=True, help=f"singular name ({l})")
    ap.add_argument("--icon", default="Folder", help="lucide-react icon name")
    ap.add_argument("--field", action="append", default=[])
    a = ap.parse_args()

    app = Path(a.app).expanduser().resolve()
    store_p = app / "src" / "store" / "useStore.ts"
    if not store_p.is_file() or not (app / "messages" / "ar.json").is_file():
        die(f"{app} does not look like an app made from the template")
    if not re.fullmatch(r"[a-z][a-zA-Z0-9]{1,24}", a.kind):
        die("kind must be camelCase letters/digits, 2-25 chars, starting lower-case")
    if a.kind in RESERVED:
        die(f"'{a.kind}' is reserved")
    if not re.fullmatch(r"[A-Z][A-Za-z0-9]{1,30}", a.type):
        die("type must be PascalCase, e.g. Client")
    store = store_p.read_text(encoding="utf-8")
    if re.search(rf"^\s*{a.kind}\s*:", store, re.M) or f"interface {a.type} " in (app / "src/types/index.ts").read_text(encoding="utf-8"):
        die(f"module '{a.kind}' / type '{a.type}' already exists")
    for marker in ("@module-type-imports", "@module-state-types", "@module-action-types", "@module-initial", "@module-actions", "@module-export", "@module-import", "@module-clear"):
        if marker not in store:
            die(f"useStore.ts lost the marker // {marker}")

    fields = [parse_field(f) for f in a.field] or [
        parse_field("name|text|الاسم|Name|Nom"), parse_field("notes|textarea|ملاحظات|Notes|Notes")]
    if fields[0]["type"] != "text":
        die("the first field is the title and must be of type text")
    keys = [f["key"] for f in fields]
    if len(set(keys)) != len(keys):
        die("duplicate field keys")
    title = fields[0]["key"]
    route = kebab(a.kind)
    Type, kind, Icon = a.type, a.kind, a.icon
    if not re.fullmatch(r"[A-Z][A-Za-z0-9]*", Icon):
        die("icon must be a lucide-react component name like Users")
    page_p = app / "src" / "app" / "[locale]" / route / "page.tsx"
    if page_p.exists():
        die(f"{page_p} already exists")

    # ---------- types ----------
    ts = []
    for f in fields:
        opt = "" if f is fields[0] else "?"
        if f["type"] == "number":
            ts.append(f"  {f['key']}{opt}: number;")
        elif f["type"] == "select":
            ts.append(f"  {f['key']}{opt}: {' | '.join(js(o[0]) for o in f['opts'])};")
        else:
            ts.append(f"  {f['key']}{opt}: string;")
    tp = app / "src" / "types" / "index.ts"
    t = tp.read_text(encoding="utf-8").rstrip("\n")
    t += f"\n\nexport interface {Type} {{\n  id: string;\n" + "\n".join(ts) + "\n  isFavorite: boolean;\n  createdAt: string;\n  updatedAt: string;\n}\n"
    tp.write_text(t, encoding="utf-8")

    # ---------- store ----------
    s = store
    s = insert_before(s, "// @module-type-imports", f"{Type},")
    s = insert_before(s, "// @module-state-types", f"{kind}: {Type}[];")
    s = insert_before(s, "// @module-action-types", "\n".join([
        f'add{Type}: (item: Omit<{Type}, "id" | "createdAt" | "updatedAt" | "isFavorite"> & {{ isFavorite?: boolean }}) => void;',
        f"update{Type}: (id: string, item: Partial<{Type}>) => void;",
        f"delete{Type}: (id: string) => void;",
        f"toggleFavorite{Type}: (id: string) => void;"]))
    s = insert_before(s, "// @module-initial", f"{kind}: [],")
    actions = (MOD / "store-actions.tpl").read_text(encoding="utf-8").replace("__Type__", Type).replace("__kind__", kind).replace("__TITLE__", title)
    s = insert_before(s, "// @module-actions", "\n".join(l[6:] if l.startswith("      ") else l for l in actions.rstrip("\n").split("\n")))
    s = insert_before(s, "// @module-export", f"{kind}: get().{kind},")
    s = insert_before(s, "// @module-import", f"if (arr(data.{kind})) set({{ {kind}: data.{kind} as {Type}[] }});")
    s = insert_before(s, "// @module-clear", f"{kind}: [],")
    store_p.write_text(s, encoding="utf-8")

    # ---------- page ----------
    empty = "{ " + ", ".join(f"{f['key']}: {('0' if f['type']=='number' else js(f['opts'][0][0]) if f['type']=='select' else js(''))}" for f in fields[:1] + [x for x in fields[1:] if x["type"] != "number"]) + " }"
    searchable = [f["key"] for f in fields if f["type"] in ("text", "textarea", "tel", "email", "url", "select")]
    search = "[" + ", ".join(f"r.{k}" for k in searchable) + "]"
    shown = [f for f in fields if f["type"] not in ("textarea", "password")][:4]
    th = "".join(f'<th className={{th}}>{{t("f_{f["key"]}")}}</th>' for f in shown)
    def cell(f, i):
        k = f["key"]
        cls = "td" + (' + " font-medium"' if i == 0 else "")
        if f["type"] == "number":
            return f'<td className={{`${{td}} num`}}>{{r.{k} ?? "—"}}</td>'
        if f["type"] == "date":
            return f'<td className={{`${{td}} num`}}>{{r.{k} ? formatDate(r.{k}, locale) : "—"}}</td>'
        if f["type"] in ("tel", "email", "url"):
            return f'<td className={{`${{td}} num`}} dir="ltr">{{r.{k} || "—"}}</td>'
        if f["type"] == "select":
            return f'<td className={{td}}>{{r.{k} ? t(`o_{k}_${{r.{k}}}`) : "—"}}</td>'
        extra = ' font-medium' if i == 0 else ''
        return f'<td className={{`${{td}}{extra}`}} dir="auto">{{r.{k} || "—"}}</td>'
    td_lines = ["                    " + cell(f, i) for i, f in enumerate(shown)]
    for f in fields:
        if f["type"] == "password":
            k = f["key"]
            td_lines.append(f'                    <td className={{td}}>{{r.{k} ? <button onClick={{() => copy(r.id, r.{k} as string)}} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg" aria-label={{tc("copy")}}><Copy className="w-4 h-4" />{{copied === r.id ? tc("copied") : t("f_{k}")}}</button> : "—"}}</td>')
    th += "".join(f'<th className={{th}}>{{t("f_{f["key"]}")}}</th>' for f in fields if f["type"] == "password")
    form = []
    for f in fields:
        k, ty = f["key"], f["type"]
        lab = f'{{t("f_{k}")}}' + (" *" if f is fields[0] else "")
        first = " autoFocus" if f is fields[0] else ""
        if ty == "textarea":
            ctl = f'<textarea className={{input}} rows={{3}} dir="auto" value={{editing.{k} ?? ""}} onChange={{(e) => setEditing({{ ...editing, {k}: e.target.value }})}} />'
        elif ty == "select":
            ctl = f'<select className={{input}} value={{editing.{k} ?? ""}} onChange={{(e) => setEditing({{ ...editing, {k}: e.target.value as {Type}["{k}"] }})}}>' + "".join(f'<option value={js(o[0])}>{{t("o_{k}_{o[0]}")}}</option>' for o in f["opts"]) + "</select>"
        elif ty == "number":
            ctl = f'<input className={{input}} inputMode="decimal" dir="ltr" value={{editing.{k} ?? ""}} onChange={{(e) => setEditing({{ ...editing, {k}: e.target.value as unknown as number }})}} />'
        elif ty == "date":
            ctl = f'<input className={{input}} type="date" dir="ltr" value={{editing.{k} ?? ""}} onChange={{(e) => setEditing({{ ...editing, {k}: e.target.value }})}} />'
        elif ty == "password":
            ctl = f'<input className={{input}} type="password" dir="ltr" autoComplete="off" value={{editing.{k} ?? ""}} onChange={{(e) => setEditing({{ ...editing, {k}: e.target.value }})}} />'
        else:
            html_ty = {"tel": "tel", "email": "email", "url": "url"}.get(ty, "text")
            d = "ltr" if ty in ("tel", "email", "url") else "auto"
            ctl = f'<input className={{input}} type="{html_ty}" dir="{d}"{first} value={{editing.{k} ?? ""}} onChange={{(e) => setEditing({{ ...editing, {k}: e.target.value }})}} />'
        form.append(f'            <label className="block text-sm">{lab}{ctl}</label>')
    save = "{ " + ", ".join(
        (f"{f['key']}: Number(String(editing?.{f['key']} ?? \"\").replace(\",\", \".\")) || 0" if f["type"] == "number"
         else f"{f['key']}: String(editing?.{f['key']} ?? \"\").trim()" if f is fields[0]
         else f"{f['key']}: String(editing?.{f['key']} ?? \"\").trim() || undefined" if f["type"] != "select"
         else f"{f['key']}: (editing?.{f['key']} || undefined) as {Type}[\"{f['key']}\"]") for f in fields) + ", isFavorite: !!editing?.isFavorite }"
    # the title may not be "undefined"-able: it is a plain string
    page = (MOD / "page.tsx.tpl").read_text(encoding="utf-8")
    for k, v in (("__EMPTY__", empty), ("__SEARCH__", search), ("__SAVE__", save), ("__TH__", th), ("__TD__", "\n".join(td_lines)),
                 ("__FORM__", "\n".join(form)), ("__TITLE__", title), ("__Type__", Type), ("__kind__", kind), ("__ICON__", Icon)):
        page = page.replace(k, v)
    page_p.parent.mkdir(parents=True, exist_ok=True)
    page_p.write_text(page, encoding="utf-8")

    # ---------- sidebar + dashboard ----------
    sp = app / "src" / "components" / "layout" / "Sidebar.tsx"
    sb = add_lucide(sp.read_text(encoding="utf-8"), Icon)
    sb = insert_before(sb, "// @nav", f'{{ href: "/{route}", icon: {Icon}, key: "{kind}" }},')
    sp.write_text(sb, encoding="utf-8")
    dp = app / "src" / "app" / "[locale]" / "dashboard" / "page.tsx"
    db = add_lucide(dp.read_text(encoding="utf-8"), Icon)
    db = insert_before(db, "// @module-dashboard-selectors", f"const {kind}Count = useStore((s) => s.{kind}.length);")
    db = insert_before(db, "// @module-dashboard-cards", f'{{ href: "{route}", icon: <{Icon} className="w-6 h-6" />, label: tn("{kind}"), value: {kind}Count }},')
    dp.write_text(db, encoding="utf-8")

    # ---------- print report ----------
    rp = app / "src" / "lib" / "reports.ts"
    r = rp.read_text(encoding="utf-8")
    r = re.sub(r'import type \{([^}]*)\} from "@/types";', lambda m: f'import type {{{m.group(1).rstrip()}, {Type} }} from "@/types";', r, count=1)
    cols = []
    rowsrc = []
    for f in fields:
        k = f["key"]
        ltr = ", undefined, true" if f["type"] in ("tel", "email", "url", "password", "number", "date") else ""
        cols.append(f'    {{ key: {js(k)}, label: tm("f_{k}"){"" if not ltr else ", ltr: true"} }},')
        if f["type"] == "password":
            rowsrc.append(f"      {k}: x.{k} ? (secrets ? x.{k} : MASK) : \"\",")
        elif f["type"] == "select":
            rowsrc.append(f'      {k}: x.{k} ? tm(`o_{k}_${{x.{k}}}`) : "",')
        elif f["type"] == "date":
            rowsrc.append(f"      {k}: formatDate(x.{k}, c.locale),")
        else:
            rowsrc.append(f"      {k}: x.{k},")
    fn = f"""
export function print{Type}(c: ReportCtx, items: {Type}[], tm: Tr) {{
  const secrets = {'askSecrets(c.tp)' if any(f['type']=='password' for f in fields) else 'false'};
  printReport({{
    title: c.title,
    locale: c.locale,
    labels: reportLabels(c.tp),
    note: secretsNote(c.tp, secrets),
    columns: [
{chr(10).join(cols)}
    ],
    rows: items.map((x) => ({{
{chr(10).join(rowsrc)}
    }})),
  }});
}}
"""
    r = insert_before(r, "// @module-reports", fn.strip("\n"))
    if "formatDate" not in r.split("export interface ReportCtx")[0]:
        r = r.replace('import { MASK, printReport,', 'import { MASK, formatDate, printReport,', 1)
    rp.write_text(r, encoding="utf-8")

    # ---------- messages ----------
    for i, l in enumerate(("ar", "en", "fr")):
        p = app / "messages" / f"{l}.json"
        d = json.loads(p.read_text(encoding="utf-8"))
        d["nav"][kind] = getattr(a, l)
        ns = {
            "title": getattr(a, l),
            "subtitle": {"ar": "{count} عنصر محفوظ", "en": "{count} saved item(s)", "fr": "{count} élément(s) enregistré(s)"}[l],
            "add": {"ar": f"إضافة {a.ar1}", "en": f"Add {a.en1.lower()}", "fr": f"Ajouter : {a.fr1.lower()}"}[l],
            "edit": {"ar": f"تعديل {a.ar1}", "en": f"Edit {a.en1.lower()}", "fr": f"Modifier : {a.fr1.lower()}"}[l],
            "empty": {"ar": f"لا توجد عناصر بعد. أضف أول {a.ar1}.", "en": f"Nothing here yet. Add your first {a.en1.lower()}.", "fr": f"Rien ici. Ajoutez : {a.fr1.lower()}."}[l],
            "confirmDelete": {"ar": "حذف «{name}» نهائياً؟", "en": "Delete “{name}” permanently?", "fr": "Supprimer « {name} » définitivement ?"}[l],
            "nameRequired": {"ar": "هذا الحقل مطلوب", "en": "This field is required", "fr": "Ce champ est obligatoire"}[l],
        }
        for f in fields:
            ns[f"f_{f['key']}"] = f[l]
            for o in f["opts"]:
                ns[f"o_{f['key']}_{o[0]}"] = o[1 + i]
        d[kind] = ns
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"""Module '{kind}' ({Type}) created:
  page      src/app/[locale]/{route}/page.tsx      menu entry + dashboard card + print report
  data      src/store/useStore.ts (slice '{kind}' is included in backup export/import/clear)
  texts     messages/ar|en|fr.json (namespace '{kind}', nav.{kind}) - review the Arabic wording
Next: npm run typecheck && npm test && npm run build
Secrets in this module? Fields of type password are masked and never part of the AI summary; if you add other secret
data (card numbers, PINs) make them type password too. Put business rules in the store AND in tests/*.test.mts.""")


if __name__ == "__main__":
    main()
