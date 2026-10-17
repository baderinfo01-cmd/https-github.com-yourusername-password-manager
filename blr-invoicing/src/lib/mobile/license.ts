// Offline single-device licence client for the Android app. Same protocol as bader-license/license.js
// (Ed25519-signed token bound to the device fingerprint), with every platform dependency injected so the
// logic is unit-tested in Node (tests/mobile-license.test.mts) and wired to Capacitor in nativeLicense.ts.
import type { MobileLicenseConfig } from "./config";

export interface LicenseDeps {
  storage: { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void>; remove(k: string): Promise<void> };
  /** POST application/x-www-form-urlencoded; resolves with the raw response (never rejects on HTTP errors). */
  post(url: string, body: string): Promise<{ status: number; text: string }>;
  /** Stable per-phone identifier (Android ID). */
  rawDeviceId(): Promise<string>;
  deviceLabel(): Promise<string>;
  sha256Hex(s: string): Promise<string>;
  randomHex(bytes: number): string;
  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
  now(): number; // seconds
  lang(): "ar" | "fr" | "en";
}

export interface LicenseState {
  valid: boolean; status: string; message: string; plan: string; edition: string; customer: string; license_id: string;
  domain: string; activated: number; expires: number; days_left: number | null; dev?: boolean;
}
interface Stored { token?: string; instance?: string; code_hint?: string; activated_at?: number; last_ok?: number; last_attempt?: number; remote?: string }

const TEXTS: Record<"ar" | "fr" | "en", Record<string, string>> = {
  ar: {
    activated: "تم تفعيل الترخيص بنجاح.", active: "الترخيص مفعّل على هذا الهاتف.", missing: "لم يتم تفعيل الترخيص بعد.",
    invalid_code: "كود التفعيل غير صحيح. تأكد أنك نسخته كاملاً.", already_used: "هذا الكود مستعمل على هاتف آخر. كل كود يعمل على هاتف واحد فقط.",
    revoked: "تم إلغاء هذا الترخيص. تواصل مع البائع.", expired: "انتهت صلاحية الترخيص. فعّل كوداً جديداً.", wrong_product: "هذا الكود خاص ببرنامج آخر.",
    rate_limited: "محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.", unreachable: "تعذّر الاتصال بخادم التفعيل. تحقق من اتصال الهاتف بالإنترنت.",
    server_error: "أرجع خادم التفعيل خطأ. أعد المحاولة أو تواصل مع البائع.", bad_signature: "ملف الترخيص غير صالح أو تم تعديله.",
    offline: "تعذّر التحقق من الترخيص منذ أكثر من %d يوماً.", wrong_device: "هذا الترخيص مفعّل على هاتف آخر. لنقله تواصل مع البائع.", bad_device: "تعذّر قراءة بصمة هذا الهاتف.",
  },
  fr: {
    activated: "Licence activée avec succès.", active: "Licence active sur ce téléphone.", missing: "Aucune licence n’est encore activée.",
    invalid_code: "Code d’activation incorrect. Vérifiez qu’il est complet.", already_used: "Ce code est déjà utilisé sur un autre téléphone. Un code = un seul téléphone.",
    revoked: "Cette licence a été annulée. Contactez le vendeur.", expired: "La licence a expiré. Activez un nouveau code.", wrong_product: "Ce code appartient à un autre logiciel.",
    rate_limited: "Trop de tentatives. Patientez quelques minutes.", unreachable: "Serveur d’activation injoignable. Vérifiez la connexion Internet.",
    server_error: "Le serveur d’activation a renvoyé une erreur. Réessayez ou contactez le vendeur.", bad_signature: "Le fichier de licence est invalide ou a été modifié.",
    offline: "La licence n’a pas pu être vérifiée depuis plus de %d jours.", wrong_device: "Cette licence est active sur un autre téléphone. Contactez le vendeur pour la transférer.", bad_device: "Impossible de lire l’empreinte de ce téléphone.",
  },
  en: {
    activated: "License activated successfully.", active: "License active on this phone.", missing: "No license has been activated yet.",
    invalid_code: "Invalid activation code. Check that you copied it completely.", already_used: "This code is already used on another phone. Each code works on one phone only.",
    revoked: "This license has been cancelled. Contact the seller.", expired: "The license has expired. Activate a new code.", wrong_product: "This code belongs to another program.",
    rate_limited: "Too many attempts. Wait a few minutes and try again.", unreachable: "Could not reach the activation server. Check the internet connection.",
    server_error: "The activation server returned an error. Try again or contact the seller.", bad_signature: "The license file is invalid or was modified.",
    offline: "The license could not be verified for more than %d days.", wrong_device: "This license is active on another phone. To move it, contact the seller.", bad_device: "Could not read this phone's fingerprint.",
  },
};

const STORE_KEY = "blr-license";
const SALT = "bader-license-device-v1";

function b64(s: string, url = false): Uint8Array {
  let t = s.replace(/\s+/g, "");
  if (url) t = t.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export class MobileLicense {
  private data: Stored | null = null;
  private dev: string | null = null;
  private cfg: MobileLicenseConfig;
  private d: LicenseDeps;
  constructor(cfg: MobileLicenseConfig, d: LicenseDeps) { this.cfg = cfg; this.d = d; }

  private t(k: string) { return TEXTS[this.d.lang()][k] || TEXTS.ar[k] || k; }

  async deviceId(): Promise<string> {
    if (!this.dev) this.dev = await this.d.sha256Hex(`${SALT}|android|${await this.d.rawDeviceId()}`);
    return this.dev;
  }

  async status(): Promise<LicenseState> {
    await this.maybeCheck();
    return this.evaluate();
  }

  async activate(codeIn: string): Promise<{ success: boolean; message: string; status?: LicenseState }> {
    const code = String(codeIn || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!/^[A-Z0-9]{2,8}(-[A-Z0-9]{4}){3,5}$/.test(code)) return { success: false, message: this.t("invalid_code"), status: await this.evaluate() };
    const data = await this.load();
    if (!data.instance) { data.instance = this.d.randomHex(16); await this.save(data); }
    const res = await this.request("activate", { code, device_label: await this.d.deviceLabel() });
    if (!res.ok) return { success: false, message: this.serverMessage(res.code), status: await this.evaluate() };
    const token = String(res.data.token || "");
    const check = await this.evalToken(token, {});
    if (!check.valid) return { success: false, message: check.message, status: check };
    const now = this.d.now();
    Object.assign(data, { token, code_hint: code.slice(0, 4) + "-••••-••••-" + code.slice(-4), activated_at: now, last_ok: now, last_attempt: now, remote: "active" });
    await this.save(data);
    return { success: true, message: this.t("activated"), status: await this.evaluate() };
  }

  async check(): Promise<void> {
    const data = await this.load();
    if (!data.token) return;
    const payload = this.decode(data.token);
    if (!payload || !payload.lid) return;
    data.last_attempt = this.d.now();
    await this.save(data);
    const res = await this.request("check", { lid: payload.lid });
    if (res.ok) {
      data.last_ok = this.d.now();
      data.remote = String(res.data.status || "active").replace(/[^a-z_]/g, "");
      if (res.data.token) { const fresh = this.decode(String(res.data.token)); if (fresh && fresh.lid === payload.lid) data.token = String(res.data.token); }
    } else if (["revoked", "released", "not_found"].includes(res.code)) {
      data.last_ok = this.d.now();
      data.remote = "revoked";
    }
    await this.save(data);
  }

  async recheck(): Promise<LicenseState> { await this.check(); return this.evaluate(); }
  async deactivate(): Promise<void> { const d = await this.load(); await this.save({ instance: d.instance || "" }); }

  // ---- evaluation ----
  private async evaluate(): Promise<LicenseState> {
    const data = await this.load();
    if (!data.token) return this.stateOf("missing", {}, this.t("missing"));
    return this.evalToken(data.token, data);
  }

  private async evalToken(token: string, data: Stored): Promise<LicenseState> {
    const p = this.decode(token);
    if (!p) return this.stateOf("bad_signature", {}, this.t("bad_signature"));
    if (!p.pid || p.pid !== this.cfg.product_id) return this.stateOf("wrong_product", p, this.t("wrong_product"));
    if (data.remote === "revoked") return this.stateOf("revoked", p, this.t("revoked"));
    if ((p.bind || "device") === "device" && p.domain !== (await this.deviceId())) return this.stateOf("wrong_device", p, this.t("wrong_device"));
    const now = this.d.now();
    if (p.exp && now > Number(p.exp)) return this.stateOf("expired", p, this.t("expired"));
    const max = Number(this.cfg.max_offline_days) || 0;
    if (max > 0 && data.last_ok && now - Number(data.last_ok) > max * 86400) return this.stateOf("offline", p, this.t("offline").replace("%d", String(max)));
    const s = this.stateOf("active", p, this.t("active"));
    s.valid = true;
    return s;
  }

  private stateOf(status: string, p: any, message: string): LicenseState {
    const exp = p.exp ? Number(p.exp) : 0;
    return {
      valid: false, status, message, plan: p.plan || "", edition: p.edition || "", customer: p.name || "", license_id: p.lid || "",
      domain: p.domain || "", activated: p.iat ? Number(p.iat) : 0, expires: exp, days_left: exp ? Math.floor((exp - this.d.now()) / 86400) : null,
    };
  }

  /** Verify the Ed25519 signature and return the payload, or null. */
  decode(token: string): any | null {
    try {
      let t = String(token || "").replace(/\s+/g, "");
      if (/^[A-Za-z0-9]{2,12}-/.test(t)) t = t.slice(t.indexOf("-") + 1);
      const parts = t.split(".");
      if (parts.length !== 2) return null;
      const message = b64(parts[0], true), signature = b64(parts[1], true), pub = b64(this.cfg.public_key);
      if (signature.length !== 64 || pub.length !== 32) return null;
      if (!this.d.verify(message, signature, pub)) return null;
      const payload = JSON.parse(new TextDecoder().decode(message));
      return payload && Number(payload.v) === 2 ? payload : null;
    } catch { return null; }
  }

  // ---- server ----
  private async maybeCheck() {
    const data = await this.load();
    if (!data.token) return;
    const interval = Math.max(1, Number(this.cfg.check_interval_hours) || 12) * 3600;
    if (!data.last_attempt || this.d.now() - Number(data.last_attempt) > interval) await this.check();
  }

  private async request(action: string, fields: Record<string, string>): Promise<{ ok: boolean; code: string; data: any }> {
    if (!this.cfg.server_url) return { ok: false, code: "no_server", data: {} };
    const data = await this.load();
    const body = new URLSearchParams({ action, domain: await this.deviceId(), site_url: "", instance: data.instance || "", product: this.cfg.product_id, version: this.cfg.app_version, ...fields }).toString();
    try {
      const r = await this.d.post(this.cfg.server_url, body);
      let json: any;
      try { json = JSON.parse(r.text); } catch { return { ok: false, code: "bad_response", data: {} }; }
      if (!json || !json.success) return { ok: false, code: String((json && json.code) || "server_error").replace(/[^a-z_]/g, ""), data: json || {} };
      return { ok: true, code: "ok", data: json };
    } catch { return { ok: false, code: "unreachable", data: {} }; }
  }

  private serverMessage(code: string) {
    if (code === "already_used") return this.t("already_used");
    if (code === "invalid_code" || code === "not_found") return this.t("invalid_code");
    if (code === "bad_device") return this.t("bad_device");
    if (code === "released") return this.t("revoked");
    if (["revoked", "expired", "wrong_product", "rate_limited", "unreachable"].includes(code)) return this.t(code);
    return this.t("server_error");
  }

  // ---- storage (token + a device-bound guard that rejects a copied file) ----
  private async guard(d: Stored) { return (await this.d.sha256Hex(`${await this.deviceId()}|${this.cfg.product_id}|${JSON.stringify(d.token || "")}|${d.instance || ""}`)).slice(0, 32); }
  private async load(): Promise<Stored> {
    if (this.data) return this.data;
    try {
      const raw = JSON.parse((await this.d.storage.get(STORE_KEY)) || "null");
      this.data = raw && raw.payload && raw.guard === (await this.guard(raw.payload)) ? raw.payload : {};
    } catch { this.data = {}; }
    return this.data!;
  }
  private async save(d: Stored) {
    this.data = d;
    await this.d.storage.set(STORE_KEY, JSON.stringify({ payload: d, guard: await this.guard(d) }));
  }
}
