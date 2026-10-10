import test from "node:test";
import assert from "node:assert/strict";

// minimal browser shims
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

const v = await import("../src/lib/vaultCrypto.ts");

test("a wrong password never unlocks (the original bug)", async () => {
  store.clear();
  await v.createVault("Correct123");
  v.lockVault();
  assert.equal(v.getVaultState(), "locked");
  for (const bad of ["1234", "wrong", "correct123", ""]) {
    const r = await v.unlockVault(bad);
    assert.equal(r.ok, false, `"${bad}" must be rejected`);
    assert.equal(v.isUnlocked(), false);
  }
});

test("correct password unlocks and data round-trips encrypted", async () => {
  store.clear();
  await v.createVault("Correct123");
  await v.encryptedStorage.setItem("x", JSON.stringify({ secret: "hunter2-visible?" }));
  assert.ok(!store.get("bader-vault-v3")!.includes("hunter2"), "must not be plaintext");
  v.lockVault();
  assert.equal(await v.encryptedStorage.getItem(), null, "locked vault yields nothing");
  const r = await v.unlockVault("Correct123");
  assert.equal(r.ok, true);
  assert.deepEqual(JSON.parse((await v.encryptedStorage.getItem())!), { secret: "hunter2-visible?" });
});

test("throttling after repeated failures", async () => {
  store.clear();
  await v.createVault("Correct123");
  v.lockVault();
  for (let i = 0; i < 3; i++) await v.unlockVault("nope");
  const r = await v.unlockVault("Correct123");
  assert.equal(r.ok, false);
  assert.ok((r.waitMs ?? 0) > 0);
});

test("change password re-encrypts; old one stops working", async () => {
  store.clear();
  await v.createVault("Correct123");
  await v.encryptedStorage.setItem("x", "payload");
  assert.equal(await v.changeMasterPassword("bad", "Newpass456"), false);
  assert.equal(await v.changeMasterPassword("Correct123", "Newpass456"), true);
  v.lockVault();
  assert.equal((await v.unlockVault("Correct123")).ok, false);
  store.set("bader-vault-v3", JSON.stringify({ ...JSON.parse(store.get("bader-vault-v3")!), lockUntil: 0, fails: 0 }));
  assert.equal((await v.unlockVault("Newpass456")).ok, true);
  assert.equal(await v.encryptedStorage.getItem(), "payload");
});

test("weak master passwords are refused; legacy data is migrated and wiped", async () => {
  store.clear();
  await assert.rejects(v.createVault("short1"));
  await assert.rejects(v.createVault("onlyletters"));
  store.set("bader-storage-v2", JSON.stringify({ state: { masterPassword: "1234", accounts: [{ id: "a" }] } }));
  await v.createVault("Correct123");
  assert.equal(store.has("bader-storage-v2"), false);
  const data = JSON.parse((await v.encryptedStorage.getItem())!);
  assert.equal(data.state.masterPassword, undefined);
  assert.equal(data.state.accounts.length, 1);
});

test("encrypted backups: wrong password fails, right one restores, nothing readable in file", async () => {
  const blob = await v.encryptBackup(JSON.stringify({ accounts: [{ password: "p@ss-visible?" }] }), "Backup2024x");
  assert.ok(!blob.includes("p@ss-visible"));
  assert.equal(v.isEncryptedBackup(blob), true);
  assert.equal(await v.decryptBackup(blob, "wrong"), null);
  assert.deepEqual(JSON.parse((await v.decryptBackup(blob, "Backup2024x"))!), { accounts: [{ password: "p@ss-visible?" }] });
});
