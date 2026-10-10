export interface EmailAccount {
  id: string;
  email: string;
  password: string;
  notes?: string;
}

export interface Account {
  id: string;
  siteName: string;
  siteUrl?: string;
  category: string;
  emails?: EmailAccount[];
  phones?: string[];
  username?: string;
  password: string;
  recoveryEmail?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  siteUrl?: string;
  category: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  customerName?: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  status: "active" | "expired" | "frozen";
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhoneAccount {
  id: string;
  number: string;
  notes?: string;
}

export interface AddressAccount {
  id: string;
  label: string;
  country: string;
  state: string;
  city: string;
  municipality: string;
  postalCode: string;
  fullAddress: string;
  isPrimary: boolean;
}

export interface SecretAccount {
  id: string;
  label: string;
  value: string;
  notes?: string;
}

export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  companyWebsite?: string;
  companyLocation?: string;
  employmentType?: "full_time" | "part_time" | "contract" | "freelance" | "internship" | "remote";
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  achievements?: string[];
  skills?: string[];
  salary?: string;
  referenceName?: string;
  referenceContact?: string;
  createdAt: string;
}
export interface LocalizedLabels {
  ar?: string;
  en?: string;
  fr?: string;
}

export interface ContactCategory {
  value: string;
  label: string;
  color: string;
  icon: string;
  labels?: LocalizedLabels;
}

export interface Hobby {
  id: string;
  name: string;
  icon?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date?: string;
  category?: string;
  impact?: string;
  url?: string;
  createdAt: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuerWebsite?: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
  createdAt: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  institutionLocation?: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
  description?: string;
  activities?: string[];
  createdAt: string;
}

export interface MyInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  birthDate?: string;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;

  country?: string;
  state?: string;
  city?: string;
  municipality?: string;
  postalCode?: string;
  fullAddress?: string;

  latitude?: number;
  longitude?: number;

  emails?: EmailAccount[];
  phones?: PhoneAccount[];
  addresses?: AddressAccount[];
  secrets?: SecretAccount[];
  experiences?: WorkExperience[];
  education?: Education[];

  skills?: string[];
  languages?: string[];
  pinCode?: string;
  notes?: string;
}

export interface MyInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  birthDate?: string;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;

  // Image
  avatar?: string;

  country?: string;
  state?: string;
  city?: string;
  municipality?: string;
  postalCode?: string;
  fullAddress?: string;

  latitude?: number;
  longitude?: number;

  emails?: EmailAccount[];
  phones?: PhoneAccount[];
  addresses?: AddressAccount[];
  secrets?: SecretAccount[];
  experiences?: WorkExperience[];
  education?: Education[];
  hobbies?: Hobby[];
  achievements?: Achievement[];
  certifications?: Certification[];

  skills?: string[];
  languages?: string[];
  pinCode?: string;
  notes?: string;
}
export interface Card {
  id: string;
  type: string;
  customType?: string;
  cardNumber: string;
  holderName: string;
  issuerBank?: string;
  expiryDate?: string;
  issueDate?: string;
  pinCode?: string;
  cvv?: string;
  phone?: string;
  nationalId?: string;
  email?: string;
  websiteUrl?: string;
  accountUrl?: string;
  accountUsername?: string;
  accountPassword?: string;
  accountNotes?: string;
  iban?: string;
  swiftCode?: string;
  branch?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

export const CARD_TYPES = [
  { value: "bank", label: "بطاقة بنكية", color: "from-blue-500 to-indigo-600", icon: "💳" },
  { value: "membership", label: "بطاقة عضوية", color: "from-green-500 to-emerald-600", icon: "🎫" },
  { value: "shopping", label: "بطاقة شراء", color: "from-orange-500 to-red-600", icon: "🛍️" },
  { value: "gaming", label: "بطاقة ألعاب", color: "from-purple-500 to-pink-600", icon: "🎮" },
  { value: "loyalty", label: "بطاقة ولاء", color: "from-yellow-500 to-orange-600", icon: "⭐" },
  { value: "transport", label: "بطاقة نقل", color: "from-cyan-500 to-blue-600", icon: "🚇" },
  { value: "student", label: "بطاقة طالب", color: "from-pink-500 to-rose-600", icon: "🎓" },
  { value: "other", label: "أخرى", color: "from-gray-500 to-slate-600", icon: "📇" },
];
export const DEFAULT_CARD_TYPES = [
  { value: "bank", label: "بطاقة بنكية", color: "from-blue-500 to-indigo-600", icon: "💳" },
  { value: "membership", label: "بطاقة عضوية", color: "from-green-500 to-emerald-600", icon: "🎫" },
  { value: "shopping", label: "بطاقة شراء", color: "from-orange-500 to-red-600", icon: "🛍️" },
  { value: "gaming", label: "بطاقة ألعاب", color: "from-purple-500 to-pink-600", icon: "🎮" },
  { value: "loyalty", label: "بطاقة ولاء", color: "from-yellow-500 to-orange-600", icon: "⭐" },
  { value: "transport", label: "بطاقة نقل", color: "from-cyan-500 to-blue-600", icon: "🚇" },
  { value: "student", label: "بطاقة طالب", color: "from-pink-500 to-rose-600", icon: "🎓" },
  { value: "other", label: "أخرى", color: "from-gray-500 to-slate-600", icon: "📇" },
];

export interface Document {
  id: string;
  type: string;
  customTypeName?: string;
  firstName: string;
  lastName: string;
  firstNameLatin?: string;  // جديد
  lastNameLatin?: string;    // جديد
  documentNumber: string;
  nationalIdNumber?: string;
  fullAddress?: string;
  postalCode?: string;
  city?: string;
  nationality?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: string;
  issueDate?: string;
  expiryDate?: string;
  issuePlace?: string;
  pinCode?: string;
  bloodType?: string;
  avatar?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

export const DEFAULT_DOCUMENT_TYPES = [
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

export const DOCUMENT_TYPES = [
  { value: "national_id", label: "بطاقة التعريف الوطنية", icon: "🆔", color: "from-blue-500 to-cyan-500" },
  { value: "driving_license", label: "رخصة السياقة", icon: "🚗", color: "from-green-500 to-emerald-500" },
  { value: "passport", label: "جواز السفر", icon: "📕", color: "from-red-500 to-pink-500" },
  { value: "residence_card", label: "بطاقة الإقامة", icon: "🏠", color: "from-purple-500 to-indigo-500" },
  { value: "health_card", label: "بطاقة الشفاء", icon: "⚕️", color: "from-emerald-500 to-teal-500" },
  { value: "work_card", label: "بطاقة العمل", icon: "💼", color: "from-gray-500 to-slate-500" },
  { value: "student_card", label: "بطاقة الطالب", icon: "🎓", color: "from-yellow-500 to-orange-500" },
  { value: "vehicle_registration", label: "بطاقة رمادي", icon: "🚙", color: "from-slate-500 to-gray-500" },
  { value: "tax_card", label: "البطاقة الجبائية", icon: "💰", color: "from-green-600 to-teal-600" },
  { value: "custom", label: "أخرى", icon: "📄", color: "from-gray-400 to-gray-500" },
];

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  city?: string;
  state?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: "add" | "edit" | "delete" | "view" | "print" | "export";
  itemType: "account" | "subscription" | "card" | "document" | "contact";
  itemName: string;
  createdAt: string;
}

export interface Analytics {
  id: string;
  page: "accounts" | "subscriptions" | "cards" | "documents" | "contacts";
  type: "view" | "export" | "print";
  createdAt: string;
}
export interface GeneratedPassword {
  id: string;
  password: string;
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  strength: number;
  strengthLabel: string;
  createdAt: string;
  isFavorite?: boolean;
}

export const CATEGORIES = [
  { value: "general", label: "محلية عمومية" },
  { value: "social", label: "إجتماعي" },
  { value: "email", label: "بريد" },
  { value: "banking", label: "بنوك" },
  { value: "shopping", label: "تسوق" },
  { value: "work", label: "عمل" },
  { value: "gaming", label: "ألعاب" },
  { value: "entertainment", label: "ترفيه" },
  { value: "education", label: "تعليمي" },
  { value: "academic", label: "اكاديمي" },
  { value: "services", label: "خدمات" },
  { value: "revenue", label: "ربحية" },
  { value: "forums", label: "منتديات" },
  { value: "platforms", label: "منصات" },
  { value: "channels", label: "قنوات" },
  { value: "companies", label: "شركات" },
  { value: "cloud", label: "تخزين سحابي" },
  { value: "download", label: "تحميل" },
  { value: "ai", label: "ذكاء اصطناعي" },
  { value: "other", label: "أخرى" },
];

export const CONTACT_CATEGORIES = [
  { value: "family", label: "الأهل" },
  { value: "relatives", label: "الأقارب" },
  { value: "friends", label: "الأصدقاء" },
  { value: "work", label: "العمل" },
  { value: "personal", label: "الخاصة" },
  { value: "companies", label: "مؤسسات" },
  { value: "other", label: "أخرى" },
];

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  city?: string;
  state?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

export const DEFAULT_CONTACT_CATEGORIES: ContactCategory[] = [
  { value: "family", label: "الأهل", icon: "👨‍👩‍👧‍👦", color: "from-red-500 to-rose-500" },
  { value: "relatives", label: "الأقارب", icon: "👪", color: "from-orange-500 to-amber-500" },
  { value: "friends", label: "الأصدقاء", icon: "👥", color: "from-blue-500 to-cyan-500" },
  { value: "work", label: "العمل", icon: "💼", color: "from-purple-500 to-indigo-500" },
  { value: "personal", label: "الخاصة", icon: "💖", color: "from-pink-500 to-rose-500" },
  { value: "companies", label: "مؤسسات", icon: "🏢", color: "from-emerald-500 to-teal-500" },
  { value: "other", label: "أخرى", icon: "📋", color: "from-gray-500 to-slate-500" },
];