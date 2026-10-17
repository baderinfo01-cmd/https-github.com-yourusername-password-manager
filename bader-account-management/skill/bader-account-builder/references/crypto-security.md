# Vault crypto design and security rules

Source of truth: `src/lib/vaultCrypto.ts` (identical in the template; covered by `tests/vault.test.mts`, 7 tests). **Do not "improve" it casually**: any change to parameters or blob layout must keep old vaults readable (the blob carries `v` and `iter` for that reason) and must come with tests.

## Design
- **Master password is never stored.** `deriveKey = PBKDF2-SHA256(password, salt[16 bytes random], iter=600_000) -> AES-GCM 256` (WebCrypto, non-extractable key). Correctness is proven by decrypting a small known value (`check = AES-GCM("bader-vault-ok")`); there is no password hash.
- **Everything at rest is ciphertext**: the zustand state is serialized and encrypted with a fresh random 12-byte IV on every write (`encryptedStorage.setItem`), stored in `localStorage["bader-vault-v3"]` as one JSON blob:
  `{ v:3, salt, iter, check:{iv,ct}, data?:{iv,ct}, fails?, lockUntil?, log?:LoginEvent[] }`
- **Key lives only in memory** (`let sessionKey`). `lockVault()` drops it; the UI then does `window.location.replace` so decrypted objects vanish. No "remember me", no biometrics, no recovery: forgetting the password = data loss (the UI says so at creation; the README says so).
- **States** (`getVaultState`): `needs-setup` (no blob) -> `locked` (blob, no key) -> `unlocked`.
- **Password policy**: `passwordProblem`: >= 8 chars (`MIN_PASSWORD_LENGTH`), at least one letter and one digit. `createVault` throws `weak-password` otherwise (the UI shows `auth.passwordTooShort/passwordWeak`).
- **Throttling**: failures counted in the blob (`fails`); after 3 free attempts the wait is `min(2^(fails-2), 900)` seconds (`lockUntil`). While waiting, `unlockVault` returns `{ok:false, waitMs}` without trying. Counting persists across restarts (it is in the blob). A success clears it.
- **Change password** (`changeMasterPassword(current,next)`): verifies `current` (derives again), decrypts data with the session key, new salt + key, re-encrypts data and check, **keeps `log`**, replaces the session key. The old password stops working (tested).
- **Dangerous actions re-verify** with `verifyPassword()` through `<PasswordDialog mode="confirm">` (wipe data, restore defaults). Do the same for any new destructive/exfiltrating action (export plaintext, delete all).
- **Wipe** (`wipeVaultData`) removes `data` but keeps the password; callers then `window.location.reload()`.
- **Legacy migration**: an old plaintext `bader-storage-v2` (earlier versions accepted any password and even stored it) is encrypted into the new vault at creation, the plaintext master password field is deleted, and the legacy key removed. New programs have no legacy data; the code stays because it is tested and harmless.
- **Sign-in history** lives in the blob but OUTSIDE the encrypted `data` (so failed attempts can be recorded while locked): time, result (`success|failed|locked`), device, OS, app version, optional IP + approximate place, source. Max 200 events. It contains no secret. `loginSummary()` must be called BEFORE logging the new success (it returns last success + failures since).
- **Backups** `.bbak`: `{format:"bader-backup", v:1, salt, iter, iv, ct}` encrypted with its OWN password (PBKDF2 600k again). Export is always encrypted; import accepts `.bbak` (asks the password) or legacy `.json`. Wrong password -> `null` (never throws to the UI). Template addition: the exported JSON carries `app: <slug>` and `importAllData` refuses another program's backup.

## What this does and does not protect (be honest in docs and answers)
Protects: stolen disk / copied `%APPDATA%` folder, curious users of the PC, cloud sync of the profile folder. Does NOT protect: malware running while the app is unlocked (memory), keyloggers, a weak master password (600k PBKDF2 slows brute force; it does not stop it), the plaintext clipboard (mitigated: copy auto-clears after 20 s if unchanged), screenshots of an open vault (mitigated in the packaged app by `setContentProtection`). Dev/unpackaged mode is not protected by the licence. A determined attacker can patch any local program: the licence stops casual copying, not reverse engineering.

## Rules for any new feature (learned the hard way; see pitfalls.md)
1. **Secret fields** (passwords, PIN, CVV, card number, document/ID numbers, API keys, notes that may contain secrets) are: masked by default in lists; copied only through `copyToClipboard` (auto-clear); hidden on printouts unless the user agrees (`askSecrets`); **never** in the AI summary, logs, notifications, error messages, `console.*`, URLs, or filenames.
2. The AI summary is an allow-list built in ONE place (`aiTools.buildSummary` / `securityAudit.buildAiSummary`): site names, counts, categories, dates. A new tool = new `case` + a unit test asserting no secret substring appears (see `tests/audit.test.mts`).
3. The Anthropic API key is typed by the user, stored encrypted inside the vault (`aiApiKey`), excluded from backups, sent only to the main process (`baderAI.ask`), validated `^sk-ant-[\w-]{10,}$`; the question is limited to 1000 chars and the summary to 20 000 chars; the model id is the constant `MODEL` in `electron-ai.js` (update when models change; it is not a secret).
4. Breach check = HIBP k-anonymity: SHA-1 in the renderer, only the 5-char prefix goes (via main) to `api.pwnedpasswords.com/range/<prefix>` with `Add-Padding`. Never send the password or full hash.
5. Network from the renderer is impossible by CSP; any new outbound call goes through a main-process IPC handler with input validation, a timeout (`AbortSignal.timeout`) and `{ok,error}` results. The sign-in place lookup (`ipwho.is`) is optional (Settings toggle, default on) and sends only the IP.
6. Randomness: `crypto.getRandomValues` only (generator uses rejection sampling to avoid modulo bias). Never `Math.random()` for secrets. (`generateId` uses it for non-secret ids only.)
7. Do not log or `alert()` raw errors; show translated sentences. Do not put user data in `localStorage` outside the vault.
8. A new dependency that touches secrets, crypto or the network needs a reason in the PR/answer; prefer WebCrypto and Node built-ins (the real app still ships `crypto-js` only for a dead helper in `encryption.ts`; the template drops it).
9. Keep `contextIsolation:true`, `sandbox:true`, `nodeIntegration:false`; expose functions only; validate every IPC argument in main (see `registerAi`).
10. Never weaken the CSP to make a library work; bundle the library instead.
