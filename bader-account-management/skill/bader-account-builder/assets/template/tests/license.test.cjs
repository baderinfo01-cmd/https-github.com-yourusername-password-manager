// Verifies the client-side license rules with a locally generated signing key (a stand-in for the server).
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const crypto = require("node:crypto");
const path = require("node:path");

// license.js needs Electron's `app`; give it a harmless stand-in
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "electron") return { app: { isPackaged: true, getVersion: () => "1.0.0", getPath: () => require("node:os").tmpdir() } };
  return realLoad.call(this, request, ...rest);
};
const BaderLicense = require(path.join(__dirname, "..", "bader-license", "license.js"));
const realConfig = require(path.join(__dirname, "..", "bader-license", "license-config.js"));

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const rawPub = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("base64");

const DEVICE = "DEVICE-A-FINGERPRINT";
const sign = (payload) => {
  const msg = Buffer.from(JSON.stringify(payload));
  return msg.toString("base64url") + "." + crypto.sign(null, msg, privateKey).toString("base64url");
};
const now = () => Math.floor(Date.now() / 1000);
const make = (over = {}, cfg = {}) => {
  const lic = new BaderLicense({ ...realConfig, public_key: rawPub, dev_mode: false, ...cfg });
  lic._deviceId = DEVICE;
  return lic;
};
const base = { v: 2, pid: realConfig.product_id, bind: "device", domain: DEVICE, lid: "L1", name: "Customer", plan: "pro", iat: now() };

test("shipped config: works for life offline (no offline cutoff) and has its OWN product id", () => {
  assert.equal(realConfig.max_offline_days, 0);
  assert.match(realConfig.product_id, /^[a-z0-9][a-z0-9-]{2,}$/);
  // every program needs its own product in the dashboard: never reuse another program's id
  for (const other of ["blr-invoicing", "bader-account-management", "bader-prog", "bader-desktop-tool"]) {
    assert.notEqual(realConfig.product_id, other, "product_id belongs to another program");
  }
});

test("a valid lifetime license is accepted, even if the server was last reached long ago", () => {
  const lic = make();
  const longAgo = now() - 5 * 365 * 86400;
  const s = lic._evaluateToken(sign(base), { last_ok: longAgo });
  assert.equal(s.valid, true, s.status);
});

test("license for ANOTHER program is refused", () => {
  const s = make()._evaluateToken(sign({ ...base, pid: "some-other-app" }), {});
  assert.equal(s.valid, false);
  assert.equal(s.status, "wrong_product");
});

test("license bound to ANOTHER device is refused", () => {
  const s = make()._evaluateToken(sign({ ...base, domain: "DEVICE-B" }), {});
  assert.equal(s.valid, false);
  assert.equal(s.status, "wrong_device");
});

test("tampered or forged license is refused", () => {
  const good = sign(base);
  const [m, sig] = good.split(".");
  const forgedPayload = Buffer.from(JSON.stringify({ ...base, plan: "elite", exp: 0 })).toString("base64url");
  assert.equal(make()._evaluateToken(forgedPayload + "." + sig, {}).status, "bad_signature");
  const other = crypto.generateKeyPairSync("ed25519");
  const msg = Buffer.from(JSON.stringify(base));
  const forged = msg.toString("base64url") + "." + crypto.sign(null, msg, other.privateKey).toString("base64url");
  assert.equal(make()._evaluateToken(forged, {}).status, "bad_signature");
});

test("2-day trial: valid now, expired after 2 days", () => {
  const trial = sign({ ...base, plan: "trial", exp: now() + 2 * 86400 });
  assert.equal(make()._evaluateToken(trial, {}).valid, true);
  const expired = sign({ ...base, plan: "trial", exp: now() - 10 });
  const s = make()._evaluateToken(expired, {});
  assert.equal(s.valid, false);
  assert.equal(s.status, "expired");
});

test("a revoked license stops once the server has said so", () => {
  const s = make()._evaluateToken(sign(base), { remote: "revoked" });
  assert.equal(s.valid, false);
  assert.equal(s.status, "revoked");
});

test("with the OLD 14-day setting the program would have stopped offline (why max_offline_days is 0)", () => {
  const lic = make({}, { max_offline_days: 14 });
  const s = lic._evaluateToken(sign(base), { last_ok: now() - 20 * 86400 });
  assert.equal(s.status, "offline");
});
