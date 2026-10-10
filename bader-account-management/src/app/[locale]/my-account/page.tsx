"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Briefcase,
  GraduationCap,
  Edit,
  Save as SaveIcon,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Printer,
  Download,
  Navigation,
  Copy,
  Camera,
  Heart,
  Trophy,
  Award,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { printElement } from "@/lib/print";
import { generateId } from "@/lib/encryption";

const translations = {
  ar: {
    title: "حسابي",
    subtitle: "معلوماتك الشاملة بشكل احترافي",
    export: "تصدير",
    print: "طباعة",
    edit: "تعديل",
    save: "حفظ",
    add: "إضافة",
    delete: "حذف",
    call: "اتصال",
    saved: "✅ تم الحفظ بنجاح",
    imageTooLarge: "❌ حجم الصورة كبير جداً (الحد الأقصى 5MB)",
    locationError: "❌ تعذر الحصول على الموقع",
    locationSuccess: "✅ تم تحديد الموقع",
    latitude: "خط العرض",
    longitude: "خط الطول",
    fallbackFirstName: "الاسم",
    fallbackLastName: "واللقب",
    untilNow: "حتى الآن",
    tabs: {
      personal: "شخصي",
      contact: "التواصل",
      address: "العنوان",
      secrets: "الأسرار",
      experience: "الخبرات",
      education: "التعليم",
      certifications: "الشهادات",
      achievements: "الأعمال",
      hobbies: "الهوايات",
    },
    personal: {
      title: "المعلومات الشخصية",
      firstName: "الاسم",
      lastName: "اللقب",
      username: "اسم المستخدم",
      birthDate: "تاريخ الميلاد",
      nationality: "الجنسية",
      gender: "الجنس",
      choose: "اختر...",
      male: "ذكر",
      female: "أنثى",
      bio: "نبذة شخصية",
      bioPlaceholder: "اكتب نبذة عن نفسك...",
      skills: "المهارات (افصل بفاصلة)",
      skillsPlaceholder: "JavaScript, React, التصميم...",
      languages: "اللغات (افصل بفاصلة)",
      languagesPlaceholder: "العربية، الإنجليزية، الفرنسية",
    },
    contact: {
      emails: "الإيميلات",
      phones: "أرقام الهاتف",
      password: "كلمة المرور",
      emailPlaceholder: "email@example.com",
      phonePlaceholder: "+213 XXX XXX XXX",
    },
    address: {
      title: "العنوان",
      country: "الدولة",
      state: "الولاية",
      city: "المدينة",
      municipality: "البلدية",
      postalCode: "الرمز البريدي",
      fullAddress: "العنوان الكامل",
      gps: "تحديد GPS",
      locating: "جاري التحديد...",
    },
    secrets: {
      title: "الأرقام السرية",
      labelPlaceholder: "اسم السري",
      valuePlaceholder: "القيمة",
    },
    experience: {
      title: "الخبرات المهنية",
      positionPlaceholder: "المنصب",
      companyPlaceholder: "الشركة",
      current: "أعمل حالياً هنا",
      descriptionPlaceholder: "وصف المهام...",
    },
    education: {
      title: "التعليم",
      degreePlaceholder: "الدرجة العلمية",
      institutionPlaceholder: "المؤسسة",
      current: "أدرس حالياً",
    },
    certifications: {
      title: "الشهادات والدبلومات",
      namePlaceholder: "اسم الشهادة",
      issuerPlaceholder: "الجهة المانحة",
      credentialIdPlaceholder: "رقم الاعتماد",
      issueDate: "تاريخ الإصدار",
      expiryDate: "تاريخ الانتهاء",
      credentialId: "رقم الاعتماد",
    },
    achievements: {
      title: "الأعمال المنجزة",
      titlePlaceholder: "عنوان الإنجاز",
      descriptionPlaceholder: "وصف الإنجاز...",
    },
    hobbies: {
      title: "الهوايات والاهتمامات",
      iconPlaceholder: "🎨",
      namePlaceholder: "اسم الهواية",
    },
  },
  en: {
    title: "My Account",
    subtitle: "Your complete information in a professional format",
    export: "Export",
    print: "Print",
    edit: "Edit",
    save: "Save",
    add: "Add",
    delete: "Delete",
    call: "Call",
    saved: "✅ Saved successfully",
    imageTooLarge: "❌ Image size is too large (maximum 5MB)",
    locationError: "❌ Unable to get location",
    locationSuccess: "✅ Location detected",
    latitude: "Latitude",
    longitude: "Longitude",
    fallbackFirstName: "First name",
    fallbackLastName: "Last name",
    untilNow: "Until now",
    tabs: {
      personal: "Personal",
      contact: "Contact",
      address: "Address",
      secrets: "Secrets",
      experience: "Experience",
      education: "Education",
      certifications: "Certificates",
      achievements: "Works",
      hobbies: "Hobbies",
    },
    personal: {
      title: "Personal Information",
      firstName: "First name",
      lastName: "Last name",
      username: "Username",
      birthDate: "Birth date",
      nationality: "Nationality",
      gender: "Gender",
      choose: "Choose...",
      male: "Male",
      female: "Female",
      bio: "Personal bio",
      bioPlaceholder: "Write a short bio about yourself...",
      skills: "Skills (separate with comma)",
      skillsPlaceholder: "JavaScript, React, Design...",
      languages: "Languages (separate with comma)",
      languagesPlaceholder: "Arabic, English, French",
    },
    contact: {
      emails: "Emails",
      phones: "Phone numbers",
      password: "Password",
      emailPlaceholder: "email@example.com",
      phonePlaceholder: "+213 XXX XXX XXX",
    },
    address: {
      title: "Address",
      country: "Country",
      state: "State",
      city: "City",
      municipality: "Municipality",
      postalCode: "Postal code",
      fullAddress: "Full address",
      gps: "Detect GPS",
      locating: "Locating...",
    },
    secrets: {
      title: "Secret numbers",
      labelPlaceholder: "Secret name",
      valuePlaceholder: "Value",
    },
    experience: {
      title: "Professional Experience",
      positionPlaceholder: "Position",
      companyPlaceholder: "Company",
      current: "I currently work here",
      descriptionPlaceholder: "Task description...",
    },
    education: {
      title: "Education",
      degreePlaceholder: "Degree",
      institutionPlaceholder: "Institution",
      current: "I am currently studying",
    },
    certifications: {
      title: "Certificates and Diplomas",
      namePlaceholder: "Certificate name",
      issuerPlaceholder: "Issuer",
      credentialIdPlaceholder: "Credential ID",
      issueDate: "Issue date",
      expiryDate: "Expiry date",
      credentialId: "Credential ID",
    },
    achievements: {
      title: "Completed Works",
      titlePlaceholder: "Achievement title",
      descriptionPlaceholder: "Achievement description...",
    },
    hobbies: {
      title: "Hobbies and Interests",
      iconPlaceholder: "🎨",
      namePlaceholder: "Hobby name",
    },
  },
  fr: {
    title: "Mon compte",
    subtitle: "Vos informations complètes de manière professionnelle",
    export: "Exporter",
    print: "Imprimer",
    edit: "Modifier",
    save: "Enregistrer",
    add: "Ajouter",
    delete: "Supprimer",
    call: "Appeler",
    saved: "✅ Enregistré avec succès",
    imageTooLarge: "❌ La taille de l'image est trop grande (maximum 5MB)",
    locationError: "❌ Impossible d'obtenir la localisation",
    locationSuccess: "✅ Localisation détectée",
    latitude: "Latitude",
    longitude: "Longitude",
    fallbackFirstName: "Prénom",
    fallbackLastName: "Nom",
    untilNow: "Jusqu'à maintenant",
    tabs: {
      personal: "Personnel",
      contact: "Contact",
      address: "Adresse",
      secrets: "Secrets",
      experience: "Expériences",
      education: "Éducation",
      certifications: "Certificats",
      achievements: "Travaux",
      hobbies: "Loisirs",
    },
    personal: {
      title: "Informations personnelles",
      firstName: "Prénom",
      lastName: "Nom",
      username: "Nom d'utilisateur",
      birthDate: "Date de naissance",
      nationality: "Nationalité",
      gender: "Genre",
      choose: "Choisir...",
      male: "Homme",
      female: "Femme",
      bio: "Bio personnelle",
      bioPlaceholder: "Écrivez une brève présentation...",
      skills: "Compétences (séparées par des virgules)",
      skillsPlaceholder: "JavaScript, React, Design...",
      languages: "Langues (séparées par des virgules)",
      languagesPlaceholder: "Arabe, Anglais, Français",
    },
    contact: {
      emails: "Emails",
      phones: "Numéros de téléphone",
      password: "Mot de passe",
      emailPlaceholder: "email@example.com",
      phonePlaceholder: "+213 XXX XXX XXX",
    },
    address: {
      title: "Adresse",
      country: "Pays",
      state: "Région",
      city: "Ville",
      municipality: "Commune",
      postalCode: "Code postal",
      fullAddress: "Adresse complète",
      gps: "Détecter GPS",
      locating: "Localisation...",
    },
    secrets: {
      title: "Numéros secrets",
      labelPlaceholder: "Nom du secret",
      valuePlaceholder: "Valeur",
    },
    experience: {
      title: "Expériences professionnelles",
      positionPlaceholder: "Poste",
      companyPlaceholder: "Entreprise",
      current: "Je travaille actuellement ici",
      descriptionPlaceholder: "Description des tâches...",
    },
    education: {
      title: "Éducation",
      degreePlaceholder: "Diplôme",
      institutionPlaceholder: "Établissement",
      current: "J'étudie actuellement",
    },
    certifications: {
      title: "Certificats et diplômes",
      namePlaceholder: "Nom du certificat",
      issuerPlaceholder: "Organisme émetteur",
      credentialIdPlaceholder: "ID d'accréditation",
      issueDate: "Date d'émission",
      expiryDate: "Date d'expiration",
      credentialId: "ID d'accréditation",
    },
    achievements: {
      title: "Travaux réalisés",
      titlePlaceholder: "Titre de la réalisation",
      descriptionPlaceholder: "Description de la réalisation...",
    },
    hobbies: {
      title: "Loisirs et intérêts",
      iconPlaceholder: "🎨",
      namePlaceholder: "Nom du loisir",
    },
  },
};

export default function MyAccountPage() {
  const locale = useLocale();
  const lang =
    locale === "ar" || locale === "en" || locale === "fr" ? locale : "ar";
  const tr = translations[lang];
  const dateLocale =
    lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US";
  const joiner = lang === "ar" ? "، " : ", ";

  const myInfo = useStore((state) => state.myInfo) || {
    id: "main",
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    emails: [],
    phones: [],
    addresses: [],
    secrets: [],
    experiences: [],
    education: [],
    hobbies: [],
    achievements: [],
    certifications: [],
    skills: [],
    languages: [],
  };

  const updateMyInfo = useStore((state) => state.updateMyInfo);
  const addEmail = useStore((state) => state.addEmail);
  const removeEmail = useStore((state) => state.removeEmail);
  const addPhone = useStore((state) => state.addPhone);
  const removePhone = useStore((state) => state.removePhone);
  const addExperience = useStore((state) => state.addExperience);
  const removeExperience = useStore((state) => state.removeExperience);
  const addEducation = useStore((state) => state.addEducation);
  const removeEducation = useStore((state) => state.removeEducation);
  const addSecret = useStore((state) => state.addSecret);
  const removeSecret = useStore((state) => state.removeSecret);
  const addHobby = useStore((state) => state.addHobby);
  const removeHobby = useStore((state) => state.removeHobby);
  const addAchievement = useStore((state) => state.addAchievement);
  const removeAchievement = useStore((state) => state.removeAchievement);
  const addCertification = useStore((state) => state.addCertification);
  const removeCertification = useStore((state) => state.removeCertification);
  const getCurrentLocation = useStore((state) => state.getCurrentLocation);

  const [editing, setEditing] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<any>(myInfo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(myInfo);
  }, [myInfo]);

  const handleSave = () => {
    updateMyInfo(formData);
    setEditing(false);
    alert(tr.saved);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(tr.imageTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({
        ...formData,
        avatar: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const getLocation = async () => {
    setLoadingLocation(true);
    try {
      const pos = await getCurrentLocation();
      setFormData({
        ...formData,
        latitude: pos.lat,
        longitude: pos.lng,
      });
      alert(
        `${tr.locationSuccess}\n${tr.latitude}: ${pos.lat.toFixed(
          6
        )}\n${tr.longitude}: ${pos.lng.toFixed(6)}`
      );
    } catch {
      alert(tr.locationError);
    }
    setLoadingLocation(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(myInfo, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `my-info-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "personal", label: tr.tabs.personal, icon: User },
    { id: "contact", label: tr.tabs.contact, icon: Phone },
    { id: "address", label: tr.tabs.address, icon: MapPin },
    { id: "secrets", label: tr.tabs.secrets, icon: Lock },
    { id: "experience", label: tr.tabs.experience, icon: Briefcase },
    { id: "education", label: tr.tabs.education, icon: GraduationCap },
    { id: "certifications", label: tr.tabs.certifications, icon: Award },
    { id: "achievements", label: tr.tabs.achievements, icon: Trophy },
    { id: "hobbies", label: tr.tabs.hobbies, icon: Heart },
  ];

  return (
    <AppLayout>
      <div id="my-account-content" className="space-y-6">
        {/* Header */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">👤 {tr.title}</h1>
            <p className="text-gray-600 mt-1">{tr.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {tr.export}
            </button>

            <button
              onClick={() =>
                printElement(
                  "my-account-content",
                  `${tr.title} - Bader Account Management`
                )
              }
              className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {tr.print}
            </button>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Edit className="w-5 h-5" />
                {tr.edit}
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                style={{ background: "#10b981" }}
              >
                <SaveIcon className="w-5 h-5" />
                {tr.save}
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="no-print glass rounded-2xl p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-2xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))",
                }}
              >
                {myInfo?.avatar ? (
                  <img
                    src={myInfo.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {myInfo?.firstName?.[0] || "B"}
                    {myInfo?.lastName?.[0] || "A"}
                  </>
                )}
              </div>

              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {myInfo?.firstName || tr.fallbackFirstName}{" "}
                {myInfo?.lastName || tr.fallbackLastName}
              </h2>

              {myInfo?.username && (
                <p className="text-gray-600">@{myInfo.username}</p>
              )}

              {myInfo?.bio && (
                <p className="text-sm text-gray-700 mt-2">{myInfo.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="no-print flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-white shadow-lg"
                    : "bg-white hover:bg-gray-50"
                }`}
                style={
                  activeTab === tab.id
                    ? { backgroundColor: "rgb(var(--color-primary))" }
                    : {}
                }
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <div className="no-print glass rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <User className="w-5 h-5" />
              {tr.personal.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label={tr.personal.firstName}
                value={editing ? formData?.firstName || "" : myInfo?.firstName || ""}
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, firstName: value })
                }
              />

              <Field
                label={tr.personal.lastName}
                value={editing ? formData?.lastName || "" : myInfo?.lastName || ""}
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, lastName: value })
                }
              />

              <Field
                label={tr.personal.username}
                value={editing ? formData?.username || "" : myInfo?.username || ""}
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, username: value })
                }
              />

              <DateField
                label={tr.personal.birthDate}
                value={editing ? formData?.birthDate || "" : myInfo?.birthDate || ""}
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, birthDate: value })
                }
              />

              <Field
                label={tr.personal.nationality}
                value={
                  editing
                    ? formData?.nationality || ""
                    : myInfo?.nationality || ""
                }
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, nationality: value })
                }
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tr.personal.gender}
                </label>
                <select
                  value={editing ? formData?.gender || "" : myInfo?.gender || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  disabled={!editing}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
                >
                  <option value="">{tr.personal.choose}</option>
                  <option value="male">{tr.personal.male}</option>
                  <option value="female">{tr.personal.female}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {tr.personal.bio}
              </label>
              <textarea
                value={editing ? formData?.bio || "" : myInfo?.bio || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                disabled={!editing}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
                placeholder={tr.personal.bioPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {tr.personal.skills}
              </label>
              <input
                type="text"
                value={
                  editing
                    ? (formData?.skills || []).join(joiner)
                    : (myInfo?.skills || []).join(joiner)
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skills: e.target.value
                      .split(/[،,]/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                disabled={!editing}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
                placeholder={tr.personal.skillsPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {tr.personal.languages}
              </label>
              <input
                type="text"
                value={
                  editing
                    ? (formData?.languages || []).join(joiner)
                    : (myInfo?.languages || []).join(joiner)
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    languages: e.target.value
                      .split(/[،,]/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                disabled={!editing}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
                placeholder={tr.personal.languagesPlaceholder}
              />
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="no-print space-y-4">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {tr.contact.emails}
                </h3>

                {editing && (
                  <button
                    onClick={() =>
                      addEmail({ id: generateId(), email: "", password: "" })
                    }
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {tr.add}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(editing ? formData?.emails : myInfo?.emails || [])?.map(
                  (email: any) => (
                    <div
                      key={email.id}
                      className="flex items-center gap-2 bg-white rounded-xl p-3"
                    >
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />

                      {editing ? (
                        <>
                          <input
                            type="email"
                            value={email.email}
                            onChange={(e) => {
                              const newEmails =
                                formData?.emails?.map((em: any) =>
                                  em.id === email.id
                                    ? { ...em, email: e.target.value }
                                    : em
                                ) || [];
                              setFormData({ ...formData, emails: newEmails });
                            }}
                            placeholder={tr.contact.emailPlaceholder}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm"
                          />

                          <input
                            type="text"
                            value={email.password}
                            onChange={(e) => {
                              const newEmails =
                                formData?.emails?.map((em: any) =>
                                  em.id === email.id
                                    ? { ...em, password: e.target.value }
                                    : em
                                ) || [];
                              setFormData({ ...formData, emails: newEmails });
                            }}
                            placeholder={tr.contact.password}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm"
                          />

                          <button
                            onClick={() => removeEmail(email.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 truncate">
                            {email.email}
                          </span>
                          <span className="font-mono text-sm text-gray-500">
                            ••••••••
                          </span>
                          <button
                            onClick={() => copyToClipboard(email.email)}
                            className="p-1.5 rounded-lg hover:bg-gray-100"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  {tr.contact.phones}
                </h3>

                {editing && (
                  <button
                    onClick={() => addPhone({ id: generateId(), number: "" })}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {tr.add}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(editing ? formData?.phones : myInfo?.phones || [])?.map(
                  (phone: any) => (
                    <div
                      key={phone.id}
                      className="flex items-center gap-2 bg-white rounded-xl p-3"
                    >
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />

                      {editing ? (
                        <>
                          <input
                            type="tel"
                            value={phone.number}
                            onChange={(e) => {
                              const newPhones =
                                formData?.phones?.map((p: any) =>
                                  p.id === phone.id
                                    ? { ...p, number: e.target.value }
                                    : p
                                ) || [];
                              setFormData({ ...formData, phones: newPhones });
                            }}
                            placeholder={tr.contact.phonePlaceholder}
                            dir="ltr"
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm"
                          />
                          <button
                            onClick={() => removePhone(phone.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span dir="ltr" className="flex-1">
                            {phone.number}
                          </span>
                          <button
                            onClick={() => copyToClipboard(phone.number)}
                            className="p-1.5 rounded-lg hover:bg-gray-100"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Address Tab */}
        {activeTab === "address" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {tr.address.title}
              </h3>

              {editing && (
                <button
                  onClick={getLocation}
                  disabled={loadingLocation}
                  className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Navigation className="w-4 h-4" />
                  {loadingLocation ? tr.address.locating : tr.address.gps}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label={tr.address.country}
                value={editing ? formData?.country || "" : myInfo?.country || ""}
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              />

              <Field
                label={tr.address.state}
                value={editing ? formData?.state || "" : myInfo?.state || ""}
                disabled={!editing}
                onChange={(value) => setFormData({ ...formData, state: value })}
              />

              <Field
                label={tr.address.city}
                value={editing ? formData?.city || "" : myInfo?.city || ""}
                disabled={!editing}
                onChange={(value) => setFormData({ ...formData, city: value })}
              />

              <Field
                label={tr.address.municipality}
                value={
                  editing
                    ? formData?.municipality || ""
                    : myInfo?.municipality || ""
                }
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, municipality: value })
                }
              />

              <Field
                label={tr.address.postalCode}
                value={
                  editing
                    ? formData?.postalCode || ""
                    : myInfo?.postalCode || ""
                }
                disabled={!editing}
                onChange={(value) =>
                  setFormData({ ...formData, postalCode: value })
                }
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                {tr.address.fullAddress}
              </label>
              <textarea
                value={
                  editing
                    ? formData?.fullAddress || ""
                    : myInfo?.fullAddress || ""
                }
                onChange={(e) =>
                  setFormData({ ...formData, fullAddress: e.target.value })
                }
                disabled={!editing}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
              />
            </div>

            {(myInfo?.latitude || editing) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field
                  label={tr.latitude}
                  value={
                    editing
                      ? formData?.latitude || ""
                      : myInfo?.latitude || ""
                  }
                  disabled
                  dir="ltr"
                  onChange={() => {}}
                />

                <Field
                  label={tr.longitude}
                  value={
                    editing
                      ? formData?.longitude || ""
                      : myInfo?.longitude || ""
                  }
                  disabled
                  dir="ltr"
                  onChange={() => {}}
                />
              </div>
            )}
          </div>
        )}

        {/* Secrets Tab */}
        {activeTab === "secrets" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {tr.secrets.title}
              </h3>

              {editing && (
                <button
                  onClick={() =>
                    addSecret({ id: generateId(), label: "", value: "" })
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {tr.add}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {(editing ? formData?.secrets : myInfo?.secrets || [])?.map(
                (secret: any) => (
                  <div
                    key={secret.id}
                    className="flex items-center gap-2 bg-white rounded-xl p-3"
                  >
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={secret.label}
                          onChange={(e) => {
                            const newSecrets =
                              formData?.secrets?.map((s: any) =>
                                s.id === secret.id
                                  ? { ...s, label: e.target.value }
                                  : s
                              ) || [];
                            setFormData({ ...formData, secrets: newSecrets });
                          }}
                          placeholder={tr.secrets.labelPlaceholder}
                          className="w-40 px-3 py-1.5 rounded-lg border border-border text-sm"
                        />

                        <input
                          type="text"
                          value={secret.value}
                          onChange={(e) => {
                            const newSecrets =
                              formData?.secrets?.map((s: any) =>
                                s.id === secret.id
                                  ? { ...s, value: e.target.value }
                                  : s
                              ) || [];
                            setFormData({ ...formData, secrets: newSecrets });
                          }}
                          placeholder={tr.secrets.valuePlaceholder}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm"
                        />

                        <button
                          onClick={() => removeSecret(secret.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium min-w-[100px]">
                          {secret.label}
                        </span>
                        <span className="flex-1 font-mono">
                          {showSecrets[secret.id]
                            ? secret.value
                            : "••••••••••"}
                        </span>
                        <button
                          onClick={() =>
                            setShowSecrets({
                              ...showSecrets,
                              [secret.id]: !showSecrets[secret.id],
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          {showSecrets[secret.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(secret.value)}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === "experience" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                {tr.experience.title}
              </h3>

              {editing && (
                <button
                  onClick={() =>
                    addExperience({
  id: generateId(),
  position: "",
  company: "",
  startDate: new Date().toISOString().split("T")[0],
  current: false,
  createdAt: new Date().toISOString(),
})
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {tr.add}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(editing
                ? formData?.experiences
                : myInfo?.experiences || []
              )?.map((exp: any) => (
                <div key={exp.id} className="bg-white rounded-xl p-4 space-y-3">
                  {editing ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => {
                            const newExps =
                              formData?.experiences?.map((x: any) =>
                                x.id === exp.id
                                  ? { ...x, position: e.target.value }
                                  : x
                              ) || [];
                            setFormData({ ...formData, experiences: newExps });
                          }}
                          placeholder={tr.experience.positionPlaceholder}
                          className="px-3 py-2 rounded-lg border border-border"
                        />

                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExps =
                              formData?.experiences?.map((x: any) =>
                                x.id === exp.id
                                  ? { ...x, company: e.target.value }
                                  : x
                              ) || [];
                            setFormData({ ...formData, experiences: newExps });
                          }}
                          placeholder={tr.experience.companyPlaceholder}
                          className="px-3 py-2 rounded-lg border border-border"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={exp.startDate || ""}
                          onChange={(e) => {
                            const newExps =
                              formData?.experiences?.map((x: any) =>
                                x.id === exp.id
                                  ? { ...x, startDate: e.target.value }
                                  : x
                              ) || [];
                            setFormData({ ...formData, experiences: newExps });
                          }}
                          className="px-3 py-2 rounded-lg border border-border"
                        />

                        <input
                          type="date"
                          value={exp.endDate || ""}
                          disabled={exp.current}
                          onChange={(e) => {
                            const newExps =
                              formData?.experiences?.map((x: any) =>
                                x.id === exp.id
                                  ? { ...x, endDate: e.target.value }
                                  : x
                              ) || [];
                            setFormData({ ...formData, experiences: newExps });
                          }}
                          className="px-3 py-2 rounded-lg border border-border disabled:bg-gray-100"
                        />
                      </div>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => {
                            const newExps =
                              formData?.experiences?.map((x: any) =>
                                x.id === exp.id
                                  ? { ...x, current: e.target.checked }
                                  : x
                              ) || [];
                            setFormData({ ...formData, experiences: newExps });
                          }}
                        />
                        <span className="text-sm">{tr.experience.current}</span>
                      </label>

                      <textarea
                        value={exp.description || ""}
                        onChange={(e) => {
                          const newExps =
                            formData?.experiences?.map((x: any) =>
                              x.id === exp.id
                                ? { ...x, description: e.target.value }
                                : x
                            ) || [];
                          setFormData({ ...formData, experiences: newExps });
                        }}
                        placeholder={tr.experience.descriptionPlaceholder}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border"
                      />

                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                      >
                        <Trash2 className="w-4 h-4 inline" /> {tr.delete}
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-lg">{exp.position}</h4>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {exp.startDate &&
                          new Date(exp.startDate).toLocaleDateString(
                            dateLocale
                          )}
                        {exp.current
                          ? ` - ${tr.untilNow}`
                          : exp.endDate
                          ? ` - ${new Date(exp.endDate).toLocaleDateString(
                              dateLocale
                            )}`
                          : ""}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-700 mt-2">
                          {exp.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === "education" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                {tr.education.title}
              </h3>

              {editing && (
                <button
                  onClick={() =>
                   addEducation({
  id: generateId(),
  degree: "",
  institution: "",
  startDate: new Date().toISOString().split("T")[0],
  current: false,
  createdAt: new Date().toISOString(),
})
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {tr.add}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(editing ? formData?.education : myInfo?.education || [])?.map(
                (edu: any) => (
                  <div key={edu.id} className="bg-white rounded-xl p-4 space-y-3">
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEdus =
                              formData?.education?.map((x: any) =>
                                x.id === edu.id
                                  ? { ...x, degree: e.target.value }
                                  : x
                              ) || [];
                            setFormData({ ...formData, education: newEdus });
                          }}
                          placeholder={tr.education.degreePlaceholder}
                          className="w-full px-3 py-2 rounded-lg border border-border"
                        />

                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdus =
                              formData?.education?.map((x: any) =>
                                x.id === edu.id
                                  ? { ...x, institution: e.target.value }
                                  : x
                              ) || [];
                            setFormData({ ...formData, education: newEdus });
                          }}
                          placeholder={tr.education.institutionPlaceholder}
                          className="w-full px-3 py-2 rounded-lg border border-border"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={edu.startDate || ""}
                            onChange={(e) => {
                              const newEdus =
                                formData?.education?.map((x: any) =>
                                  x.id === edu.id
                                    ? { ...x, startDate: e.target.value }
                                    : x
                                ) || [];
                              setFormData({ ...formData, education: newEdus });
                            }}
                            className="px-3 py-2 rounded-lg border border-border"
                          />

                          <input
                            type="date"
                            value={edu.endDate || ""}
                            disabled={edu.current}
                            onChange={(e) => {
                              const newEdus =
                                formData?.education?.map((x: any) =>
                                  x.id === edu.id
                                    ? { ...x, endDate: e.target.value }
                                    : x
                                ) || [];
                              setFormData({ ...formData, education: newEdus });
                            }}
                            className="px-3 py-2 rounded-lg border border-border disabled:bg-gray-100"
                          />
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={edu.current}
                            onChange={(e) => {
                              const newEdus =
                                formData?.education?.map((x: any) =>
                                  x.id === edu.id
                                    ? { ...x, current: e.target.checked }
                                    : x
                                ) || [];
                              setFormData({ ...formData, education: newEdus });
                            }}
                          />
                          <span className="text-sm">{tr.education.current}</span>
                        </label>

                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                        >
                          <Trash2 className="w-4 h-4 inline" /> {tr.delete}
                        </button>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-lg">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">
                          {edu.startDate &&
                            new Date(edu.startDate).toLocaleDateString(
                              dateLocale
                            )}
                          {edu.current
                            ? ` - ${tr.untilNow}`
                            : edu.endDate
                            ? ` - ${new Date(edu.endDate).toLocaleDateString(
                                dateLocale
                              )}`
                            : ""}
                        </p>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === "certifications" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5" />
                {tr.certifications.title}
              </h3>

              {editing && (
                <button
                  onClick={() =>
                  addCertification({
  id: generateId(),
  name: "",
  issuer: "",
  issueDate: new Date().toISOString().split("T")[0],
  createdAt: new Date().toISOString(),
})
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {tr.add}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(editing
                ? formData?.certifications
                : myInfo?.certifications || []
              )?.map((cert: any) => (
                <div key={cert.id} className="bg-white rounded-xl p-4 space-y-3">
                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const newCerts =
                            formData?.certifications?.map((c: any) =>
                              c.id === cert.id
                                ? { ...c, name: e.target.value }
                                : c
                            ) || [];
                          setFormData({
                            ...formData,
                            certifications: newCerts,
                          });
                        }}
                        placeholder={tr.certifications.namePlaceholder}
                        className="w-full px-3 py-2 rounded-lg border border-border"
                      />

                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const newCerts =
                            formData?.certifications?.map((c: any) =>
                              c.id === cert.id
                                ? { ...c, issuer: e.target.value }
                                : c
                            ) || [];
                          setFormData({
                            ...formData,
                            certifications: newCerts,
                          });
                        }}
                        placeholder={tr.certifications.issuerPlaceholder}
                        className="w-full px-3 py-2 rounded-lg border border-border"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={cert.issueDate || ""}
                          onChange={(e) => {
                            const newCerts =
                              formData?.certifications?.map((c: any) =>
                                c.id === cert.id
                                  ? { ...c, issueDate: e.target.value }
                                  : c
                              ) || [];
                            setFormData({
                              ...formData,
                              certifications: newCerts,
                            });
                          }}
                          className="px-3 py-2 rounded-lg border border-border"
                        />

                        <input
                          type="date"
                          value={cert.expiryDate || ""}
                          onChange={(e) => {
                            const newCerts =
                              formData?.certifications?.map((c: any) =>
                                c.id === cert.id
                                  ? { ...c, expiryDate: e.target.value }
                                  : c
                              ) || [];
                            setFormData({
                              ...formData,
                              certifications: newCerts,
                            });
                          }}
                          className="px-3 py-2 rounded-lg border border-border"
                        />
                      </div>

                      <input
                        type="text"
                        value={cert.credentialId || ""}
                        onChange={(e) => {
                          const newCerts =
                            formData?.certifications?.map((c: any) =>
                              c.id === cert.id
                                ? { ...c, credentialId: e.target.value }
                                : c
                            ) || [];
                          setFormData({
                            ...formData,
                            certifications: newCerts,
                          });
                        }}
                        placeholder={tr.certifications.credentialIdPlaceholder}
                        className="w-full px-3 py-2 rounded-lg border border-border"
                      />

                      <button
                        onClick={() => removeCertification(cert.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                      >
                        <Trash2 className="w-4 h-4 inline" /> {tr.delete}
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-lg">{cert.name}</h4>
                      <p className="text-gray-600">{cert.issuer}</p>
                      <p className="text-sm text-gray-500">
                        {cert.issueDate &&
                          new Date(cert.issueDate).toLocaleDateString(
                            dateLocale
                          )}
                        {cert.expiryDate &&
                          ` - ${new Date(cert.expiryDate).toLocaleDateString(
                            dateLocale
                          )}`}
                      </p>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-500">
                          {tr.certifications.credentialId}: {cert.credentialId}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {tr.achievements.title}
              </h3>

              {editing && (
                <button
                  onClick={() =>
                   addAchievement({
  id: generateId(),
  title: "",
  description: "",
  createdAt: new Date().toISOString(),
})
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {tr.add}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(editing
                ? formData?.achievements
                : myInfo?.achievements || []
              )?.map((ach: any) => (
                <div key={ach.id} className="bg-white rounded-xl p-4 space-y-3">
                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={ach.title}
                        onChange={(e) => {
                          const newAchs =
                            formData?.achievements?.map((a: any) =>
                              a.id === ach.id
                                ? { ...a, title: e.target.value }
                                : a
                            ) || [];
                          setFormData({ ...formData, achievements: newAchs });
                        }}
                        placeholder={tr.achievements.titlePlaceholder}
                        className="w-full px-3 py-2 rounded-lg border border-border"
                      />

                      <textarea
                        value={ach.description}
                        onChange={(e) => {
                          const newAchs =
                            formData?.achievements?.map((a: any) =>
                              a.id === ach.id
                                ? { ...a, description: e.target.value }
                                : a
                            ) || [];
                          setFormData({ ...formData, achievements: newAchs });
                        }}
                        placeholder={tr.achievements.descriptionPlaceholder}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border"
                      />

                      <input
                        type="date"
                        value={ach.date || ""}
                        onChange={(e) => {
                          const newAchs =
                            formData?.achievements?.map((a: any) =>
                              a.id === ach.id
                                ? { ...a, date: e.target.value }
                                : a
                            ) || [];
                          setFormData({ ...formData, achievements: newAchs });
                        }}
                        className="px-3 py-2 rounded-lg border border-border"
                      />

                      <button
                        onClick={() => removeAchievement(ach.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                      >
                        <Trash2 className="w-4 h-4 inline" /> {tr.delete}
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        {ach.title}
                      </h4>
                      <p className="text-gray-700">{ach.description}</p>
                      {ach.date && (
                        <p className="text-sm text-gray-500">
                          {new Date(ach.date).toLocaleDateString(dateLocale)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hobbies Tab */}
        {activeTab === "hobbies" && (
          <div className="no-print glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-5 h-5" />
                {tr.hobbies.title}
              </h3>

              {editing && (
                <button
                  onClick={() =>
                    addHobby({ id: generateId(), name: "", icon: "" })
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {tr.add}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(editing ? formData?.hobbies : myInfo?.hobbies || [])?.map(
                (hobby: any) => (
                  <div
                    key={hobby.id}
                    className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-3 flex items-center gap-2"
                  >
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={hobby.icon || ""}
                          onChange={(e) => {
                            const newHobbies =
                              formData?.hobbies?.map((h: any) =>
                                h.id === hobby.id
                                  ? { ...h, icon: e.target.value }
                                  : h
                              ) || [];
                            setFormData({ ...formData, hobbies: newHobbies });
                          }}
                          placeholder={tr.hobbies.iconPlaceholder}
                          className="w-12 px-2 py-1 rounded-lg border border-border text-center text-sm"
                          maxLength={2}
                        />

                        <input
                          type="text"
                          value={hobby.name}
                          onChange={(e) => {
                            const newHobbies =
                              formData?.hobbies?.map((h: any) =>
                                h.id === hobby.id
                                  ? { ...h, name: e.target.value }
                                  : h
                              ) || [];
                            setFormData({ ...formData, hobbies: newHobbies });
                          }}
                          placeholder={tr.hobbies.namePlaceholder}
                          className="flex-1 px-3 py-1 rounded-lg border border-border text-sm"
                        />

                        <button
                          onClick={() => removeHobby(hobby.id)}
                          className="p-1 rounded bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        {hobby.icon && (
                          <span className="text-2xl">{hobby.icon}</span>
                        )}
                        <span className="font-medium">{hobby.name}</span>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        dir={dir}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
      />
    </div>
  );
}