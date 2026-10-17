/**
 * Bader License for Electron — v1.0.0
 * Baderinfo Apps (https://baderinfo.com)
 *
 * Protects a Windows .exe (Electron) with single-use activation codes tied to ONE device:
 *   - at first activation the code is sent with the device fingerprint; the server binds the
 *     code to that machine and answers with a license signed with Ed25519;
 *   - every launch the license is verified LOCALLY against the embedded public key, in the
 *     main process, so copying the .exe to another PC fails (different fingerprint);
 *   - every 12 hours the server is asked whether the license was cancelled / extended / moved;
 *   - after 14 days with no successful check the license stops (a copy that blocks the server
 *     cannot run for ever). While you develop with `npm run dev`, dev mode lets it run freely.
 *
 * Runs ONLY in the main process. The renderer (your app window) talks to it through a small,
 * read-only IPC bridge (see preload.js). The renderer can never grant itself a license.
 *
 * Requirements: Electron 20+ (Node 16+). No external dependencies.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const { app } = require('electron');
const { getDeviceId, getDeviceLabel } = require('./device-id');

const EDITIONS = ['basic', 'pro', 'elite', 'unlimited'];
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

class BaderLicense {
    constructor(config = {}) {
        this.cfg = Object.assign({
            server_url: '',
            public_key: '',
            product_id: '',
            app_name: 'My App',
            app_version: (app && app.getVersion && app.getVersion()) || '',
            check_interval_hours: 12,
            max_offline_days: 14,
            // Run without a license while developing (npm run dev / not packaged).
            dev_mode: !(app && app.isPackaged),
            request_timeout_ms: 12000,
            // Where the signed license is stored (default: Electron userData, per-user, writable)
            storage_file: null,
        }, config);
        this._data = null;
        this._deviceId = null;
    }

    static fromFile(file) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        return new BaderLicense(require(file));
    }

    /* ================================================================
     * Public API (main process)
     * ================================================================ */

    deviceId() {
        if (!this._deviceId) this._deviceId = getDeviceId();
        return this._deviceId;
    }

    async status() {
        if (this.cfg.dev_mode) {
            return this._devState();
        }
        await this._maybeCheck();
        return this._evaluate();
    }

    async isValid() {
        return (await this.status()).valid;
    }

    async edition() {
        const s = await this.status();
        return s.valid ? s.edition : '';
    }

    async hasEdition(minimum) {
        const current = EDITIONS.indexOf(await this.edition());
        const wanted = EDITIONS.indexOf(minimum);
        return current !== -1 && wanted !== -1 && current >= wanted;
    }

    async activate(code) {
        code = String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (!/^[A-Z0-9]{2,8}(-[A-Z0-9]{4}){3,5}$/.test(code)) {
            return { success: false, message: this._t('invalid_code') };
        }
        const data = this._load();
        if (!data.instance) {
            data.instance = crypto.randomBytes(16).toString('hex');
            this._save(data);
        }
        const res = await this._request('activate', { code, device_label: getDeviceLabel() });
        if (!res.ok) {
            return { success: false, message: this._serverMessage(res.code, res.data) };
        }
        const token = String(res.data.token || '');
        const check = this._evaluateToken(token, {});
        if (!check.valid) {
            return { success: false, message: check.message };
        }
        const now = Math.floor(Date.now() / 1000);
        Object.assign(data, {
            token,
            code_hint: code.slice(0, 4) + '-••••-••••-' + code.slice(-4),
            activated_at: now, last_ok: now, last_attempt: now, remote: 'active',
        });
        this._save(data);
        return { success: true, message: this._t('activated') };
    }

    async check() {
        const data = this._load();
        if (!data.token) return;
        const payload = this._decode(data.token);
        if (!payload || !payload.lid) return;
        data.last_attempt = Math.floor(Date.now() / 1000);
        this._save(data);

        const res = await this._request('check', { lid: payload.lid });
        if (res.ok) {
            data.last_ok = Math.floor(Date.now() / 1000);
            data.remote = String(res.data.status || 'active').replace(/[^a-z_]/g, '');
            if (res.data.token) {
                const fresh = this._decode(res.data.token);
                if (fresh && fresh.lid === payload.lid) data.token = String(res.data.token);
            }
        } else if (['revoked', 'released', 'not_found'].includes(res.code)) {
            data.last_ok = Math.floor(Date.now() / 1000);
            data.remote = 'revoked';
        }
        this._save(data);
    }

    deactivate() {
        const data = this._load();
        this._save({ instance: data.instance || '' });
    }

    /**
     * Register the IPC handlers the activation window uses. Call once, before creating windows.
     * Channels (all in the main process):
     *   bader-license:status   -> status object
     *   bader-license:activate  (code) -> { success, message }
     *   bader-license:recheck  -> status object
     *   bader-license:config   -> { app_name, lang, purchase_url, device_label }
     */
    registerIpc(ipcMain) {
        ipcMain.handle('bader-license:status', async () => this.status());
        ipcMain.handle('bader-license:activate', async (_e, code) => {
            const r = await this.activate(code);
            return Object.assign(r, { status: await this.status() });
        });
        ipcMain.handle('bader-license:recheck', async () => {
            await this.check();
            return this.status();
        });
        ipcMain.handle('bader-license:config', async () => ({
            app_name: this.cfg.app_name,
            lang: this.cfg.lang || 'ar',
            purchase_url: this.cfg.purchase_url || '',
            device_label: getDeviceLabel(),
        }));
    }

    /* ================================================================
     * Evaluation
     * ================================================================ */

    _devState() {
        return {
            valid: true, status: 'dev', dev: true,
            message: this._t('dev'), plan: 'pro', edition: 'pro',
            customer: '', license_id: 'DEV', domain: this.deviceId().slice(0, 12),
            activated: 0, expires: 0, days_left: null,
        };
    }

    _evaluate() {
        const data = this._load();
        if (!data.token) return this._stateOf('missing', {}, this._t('missing'));
        return this._evaluateToken(data.token, data);
    }

    _evaluateToken(token, data) {
        const p = this._decode(token);
        if (!p) return this._stateOf('bad_signature', {}, this._t('bad_signature'));
        if (!p.pid || p.pid !== this.cfg.product_id) return this._stateOf('wrong_product', p, this._t('wrong_product'));
        if (data.remote === 'revoked') return this._stateOf('revoked', p, this._t('revoked'));

        // The license must be bound to THIS device
        if ((p.bind || 'device') === 'device' && p.domain !== this.deviceId()) {
            return this._stateOf('wrong_device', p, this._t('wrong_device'));
        }
        const now = Math.floor(Date.now() / 1000);
        if (p.exp && now > Number(p.exp)) return this._stateOf('expired', p, this._t('expired'));
        const max = Number(this.cfg.max_offline_days) || 0;
        if (max > 0 && data.last_ok && now - Number(data.last_ok) > max * 86400) {
            return this._stateOf('offline', p, this._t('offline').replace('%d', String(max)));
        }
        const s = this._stateOf('active', p, this._t('active'));
        s.valid = true;
        return s;
    }

    _stateOf(status, p, message) {
        const exp = p.exp ? Number(p.exp) : 0;
        return {
            valid: false, status, message,
            plan: p.plan || '', edition: p.edition || '', customer: p.name || '',
            license_id: p.lid || '', domain: p.domain || '',
            activated: p.iat ? Number(p.iat) : 0, expires: exp,
            days_left: exp ? Math.floor((exp - Date.now() / 1000) / 86400) : null,
        };
    }

    /** Verify the Ed25519 signature and return the payload, or null. */
    _decode(token) {
        try {
            let t = String(token || '').replace(/\s+/g, '');
            if (/^[A-Za-z0-9]{2,12}-/.test(t)) t = t.slice(t.indexOf('-') + 1);
            const parts = t.split('.');
            if (parts.length !== 2) return null;
            const message = Buffer.from(parts[0], 'base64url');
            const signature = Buffer.from(parts[1], 'base64url');
            const raw = Buffer.from(String(this.cfg.public_key), 'base64');
            if (signature.length !== 64 || raw.length !== 32) return null;
            const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519_PREFIX, raw]), format: 'der', type: 'spki' });
            if (!crypto.verify(null, message, key, signature)) return null;
            const payload = JSON.parse(message.toString('utf8'));
            return payload && Number(payload.v) === 2 ? payload : null;
        } catch (e) {
            return null;
        }
    }

    /* ================================================================
     * Server
     * ================================================================ */

    async _maybeCheck() {
        const data = this._load();
        if (!data.token) return;
        const interval = Math.max(1, Number(this.cfg.check_interval_hours) || 12) * 3600;
        const now = Math.floor(Date.now() / 1000);
        if (!data.last_attempt || now - Number(data.last_attempt) > interval) await this.check();
    }

    _request(action, fields) {
        return new Promise((resolve) => {
            if (!this.cfg.server_url) return resolve({ ok: false, code: 'no_server', data: {} });
            const data = this._load();
            const body = querystring.stringify(Object.assign({
                action,
                domain: this.deviceId(), // device products send the fingerprint in this field
                site_url: '',
                instance: data.instance || '',
                product: this.cfg.product_id,
                version: this.cfg.app_version,
            }, fields));
            let url;
            try { url = new URL(this.cfg.server_url); } catch (e) { return resolve({ ok: false, code: 'no_server', data: {} }); }
            const lib = url.protocol === 'http:' ? http : https;
            const req = lib.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), Accept: 'application/json' },
                timeout: this.cfg.request_timeout_ms,
            }, (res) => {
                let raw = '';
                res.setEncoding('utf8');
                res.on('data', (c) => { raw += c; });
                res.on('end', () => {
                    let json;
                    try { json = JSON.parse(raw); } catch (e) { return resolve({ ok: false, code: 'bad_response', data: {} }); }
                    if (!json || !json.success) {
                        return resolve({ ok: false, code: String((json && json.code) || 'server_error').replace(/[^a-z_]/g, ''), data: json || {} });
                    }
                    return resolve({ ok: true, code: 'ok', data: json });
                });
            });
            req.on('timeout', () => req.destroy(new Error('timeout')));
            req.on('error', () => resolve({ ok: false, code: 'unreachable', data: {} }));
            req.end(body);
            return undefined;
        });
    }

    _serverMessage(code, data) {
        if (code === 'already_used') return this._t('already_used');
        if (code === 'invalid_code' || code === 'not_found') return this._t('invalid_code');
        if (code === 'bad_device') return this._t('bad_device');
        if (code === 'released') return this._t('revoked');
        if (['trial_used', 'revoked', 'expired', 'wrong_product', 'rate_limited', 'unreachable'].includes(code)) return this._t(code);
        return this._t('server_error');
    }

    /* ================================================================
     * Storage (signed token saved in the per-user Electron data folder)
     * ================================================================ */

    _file() {
        if (this.cfg.storage_file) return this.cfg.storage_file;
        const dir = (app && app.getPath) ? app.getPath('userData') : path.join(require('os').tmpdir(), 'bader-license');
        return path.join(dir, 'license.dat');
    }

    _load() {
        if (this._data) return this._data;
        try {
            const raw = JSON.parse(fs.readFileSync(this._file(), 'utf8'));
            // A tamper-check tie to this device: a copied license.dat from another PC is ignored
            if (raw && raw.payload && raw.guard === this._guard(raw.payload)) {
                this._data = raw.payload;
            } else {
                this._data = {};
            }
        } catch (e) {
            this._data = {};
        }
        return this._data;
    }

    _save(data) {
        this._data = data;
        try {
            const dir = path.dirname(this._file());
            fs.mkdirSync(dir, { recursive: true });
            const out = JSON.stringify({ payload: data, guard: this._guard(data) });
            const tmp = this._file() + '.tmp';
            fs.writeFileSync(tmp, out, { mode: 0o600 });
            fs.renameSync(tmp, this._file());
            return true;
        } catch (e) {
            return false;
        }
    }

    // Binds the stored file to this machine (not a secret, just stops a plain file-copy)
    _guard(data) {
        return crypto.createHmac('sha256', this.deviceId() + '|' + this.cfg.product_id)
            .update(JSON.stringify(data.token || '') + '|' + (data.instance || '')).digest('hex').slice(0, 32);
    }

    /* ================================================================
     * Texts
     * ================================================================ */

    _t(key) {
        const texts = BaderLicense.TEXTS;
        const lang = texts[this.cfg.lang] ? this.cfg.lang : 'ar';
        return (texts[lang] && texts[lang][key]) || key;
    }
}

BaderLicense.TEXTS = {
    "ar": {
        "title": "تفعيل الترخيص",
        "active_title": "الترخيص مفعّل",
        "intro": "هذا البرنامج محمي بترخيص. أدخل كود التفعيل الذي استلمته.",
        "code_label": "كود التفعيل",
        "activate": "تفعيل الترخيص",
        "activated": "تم تفعيل الترخيص بنجاح.",
        "active": "الترخيص مفعّل على هذا الجهاز.",
        "missing": "لم يتم تفعيل الترخيص بعد.",
        "genuine": "ترخيص أصلي موقّع",
        "customer": "الزبون",
        "license_no": "رقم الترخيص",
        "plan": "الخطة",
        "valid_until": "صالح حتى",
        "lifetime": "مدى الحياة",
        "check_now": "تحقق الآن",
        "remove": "إزالة الترخيص",
        "remove_confirm": "إزالة الترخيص من هذا الموقع؟",
        "removed": "تمت إزالة الترخيص من هذا الموقع.",
        "one_site": "كل كود يعمل على جهاز واحد فقط.",
        "buy": "شراء ترخيص",
        "invalid_code": "كود التفعيل غير صحيح. تأكد أنك نسخته كاملاً.",
        "already_used": "هذا الكود مستعمل على جهاز آخر. كل كود يعمل على جهاز واحد فقط.",
        "trial_used": "تم استعمال النسخة التجريبية من قبل على هذا الجهاز.",
        "revoked": "تم إلغاء هذا الترخيص. تواصل مع البائع.",
        "expired": "انتهت صلاحية الترخيص. فعّل كوداً جديداً.",
        "wrong_domain": "هذا الترخيص ليس لهذا الموقع (%s).",
        "wrong_product": "هذا الكود خاص ببرنامج آخر.",
        "rate_limited": "محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.",
        "unreachable": "تعذّر الاتصال بخادم التفعيل. تحقق من اتصال الاستضافة بالإنترنت.",
        "server_error": "أرجع خادم التفعيل خطأ. أعد المحاولة أو تواصل مع البائع.",
        "bad_signature": "ملف الترخيص غير صالح أو تم تعديله.",
        "offline": "تعذّر التحقق من الترخيص منذ أكثر من %d يوماً. تأكد أن الجهاز متصل بالإنترنت ثم اضغط تحقق الآن.",
        "wrong_device": "هذا الترخيص مفعّل على جهاز آخر. لنقله إلى هذا الجهاز تواصل مع البائع.",
        "bad_device": "تعذّر قراءة بصمة هذا الجهاز. أعد تشغيل البرنامج كمسؤول (Run as administrator) ثم أعد المحاولة.",
        "dev": "وضع التطوير: البرنامج يعمل بدون ترخيص لأنه غير مبني كملف exe بعد.",
        "device": "الجهاز",
        "your_device": "جهازك الحالي"
    },
    "fr": {
        "title": "Activation de la licence",
        "active_title": "Licence active",
        "intro": "Ce logiciel est protégé par une licence. Saisissez le code d’activation reçu.",
        "code_label": "Code d’activation",
        "activate": "Activer la licence",
        "activated": "Licence activée avec succès.",
        "active": "Licence active sur cet appareil.",
        "missing": "Aucune licence n’est encore activée.",
        "genuine": "Licence originale signée",
        "customer": "Client",
        "license_no": "N° de licence",
        "plan": "Formule",
        "valid_until": "Valable jusqu’au",
        "lifetime": "À vie",
        "check_now": "Vérifier",
        "remove": "Retirer la licence",
        "remove_confirm": "Retirer la licence de ce site ?",
        "removed": "Licence retirée de ce site.",
        "one_site": "Chaque code fonctionne sur un seul appareil.",
        "buy": "Acheter une licence",
        "invalid_code": "Code d’activation incorrect. Vérifiez qu’il est complet.",
        "already_used": "Ce code est déjà utilisé sur un autre appareil. Chaque code fonctionne sur un seul appareil.",
        "trial_used": "Un essai a déjà été utilisé sur cet appareil.",
        "revoked": "Cette licence a été annulée. Contactez le vendeur.",
        "expired": "La licence a expiré. Activez un nouveau code.",
        "wrong_domain": "Cette licence n’est pas pour ce site (%s).",
        "wrong_product": "Ce code appartient à un autre logiciel.",
        "rate_limited": "Trop de tentatives. Patientez quelques minutes.",
        "unreachable": "Impossible de joindre le serveur d’activation. Vérifiez la connexion de l’hébergement.",
        "server_error": "Le serveur d’activation a renvoyé une erreur. Réessayez ou contactez le vendeur.",
        "bad_signature": "Le fichier de licence est invalide ou a été modifié.",
        "offline": "La licence n’a pas pu être vérifiée depuis plus de %d jours. Vérifiez la connexion, puis cliquez sur Vérifier.",
        "wrong_device": "Cette licence est active sur un autre appareil. Pour la transférer ici, contactez le vendeur.",
        "bad_device": "Impossible de lire l’empreinte de cet appareil. Lancez le programme en tant qu’administrateur, puis réessayez.",
        "dev": "Mode développement : le programme fonctionne sans licence car il n’est pas encore compilé en .exe.",
        "device": "Appareil",
        "your_device": "Votre appareil"
    },
    "en": {
        "title": "License activation",
        "active_title": "License active",
        "intro": "This software is protected by a license. Enter the activation code you received.",
        "code_label": "Activation code",
        "activate": "Activate license",
        "activated": "License activated successfully.",
        "active": "License active on this device.",
        "missing": "No license has been activated yet.",
        "genuine": "Genuine signed license",
        "customer": "Customer",
        "license_no": "License number",
        "plan": "Plan",
        "valid_until": "Valid until",
        "lifetime": "Lifetime",
        "check_now": "Check now",
        "remove": "Remove license",
        "remove_confirm": "Remove the license from this website?",
        "removed": "License removed from this website.",
        "one_site": "Each code works on one device only.",
        "buy": "Buy a license",
        "invalid_code": "Invalid activation code. Check that you copied it completely.",
        "already_used": "This code is already used on another device. Each code works on one device only.",
        "trial_used": "A trial has already been used on this device.",
        "revoked": "This license has been cancelled. Contact the seller.",
        "expired": "The license has expired. Activate a new code.",
        "wrong_domain": "This license is not for this website (%s).",
        "wrong_product": "This code belongs to another program.",
        "rate_limited": "Too many attempts. Wait a few minutes and try again.",
        "unreachable": "Could not reach the activation server. Check the internet connection of the hosting.",
        "server_error": "The activation server returned an error. Try again or contact the seller.",
        "bad_signature": "The license file is invalid or was modified.",
        "offline": "The license could not be verified for more than %d days. Check the connection, then press Check now.",
        "wrong_device": "This license is active on another device. To move it here, contact the seller.",
        "bad_device": "Could not read this device fingerprint. Run the program as administrator, then try again.",
        "dev": "Development mode: the program runs without a license because it is not built as an .exe yet.",
        "device": "Device",
        "your_device": "Your device"
    }
};

module.exports = BaderLicense;
module.exports.BaderLicense = BaderLicense;
