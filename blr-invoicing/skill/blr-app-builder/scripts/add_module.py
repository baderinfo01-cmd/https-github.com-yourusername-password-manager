#!/usr/bin/env python3
"""Scaffold a new CRUD module (store + page + types + dictionary keys + sidebar link + permission) in an app made from the template.

  python3 add_module.py --app ~/dev/my-shop --kind products --type Product \
      --ar "المنتجات" --en "Products" --fr "Produits" \
      --ar1 "منتج" --en1 "Product" --fr1 "Produit" [--perm products] [--icon Package] [--group nav_data]

  kind  = SQLite record kind + route folder (lowercase letters / underscore, 2-32 chars)  -> src/app/<kind>/page.tsx
  type  = TypeScript interface name (PascalCase, singular)                                  -> src/lib/types.ts
  perm  = permission name used with can(): "<perm>" to write, "<perm>:read" to view; manager role gets it (edit PERMS in src/store/ui.ts)

It creates src/store/<kind>.ts and src/app/<kind>/page.tsx from ../assets/module/*.tpl, appends the interface and the
dictionary triples, adds the NAV entry under the `// @nav:<group>` marker in Shell.tsx and the permission under the
`// @perms:manager` marker in ui.ts. Then run: npm run typecheck && npm test (the dictionary test checks the new keys).
Business rules that touch several records (stock, payments, numbering) are NOT generated: write them in src/store/data.ts
using api().db.batch (see references/add-module.md).
"""
import argparse
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MOD = HERE.parent / "assets" / "module"


def die(m):
    print("ERROR: " + m, file=sys.stderr)
    sys.exit(1)


def sub(text, m):
    for k, v in m.items():
        text = text.replace(k, v)
    return text


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--app", required=True)
    ap.add_argument("--kind", required=True)
    ap.add_argument("--type", required=True)
    for l in ("ar", "en", "fr"):
        ap.add_argument(f"--{l}", required=True, help=f"plural label ({l})")
        ap.add_argument(f"--{l}1", required=True, help=f"singular label ({l})")
    ap.add_argument("--perm")
    ap.add_argument("--icon", default="Package", help="lucide-react icon name")
    ap.add_argument("--group", default="nav_data")
    a = ap.parse_args()

    app = Path(a.app).expanduser().resolve()
    if not (app / "src" / "store" / "data.ts").is_file():
        die(f"{app} does not look like an app made from the template")
    if not re.fullmatch(r"[a-z_]{2,32}", a.kind):
        die("kind must match [a-z_]{2,32} (electron/db.js rejects anything else)")
    if a.kind in ("users", "settings", "audit", "items"):
        die(f"'{a.kind}' is reserved/already used")
    if not re.fullmatch(r"[A-Z][A-Za-z0-9]+", a.type):
        die("type must be PascalCase, e.g. Product")
    single = a.type.lower()
    perm = a.perm or a.kind
    route = a.kind.replace("_", "-")
    m = {"__kind__": a.kind, "__Type__": a.type, "__single__": single, "__perm__": perm}

    store = app / "src" / "store" / f"{a.kind}.ts"
    page = app / "src" / "app" / route / "page.tsx"
    if store.exists() or page.exists():
        die("module files already exist")
    page.parent.mkdir(parents=True, exist_ok=True)
    store.write_text(sub((MOD / "store.ts.tpl").read_text(encoding="utf-8"), m), encoding="utf-8")
    page.write_text(sub((MOD / "page.tsx.tpl").read_text(encoding="utf-8"), m), encoding="utf-8")

    # types
    tp = app / "src" / "lib" / "types.ts"
    t = tp.read_text(encoding="utf-8")
    if f"interface {a.type} " not in t:
        t = t.rstrip("\n") + f"\n\nexport interface {a.type} {{ id: string; name: string; category?: string; amount: number; notes?: string; active?: boolean; createdAt?: number; updatedAt?: number }}\n"
        tp.write_text(t, encoding="utf-8")

    # dictionary
    dp = app / "src" / "lib" / "dict.ts"
    d = dp.read_text(encoding="utf-8")
    entries = {
        a.kind: (a.ar, a.en, a.fr),
        f"add_{single}": (f"إضافة {a.ar1}", f"Add {a.en1.lower()}", f"Ajouter : {a.fr1.lower()}"),
        f"edit_{single}": (f"تعديل {a.ar1}", f"Edit {a.en1.lower()}", f"Modifier : {a.fr1.lower()}"),
    }
    add = ""
    for k, v in entries.items():
        if re.search(rf'^\s*"?{re.escape(k)}"?\s*:', d, re.M):
            print(f"  dict key '{k}' already exists, kept")
            continue
        add += f"  {k}: [{', '.join(repr_js(x) for x in v)}],\n"
    idx = d.rstrip().rfind("};")
    d = d[:idx] + add + d[idx:]
    dp.write_text(d, encoding="utf-8")

    # sidebar
    sp = app / "src" / "components" / "Shell.tsx"
    s = sp.read_text(encoding="utf-8")
    marker = f"// @nav:{a.group}"
    if marker not in s:
        die(f"marker '{marker}' not found in Shell.tsx (use --group nav_data or add the marker)")
    line_end = s.index("\n", s.index(marker)) + 1
    s = s[:line_end] + f'      {{ href: "/{route}/", key: "{a.kind}", icon: <{a.icon} size={{18}} />, perm: "{perm}:read" }},\n' + s[line_end:]
    s = re.sub(r"(import \{)([^}]*)(\} from \"lucide-react\";)", lambda mo: mo.group(1) + mo.group(2).rstrip() + (f", {a.icon} " if a.icon not in mo.group(2) else " ") + mo.group(3), s, count=1)
    sp.write_text(s, encoding="utf-8")

    # permissions
    up = app / "src" / "store" / "ui.ts"
    u = up.read_text(encoding="utf-8")
    u = re.sub(r'(manager: \[)([^\]]*)(\],)', lambda mo: f'{mo.group(1)}{mo.group(2)}, "{perm}"{mo.group(3)}', u, count=1)
    up.write_text(u, encoding="utf-8")

    print(f"""Module '{a.kind}' created:
  src/store/{a.kind}.ts   src/app/{route}/page.tsx   (+ type {a.type}, dict keys, NAV link, manager permission '{perm}')
Now: review roles in PERMS (src/store/ui.ts: cashier/accountant get "{perm}:read" only if you add it), then
  npm run typecheck && npm test && npm run build""")


def repr_js(x):
    return '"' + x.replace("\\", "\\\\").replace('"', '\\"') + '"'


if __name__ == "__main__":
    main()
