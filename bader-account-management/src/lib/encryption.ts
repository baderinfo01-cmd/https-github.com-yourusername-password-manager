import CryptoJS from "crypto-js";

export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decryptData(encryptedData: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}