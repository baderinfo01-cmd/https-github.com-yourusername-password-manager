// Android licence client: same rules as the desktop one, with injected platform pieces.
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import nacl from "tweetnacl";
import { MobileLicense, type LicenseDeps } from "../src/lib/mobile/license.ts";
import { MOBILE_LICENSE } from "../src/lib/mobile/config.ts";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const rawPub = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("base64");
const cfg = { ...MOBILE_LICENSE, public_key: rawPub };
const nowS = () => Math.floor(Date.now() / 1000);
const sign = (p: object) => { const m = Buffer.from(JSON.stringify(p)); return m.toString("base64url") + "." + crypto.sign(null, m, privateKey).toString("base64url"); };
const sha = async (s: string) => crypto.createHash("sha256").update(s).digest("hex");

function make(opts: { raw?: string; store?: Map<string, string>; server?: (body: URLSearchParams) => any; nowFn?: () => number } = {}) {
  const store = opts.store || new Map<string, string>();
  const posts: URLSearchParams[] = [];
  const deps: LicenseDeps = {
    storage: { get: async (k) => store.get(k) ?? null, set: async (k, v) => void store.set(k, v), remove: async (k) => void store.delete(k) },
    post: async (_u, body) => { const p = new URLSearchParams(body); posts.push(p); if (!opts.server) throw new Error("offline"); return { status: 200, text: JSON.stringify(opts.server(p)) }; },
    rawDeviceId: async () => opts.raw || "android-id-1", deviceLabel: async () => "Pixel 8 — Android 15",
    sha256Hex: sha, randomHex: (n) => crypto.randomBytes(n).toString("hex"),
    verify: (m, s, k) => nacl.sign.detached.verify(m, s, k), now: opts.nowFn || nowS, lang: () => "en",
  };
  return { lic: new MobileLicense(cfg, deps), store, posts };
}
const payloadFor = async (raw: string, over: object = {}) => ({ v: 2, pid: cfg.product_id, bind: "device", domain: await sha(`bader-license-device-v1|android|${raw}`), lid: "BG-26-000001", name: "Ali", plan: "lifetime", iat: nowS(), ...over });
const CODE = "BLRM-ABCD-EFGH-JKLM";

test("mobile config: own product id and lifetime offline", () => {
  assert.equal(MOBILE_LICENSE.product_id, "blr-fatourati-mobile");
  assert.equal(MOBILE_LICENSE.max_offline_days, 0);
});

test("missing licence is not valid", async () => {
  const { lic } = make();
  const s = await lic.status();
  assert.equal(s.valid, false); assert.equal(s.status, "missing");
});

test("activation sends device fingerprint + product and stores a valid licence; works offline afterwards", async () => {
  const token = sign(await payloadFor("android-id-1"));
  const a = make({ server: () => ({ success: true, token }) });
  const r = await a.lic.activate(CODE);
  assert.equal(r.success, true);
  assert.equal(a.posts[0].get("action"), "activate");
  assert.equal(a.posts[0].get("product"), cfg.product_id);
  assert.equal(a.posts[0].get("domain")!.length, 64);
  // new process, no network, much later
  const b = make({ store: a.store, nowFn: () => nowS() + 5 * 365 * 86400 });
  const s = await b.lic.status();
  assert.equal(s.valid, true); assert.equal(s.license_id, "BG-26-000001"); assert.equal(s.customer, "Ali");
});

test("a licence copied to another phone is rejected", async () => {
  const token = sign(await payloadFor("android-id-1"));
  const a = make({ server: () => ({ success: true, token }) });
  await a.lic.activate(CODE);
  const other = make({ raw: "android-id-2", store: a.store });
  assert.equal((await other.lic.status()).valid, false);
  // and a hand-edited storage entry is ignored by the guard
  const tampered = new Map(a.store); const raw = JSON.parse(tampered.get("blr-license")!); raw.payload.instance = "x"; tampered.set("blr-license", JSON.stringify(raw));
  assert.equal((await make({ store: tampered }).lic.status()).status, "missing");
});

test("wrong product, bad signature, expired, revoked", async () => {
  for (const [over, code] of [[{ pid: "other" }, "wrong_product"], [{ exp: nowS() - 10 }, "expired"]] as const) {
    const t = sign(await payloadFor("android-id-1", over));
    const r = await make({ server: () => ({ success: true, token: t }) }).lic.activate(CODE);
    assert.equal(r.success, false); assert.equal(r.status!.status, code);
  }
  const forged = sign(await payloadFor("android-id-1")).replace(/\.[^.]+$/, "." + Buffer.alloc(64).toString("base64url"));
  assert.equal((await make({ server: () => ({ success: true, token: forged }) }).lic.activate(CODE)).success, false);
  const tok = sign(await payloadFor("android-id-1"));
  const a = make({ server: (b) => (b.get("action") === "activate" ? { success: true, token: tok } : { success: false, code: "revoked" }) });
  await a.lic.activate(CODE);
  const s = await a.lic.recheck();
  assert.equal(s.valid, false); assert.equal(s.status, "revoked");
});

test("server errors are reported, bad code format never hits the server", async () => {
  const bad = make({ server: () => ({ success: false, code: "already_used" }) });
  assert.match((await bad.lic.activate(CODE)).message, /another phone/);
  const fmt = make({ server: () => ({ success: true }) });
  assert.equal((await fmt.lic.activate("hello")).success, false); assert.equal(fmt.posts.length, 0);
  assert.match((await make().lic.activate(CODE)).message, /activation server/);
});
