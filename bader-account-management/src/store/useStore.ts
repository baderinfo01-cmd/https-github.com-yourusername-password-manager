import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptedStorage } from "@/lib/vaultCrypto";
import {
  Account,
  Subscription,
  Card,
  Document,
  Contact,
  ActivityLog,
  MyInfo,
  EmailAccount,
  PhoneAccount,
  AddressAccount,
  SecretAccount,
  WorkExperience,
  Education,
  Hobby,
  Achievement,
  Certification,
  GeneratedPassword,
  Analytics,
} from "@/types";
import { generateId } from "@/lib/encryption";

interface LocalizedLabels {
  ar?: string;
  en?: string;
  fr?: string;
}

interface CardCategory {
  value: string;
  label: string;
  color: string;
  icon: string;
  labels?: LocalizedLabels;
}

interface DocumentCategory {
  value: string;
  label: string;
  color: string;
  icon: string;
  labels?: LocalizedLabels;
}

interface ContactCategory {
  value: string;
  label: string;
  color: string;
  icon: string;
  labels?: LocalizedLabels;
}

interface StoreState {
  accounts: Account[];
  subscriptions: Subscription[];
  cards: Card[];
  documents: Document[];
  contacts: Contact[];
  myInfo: MyInfo;
  activityLog: ActivityLog[];
  cardCategories: CardCategory[];
  documentCategories: DocumentCategory[];
  contactCategories: ContactCategory[];
  generatedPasswords: GeneratedPassword[];
  analytics: Analytics[];

  // Settings
  theme: string;
  language: string;
  fontSize: string;
  autoLockMinutes: number;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  backupFrequency: string;
  exportFormat: string;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  enableBetaFeatures: boolean;
  enableAnalytics: boolean;
  aiApiKey: string;


  setTheme: (theme: string) => void;
  setLanguage: (language: string) => void;
  setFontSize: (fontSize: string) => void;
  setAutoLockMinutes: (minutes: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBackupFrequency: (freq: string) => void;
  setExportFormat: (format: string) => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setLoginAlerts: (enabled: boolean) => void;
  setSessionTimeout: (minutes: number) => void;
  setEnableBetaFeatures: (enabled: boolean) => void;
  setEnableAnalytics: (enabled: boolean) => void;
  setAiApiKey: (key: string) => void;

  addAccount: (
    account: Omit<Account, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  toggleFavoriteAccount: (id: string) => void;

  addSubscription: (
    subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateSubscription: (
    id: string,
    subscription: Partial<Subscription>
  ) => void;
  deleteSubscription: (id: string) => void;
  toggleFavoriteSubscription: (id: string) => void;

  addCard: (card: Omit<Card, "id" | "createdAt">) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  toggleFavoriteCard: (id: string) => void;
  addCardCategory: (category: CardCategory) => void;
  removeCardCategory: (value: string) => void;

  addDocument: (doc: Omit<Document, "id" | "createdAt">) => void;
  updateDocument: (id: string, doc: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  toggleFavoriteDocument: (id: string) => void;
  addDocumentCategory: (category: DocumentCategory) => void;
  removeDocumentCategory: (value: string) => void;

  addContact: (contact: Omit<Contact, "id" | "createdAt">) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  toggleFavoriteContact: (id: string) => void;
  addContactCategory: (category: ContactCategory) => void;
  removeContactCategory: (value: string) => void;

  updateMyInfo: (info: Partial<MyInfo>) => void;
  addEmail: (email: EmailAccount) => void;
  removeEmail: (id: string) => void;
  addPhone: (phone: PhoneAccount) => void;
  removePhone: (id: string) => void;
  addAddress: (address: AddressAccount) => void;
  removeAddress: (id: string) => void;
  addSecret: (secret: SecretAccount) => void;
  removeSecret: (id: string) => void;
  addExperience: (exp: WorkExperience) => void;
  removeExperience: (id: string) => void;
  addEducation: (edu: Education) => void;
  removeEducation: (id: string) => void;
  addHobby: (hobby: Hobby) => void;
  removeHobby: (id: string) => void;
  addAchievement: (achievement: Achievement) => void;
  removeAchievement: (id: string) => void;
  addCertification: (cert: Certification) => void;
  removeCertification: (id: string) => void;
  getCurrentLocation: () => Promise<{ lat: number; lng: number }>;

  addGeneratedPassword: (password: GeneratedPassword) => void;
  removeGeneratedPassword: (id: string) => void;
  toggleFavoritePassword: (id: string) => void;
  clearAllGeneratedPasswords: () => void;

  addAnalytics: (analytics: Analytics) => void;

  logActivity: (
    type: ActivityLog["type"],
    itemType: ActivityLog["itemType"],
    itemName: string
  ) => void;
  clearActivityLog: () => void;

  exportAllData: () => string;
  importAllData: (data: string) => boolean;
  clearAllData: () => void;

}

const defaultCardCategories: CardCategory[] = [
  { value: "bank", label: "بطاقة بنكية", color: "from-blue-500 to-indigo-600", icon: "💳" },
  { value: "membership", label: "بطاقة عضوية", color: "from-green-500 to-emerald-600", icon: "🎫" },
  { value: "shopping", label: "بطاقة شراء", color: "from-orange-500 to-red-600", icon: "🛍️" },
  { value: "gaming", label: "بطاقة ألعاب", color: "from-purple-500 to-pink-600", icon: "🎮" },
  { value: "loyalty", label: "بطاقة ولاء", color: "from-yellow-500 to-orange-600", icon: "⭐" },
  { value: "transport", label: "بطاقة نقل", color: "from-cyan-500 to-blue-600", icon: "🚇" },
  { value: "student", label: "بطاقة طالب", color: "from-pink-500 to-rose-600", icon: "🎓" },
  { value: "other", label: "أخرى", color: "from-gray-500 to-slate-600", icon: "📇" },
];

const defaultDocumentCategories: DocumentCategory[] = [
  { value: "national_id", label: "بطاقة التعريف الوطنية", icon: "🆔", color: "from-blue-500 to-cyan-500" },
  { value: "driving_license", label: "رخصة السياقة", icon: "🚗", color: "from-green-500 to-emerald-500" },
  { value: "passport", label: "جواز السفر", icon: "📕", color: "from-red-500 to-pink-500" },
  { value: "residence_card", label: "بطاقة الإقامة", icon: "🏠", color: "from-purple-500 to-indigo-500" },
  { value: "health_card", label: "بطاقة الشفاء", icon: "⚕️", color: "from-emerald-500 to-teal-500" },
  { value: "work_card", label: "بطاقة العمل", icon: "💼", color: "from-gray-500 to-slate-500" },
  { value: "student_card", label: "بطاقة الطالب", icon: "🎓", color: "from-yellow-500 to-orange-500" },
  { value: "vehicle_registration", label: "بطاقة رمادي", icon: "🚙", color: "from-slate-500 to-gray-500" },
  { value: "tax_card", label: "البطاقة الجبائية", icon: "💰", color: "from-green-600 to-teal-600" },
  { value: "military_card", label: "بطاقة الخدمة الوطنية", icon: "🎖️", color: "from-orange-600 to-red-600" },
  { value: "custom", label: "أخرى", icon: "📄", color: "from-gray-400 to-gray-500" },
];

const defaultContactCategories: ContactCategory[] = [
  { value: "family", label: "الأهل", icon: "👨‍👩‍👧‍👦", color: "from-red-500 to-rose-500" },
  { value: "relatives", label: "الأقارب", icon: "👪", color: "from-orange-500 to-amber-500" },
  { value: "friends", label: "الأصدقاء", icon: "👥", color: "from-blue-500 to-cyan-500" },
  { value: "work", label: "العمل", icon: "💼", color: "from-purple-500 to-indigo-500" },
  { value: "personal", label: "الخاصة", icon: "💖", color: "from-pink-500 to-rose-500" },
  { value: "companies", label: "مؤسسات", icon: "🏢", color: "from-emerald-500 to-teal-500" },
  { value: "other", label: "أخرى", icon: "📋", color: "from-gray-500 to-slate-500" },
];

const defaultMyInfo: MyInfo = {
  id: "main",
  firstName: "",
  lastName: "",
  username: "",
  bio: "",
  emails: [],
  addresses: [],
  phones: [],
  secrets: [],
  experiences: [],
  education: [],
  hobbies: [],
  achievements: [],
  certifications: [],
  skills: [],
  languages: [],
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      accounts: [],
      subscriptions: [],
      cards: [],
      documents: [],
      contacts: [],
      myInfo: defaultMyInfo,
      activityLog: [],
      cardCategories: defaultCardCategories,
      documentCategories: defaultDocumentCategories,
      contactCategories: defaultContactCategories,
      generatedPasswords: [],
      analytics: [],

      // Settings defaults
      theme: "blue",
      language: "ar",
      fontSize: "medium",
      autoLockMinutes: 5,
      notificationsEnabled: true,
      emailNotifications: false,
      desktopNotifications: true,
      backupFrequency: "weekly",
      exportFormat: "json",
      biometricEnabled: false,
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 30,
      enableBetaFeatures: false,
      enableAnalytics: true,
      aiApiKey: "",

      // Settings Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setBackupFrequency: (backupFrequency) => set({ backupFrequency }),
      setExportFormat: (exportFormat) => set({ exportFormat }),
      setTwoFactorEnabled: (twoFactorEnabled) =>
        set({ twoFactorEnabled }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setLoginAlerts: (loginAlerts) => set({ loginAlerts }),
      setSessionTimeout: (sessionTimeout) => set({ sessionTimeout }),
      setEnableBetaFeatures: (enableBetaFeatures) =>
        set({ enableBetaFeatures }),
      setEnableAnalytics: (enableAnalytics) => set({ enableAnalytics }),
      setAiApiKey: (aiApiKey) => set({ aiApiKey }),

      addAccount: (account) => {
        const newAccount: Account = {
          ...account,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ accounts: [...get().accounts, newAccount] });
        get().logActivity("add", "account", account.siteName);
      },

      updateAccount: (id, updates) => {
        const account = get().accounts.find((a) => a.id === id);
        set({
          accounts: get().accounts.map((acc) =>
            acc.id === id
              ? { ...acc, ...updates, updatedAt: new Date().toISOString() }
              : acc
          ),
        });
        if (account) {
          get().logActivity(
            "edit",
            "account",
            updates.siteName || account.siteName
          );
        }
      },

      deleteAccount: (id) => {
        const account = get().accounts.find((a) => a.id === id);
        set({ accounts: get().accounts.filter((acc) => acc.id !== id) });
        if (account) {
          get().logActivity("delete", "account", account.siteName);
        }
      },

      toggleFavoriteAccount: (id) => {
        set({
          accounts: get().accounts.map((acc) =>
            acc.id === id ? { ...acc, isFavorite: !acc.isFavorite } : acc
          ),
        });
      },

      addSubscription: (subscription) => {
        const newSub: Subscription = {
          ...subscription,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ subscriptions: [...get().subscriptions, newSub] });
        get().logActivity("add", "subscription", subscription.name);
      },

      updateSubscription: (id, updates) => {
        const sub = get().subscriptions.find((s) => s.id === id);
        set({
          subscriptions: get().subscriptions.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        });
        if (sub) {
          get().logActivity(
            "edit",
            "subscription",
            updates.name || sub.name
          );
        }
      },

      deleteSubscription: (id) => {
        const sub = get().subscriptions.find((s) => s.id === id);
        set({ subscriptions: get().subscriptions.filter((s) => s.id !== id) });
        if (sub) {
          get().logActivity("delete", "subscription", sub.name);
        }
      },

      toggleFavoriteSubscription: (id) => {
        set({
          subscriptions: get().subscriptions.map((s) =>
            s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
          ),
        });
      },

      addCard: (card) => {
        const newCard: Card = {
          ...card,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set({ cards: [...get().cards, newCard] });
      },

      updateCard: (id, updates) => {
        set({
          cards: get().cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        });
      },

      deleteCard: (id) => {
        set({ cards: get().cards.filter((c) => c.id !== id) });
      },

      toggleFavoriteCard: (id) => {
        set({
          cards: get().cards.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        });
      },

      addCardCategory: (category) => {
        const current = get().cardCategories;
        if (!current.find((c) => c.value === category.value)) {
          set({ cardCategories: [...current, category] });
        }
      },

      removeCardCategory: (value) => {
        set({
          cardCategories: get().cardCategories.filter((c) => c.value !== value),
        });
      },

      addDocument: (doc) => {
        const newDoc: Document = {
          ...doc,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set({ documents: [...get().documents, newDoc] });
      },

      updateDocument: (id, updates) => {
        set({
          documents: get().documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        });
      },

      deleteDocument: (id) => {
        set({ documents: get().documents.filter((d) => d.id !== id) });
      },

      toggleFavoriteDocument: (id) => {
        set({
          documents: get().documents.map((d) =>
            d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
          ),
        });
      },

      addDocumentCategory: (category) => {
        const current = get().documentCategories;
        if (!current.find((c) => c.value === category.value)) {
          set({ documentCategories: [...current, category] });
        }
      },

      removeDocumentCategory: (value) => {
        set({
          documentCategories: get().documentCategories.filter(
            (c) => c.value !== value
          ),
        });
      },

      addContact: (contact) => {
        const newContact: Contact = {
          ...contact,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set({ contacts: [...get().contacts, newContact] });
      },

      updateContact: (id, updates) => {
        set({
          contacts: get().contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        });
      },

      deleteContact: (id) => {
        set({ contacts: get().contacts.filter((c) => c.id !== id) });
      },

      toggleFavoriteContact: (id) => {
        set({
          contacts: get().contacts.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        });
      },

      addContactCategory: (category) => {
        const current = get().contactCategories;
        if (!current.find((c) => c.value === category.value)) {
          set({ contactCategories: [...current, category] });
        }
      },

      removeContactCategory: (value) => {
        set({
          contactCategories: get().contactCategories.filter(
            (c) => c.value !== value
          ),
        });
      },

      updateMyInfo: (info) => {
        set({ myInfo: { ...get().myInfo, ...info } });
      },

      addEmail: (email) => {
        set({
          myInfo: {
            ...get().myInfo,
            emails: [...(get().myInfo.emails || []), email],
          },
        });
      },

      removeEmail: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            emails: (get().myInfo.emails || []).filter((e) => e.id !== id),
          },
        });
      },

      addPhone: (phone) => {
        set({
          myInfo: {
            ...get().myInfo,
            phones: [...(get().myInfo.phones || []), phone],
          },
        });
      },

      removePhone: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            phones: (get().myInfo.phones || []).filter((p) => p.id !== id),
          },
        });
      },

      addAddress: (address) => {
        set({
          myInfo: {
            ...get().myInfo,
            addresses: [...(get().myInfo.addresses || []), address],
          },
        });
      },

      removeAddress: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            addresses: (get().myInfo.addresses || []).filter(
              (a) => a.id !== id
            ),
          },
        });
      },

      addSecret: (secret) => {
        set({
          myInfo: {
            ...get().myInfo,
            secrets: [...(get().myInfo.secrets || []), secret],
          },
        });
      },

      removeSecret: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            secrets: (get().myInfo.secrets || []).filter((s) => s.id !== id),
          },
        });
      },

      addExperience: (exp) => {
        set({
          myInfo: {
            ...get().myInfo,
            experiences: [...(get().myInfo.experiences || []), exp],
          },
        });
      },

      removeExperience: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            experiences: (get().myInfo.experiences || []).filter(
              (e) => e.id !== id
            ),
          },
        });
      },

      addEducation: (edu) => {
        set({
          myInfo: {
            ...get().myInfo,
            education: [...(get().myInfo.education || []), edu],
          },
        });
      },

      removeEducation: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            education: (get().myInfo.education || []).filter(
              (e) => e.id !== id
            ),
          },
        });
      },

      addHobby: (hobby) => {
        set({
          myInfo: {
            ...get().myInfo,
            hobbies: [...(get().myInfo.hobbies || []), hobby],
          },
        });
      },

      removeHobby: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            hobbies: (get().myInfo.hobbies || []).filter((h) => h.id !== id),
          },
        });
      },

      addAchievement: (achievement) => {
        set({
          myInfo: {
            ...get().myInfo,
            achievements: [...(get().myInfo.achievements || []), achievement],
          },
        });
      },

      removeAchievement: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            achievements: (get().myInfo.achievements || []).filter(
              (a) => a.id !== id
            ),
          },
        });
      },

      addCertification: (cert) => {
        set({
          myInfo: {
            ...get().myInfo,
            certifications: [...(get().myInfo.certifications || []), cert],
          },
        });
      },

      removeCertification: (id) => {
        set({
          myInfo: {
            ...get().myInfo,
            certifications: (get().myInfo.certifications || []).filter(
              (c) => c.id !== id
            ),
          },
        });
      },

      getCurrentLocation: () => {
        return new Promise((resolve, reject) => {
          if (typeof navigator === "undefined" || !navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (error) => reject(error),
            { enableHighAccuracy: true }
          );
        });
      },

      addGeneratedPassword: (password) => {
        set({
          generatedPasswords: [
            password,
            ...get().generatedPasswords,
          ].slice(0, 50),
        });
      },

      removeGeneratedPassword: (id) => {
        set({
          generatedPasswords: get().generatedPasswords.filter(
            (p) => p.id !== id
          ),
        });
      },

      toggleFavoritePassword: (id) => {
        set({
          generatedPasswords: get().generatedPasswords.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        });
      },

      clearAllGeneratedPasswords: () => {
        set({ generatedPasswords: [] });
      },

      addAnalytics: (analytics) => {
        set({
          analytics: [analytics, ...get().analytics].slice(0, 100),
        });
      },

      logActivity: (type, itemType, itemName) => {
        const newLog: ActivityLog = {
          id: generateId(),
          type,
          itemType,
          itemName,
          createdAt: new Date().toISOString(),
        };
        set({ activityLog: [newLog, ...get().activityLog].slice(0, 100) });
      },

      clearActivityLog: () => {
        set({ activityLog: [] });
      },

      exportAllData: () => {
        const data = {
          version: "2.0.0",
          exportDate: new Date().toISOString(),
          accounts: get().accounts,
          subscriptions: get().subscriptions,
          cards: get().cards,
          documents: get().documents,
          contacts: get().contacts,
          myInfo: get().myInfo,
          cardCategories: get().cardCategories,
          documentCategories: get().documentCategories,
          contactCategories: get().contactCategories,
          generatedPasswords: get().generatedPasswords,
          analytics: get().analytics,
          settings: {
            theme: get().theme,
            language: get().language,
            fontSize: get().fontSize,
            autoLockMinutes: get().autoLockMinutes,
            notificationsEnabled: get().notificationsEnabled,
            emailNotifications: get().emailNotifications,
            desktopNotifications: get().desktopNotifications,
            backupFrequency: get().backupFrequency,
            exportFormat: get().exportFormat,
            biometricEnabled: get().biometricEnabled,
            twoFactorEnabled: get().twoFactorEnabled,
            loginAlerts: get().loginAlerts,
            sessionTimeout: get().sessionTimeout,
            enableBetaFeatures: get().enableBetaFeatures,
            enableAnalytics: get().enableAnalytics,
          },
        };
        return JSON.stringify(data, null, 2);
      },

      importAllData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data.accounts) set({ accounts: data.accounts });
          if (data.subscriptions) set({ subscriptions: data.subscriptions });
          if (data.cards) set({ cards: data.cards });
          if (data.documents) set({ documents: data.documents });
          if (data.contacts) set({ contacts: data.contacts });
          if (data.myInfo) set({ myInfo: data.myInfo });
          if (data.cardCategories)
            set({ cardCategories: data.cardCategories });
          if (data.documentCategories)
            set({ documentCategories: data.documentCategories });
          if (data.contactCategories)
            set({ contactCategories: data.contactCategories });
          if (data.generatedPasswords)
            set({ generatedPasswords: data.generatedPasswords });
          if (data.analytics) set({ analytics: data.analytics });
          if (data.settings) {
            set({
              theme: data.settings.theme || "blue",
              language: data.settings.language || "ar",
              fontSize: data.settings.fontSize || "medium",
              autoLockMinutes: data.settings.autoLockMinutes || 5,
              notificationsEnabled: data.settings.notificationsEnabled ?? true,
              emailNotifications: data.settings.emailNotifications ?? false,
              desktopNotifications: data.settings.desktopNotifications ?? true,
              backupFrequency: data.settings.backupFrequency || "weekly",
              exportFormat: data.settings.exportFormat || "json",
              biometricEnabled: data.settings.biometricEnabled ?? false,
              twoFactorEnabled: data.settings.twoFactorEnabled ?? false,
              loginAlerts: data.settings.loginAlerts ?? true,
              sessionTimeout: data.settings.sessionTimeout || 30,
              enableBetaFeatures: data.settings.enableBetaFeatures ?? false,
              enableAnalytics: data.settings.enableAnalytics ?? true,
            });
          }
          return true;
        } catch {
          return false;
        }
      },

      clearAllData: () => {
        set({
          accounts: [],
          subscriptions: [],
          cards: [],
          documents: [],
          contacts: [],
          activityLog: [],
          myInfo: defaultMyInfo,
          cardCategories: defaultCardCategories,
          documentCategories: defaultDocumentCategories,
          contactCategories: defaultContactCategories,
          generatedPasswords: [],
          analytics: [],
          theme: "blue",
          language: "ar",
          fontSize: "medium",
          autoLockMinutes: 5,
          notificationsEnabled: true,
          emailNotifications: false,
          desktopNotifications: true,
          backupFrequency: "weekly",
          exportFormat: "json",
          biometricEnabled: false,
          twoFactorEnabled: false,
          loginAlerts: true,
          sessionTimeout: 30,
          enableBetaFeatures: false,
          enableAnalytics: true,
          aiApiKey: "",
        });
      },
    }),
    {
      name: "bader-storage-v2",
      storage: createJSONStorage(() => encryptedStorage),
      // data is only readable after the vault is unlocked: see rehydrateAfterUnlock()
      skipHydration: true,
    }
  )
);