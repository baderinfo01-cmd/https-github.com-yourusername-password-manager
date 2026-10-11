// End-to-end test of Bader Sync: real PHP relay (api.php) + the real encryption/merge engine, two simulated devices.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdtempSync, copyFileSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SyncEngine, type Adapter, type Item, type SyncState } from "../src/lib/sync/engine.ts";
import { deriveKeys, decodePairing, encodePairing, randomBytes, toHex } from "../src/lib/sync/crypto.ts";
import { pullAlerts, pushAlert, type AlertConfig, type AlertEvent } from "../src/lib/sync/alerts.ts";

const hasPhp = spawnSync("php", ["-v"]).status === 0;
let server: ChildProcess;
let url = "";
let dir = "";
const REG = "test-register-key";

const transport = {
  async post(u: string, body: unknown) {
    const r = await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, status: r.status, json: await r.json().catch(() => null) };
  },
};

before(async () => {
  if (!hasPhp) return;
  dir = mkdtempSync(join(tmpdir(), "bsync-"));
  copyFileSync(new URL("../sync-server/api.php", import.meta.url), join(dir, "api.php"));
  writeFileSync(join(dir, "config.php"), `<?php return ['register_key'=>'${REG}','cors_origin'=>'*'];`);
  const port = 20000 + Math.floor(Math.random() * 20000);
  server = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", dir], { stdio: "ignore" });
  url = `http://127.0.0.1:${port}/api.php`;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(url + "?a=ping", { method: "POST", body: "{}" });
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("php server did not start");
});
after(() => server?.kill());

/** A fake app store for one device. */
function device(name: string, K: Uint8Array, clock: { t: number }) {
  const data: Record<string, Item[]> = {
    accounts: [], subscriptions: [], cards: [], documents: [], contacts: [],
    cardCategories: [], documentCategories: [], contactCategories: [], generatedPasswords: [], myInfo: [{ id: "me" }],
  };
  let state: SyncState = { cursor: 0, meta: {} };
  const adapter: Adapter = {
    read: () => JSON.parse(JSON.stringify(data)),
    write: (n) => Object.assign(data, JSON.parse(JSON.stringify(n))),
    getState: () => state,
    setState: (s) => (state = s),
  };
  const deviceId = toHex(randomBytes(16));
  const engine = new SyncEngine({ serverUrl: url, K, deviceId, adapter, transport, now: () => ++clock.t });
  return { name, data, engine, deviceId };
}

test("register needs the server's register key", { skip: !hasPhp }, async () => {
  const K = randomBytes(32);
  const eng = new SyncEngine({ serverUrl: url, K, deviceId: toHex(randomBytes(16)), adapter: {} as Adapter, transport });
  await assert.rejects(eng.register("wrong-key"), /bad_register_key/);
  await eng.register(REG);
  await assert.rejects(eng.register(REG), /exists/);
});

test("two devices converge; server only ever stores ciphertext", { skip: !hasPhp }, async () => {
  const K = randomBytes(32);
  const clock = { t: 1_000_000 };
  const A = device("A", K, clock);
  await A.engine.register(REG);

  A.data.accounts.push({ id: "a1", siteName: "Facebook", password: "SuperSecret-visible?", username: "bader" });
  A.data.contacts.push({ id: "c1", firstName: "Ali", phone1: "0550896115" });
  A.data.myInfo = [{ id: "me", firstName: "Bader" }];
  const r1 = await A.engine.syncOnce();
  assert.ok(r1.pushed >= 3);

  // the relay's database must not contain anything readable
  const db = readFileSync(join(dir, "data", "sync.sqlite"));
  for (const secret of ["SuperSecret-visible", "Facebook", "0550896115", "Ali", "bader"]) {
    assert.equal(db.includes(Buffer.from(secret)), false, `"${secret}" must not appear in the server database`);
  }

  // device B joins with the pairing code
  const code = encodePairing(url, K);
  const pair = decodePairing(code)!;
  const B = device("B", pair.K, clock);
  await B.engine.verify();
  await B.engine.syncOnce();
  assert.equal(B.data.accounts[0]?.password, "SuperSecret-visible?");
  assert.equal(B.data.contacts[0]?.firstName, "Ali");
  assert.equal(B.data.myInfo[0].firstName, "Bader");

  // B edits + adds, A receives
  B.data.accounts[0].password = "ChangedOnPhone";
  B.data.accounts.push({ id: "a2", siteName: "Gmail", password: "x" });
  await B.engine.syncOnce();
  await A.engine.syncOnce();
  assert.equal(A.data.accounts.find((x) => x.id === "a1")?.password, "ChangedOnPhone");
  assert.equal(A.data.accounts.length, 2);

  // delete propagates
  A.data.contacts = [];
  await A.engine.syncOnce();
  await B.engine.syncOnce();
  assert.equal(B.data.contacts.length, 0);

  // conflict: both edit the same item; the LATER edit wins on both devices
  A.data.accounts.find((x) => x.id === "a2")!.password = "A-edit-earlier";
  clock.t += 10;
  B.data.accounts.find((x) => x.id === "a2")!.password = "B-edit-later";
  await A.engine.syncOnce(); // A pushes first (its change is older)
  await B.engine.syncOnce();
  await A.engine.syncOnce();
  assert.equal(A.data.accounts.find((x) => x.id === "a2")?.password, "B-edit-later");
  assert.equal(B.data.accounts.find((x) => x.id === "a2")?.password, "B-edit-later");

  // a third sync changes nothing (stable)
  const again = await A.engine.syncOnce();
  assert.equal(again.pushed, 0);
  assert.equal(again.applied, 0);
});

test("wrong key is rejected; alert key cannot read or write data", { skip: !hasPhp }, async () => {
  const K = randomBytes(32);
  const A = device("A", K, { t: 5_000_000 });
  await A.engine.register(REG);
  A.data.accounts.push({ id: "a1", siteName: "Bank", password: "p" });
  await A.engine.syncOnce();

  const stranger = device("S", randomBytes(32), { t: 6_000_000 });
  await assert.rejects(stranger.engine.verify(), /unauthorized/);

  const { keys, alert } = await deriveKeys(K);
  const asAlert = await transport.post(url + "?a=pull", { id: keys.accountId, auth: alert.auth, since: 0 });
  assert.equal(asAlert.json.ok, true);
  assert.equal(asAlert.json.ops.length, 0, "alert token must not see data items");
  const write = await transport.post(url + "?a=push", { id: keys.accountId, auth: alert.auth, device: "ab", ops: [{ k: "a".repeat(64), ts: 1, iv: "AAAAAAAAAAAAAAAA", ct: "AAAA" }] });
  assert.equal(write.status, 403);
});

test("security alerts travel while the vault is locked, and not back to the sender", { skip: !hasPhp }, async () => {
  const K = randomBytes(32);
  const A = device("A", K, { t: 7_000_000 });
  await A.engine.register(REG);
  const { alert } = await deriveKeys(K);
  const pcCfg: AlertConfig = { ...alert, serverUrl: url, device: toHex(randomBytes(16)), cursor: 0 };
  const phoneCfg: AlertConfig = { ...alert, serverUrl: url, device: toHex(randomBytes(16)), cursor: 0 };

  const ev: AlertEvent = { id: "evt1", t: Date.now(), result: "failed", device: "BaderInfo01", os: "Windows 10", app: "3.0.0", ip: "41.1.2.3", city: "Algiers", country: "Algeria", source: "desktop" };
  assert.equal(await pushAlert(pcCfg, transport, ev), true);

  const got = await pullAlerts(phoneCfg, transport);
  assert.equal(got?.events.length, 1);
  assert.equal(got?.events[0].city, "Algiers");
  assert.equal(got?.events[0].result, "failed");

  const mine = await pullAlerts(pcCfg, transport);
  assert.equal(mine?.events.length, 0, "the sender does not get its own alert");

  const next = await pullAlerts({ ...phoneCfg, cursor: got!.cursor }, transport);
  assert.equal(next?.events.length, 0, "cursor prevents repeats");
});
