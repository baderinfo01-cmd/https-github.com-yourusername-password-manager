const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Store } = require("../electron/db");

const mk = () => new Store(fs.mkdtempSync(path.join(os.tmpdir(), "blr-")));

test("first admin, login, throttling and roles", () => {
  const s = mk();
  assert.equal(s.hasUsers(), false);
  s.createFirstAdmin({ name: "Admin", username: "admin", password: "secret1" });
  assert.throws(() => s.createFirstAdmin({ name: "x", username: "xx1", password: "secret1" }), /already/);
  assert.equal(s.login("admin", "bad").ok, false);
  assert.equal(s.login("admin", "secret1").ok, true);
  s.saveUser({ name: "Cash", username: "cash", password: "cashpw", role: "cashier" });
  assert.equal(s.listUsers().length, 2);
  assert.ok(!("hash" in s.listUsers()[0]));
  assert.throws(() => s.list("users"), /forbidden/);
  s.logout();
  for (let i = 0; i < 5; i++) s.login("admin", "bad");
  assert.equal(s.login("admin", "secret1").error, "locked");
  s.failures.clear();
  s.login("cash", "cashpw");
  assert.throws(() => s.listUsers(), /forbidden/);
  assert.throws(() => s.save("settings", { id: "main" }), /forbidden/);
});

test("records, batch atomicity, counters", () => {
  const s = mk();
  s.createFirstAdmin({ name: "A", username: "admin", password: "secret1" });
  s.login("admin", "secret1");
  const c = s.save("clients", { name: "Ali" });
  assert.ok(c.id);
  assert.equal(s.list("clients").length, 1);
  assert.throws(() => s.batch([{ op: "save", kind: "clients", doc: { name: "B" } }, { op: "bogus" }]));
  assert.equal(s.list("clients").length, 1); // rolled back
  assert.equal(s.next("invoice:2026"), 1);
  assert.equal(s.next("invoice:2026"), 2);
});

test("encrypted backup round-trip and wrong password", () => {
  const s = mk();
  s.createFirstAdmin({ name: "A", username: "admin", password: "secret1" });
  s.login("admin", "secret1");
  s.save("clients", { name: "Ali" });
  s.next("x");
  const buf = s.exportBackup("pw123456");
  assert.ok(!buf.toString("latin1").includes("Ali"));
  assert.throws(() => Store.parseBackup(buf, "nope"), /wrong-password/);
  s.save("clients", { name: "Extra" });
  s.restoreBackup(buf, "pw123456");
  s.login("admin", "secret1");
  assert.equal(s.list("clients").length, 1);
  assert.equal(s.next("x"), 2);
});
