#!/usr/bin/env python3
"""Create a NEW program from assets/template (+ landing page + WordPress plugin). Never touches Bader Account Management.

  python3 new_app.py --dest ~/dev/my-vault --name "My Vault" [--name-ar "خزنتي"] [--slug my-vault]
                     [--product-id my-vault] [--app-id com.baderinfo.myvault]
                     [--author "Bader Eddine Hamidane"] [--email me@x.com] [--phone 0550000000] [--whatsapp 213550000000]
                     [--accent "#2563eb"] [--icon logo.png] [--no-landing] [--git] [--force]
  python3 new_app.py --check ~/dev/my-vault [--release]   # scan an app for leftovers / safety problems (exit 1 = problems)

What it does
  1. copies assets/template (the app; its .ts/.tsx files are stored as *.tpl and renamed back) and, unless --no-landing, assets/landing (static page) and assets/wordpress
     (plugin, renamed to <slug>-landing so it can live next to other programs' plugins, + a ready zip);
  2. replaces the placeholders: Template App -> display name, template-app -> slug (npm name, %APPDATA% folder, app:// host,
     backup tag), template-product -> licence product id, com.example.templateapp -> appId, Template Author / template@example.com /
     phone placeholders -> owner data, accent colour #0ea5e9 (+ its RGB triple) -> --accent;
  3. optionally builds the icon set (needs Pillow) from one PNG;
  4. runs the same check as --check and prints the next steps.
It refuses to write inside the Bader Account Management project or inside this skill folder, and refuses product ids that
belong to other programs.
"""
import argparse
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
TEMPLATE = ASSETS / "template"
LANDING = ASSETS / "landing"
WP_SRC = ASSETS / "wordpress" / "bader-landing"

BINARY_EXT = {".png", ".jpg", ".jpeg", ".ico", ".woff", ".woff2", ".ttf", ".zip", ".gz"}
SKIP_DIRS = {"node_modules", "out", ".next", "dist", ".git"}
DEFAULT_ACCENT = "#0ea5e9"
DEFAULT_TRIPLE = "14 165 233"
DEFAULT_ACCENT_DARK = "#0284c7"
RESERVED_PRODUCTS = {"bader-account-management", "blr-invoicing", "bader-prog", "bader-desktop-tool", "template-product"}
# files that legitimately mention other programs' ids (they guard against re-using them)
ALLOW_OTHER_PRODUCT = {"license.test.cjs", "license-doctor.cjs"}
TEXT_EXT = {".ts", ".tsx", ".js", ".cjs", ".mts", ".json", ".yml", ".css", ".md", ".html", ".php", ".txt"}


def die(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def darker(hexcolor, f=0.8):
    h = hexcolor.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return "#%02x%02x%02x" % (int(r * f), int(g * f), int(b * f))


def triple(hexcolor):
    h = hexcolor.lstrip("#")
    return " ".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def tint(hexcolor, amount):
    """Mix the colour with white (amount = share of the colour) -> RGB triple string; used for page background / borders."""
    h = hexcolor.lstrip("#")
    return " ".join(str(round(255 - (255 - int(h[i:i + 2], 16)) * amount)) for i in (0, 2, 4))


def refuses(path: Path) -> str:
    """Reason why `path` must not be used as a destination, or ''."""
    p = path.resolve()
    if HERE.parent in [p, *p.parents]:
        return "destination is inside the skill folder"
    for d in [p, *p.parents]:
        pj = d / "package.json"
        if pj.is_file():
            t = pj.read_text(encoding="utf-8", errors="ignore")
            if '"name": "bader-account-management"' in t or '"name": "blr-invoicing"' in t:
                return f"destination is inside an existing Baderinfo program ({d.name}); create new programs OUTSIDE it (e.g. ~/dev/<slug>)"
    return ""


def replace_tree(root: Path, mapping, regex=()):
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
        for pat, rep in regex:
            new = re.sub(pat, rep, new)
        if new != text:
            f.write_text(new, encoding="utf-8")


def set_icon(dest: Path, icon: Path, extra_logos):
    try:
        from PIL import Image
    except ImportError:
        print("  (Pillow not installed: icons NOT generated. Replace build/icon.png (512px), build/icon-256.png, public/brand/*.png, src/app/favicon.ico by hand)")
        return
    im = Image.open(icon).convert("RGBA")
    sizes = {"build/icon.png": 512, "build/icon-256.png": 256, "public/brand/icon-192.png": 192, "public/brand/app-icon.png": 512, "public/brand/logo-light.png": 512}
    for rel, size in sizes.items():
        im.resize((size, size), Image.LANCZOS).save(dest / rel)
    im.resize((64, 64), Image.LANCZOS).save(dest / "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    for p in extra_logos:
        if p.is_file():
            im.resize((256, 256), Image.LANCZOS).save(p)


def build_wordpress(dest: Path, name: str, slug: str, snake: str) -> Path:
    """Copy the plugin as <slug>-landing and rename every global identifier (two programs' plugins must coexist on one site)."""
    plug = dest / "wordpress" / f"{slug}-landing"
    shutil.copytree(WP_SRC, plug)
    for f in plug.rglob("*"):
        if not f.is_file() or f.suffix.lower() in BINARY_EXT:
            continue
        t = f.read_text(encoding="utf-8")
        t = re.sub(r"(?<![A-Za-z0-9])bal_", snake + "_", t)
        t = re.sub(r"(?<![A-Za-z0-9])BAL_", snake.upper() + "_", t)
        t = t.replace("bader_landing", snake + "_landing").replace("bader-landing", slug + "-landing").replace("Bader Landing", name + " Landing")
        f.write_text(t, encoding="utf-8")
    (plug / "bader-landing.php").rename(plug / f"{slug}-landing.php")
    return plug


def zip_plugin(plug: Path, slug: str) -> Path:
    zpath = plug.parent / f"{slug}-landing.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(plug.rglob("*")):
            if f.is_file():
                z.write(f, Path(f"{slug}-landing") / f.relative_to(plug))
    return zpath


def check(app: Path, release: bool = False) -> int:
    """Static sanity scan of a generated app. Returns the number of problems.
    DRAFT marketing copy is only a TODO note, but a PROBLEM with release=True (use `--check DIR --release` before publishing)."""
    problems = []
    todos = []
    pkg = app / "package.json"
    if not pkg.is_file():
        die(f"{app} has no package.json")
    txt = pkg.read_text(encoding="utf-8")
    cfg = app / "bader-license" / "license-config.js"
    cfgtxt = cfg.read_text(encoding="utf-8") if cfg.is_file() else ""
    m = re.search(r"product_id:\s*'([^']+)'", cfgtxt)
    pid = m.group(1) if m else ""
    if not pid:
        problems.append("license-config.js: product_id missing")
    if pid in RESERVED_PRODUCTS:
        problems.append(f"license-config.js: product_id is '{pid}' (must be THIS program's own id from the licence dashboard)")
    for key in ("server_url", "public_key"):
        if not re.search(rf"{key}:\s*'[^']+'", cfgtxt):
            problems.append(f"license-config.js: {key} missing")
    if re.search(r'"name":\s*"template-app"|Template App|com\.example\.templateapp', txt):
        problems.append("package.json still contains template placeholders (name / productName / appId)")
    for rel in ("build/icon.png", "package-lock.json", "public/fonts/ElMessiri-arabic.woff2", "electron-main.js", "bader-license/license.js"):
        if not (app / rel).is_file():
            problems.append(f"missing {rel}")
    gi = (app / ".gitignore").read_text(encoding="utf-8") if (app / ".gitignore").is_file() else ""
    for line in gi.splitlines():
        s = line.strip().rstrip("/")
        if s in ("build", "/build", "public", "/public", "package-lock.json", "*.png", "/messages", "messages"):
            problems.append(f".gitignore ignores '{line.strip()}' (electron-builder needs build/icon.png; CI needs package-lock.json)")
    em = app / "electron-main.js"
    if em.is_file():
        host = re.search(r'APP_ORIGIN\s*=\s*"app://([^"]+)"', em.read_text(encoding="utf-8"))
        slug = re.search(r'"name":\s*"([^"]+)"', txt)
        if host and slug and host.group(1) != slug.group(1):
            problems.append(f"electron-main.js app:// host '{host.group(1)}' differs from package name '{slug.group(1)}'")
    for f in app.rglob("*"):
        if not f.is_file() or any(p in SKIP_DIRS for p in f.relative_to(app).parts) or f.suffix not in TEXT_EXT:
            continue
        if f.name == "package-lock.json":
            continue
        t = f.read_text(encoding="utf-8", errors="ignore")
        rel = f.relative_to(app)
        if re.search(r"Template App|template-app|Template Author|template@example\.com|templateapp|template_app", t):
            problems.append(f"placeholder text left in {rel}")
        if re.search(r"Bader Account Management|bader-account-management", t) and f.name not in ALLOW_OTHER_PRODUCT:
            problems.append(f"reference to Bader Account Management in {rel} (copy/paste leftover?)")
        if re.search(r"COPY-STATUS:\s*DRAFT", t):
            (problems if release else todos).append(f"{rel}: marketing copy is still the DRAFT copied from Account Management: rewrite it for this program, then set COPY-STATUS: FINAL")
        if f.name == "branding.ts" and re.search(r'"0000000000"|"\+0000000000"', t):
            problems.append("branding.ts: developer phone/whatsapp are placeholders")
    # message parity (the unit test checks it too, this catches it before npm install)
    import json
    try:
        ks = {}
        for l in ("ar", "en", "fr"):
            ks[l] = set()
            def walk(o, p=""):
                for k, v in o.items():
                    (walk(v, p + k + ".") if isinstance(v, dict) else ks[l].add(p + k))
            walk(json.loads((app / "messages" / f"{l}.json").read_text(encoding="utf-8")))
        for l in ("ar", "fr"):
            if ks[l] != ks["en"]:
                problems.append(f"messages/{l}.json keys differ from en.json ({len(ks[l] ^ ks['en'])} keys)")
    except Exception as e:  # noqa: BLE001
        problems.append(f"messages/*.json unreadable: {e}")
    for p in problems:
        print("  PROBLEM " + p)
    for t in todos:
        print("  TODO    " + t)
    print("check: OK" if not problems else f"check: {len(problems)} problem(s)")
    return len(problems)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dest")
    ap.add_argument("--name", help='display / installer name, ASCII, e.g. "My Vault"')
    ap.add_argument("--name-ar", help="Arabic display name shown in the Arabic UI (messages/ar.json common.appName)")
    ap.add_argument("--slug", help="npm name + data folder + app:// host + backup tag: [a-z0-9-], default from --name. NEVER change after release")
    ap.add_argument("--product-id", help="licence product id created in the dashboard (default = slug)")
    ap.add_argument("--app-id", help="electron-builder appId, default com.baderinfo.<slug without dashes>")
    ap.add_argument("--author", default="Bader Eddine Hamidane")
    ap.add_argument("--email", default="baderinfo12@gmail.com")
    ap.add_argument("--phone", default="0550896115", help="support phone shown in the licence page / landing page")
    ap.add_argument("--whatsapp", default="213550896115", help="digits only with country code")
    ap.add_argument("--accent", help="brand colour like #2563eb (default #0ea5e9)")
    ap.add_argument("--icon", help="square PNG (512x512 best) used for the icon set (needs Pillow)")
    ap.add_argument("--no-landing", action="store_true", help="skip landing/ and wordpress/")
    ap.add_argument("--git", action="store_true", help="run `git init` in the new folder (no commit is made)")
    ap.add_argument("--force", action="store_true", help="allow a non-empty destination")
    ap.add_argument("--check", metavar="APP_DIR", help="scan an existing app and exit")
    ap.add_argument("--release", action="store_true", help="with --check: unfinished (DRAFT) marketing copy counts as a problem")
    a = ap.parse_args()

    if a.check:
        sys.exit(1 if check(Path(a.check).expanduser().resolve(), a.release) else 0)
    if not a.dest or not a.name:
        ap.error("--dest and --name are required")
    if not TEMPLATE.is_dir():
        die(f"template not found at {TEMPLATE}")
    name = a.name.strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 ._-]{1,40}", name):
        die("--name must be ASCII (letters, digits, space . _ -): Arabic characters can break NSIS/artifact paths; use --name-ar for the Arabic name")

    slug = a.slug or re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name.lower())).strip("-")
    if not re.fullmatch(r"[a-z][a-z0-9-]{2,40}", slug or ""):
        die(f"slug '{slug}' invalid: use 3-41 chars [a-z0-9-] starting with a letter (pass --slug)")
    product_id = a.product_id or slug
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,}", product_id):
        die(f"product id '{product_id}' invalid")
    if product_id in RESERVED_PRODUCTS:
        die(f"product id '{product_id}' belongs to another program/placeholder: create a NEW product in the licence dashboard")
    app_id = a.app_id or "com.baderinfo." + slug.replace("-", "")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9-]*)+", app_id):
        die(f"appId '{app_id}' invalid")
    accent = (a.accent or DEFAULT_ACCENT).lower()
    if not re.fullmatch(r"#[0-9a-f]{6}", accent):
        die("--accent must look like #2563eb")
    if not re.fullmatch(r"\d{7,15}", a.whatsapp):
        die("--whatsapp: digits only, country code first (e.g. 213550896115)")

    dest = Path(a.dest).expanduser().resolve()
    why = refuses(dest)
    if why:
        die(why)
    if dest.exists() and any(dest.iterdir()) and not a.force:
        die(f"{dest} is not empty (use --force to merge)")
    ign = shutil.ignore_patterns(*SKIP_DIRS)
    shutil.copytree(TEMPLATE, dest, dirs_exist_ok=True, ignore=ign)
    # TypeScript sources are stored as *.ts.tpl / *.tsx.tpl inside the skill so that the skill folder can never be picked up by the
    # tsconfig (`include: **/*.ts`) of an app that happens to contain it; give them their real names here.
    for f in list(dest.rglob("*.ts.tpl")) + list(dest.rglob("*.tsx.tpl")):
        if not any(part in SKIP_DIRS for part in f.relative_to(dest).parts):
            f.rename(f.with_suffix(""))
    with_landing = not a.no_landing and LANDING.is_dir() and WP_SRC.is_dir()
    if with_landing:
        shutil.copytree(LANDING, dest / "landing", dirs_exist_ok=True, ignore=ign)

    snake = slug.replace("-", "_")
    first = name.split()[0]
    plug = build_wordpress(dest, name, slug, snake) if with_landing else None
    mapping = [
        ("Template-App", re.sub(r"\s+", "-", name)),        # artifact names in the workflow
        ("Template App", name),
        ("template-product", product_id),
        ("com.example.templateapp", app_id),
        ("template-app", slug),
        ("template_app", snake),
        ("Template Author", a.author),
        ("template@example.com", a.email),
        ("+0000000000", "+" + a.whatsapp),
        ("0000000000", a.whatsapp),
    ]
    regex = [
        (r'(appShortName|ownerName): "Template"', lambda m: f'{m.group(1)}: "{first}"'),
        (r'logoText: "t"', f'logoText: "{first[0].lower()}"'),
        # the support PHONE (display number) differs from the whatsapp digits: handle it before the generic placeholder pass
        (r"""(?i)(phone[^\n]{0,20}?)(["'])0{10}\2""", lambda m: f"{m.group(1)}{m.group(2)}{a.phone}{m.group(2)}"),
    ]
    if accent != DEFAULT_ACCENT:
        mapping += [(DEFAULT_ACCENT, accent), (DEFAULT_ACCENT_DARK, darker(accent)), (DEFAULT_TRIPLE, triple(accent)),
                    # light-mode page background / soft fill / borders of the default theme are tints of the accent
                    ("240 249 255", tint(accent, 0.06)), ("224 242 254", tint(accent, 0.13)), ("186 230 253", tint(accent, 0.30))]
    replace_tree(dest, [], regex)
    replace_tree(dest, mapping)
    if a.name_ar:
        p = dest / "messages" / "ar.json"
        t = p.read_text(encoding="utf-8")
        p.write_text(t.replace(f'"appName": "{name}"', f'"appName": "{a.name_ar.strip()}"', 1), encoding="utf-8")

    if a.icon:
        logos = [dest / "landing" / "assets" / "logo.png", plug / "assets" / "logo.png"] if plug else []
        set_icon(dest, Path(a.icon).expanduser().resolve(), logos)
    if plug:
        php = shutil.which("php")
        if php:
            r = subprocess.run([php, "-l", str(plug / f"{slug}-landing.php")], capture_output=True, text=True)
            out = (r.stdout or r.stderr).strip()
            print("  php -l plugin:", out.splitlines()[0] if out else "?")
            if r.returncode != 0:
                die("the generated WordPress plugin has a PHP syntax error")
        else:
            print("  (php not installed: plugin syntax not checked)")
        zip_plugin(plug, slug)
    if a.git:
        subprocess.run(["git", "init", "-q"], cwd=dest, check=False)

    print(f"\nCreated '{name}' in {dest}\n  slug={slug}  product_id={product_id}  appId={app_id}  accent={accent}\n")
    left = check(dest)
    print(f"""
Next steps
  1. cd {dest}
  2. Licence: create product '{product_id}' (bind type: device / .exe) in the Baderinfo licence dashboard, then `npm run license:doctor`.
     Edit ONLY bader-license/license-config.js. Never touch device-id.js / license.js.
  3. npm install && npm run typecheck && npm test && npm run build              (Node >= 22.13)
  4. Modules:   python3 {HERE / 'add_module.py'} --app {dest} --kind clients --type Client --ar ... (see its --help)
  5. QA:        bash {HERE / 'verify_app.sh'} {dest} --e2e
  6. Brand:     src/config/branding.ts, public/brand/*, build/icon.png (512 px), messages/*.json wording, landing/ + wordpress/ copy (COPY-STATUS: DRAFT -> FINAL).
  7. Ship:      commit package-lock.json, tag {slug}-v<version> -> .github/workflows/build-windows.yml builds the installer.""")
    sys.exit(1 if left else 0)


if __name__ == "__main__":
    main()
