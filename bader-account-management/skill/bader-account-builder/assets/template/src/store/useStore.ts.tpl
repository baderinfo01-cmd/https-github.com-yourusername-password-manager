import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptedStorage } from "@/lib/vaultCrypto";
import type {
  Account,
  ActivityLog,
  GeneratedPassword,
  MyInfo,
  // @module-type-imports
} from "@/types";
import { generateId } from "@/lib/encryption";
import { branding } from "@/config/branding";

/**
 * ONE zustand store for all user data, persisted ENCRYPTED (encryptedStorage -> AES-GCM in localStorage).
 * - skipHydration: nothing is read until the vault is unlocked; the login page calls `useStore.persist.rehydrate()`.
 * - Adding a module: scripts/add_module.py inserts code at the `// @module-*` markers. Keep the markers.
 * - exportAllData/importAllData/clearAllData must list EVERY collection or backups silently lose data.
 */
interface StoreState {
  accounts: Account[];
  myInfo: MyInfo;
  activityLog: ActivityLog[];
  generatedPasswords: GeneratedPassword[];
  // @module-state-types

  // settings
  theme: string;
  autoLockMinutes: number;
  notificationsEnabled: boolean;
  aiApiKey: string;

  setTheme: (theme: string) => void;
  setAutoLockMinutes: (minutes: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAiApiKey: (key: string) => void;
  updateMyInfo: (info: Partial<MyInfo>) => void;

  addAccount: (account: Omit<Account, "id" | "createdAt" | "updatedAt">) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  toggleFavoriteAccount: (id: string) => void;

  addGeneratedPassword: (password: string) => void;
  clearGeneratedPasswords: () => void;
  // @module-action-types

  logActivity: (type: ActivityLog["type"], itemType: string, itemName: string) => void;
  clearActivityLog: () => void;

  exportAllData: () => string;
  /** returns false (and changes nothing) when the file is not a backup of THIS program */
  importAllData: (data: string) => boolean;
  clearAllData: () => void;
}

const defaultMyInfo: MyInfo = { id: "main", firstName: "", lastName: "", username: "" };
const now = () => new Date().toISOString();
const arr = (v: unknown): v is unknown[] => Array.isArray(v);

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      accounts: [],
      myInfo: defaultMyInfo,
      activityLog: [],
      generatedPasswords: [],
      // @module-initial

      theme: "brand",
      autoLockMinutes: 5,
      notificationsEnabled: true,
      aiApiKey: "",

      setTheme: (theme) => set({ theme }),
      setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setAiApiKey: (aiApiKey) => set({ aiApiKey }),
      updateMyInfo: (info) => set({ myInfo: { ...get().myInfo, ...info } }),

      addAccount: (account) => {
        const rec: Account = { ...account, id: generateId(), createdAt: now(), updatedAt: now() };
        set({ accounts: [...get().accounts, rec] });
        get().logActivity("add", "account", account.siteName);
      },
      updateAccount: (id, updates) => {
        const old = get().accounts.find((a) => a.id === id);
        set({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: now() } : a)) });
        if (old) get().logActivity("edit", "account", updates.siteName || old.siteName);
      },
      deleteAccount: (id) => {
        const old = get().accounts.find((a) => a.id === id);
        set({ accounts: get().accounts.filter((a) => a.id !== id) });
        if (old) get().logActivity("delete", "account", old.siteName);
      },
      toggleFavoriteAccount: (id) =>
        set({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite } : a)) }),

      addGeneratedPassword: (password) =>
        set({ generatedPasswords: [{ id: generateId(), password, createdAt: now() }, ...get().generatedPasswords].slice(0, 50) }),
      clearGeneratedPasswords: () => set({ generatedPasswords: [] }),
      // @module-actions

      logActivity: (type, itemType, itemName) =>
        set({ activityLog: [{ id: generateId(), type, itemType, itemName, createdAt: now() }, ...get().activityLog].slice(0, 100) }),
      clearActivityLog: () => set({ activityLog: [] }),

      exportAllData: () =>
        JSON.stringify(
          {
            app: branding.slug, // lets importAllData refuse a backup made by another program
            version: branding.version,
            exportDate: now(),
            accounts: get().accounts,
            myInfo: get().myInfo,
            generatedPasswords: get().generatedPasswords,
            // @module-export
            settings: { theme: get().theme, autoLockMinutes: get().autoLockMinutes, notificationsEnabled: get().notificationsEnabled },
          },
          null,
          2
        ),

      importAllData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (!data || typeof data !== "object") return false;
          if (data.app && data.app !== branding.slug) return false;
          if (arr(data.accounts)) set({ accounts: data.accounts as Account[] });
          if (data.myInfo && typeof data.myInfo === "object") set({ myInfo: { ...defaultMyInfo, ...data.myInfo } });
          if (arr(data.generatedPasswords)) set({ generatedPasswords: data.generatedPasswords as GeneratedPassword[] });
          // @module-import
          if (data.settings && typeof data.settings === "object") {
            set({
              theme: data.settings.theme || "brand",
              autoLockMinutes: data.settings.autoLockMinutes || 5,
              notificationsEnabled: data.settings.notificationsEnabled ?? true,
            });
          }
          return true;
        } catch {
          return false;
        }
      },

      clearAllData: () =>
        set({
          accounts: [],
          myInfo: defaultMyInfo,
          activityLog: [],
          generatedPasswords: [],
          // @module-clear
          theme: "brand",
          autoLockMinutes: 5,
          notificationsEnabled: true,
          aiApiKey: "",
        }),
    }),
    {
      name: "bader-storage-v2",
      storage: createJSONStorage(() => encryptedStorage),
      // data is only readable after the vault is unlocked: the login page calls useStore.persist.rehydrate()
      skipHydration: true,
    }
  )
);
