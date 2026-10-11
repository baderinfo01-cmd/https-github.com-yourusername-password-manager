// After `next build`: write out/sw.js (versioned), out/precache.json and out/index.html (root redirect).
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";

const out = new URL("../out", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(out);

const rel = (p) => "/" + relative(out, p).split(sep).join("/");
const all = files.map(rel).filter((u) => !/\.(map)$/.test(u) && !["/sw.js", "/precache.json", "/404.html"].includes(u));

const core = all.filter((u) => u.startsWith("/_next/static/") || u.startsWith("/brand/") || u === "/manifest.webmanifest" || u === "/favicon.ico" || u === "/index.html");
const locales = {};
for (const l of ["ar", "en", "fr"]) {
  locales[l] = all
    .filter((u) => u.startsWith("/" + l + "/"))
    .map((u) => (u.endsWith("/index.html") ? u.slice(0, -"index.html".length) : u)); // pages are requested as /ar/accounts/
}
const build = createHash("sha256")
  .update(all.map((u) => u + statSync(join(out, u)).size).join("|"))
  .digest("hex")
  .slice(0, 12);

writeFileSync(join(out, "precache.json"), JSON.stringify({ build, core, locales }));
writeFileSync(join(out, "sw.js"), readFileSync(new URL("./sw.template.js", import.meta.url), "utf8").replaceAll("__BUILD__", build));

// "/" has no page of its own. This file is also the shell of the Android app: its local server answers every
// path WITHOUT a file extension (e.g. /ar/accounts/) with this file, so it loads the real page and swaps it in.
const shell = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bader Account Management</title>
<script>
(function () {
  var p = location.pathname;
  if (p === "/" || p === "/index.html") {
    var l = ""; try { l = localStorage.getItem("bal-lang") || ""; } catch (e) {}
    if (["ar", "en", "fr"].indexOf(l) < 0) l = (navigator.language || "ar").slice(0, 2);
    location.replace("/" + (["ar", "en", "fr"].indexOf(l) >= 0 ? l : "ar") + "/");
    return;
  }
  var target = (p.charAt(p.length - 1) === "/" ? p : p + "/") + "index.html";
  fetch(target).then(function (r) { if (!r.ok) throw 0; return r.text(); })
    .then(function (h) { document.open(); document.write(h); document.close(); })
    .catch(function () { location.replace("/ar/index.html"); });
})();
</script>
<noscript><meta http-equiv="refresh" content="0;url=/ar/index.html"></noscript></head><body></body></html>`;
writeFileSync(join(out, "index.html"), shell);
console.log(`PWA: build ${build}, ${all.length} files, ar=${locales.ar.length} en=${locales.en.length} fr=${locales.fr.length}`);
