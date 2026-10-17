/** Unique-enough record id (time + random). No crypto here: real encryption lives in vaultCrypto.ts. */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
