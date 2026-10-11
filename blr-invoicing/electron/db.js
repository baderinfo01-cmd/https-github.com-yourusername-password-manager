"use strict";

// Local database (SQLite built into Node/Electron) + users + encrypted backups.
// Everything lives in the user's data folder; nothing is ever sent anywhere.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROLES = ["admin", "manager", "cashier", "accountant"];
const PRIVATE_KINDS = new Set(["users"]); // never exposed through the generic API
const WRITE_ADMIN_ONLY = new Set(["settings"]);

class Store {
  constructor(dir) {
    fs.mkdirSync(dir, { recursive: true });
    this.dir = dir;
    this.file = path.join(dir, "blr.sqlite");
    this.db = new DatabaseSync(this.file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS records (
        kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated_at INTEGER NOT NULL,
        PRIMARY KEY (kind, id)
      );
      CREATE INDEX IF NOT EXISTS idx_records_kind ON records(kind);
      CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
    `);
    this.q = {
      list: this.db.prepare("SELECT data FROM records WHERE kind = ?"),
      get: this.db.prepare("SELECT data FROM records WHERE kind = ? AND id = ?"),
      put: this.db.prepare(
        "INSERT INTO records(kind,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at"
      ),
      del: this.db.prepare("DELETE FROM records WHERE kind = ? AND id = ?"),
      counterGet: this.db.prepare("SELECT value FROM counters WHERE name = ?"),
      counterSet: this.db.prepare(
        "INSERT INTO counters(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value"
      ),
    };
    this.failures = new Map(); // login throttling
    this.session = null;
  }

  // ---- generic records ----
  _tx(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const r = fn();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      try { this.db.exec("ROLLBACK"); } catch {}
      throw e;
    }
  }
  _checkKind(kind, write) {
    if (typeof kind !== "string" || !/^[a-z_]{2,32}$/.test(kind)) throw new Error("bad-kind");
    if (PRIVATE_KINDS.has(kind)) throw new Error("forbidden");
    if (write && WRITE_ADMIN_ONLY.has(kind) && !this._isRole("admin")) throw new Error("forbidden");
  }
  _isRole(...roles) {
    return !!this.session && roles.includes(this.session.role);
  }
  list(kind) {
    this._checkKind(kind, false);
    return this.q.list.all(kind).map((r) => JSON.parse(r.data));
  }
  get(kind, id) {
    this._checkKind(kind, false);
    const r = this.q.get.get(kind, String(id));
    return r ? JSON.parse(r.data) : null;
  }
  _put(kind, doc) {
    if (!doc || typeof doc !== "object") throw new Error("bad-doc");
    const now = Date.now();
    const d = { ...doc };
    if (!d.id) d.id = crypto.randomUUID();
    if (!d.createdAt) d.createdAt = now;
    d.updatedAt = now;
    this.q.put.run(kind, String(d.id), JSON.stringify(d), now);
    return d;
  }
  save(kind, doc) {
    this._checkKind(kind, true);
    this._requireSession();
    return this._put(kind, doc);
  }
  remove(kind, id) {
    this._checkKind(kind, true);
    this._requireSession();
    this.q.del.run(kind, String(id));
    return true;
  }
  // ops: [{op:"save",kind,doc} | {op:"remove",kind,id}] — all or nothing
  batch(ops) {
    this._requireSession();
    if (!Array.isArray(ops) || ops.length > 5000) throw new Error("bad-batch");
    return this._tx(() =>
      ops.map((o) => {
        if (o.op === "save") { this._checkKind(o.kind, true); return this._put(o.kind, o.doc); }
        if (o.op === "remove") { this._checkKind(o.kind, true); this.q.del.run(o.kind, String(o.id)); return true; }
        throw new Error("bad-op");
      })
    );
  }
  next(name) {
    this._requireSession();
    if (typeof name !== "string" || !/^[a-z_0-9:-]{1,40}$/i.test(name)) throw new Error("bad-counter");
    return this._tx(() => {
      const row = this.q.counterGet.get(name);
      const v = (row ? row.value : 0) + 1;
      this.q.counterSet.run(name, v);
      return v;
    });
  }
  _requireSession() {
    if (!this.session) throw new Error("not-signed-in");
  }

  // ---- users & sign-in ----
  _users() {
    return this.q.list.all("users").map((r) => JSON.parse(r.data));
  }
  _hash(password, salt) {
    return crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  }
  _publicUser(u) {
    const { hash, salt, recoveryHash, recoverySalt, ...rest } = u;
    return { ...rest, hasRecovery: !!recoveryHash };
  }
  // Recovery key: 20 random characters (100 bits) shown ONCE; only a salted hash is stored.
  _makeRecovery(u) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.randomBytes(20);
    let raw = "";
    for (const b of bytes) raw += alphabet[b % alphabet.length];
    u.recoverySalt = crypto.randomBytes(16).toString("hex");
    u.recoveryHash = this._hash(raw, u.recoverySalt);
    return raw.match(/.{4}/g).join("-");
  }
  _normKey(k) {
    return String(k || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  hasUsers() {
    return this._users().length > 0;
  }
  _validPassword(p) {
    return typeof p === "string" && p.length >= 6 && p.length <= 200;
  }
  createFirstAdmin({ name, username, password }) {
    if (this.hasUsers()) throw new Error("already-set-up");
    return this._createUser({ name, username, password, role: "admin" }, true);
  }
  _createUser({ name, username, password, role, active = true }, first = false) {
    if (!first && !this._isRole("admin")) throw new Error("forbidden");
    if (!ROLES.includes(role)) throw new Error("bad-role");
    if (typeof username !== "string" || !/^[\w.@-]{3,40}$/.test(username)) throw new Error("bad-username");
    if (!this._validPassword(password)) throw new Error("weak-password");
    const uname = username.toLowerCase();
    if (this._users().some((u) => u.username === uname)) throw new Error("username-taken");
    const salt = crypto.randomBytes(16).toString("hex");
    const rec = { name: String(name || username).slice(0, 80), username: uname, role, active, salt, hash: this._hash(password, salt) };
    const recoveryKey = first ? this._makeRecovery(rec) : undefined;
    const u = this._put("users", rec);
    return first ? { user: this._publicUser(u), recoveryKey } : this._publicUser(u);
  }
  login(username, password) {
    const uname = String(username || "").toLowerCase();
    const f = this.failures.get(uname) || { n: 0, until: 0 };
    if (Date.now() < f.until) return { ok: false, error: "locked", waitMs: f.until - Date.now() };
    const u = this._users().find((x) => x.username === uname);
    let ok = false;
    if (u && u.active !== false) {
      const h = Buffer.from(this._hash(password, u.salt), "hex");
      ok = crypto.timingSafeEqual(h, Buffer.from(u.hash, "hex"));
    } else {
      this._hash(password, "00000000000000000000000000000000"); // equalise timing
    }
    if (!ok) {
      f.n += 1;
      if (f.n >= 5) f.until = Date.now() + Math.min(60000 * 2 ** (f.n - 5), 15 * 60000);
      this.failures.set(uname, f);
      this._log("login-failed", { username: uname });
      return { ok: false, error: "invalid" };
    }
    this.failures.delete(uname);
    this.session = { id: u.id, role: u.role, name: u.name, username: u.username };
    this._log("login", {}, u);
    return { ok: true, user: this._publicUser(u) };
  }
  logout() {
    this.session = null;
    return true;
  }
  currentUser() {
    return this.session;
  }
  // Forgot-password flow: username + recovery key -> new password (and a fresh recovery key)
  resetWithRecovery(username, key, newPassword) {
    const uname = String(username || "").toLowerCase();
    const fk = "recovery:" + uname;
    const f = this.failures.get(fk) || { n: 0, until: 0 };
    if (Date.now() < f.until) throw new Error("locked");
    if (!this._validPassword(newPassword)) throw new Error("weak-password");
    const u = this._users().find((x) => x.username === uname);
    let ok = false;
    if (u && u.recoveryHash && u.active !== false) {
      const h = Buffer.from(this._hash(this._normKey(key), u.recoverySalt), "hex");
      ok = crypto.timingSafeEqual(h, Buffer.from(u.recoveryHash, "hex"));
    } else {
      this._hash("x", "00000000000000000000000000000000");
    }
    if (!ok) {
      f.n += 1;
      if (f.n >= 5) f.until = Date.now() + Math.min(60000 * 2 ** (f.n - 5), 30 * 60000);
      this.failures.set(fk, f);
      this._log("recovery-failed", { username: uname });
      throw new Error("invalid-recovery");
    }
    this.failures.delete(fk);
    this.failures.delete(uname);
    u.salt = crypto.randomBytes(16).toString("hex");
    u.hash = this._hash(newPassword, u.salt);
    const recoveryKey = this._makeRecovery(u);
    this._put("users", u);
    this._log("password-reset-recovery", {}, u);
    return { recoveryKey };
  }
  // Create / renew the recovery key of the signed-in user (needs the current password)
  newRecoveryKey(password) {
    this._requireSession();
    const u = this._users().find((x) => x.id === this.session.id);
    const ok = u && crypto.timingSafeEqual(Buffer.from(this._hash(password, u.salt), "hex"), Buffer.from(u.hash, "hex"));
    if (!ok) throw new Error("invalid");
    const recoveryKey = this._makeRecovery(u);
    this._put("users", u);
    this._log("recovery-key-renewed");
    return { recoveryKey };
  }
  listUsers() {
    if (!this._isRole("admin")) throw new Error("forbidden");
    return this._users().map((u) => this._publicUser(u));
  }
  saveUser(input) {
    if (!this._isRole("admin")) throw new Error("forbidden");
    if (!input.id) return this._createUser(input);
    const cur = this._users().find((u) => u.id === input.id);
    if (!cur) throw new Error("not-found");
    const next = { ...cur, name: String(input.name || cur.name).slice(0, 80) };
    if (ROLES.includes(input.role)) next.role = input.role;
    if (typeof input.active === "boolean") next.active = input.active;
    const admins = this._users().filter((u) => u.role === "admin" && u.active !== false && u.id !== cur.id);
    if ((next.role !== "admin" || next.active === false) && cur.role === "admin" && admins.length === 0) {
      throw new Error("last-admin");
    }
    if (input.password) {
      if (!this._validPassword(input.password)) throw new Error("weak-password");
      next.salt = crypto.randomBytes(16).toString("hex");
      next.hash = this._hash(input.password, next.salt);
    }
    return this._publicUser(this._put("users", next));
  }
  deleteUser(id) {
    if (!this._isRole("admin")) throw new Error("forbidden");
    const all = this._users();
    const cur = all.find((u) => u.id === id);
    if (!cur) return true;
    if (cur.id === this.session.id) throw new Error("cannot-delete-self");
    if (cur.role === "admin" && all.filter((u) => u.role === "admin" && u.active !== false).length <= 1) throw new Error("last-admin");
    this.q.del.run("users", id);
    return true;
  }
  changeOwnPassword(oldPassword, newPassword) {
    this._requireSession();
    const u = this._users().find((x) => x.id === this.session.id);
    const ok = u && crypto.timingSafeEqual(Buffer.from(this._hash(oldPassword, u.salt), "hex"), Buffer.from(u.hash, "hex"));
    if (!ok) throw new Error("invalid");
    if (!this._validPassword(newPassword)) throw new Error("weak-password");
    u.salt = crypto.randomBytes(16).toString("hex");
    u.hash = this._hash(newPassword, u.salt);
    this._put("users", u);
    return true;
  }
  _log(action, detail, user) {
    try {
      const u = user || this.session || {};
      this._put("audit", { action, detail, user: u.username || detail?.username || "", at: Date.now() });
      // keep the log from growing without limit
      const n = this.db.prepare("SELECT COUNT(*) AS c FROM records WHERE kind='audit'").get().c;
      if (n > 5000) {
        this.db.exec("DELETE FROM records WHERE kind='audit' AND id IN (SELECT id FROM records WHERE kind='audit' ORDER BY updated_at ASC LIMIT 500)");
      }
    } catch {}
  }
  audit(action, detail) {
    this._requireSession();
    this._log(String(action).slice(0, 40), detail && typeof detail === "object" ? detail : {});
    return true;
  }

  // ---- backups (AES-256-GCM, key from password via scrypt) ----
  _dump(includeUsers = true) {
    const rows = this.db.prepare("SELECT kind,id,data,updated_at FROM records").all();
    return {
      app: "BLR", v: 1, at: Date.now(),
      records: rows.filter((r) => includeUsers || r.kind !== "users"),
      counters: this.db.prepare("SELECT name,value FROM counters").all(),
    };
  }
  exportBackup(password) {
    this._requireSession();
    const plain = Buffer.from(JSON.stringify(this._dump(true)), "utf8");
    if (!password) return Buffer.concat([Buffer.from("BLRB0"), plain]);
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
    const c = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([c.update(plain), c.final()]);
    return Buffer.concat([Buffer.from("BLRB1"), salt, iv, c.getAuthTag(), enc]);
  }
  static parseBackup(buf, password) {
    const magic = buf.subarray(0, 5).toString();
    if (magic === "BLRB0") return JSON.parse(buf.subarray(5).toString("utf8"));
    if (magic !== "BLRB1") throw new Error("not-a-backup");
    if (!password) throw new Error("password-required");
    const salt = buf.subarray(5, 21), iv = buf.subarray(21, 33), tag = buf.subarray(33, 49), enc = buf.subarray(49);
    const key = crypto.scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
    const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
    d.setAuthTag(tag);
    try {
      return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString("utf8"));
    } catch {
      throw new Error("wrong-password");
    }
  }
  restoreBackup(buf, password) {
    if (!this._isRole("admin")) throw new Error("forbidden");
    const dump = Store.parseBackup(buf, password);
    if (!dump || dump.app !== "BLR" || !Array.isArray(dump.records)) throw new Error("not-a-backup");
    this.autoBackup("before-restore");
    this._tx(() => {
      this.db.exec("DELETE FROM records; DELETE FROM counters;");
      for (const r of dump.records) this.q.put.run(r.kind, r.id, r.data, r.updated_at);
      for (const c of dump.counters || []) this.q.counterSet.run(c.name, c.value);
    });
    this.session = null; // sign in again with the restored accounts
    return true;
  }
  // daily automatic copy kept in the data folder (last 14)
  autoBackup(tag = "auto") {
    try {
      const dir = path.join(this.dir, "backups");
      fs.mkdirSync(dir, { recursive: true });
      const day = new Date().toISOString().slice(0, 10);
      const f = path.join(dir, `blr-${day}${tag === "auto" ? "" : "-" + tag}.blrbak`);
      if (tag === "auto" && fs.existsSync(f)) return null;
      const plain = Buffer.concat([Buffer.from("BLRB0"), Buffer.from(JSON.stringify(this._dump(true)))]);
      fs.writeFileSync(f, plain);
      const all = fs.readdirSync(dir).filter((n) => n.endsWith(".blrbak")).sort();
      for (const old of all.slice(0, Math.max(0, all.length - 14))) fs.unlinkSync(path.join(dir, old));
      return f;
    } catch {
      return null;
    }
  }
  close() {
    try { this.db.close(); } catch {}
  }
}

module.exports = { Store, ROLES };
