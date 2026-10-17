// Data model. Every record has: id (generateId), createdAt/updatedAt (ISO strings), isFavorite.
// Secrets (password, PIN, card number, document number) live ONLY inside the encrypted vault and are
// never sent to the AI assistant or printed unless the user explicitly agrees (see securityAudit.ts, reports).

export interface Account {
  id: string;
  siteName: string;
  siteUrl?: string;
  category: string;
  username?: string;
  password: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MyInfo {
  id: "main";
  firstName: string;
  lastName: string;
  /** printed in the header of reports (who owns the data) */
  username: string;
}

export interface ActivityLog {
  id: string;
  type: "add" | "edit" | "delete";
  itemType: string;
  itemName: string;
  createdAt: string;
}

export interface GeneratedPassword {
  id: string;
  password: string;
  createdAt: string;
}

export const CATEGORIES = [
  { value: "social", icon: "👥" },
  { value: "email", icon: "✉️" },
  { value: "banking", icon: "🏦" },
  { value: "shopping", icon: "🛍️" },
  { value: "work", icon: "💼" },
  { value: "other", icon: "📁" },
] as const;

// @module-types  (add_module.py appends the interfaces of new modules below this line)
