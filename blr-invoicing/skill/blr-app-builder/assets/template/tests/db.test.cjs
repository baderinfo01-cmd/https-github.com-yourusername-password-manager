const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Store } = require("../electron/db");

const mk = () => new Store(fs.mkdtempSync(path.join(os.tmpdir(), "app-")));

test("first admin, login, throttling and roles", () => {
  const s = mk();
  assert.equal(s.hasUsers(), false);
  const first = s.createFirstAdmin({ name: "Admin", username: "admin", password: "secret1" });
  assert.match(first.recoveryKey, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
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

test("forgotten password: recovery key resets the password, then a fresh key is issued", () => {
  const s = mk();
  const { recoveryKey } = s.createFirstAdmin({ name: "A", username: "admin", password: "secret1" });
  s.save && assert.ok(!JSON.stringify(s._publicUser(s._users()[0])).includes("recoveryHash"));
  assert.throws(() => s.resetWithRecovery("admin", "AAAA-BBBB-CCCC-DDDD-EEEE", "newpass1"), /invalid-recovery/);
  assert.throws(() => s.resetWithRecovery("admin", recoveryKey, "123"), /weak-password/);
  const r = s.resetWithRecovery("admin", recoveryKey.toLowerCase().replace(/-/g, " "), "newpass1");
  assert.notEqual(r.recoveryKey, recoveryKey);
  assert.equal(s.login("admin", "secret1").ok, false);
  assert.equal(s.login("admin", "newpass1").ok, true);
  assert.throws(() => s.resetWithRecovery("admin", recoveryKey, "another1"), /invalid-recovery/); // old key is dead
  assert.equal(typeof s.newRecoveryKey("newpass1").recoveryKey, "string");
  assert.throws(() => s.newRecoveryKey("wrong"), /invalid/);
  s.logout();
  for (let i = 0; i < 5; i++) assert.throws(() => s.resetWithRecovery("admin", "BAD", "newpass2"));
  assert.throws(() => s.resetWithRecovery("admin", r.recoveryKey, "newpass2"), /locked/);
});

test("a backup of ANOTHER program is refused on restore", () => {
  const s = mk();
  s.createFirstAdmin({ name: "A", username: "admin", password: "secret1" });
  s.login("admin", "secret1");
  const foreign = Buffer.concat([Buffer.from("XBAK0"), Buffer.from(JSON.stringify({ app: "some-other-app", records: [], counters: [] }))]);
  assert.throws(() => s.restoreBackup(foreign, ""), /not-a-backup/);
});

test("non-admin roles cannot write settings or read users; kind names are validated", () => {
  const s = mk();
  s.createFirstAdmin({ name: "A", username: "admin", password: "secret1" });
  s.login("admin", "secret1");
  s.saveUser({ name: "Acc", username: "acc", password: "accpw1", role: "accountant" });
  s.logout();
  assert.throws(() => s.save("items", { name: "x" }), /not-signed-in/);
  s.login("acc", "accpw1");
  assert.throws(() => s.save("settings", { id: "main" }), /forbidden/);
  assert.throws(() => s.list("users"), /forbidden/);
  assert.throws(() => s.list("Bad Kind!"), /bad-kind/);
  assert.equal(s.save("items", { name: "ok" }).name, "ok");
});
