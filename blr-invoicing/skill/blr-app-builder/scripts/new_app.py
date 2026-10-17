#!/usr/bin/env python3
"""Create a NEW desktop program from assets/template (never touches blr-invoicing).

  python3 new_app.py --dest ~/dev/my-shop --name "My Shop" [--slug my-shop] [--product-id my-shop]
                     [--app-id com.baderinfo.myshop] [--author "Bader Eddine Hamidane"] [--email me@x.com]
                     [--accent "#2563eb"] [--icon logo.png] [--git] [--force]
  python3 new_app.py --check ~/dev/my-shop        # scan an existing app for leftovers / safety problems

What it does: copies the template, replaces the placeholders (display name, slug, license product id, appId, author,
e-mail, accent colour), optionally replaces the icon set from one PNG (needs Pillow for resizing), then prints the
next steps. It refuses to write inside the BLR Fatourati folder and refuses the product id "blr-invoicing".
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE.parent / "assets" / "template"

# token in the template -> replaced by (order matters: longest / most specific first)
BINARY_EXT = {".png", ".jpg", ".jpeg", ".ico", ".woff", ".woff2", ".ttf", ".zip", ".gz"}
SKIP_DIRS = {"node_modules", "out", ".next", "dist", ".git"}
DEFAULT_ACCENT = ("#0a9f63", "#067a4c")
# files that legitimately mention the BLR product id (they guard against re-using it)
ALLOW_BLR_MENTION = {"license.test.cjs", "license-doctor.cjs"}


def die(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def darker(hexcolor, f=0.8):
    h = hexcolor.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return "#%02x%02x%02x" % (int(r * f), int(g * f), int(b * f))


def inside_blr(path: Path) -> bool:
    """True when path is (inside) a folder that holds BLR Fatourati itself."""
    p = path.resolve()
    for d in [p, *p.parents]:
        pj = d / "package.json"
        if pj.is_file() and '"name": "blr-invoicing"' in pj.read_text(encoding="utf-8", errors="ignore"):
            # the skill folder lives INSIDE blr-invoicing/skill: building the skeleton of a new app there is also wrong
            return True
    return False


def replace_tree(root: Path, mapping):
    for f in root.rglob("*"):
        if not f.is_file() or any(part in SKIP_DIRS for part in f.relative_to(root).parts):
            continue
        if f.suffix.lower() in BINARY_EXT:
            continue
        try:
            text = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        new = text
        for old, rep in mapping:
            new = new.replace(old, rep)
        if new != text:
            f.write_text(new, encoding="utf-8")


def set_icon(dest: Path, icon: Path):
    try:
        from PIL import Image
    except ImportError:
        print("  (Pillow not installed: copying the icon without resizing; make sure it is a 512x512 PNG)")
        for rel in ("build/icon.png", "build/icon-256.png", "public/brand/icon-192.png", "public/brand/app-icon.png"):
            shutil.copyfile(icon, dest / rel)
        return
    im = Image.open(icon).convert("RGBA")
    sizes = {"build/icon.png": 512, "build/icon-256.png": 256, "public/brand/icon-192.png": 192, "public/brand/app-icon.png": 512}
    for rel, size in sizes.items():
        im.resize((size, size), Image.LANCZOS).save(dest / rel)


def check(app: Path) -> int:
    """Static sanity scan of a generated app. Returns the number of problems."""
    problems = []
    pkg = app / "package.json"
    if not pkg.is_file():
        die(f"{app} has no package.json")
    txt = pkg.read_text(encoding="utf-8")
    cfg = (app / "bader-license" / "license-config.js")
    cfgtxt = cfg.read_text(encoding="utf-8") if cfg.is_file() else ""
    m = re.search(r"product_id:\s*'([^']+)'", cfgtxt)
    pid = m.group(1) if m else ""
    if not pid:
        problems.append("license-config.js: product_id missing")
    if pid in ("blr-invoicing", "template-product", "bader-prog"):
        problems.append(f"license-config.js: product_id is '{pid}' (must be this program's own id from the dashboard)")
    if '"name": "template-app"' in txt or "Template App" in txt or "com.example.templateapp" in txt:
        problems.append("package.json still contains template placeholders (name / productName / appId)")
    for rel in ("build/icon.png", "package-lock.json", "public/fonts/ElMessiri-arabic.woff2"):
        if not (app / rel).is_file():
            problems.append(f"missing {rel}")
    gi = (app / ".gitignore").read_text(encoding="utf-8") if (app / ".gitignore").is_file() else ""
    for line in gi.splitlines():
        s = line.strip().rstrip("/")
        if s in ("build", "/build", "public", "/public", "package-lock.json", "*.png"):
            problems.append(f".gitignore ignores '{line.strip()}' (electron-builder needs build/icon.png; CI needs package-lock.json)")
    for f in app.rglob("*"):
        if f.is_file() and not any(p in SKIP_DIRS for p in f.relative_to(app).parts) and f.suffix in {".ts", ".tsx", ".js", ".cjs", ".mts", ".json", ".yml", ".css"}:
            t = f.read_text(encoding="utf-8", errors="ignore")
            if "Template App" in t or "template-app" in t or "Template Author" in t:
                problems.append(f"placeholder text left in {f.relative_to(app)}")
            if re.search(r"BLR|blr-invoicing|Fatourati", t) and f.name not in ALLOW_BLR_MENTION:
                problems.append(f"BLR Fatourati reference in {f.relative_to(app)} (copy/paste leftover?)")
    for p in problems:
        print("  PROBLEM " + p)
    print("check: OK" if not problems else f"check: {len(problems)} problem(s)")
    return len(problems)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dest")
    ap.add_argument("--name", help='display / installer name, ASCII recommended, e.g. "My Shop"')
    ap.add_argument("--slug", help="npm name + data folder + protocol host: [a-z0-9-], default from --name")
    ap.add_argument("--product-id", help="license product id created in the dashboard (default = slug)")
    ap.add_argument("--app-id", help="electron-builder appId, default com.baderinfo.<slug without dashes>")
    ap.add_argument("--author", default="Bader Eddine Hamidane (Baderinfo)")
    ap.add_argument("--email", default="baderinfo12@gmail.com")
    ap.add_argument("--accent", help="brand colour like #2563eb (dark variant is derived)")
    ap.add_argument("--icon", help="square PNG (512x512 best) used for the app icon set")
    ap.add_argument("--git", action="store_true", help="run `git init` in the new folder (no commit is made)")
    ap.add_argument("--force", action="store_true", help="allow a non-empty destination")
    ap.add_argument("--check", metavar="APP_DIR", help="scan an existing app and exit")
    a = ap.parse_args()

    if a.check:
        sys.exit(1 if check(Path(a.check).expanduser().resolve()) else 0)
    if not a.dest or not a.name:
        ap.error("--dest and --name are required")
    if not TEMPLATE.is_dir():
        die(f"template not found at {TEMPLATE}")

    slug = a.slug or re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", a.name.lower())).strip("-")
    if not re.fullmatch(r"[a-z][a-z0-9-]{2,40}", slug or ""):
        die(f"slug '{slug}' invalid: use 3-41 chars [a-z0-9-] starting with a letter (pass --slug)")
    product_id = a.product_id or slug
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,}", product_id):
        die(f"product id '{product_id}' invalid")
    if product_id in ("blr-invoicing", "bader-prog", "template-product"):
        die(f"product id '{product_id}' belongs to another program/placeholder: create a NEW product in the license dashboard")
    app_id = a.app_id or "com.baderinfo." + slug.replace("-", "")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9-]*)+", app_id):
        die(f"appId '{app_id}' invalid")
    if a.accent and not re.fullmatch(r"#[0-9a-fA-F]{6}", a.accent):
        die("--accent must look like #2563eb")

    dest = Path(a.dest).expanduser().resolve()
    if inside_blr(dest):
        die("destination is inside the BLR Fatourati project. Create sibling products OUTSIDE blr-invoicing/ (e.g. ~/dev/<slug>).")
    if dest.exists() and any(dest.iterdir()) and not a.force:
        die(f"{dest} is not empty (use --force to merge)")
    shutil.copytree(TEMPLATE, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns(*SKIP_DIRS))

    name = a.name.strip()
    mapping = [
        ("Template-App", re.sub(r"\s+", "-", name)),       # artifact names in the workflow
        ("Template App", name),
        ("template-product", product_id),
        ("com.example.templateapp", app_id),
        ("template-app", slug),
        ("Template Author", a.author),
        ("template@example.com", a.email),
    ]
    if a.accent:
        mapping += [(DEFAULT_ACCENT[0], a.accent.lower()), (DEFAULT_ACCENT[1], darker(a.accent))]
    replace_tree(dest, mapping)
    if a.icon:
        set_icon(dest, Path(a.icon).expanduser().resolve())
    if a.git:
        subprocess.run(["git", "init", "-q"], cwd=dest, check=False)

    print(f"\nCreated '{name}' in {dest}\n  slug={slug}  product_id={product_id}  appId={app_id}\n")
    left = check(dest)
    print(
        f"""
Next steps
  1. cd {dest}
  2. License: create product '{product_id}' (bind type: device / .exe) in the Baderinfo license dashboard, then
     `npm run license:doctor`. Leave bader-license/device-id.js and license.js untouched.
  3. npm install && npm run typecheck && npm test && npm run build        (Node >= 22.13)
  4. Add modules:   python3 {HERE / 'add_module.py'} --app {dest} --kind products --type Product ...
  5. QA:            bash {HERE / 'verify_app.sh'} {dest} --e2e
  6. Replace brand assets (public/brand/*, build/icon.png) and edit src/lib/brand.ts, src/lib/dict.ts, defaults.ts."""
    )
    sys.exit(1 if left else 0)


if __name__ == "__main__":
    main()
