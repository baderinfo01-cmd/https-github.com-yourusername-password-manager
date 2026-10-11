"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import {
  Plus,
  Edit,
  Save,
  Eye,
  EyeOff,
  Copy,
  Mail,
  Phone,
  MapPin,
  Lock,
  User,
  Camera,
  Navigation,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { generateId } from "@/lib/encryption";

export default function MyInfoPage() {
  const t = useTranslations("myInfo");

  const myInfo = useStore((state) => state.myInfo) || {};
  const updateMyInfo = useStore((state) => state.updateMyInfo);
  const addEmail = useStore((state) => state.addEmail);
  const removeEmail = useStore((state) => state.removeEmail);
  const addPhone = useStore((state) => state.addPhone);
  const removePhone = useStore((state) => state.removePhone);
  const addAddress = useStore((state) => state.addAddress);
  const removeAddress = useStore((state) => state.removeAddress);
  const addSecret = useStore((state) => state.addSecret);
  const removeSecret = useStore((state) => state.removeSecret);
  const addExperience = useStore((state) => state.addExperience);
  const removeExperience = useStore((state) => state.removeExperience);
  const addEducation = useStore((state) => state.addEducation);
  const removeEducation = useStore((state) => state.removeEducation);
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
    alert(t("alerts.saved"));
  };

  const handleCancel = () => {
    setFormData(myInfo);
    setEditing(false);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t("alerts.imageTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, avatar: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const getLocation = async () => {
    setLoadingLocation(true);

    try {
      const pos = await getCurrentLocation();
      setFormData({ ...formData, latitude: pos.lat, longitude: pos.lng });
      alert(t("alerts.locationSuccess"));
    } catch {
      alert(t("alerts.locationError"));
    }

    setLoadingLocation(false);
  };

  const tabs = [
    { id: "personal", label: t("tabs.personal"), icon: User },
    { id: "contact", label: t("tabs.emails"), icon: Mail },
    { id: "phones", label: t("tabs.phones"), icon: Phone },
    { id: "address", label: t("tabs.addresses"), icon: MapPin },
    { id: "secrets", label: t("tabs.secrets"), icon: Lock },
    { id: "experience", label: t("tabs.experience"), icon: Briefcase },
    { id: "education", label: t("tabs.education"), icon: GraduationCap },
    { id: "certifications", label: t("tabs.certifications"), icon: Award },
    { id: "achievements", label: t("tabs.achievements"), icon: Trophy },
  ];

  return (
    <AppLayout>
      <div className="space-y-6" id="my-info-content">
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">ℹ️ {t("title")}</h1>
            <p className="text-gray-600 mt-1">{t("subtitle")}</p>
          </div>

          <div className="flex gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Edit className="w-5 h-5" />
                {t("actions.edit")}
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium"
                >
                  {t("actions.cancel")}
                </button>

                <button
                  onClick={handleSave}
                  className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                  style={{ background: "#10b981" }}
                >
                  <Save className="w-5 h-5" />
                  {t("actions.save")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="h-32 rounded-t-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <div className="glass rounded-2xl shadow-xl -mt-16 relative">
            <div className="pt-20 pb-6 px-6">
              <div className="flex items-start gap-6">
                <div className="relative -mt-20">
                  <div
                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center text-white font-bold text-5xl overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))",
                    }}
                  >
                    {formData?.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {formData?.firstName?.[0] || "B"}
                        {formData?.lastName?.[0] || "A"}
                      </>
                    )}
                  </div>

                  {editing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2.5 rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform"
                      title={t("actions.changeImage")}
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
                    {formData?.firstName || t("fallback.firstName")}{" "}
                    {formData?.lastName || t("fallback.lastName")}
                  </h2>

                  {formData?.username && (
                    <p className="text-gray-600">@{formData?.username}</p>
                  )}

                  {formData?.bio && (
                    <p className="text-sm text-gray-700 mt-2 italic">
                      {formData?.bio}
                    </p>
                  )}

                  {formData?.nationality && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      🌍 {formData?.nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {activeTab === "personal" && (
          <PersonalTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
          />
        )}

        {activeTab === "contact" && (
          <EmailsTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addEmail={addEmail}
            removeEmail={removeEmail}
            showSecrets={showSecrets}
            setShowSecrets={setShowSecrets}
          />
        )}

        {activeTab === "phones" && (
          <PhonesTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addPhone={addPhone}
            removePhone={removePhone}
          />
        )}

        {activeTab === "address" && (
          <AddressesTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addAddress={addAddress}
            removeAddress={removeAddress}
            getLocation={getLocation}
            loadingLocation={loadingLocation}
          />
        )}

        {activeTab === "secrets" && (
          <SecretsTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addSecret={addSecret}
            removeSecret={removeSecret}
            showSecrets={showSecrets}
            setShowSecrets={setShowSecrets}
          />
        )}

        {activeTab === "experience" && (
          <ExperienceTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addExperience={addExperience}
            removeExperience={removeExperience}
          />
        )}

        {activeTab === "education" && (
          <EducationTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addEducation={addEducation}
            removeEducation={removeEducation}
          />
        )}

        {activeTab === "certifications" && (
          <CertificationsTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addCertification={addCertification}
            removeCertification={removeCertification}
          />
        )}

        {activeTab === "achievements" && (
          <AchievementsTab
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            myInfo={myInfo}
            addAchievement={addAchievement}
            removeAchievement={removeAchievement}
          />
        )}
      </div>
    </AppLayout>
  );
}

function PersonalTab({ formData, setFormData, editing, myInfo }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
        <User className="w-5 h-5" />
        {t("personal.title")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoInput
          label={t("personal.firstName")}
          value={editing ? formData?.firstName || "" : myInfo?.firstName || ""}
          onChange={(value: string) =>
            setFormData({ ...formData, firstName: value })
          }
          disabled={!editing}
        />

        <InfoInput
          label={t("personal.lastName")}
          value={editing ? formData?.lastName || "" : myInfo?.lastName || ""}
          onChange={(value: string) =>
            setFormData({ ...formData, lastName: value })
          }
          disabled={!editing}
        />

        <InfoInput
          label={t("personal.username")}
          value={editing ? formData?.username || "" : myInfo?.username || ""}
          onChange={(value: string) =>
            setFormData({ ...formData, username: value })
          }
          disabled={!editing}
        />

        <InfoInput
          label={t("personal.nationality")}
          value={
            editing
              ? formData?.nationality || ""
              : myInfo?.nationality || ""
          }
          onChange={(value: string) =>
            setFormData({ ...formData, nationality: value })
          }
          disabled={!editing}
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("personal.birthDate")}
          </label>
          <input
            type="date"
            value={editing ? formData?.birthDate || "" : myInfo?.birthDate || ""}
            onChange={(e) =>
              setFormData({ ...formData, birthDate: e.target.value })
            }
            disabled={!editing}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("personal.gender")}
          </label>
          <select
            value={editing ? formData?.gender || "" : myInfo?.gender || ""}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            disabled={!editing}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
          >
            <option value="">{t("personal.choose")}</option>
            <option value="male">{t("personal.male")}</option>
            <option value="female">{t("personal.female")}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("personal.bio")}
        </label>
        <textarea
          value={editing ? formData?.bio || "" : myInfo?.bio || ""}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          disabled={!editing}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
        />
      </div>
    </div>
  );
}

function InfoInput({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary disabled:bg-gray-50"
      />
    </div>
  );
}

function EmailsTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addEmail,
  removeEmail,
  showSecrets,
  setShowSecrets,
}: any) {
  const t = useTranslations("myInfo");
  const emails = editing ? formData?.emails : myInfo?.emails || [];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<Mail className="w-5 h-5" />}
        title={`${t("emails.title")} (${emails?.length || 0})`}
        editing={editing}
        onAdd={() => addEmail({ id: generateId(), email: "", password: "" })}
      />

      {!emails || emails.length === 0 ? (
        <EmptyState icon={Mail} text={t("emails.empty")} />
      ) : (
        <div className="space-y-2">
          {emails.map((email: any) =>
            editing ? (
              <EmailEditCard
                key={email.id}
                email={email}
                formData={formData}
                setFormData={setFormData}
                onRemove={() => removeEmail(email.id)}
              />
            ) : (
              <EmailViewCard
                key={email.id}
                email={email}
                showSecrets={showSecrets[email.id] || false}
                onToggleShow={() =>
                  setShowSecrets({
                    ...showSecrets,
                    [email.id]: !showSecrets[email.id],
                  })
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function EmailEditCard({ email, formData, setFormData, onRemove }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border">
      <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
        <Mail className="w-5 h-5" />
      </div>

      <input
        type="email"
        value={email.email}
        onChange={(e) => {
          const newEmails =
            formData?.emails?.map((em: any) =>
              em.id === email.id ? { ...em, email: e.target.value } : em
            ) || [];
          setFormData({ ...formData, emails: newEmails });
        }}
        placeholder="email@example.com"
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
      />

      <input
        type="text"
        value={email.password}
        onChange={(e) => {
          const newEmails =
            formData?.emails?.map((em: any) =>
              em.id === email.id ? { ...em, password: e.target.value } : em
            ) || [];
          setFormData({ ...formData, emails: newEmails });
        }}
        placeholder={t("fields.password")}
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
      />

      <DeleteIconButton onClick={onRemove} />
    </div>
  );
}

function EmailViewCard({ email, showSecrets, onToggleShow }: any) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
        <Mail className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <div className="font-medium">{email.email}</div>
        <div className="text-xs text-gray-500 font-mono">
          {showSecrets ? email.password : "••••••••"}
        </div>
      </div>

      <button onClick={onToggleShow} className="p-2 rounded-lg hover:bg-gray-100">
        {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <button onClick={() => copyToClipboard(email.email)} className="p-2 rounded-lg hover:bg-gray-100">
        <Copy className="w-4 h-4" />
      </button>
    </div>
  );
}

function PhonesTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addPhone,
  removePhone,
}: any) {
  const t = useTranslations("myInfo");
  const phones = editing ? formData?.phones : myInfo?.phones || [];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<Phone className="w-5 h-5" />}
        title={`${t("phones.title")} (${phones?.length || 0})`}
        editing={editing}
        onAdd={() => addPhone({ id: generateId(), number: "" })}
      />

      {!phones || phones.length === 0 ? (
        <EmptyState icon={Phone} text={t("phones.empty")} />
      ) : (
        <div className="space-y-2">
          {phones.map((phone: any) =>
            editing ? (
              <PhoneEditCard
                key={phone.id}
                phone={phone}
                formData={formData}
                setFormData={setFormData}
                onRemove={() => removePhone(phone.id)}
              />
            ) : (
              <PhoneViewCard key={phone.id} phone={phone} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function PhoneEditCard({ phone, formData, setFormData, onRemove }: any) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border">
      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
        <Phone className="w-5 h-5" />
      </div>

      <input
        type="tel"
        value={phone.number}
        onChange={(e) => {
          const newPhones =
            formData?.phones?.map((p: any) =>
              p.id === phone.id ? { ...p, number: e.target.value } : p
            ) || [];
          setFormData({ ...formData, phones: newPhones });
        }}
        placeholder="+213 XXX XXX XXX"
        dir="ltr"
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
      />

      <DeleteIconButton onClick={onRemove} />
    </div>
  );
}

function PhoneViewCard({ phone }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
        <Phone className="w-5 h-5" />
      </div>

      <span dir="ltr" className="flex-1 font-medium">
        {phone.number}
      </span>

      <a
        href={`tel:${phone.number}`}
        className="px-3 py-1 rounded-lg bg-green-50 text-green-600 text-sm no-print"
      >
        {t("actions.call")}
      </a>

      <button onClick={() => copyToClipboard(phone.number)} className="p-2 rounded-lg hover:bg-gray-100">
        <Copy className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddressesTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addAddress,
  removeAddress,
  getLocation,
  loadingLocation,
}: any) {
  const t = useTranslations("myInfo");
  const addresses = editing ? formData?.addresses : myInfo?.addresses || [];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
          <MapPin className="w-5 h-5" />
          {t("addresses.title")}
        </h3>

        <div className="flex gap-2">
          {editing && (
            <button
              onClick={getLocation}
              disabled={loadingLocation}
              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
              {loadingLocation ? t("actions.loading") : "GPS"}
            </button>
          )}

          {editing && (
            <button
              onClick={() =>
                addAddress({
                  id: generateId(),
                  label: "",
                  country: "",
                  state: "",
                  city: "",
                  municipality: "",
                  postalCode: "",
                  fullAddress: "",
                  isPrimary: false,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {t("actions.add")}
            </button>
          )}
        </div>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState icon={MapPin} text={t("addresses.empty")} />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr: any) =>
            editing ? (
              <AddressEditCard
                key={addr.id}
                addr={addr}
                formData={formData}
                setFormData={setFormData}
                onRemove={() => removeAddress(addr.id)}
              />
            ) : (
              <AddressViewCard key={addr.id} addr={addr} />
            )
          )}
        </div>
      )}

      {(myInfo?.latitude || formData?.latitude) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-1">
            <Navigation className="w-4 h-4" />
            {t("addresses.gps")}
          </div>

          <div className="text-xs text-green-600 font-mono" dir="ltr">
            {formData?.latitude?.toFixed(6) || myInfo?.latitude?.toFixed(6)},{" "}
            {formData?.longitude?.toFixed(6) || myInfo?.longitude?.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}

function AddressEditCard({ addr, formData, setFormData, onRemove }: any) {
  const t = useTranslations("myInfo");

  const updateField = (field: string, value: any) => {
    const newAddrs =
      formData?.addresses?.map((a: any) =>
        a.id === addr.id ? { ...a, [field]: value } : a
      ) || [];
    setFormData({ ...formData, addresses: newAddrs });
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-border space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={addr.label || ""}
          onChange={(e) => updateField("label", e.target.value)}
          placeholder={t("addresses.labelPlaceholder")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />

        <input
          type="text"
          value={addr.country || ""}
          onChange={(e) => updateField("country", e.target.value)}
          placeholder={t("addresses.country")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={addr.state || ""}
          onChange={(e) => updateField("state", e.target.value)}
          placeholder={t("addresses.state")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />

        <input
          type="text"
          value={addr.city || ""}
          onChange={(e) => updateField("city", e.target.value)}
          placeholder={t("addresses.city")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={addr.municipality || ""}
          onChange={(e) => updateField("municipality", e.target.value)}
          placeholder={t("addresses.municipality")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />

        <input
          type="text"
          value={addr.postalCode || ""}
          onChange={(e) => updateField("postalCode", e.target.value)}
          placeholder={t("addresses.postalCode")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />
      </div>

      <textarea
        value={addr.fullAddress || ""}
        onChange={(e) => updateField("fullAddress", e.target.value)}
        placeholder={t("addresses.fullAddress")}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />

      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={addr.isPrimary || false}
            onChange={(e) => updateField("isPrimary", e.target.checked)}
          />
          {t("addresses.primary")}
        </label>

        <button
          onClick={onRemove}
          className="px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          {t("actions.delete")}
        </button>
      </div>
    </div>
  );
}

function AddressViewCard({ addr }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      {addr.label && <div className="font-medium">{addr.label}</div>}

      {(addr.fullAddress || addr.city) && (
        <div className="text-sm text-gray-600">
          {addr.fullAddress || `${addr.country} - ${addr.state} - ${addr.city}`}
          {addr.postalCode && ` (${addr.postalCode})`}
        </div>
      )}

      {addr.isPrimary && (
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
          ⭐ {t("addresses.primaryShort")}
        </span>
      )}
    </div>
  );
}

function SecretsTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addSecret,
  removeSecret,
  showSecrets,
  setShowSecrets,
}: any) {
  const t = useTranslations("myInfo");
  const secrets = editing ? formData?.secrets : myInfo?.secrets || [];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<Lock className="w-5 h-5" />}
        title={`${t("secrets.title")} (${secrets?.length || 0})`}
        editing={editing}
        onAdd={() => addSecret({ id: generateId(), label: "", value: "" })}
      />

      {!secrets || secrets.length === 0 ? (
        <EmptyState icon={Lock} text={t("secrets.empty")} />
      ) : (
        <div className="space-y-2">
          {secrets.map((secret: any) =>
            editing ? (
              <SecretEditCard
                key={secret.id}
                secret={secret}
                formData={formData}
                setFormData={setFormData}
                onRemove={() => removeSecret(secret.id)}
              />
            ) : (
              <SecretViewCard
                key={secret.id}
                secret={secret}
                showSecrets={showSecrets[secret.id] || false}
                onToggleShow={() =>
                  setShowSecrets({
                    ...showSecrets,
                    [secret.id]: !showSecrets[secret.id],
                  })
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SecretEditCard({ secret, formData, setFormData, onRemove }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
        <Lock className="w-5 h-5" />
      </div>

      <input
        type="text"
        value={secret.label}
        onChange={(e) => {
          const newSecrets =
            formData?.secrets?.map((s: any) =>
              s.id === secret.id ? { ...s, label: e.target.value } : s
            ) || [];
          setFormData({ ...formData, secrets: newSecrets });
        }}
        placeholder={t("secrets.labelPlaceholder")}
        className="w-40 px-3 py-2 rounded-lg border border-border text-sm"
      />

      <input
        type="text"
        value={secret.value}
        onChange={(e) => {
          const newSecrets =
            formData?.secrets?.map((s: any) =>
              s.id === secret.id ? { ...s, value: e.target.value } : s
            ) || [];
          setFormData({ ...formData, secrets: newSecrets });
        }}
        placeholder={t("secrets.valuePlaceholder")}
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
      />

      <DeleteIconButton onClick={onRemove} />
    </div>
  );
}

function SecretViewCard({ secret, showSecrets, onToggleShow }: any) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
        <Lock className="w-5 h-5" />
      </div>

      <span className="font-medium min-w-[100px]">{secret.label}</span>
      <span className="flex-1 font-mono">
        {showSecrets ? secret.value : "••••••••"}
      </span>

      <button onClick={onToggleShow} className="p-2 rounded-lg hover:bg-gray-100">
        {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <button onClick={() => copyToClipboard(secret.value)} className="p-2 rounded-lg hover:bg-gray-100">
        <Copy className="w-4 h-4" />
      </button>
    </div>
  );
}

function ExperienceTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addExperience,
  removeExperience,
}: any) {
  const t = useTranslations("myInfo");
  const experiences = editing ? formData?.experiences : myInfo?.experiences || [];

  const handleAdd = () => {
    addExperience({
      id: generateId(),
      position: "",
      company: "",
      startDate: new Date().toISOString().split("T")[0],
      current: false,
      description: "",
      achievements: [],
      skills: [],
      employmentType: "full_time",
      createdAt: new Date().toISOString(),
    });
  };

  const updateField = (id: string, field: string, value: any) => {
    const newExps =
      formData?.experiences?.map((x: any) =>
        x.id === id ? { ...x, [field]: value } : x
      ) || [];
    setFormData({ ...formData, experiences: newExps });
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<Briefcase className="w-5 h-5" />}
        title={`${t("experience.title")} (${experiences?.length || 0})`}
        editing={editing}
        onAdd={handleAdd}
      />

      {!experiences || experiences.length === 0 ? (
        <EmptyState icon={Briefcase} text={t("experience.empty")} />
      ) : (
        <div className="space-y-4">
          {experiences.map((exp: any) =>
            editing ? (
              <ExperienceEditCard
                key={exp.id}
                exp={exp}
                updateField={updateField}
                onRemove={() => removeExperience(exp.id)}
              />
            ) : (
              <ExperienceViewCard key={exp.id} exp={exp} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function ExperienceEditCard({ exp, updateField, onRemove }: any) {
  const t = useTranslations("myInfo");
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const skills = [...(exp.skills || []), skillInput.trim()];
    updateField(exp.id, "skills", skills);
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    const skills = (exp.skills || []).filter((_: any, i: number) => i !== index);
    updateField(exp.id, "skills", skills);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-border space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
            <Briefcase className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={exp.position || ""}
              onChange={(e) => updateField(exp.id, "position", e.target.value)}
              placeholder={t("experience.positionPlaceholder")}
              className="w-full font-bold text-lg px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
            />

            <input
              type="text"
              value={exp.company || ""}
              onChange={(e) => updateField(exp.id, "company", e.target.value)}
              placeholder={t("experience.companyPlaceholder")}
              className="w-full text-sm text-gray-600 px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <DeleteIconButton onClick={onRemove} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={exp.employmentType || "full_time"}
          onChange={(e) => updateField(exp.id, "employmentType", e.target.value)}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        >
          <option value="full_time">{t("experience.types.fullTime")}</option>
          <option value="part_time">{t("experience.types.partTime")}</option>
          <option value="contract">{t("experience.types.contract")}</option>
          <option value="freelance">{t("experience.types.freelance")}</option>
          <option value="internship">{t("experience.types.internship")}</option>
          <option value="remote">{t("experience.types.remote")}</option>
        </select>

        <input
          type="text"
          value={exp.companyLocation || ""}
          onChange={(e) => updateField(exp.id, "companyLocation", e.target.value)}
          placeholder={t("experience.companyLocation")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DateInput
          label={t("fields.startDate")}
          value={exp.startDate || ""}
          onChange={(value: string) => updateField(exp.id, "startDate", value)}
        />

        <DateInput
          label={t("fields.endDate")}
          value={exp.endDate || ""}
          disabled={exp.current}
          onChange={(value: string) => updateField(exp.id, "endDate", value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={exp.current || false}
          onChange={(e) => updateField(exp.id, "current", e.target.checked)}
        />
        {t("experience.current")}
      </label>

      <div>
        <label className="block text-xs font-medium mb-1">
          {t("experience.description")}
        </label>
        <textarea
          value={exp.description || ""}
          onChange={(e) => updateField(exp.id, "description", e.target.value)}
          placeholder={t("experience.descriptionPlaceholder")}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          {t("experience.skills")}
        </label>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder={t("experience.addSkill")}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
          />

          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-1 rounded bg-blue-50 text-blue-600 text-sm"
          >
            +
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {(exp.skills || []).map((skill: string, idx: number) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs flex items-center gap-1"
            >
              {skill}
              <button
                onClick={() => removeSkill(idx)}
                className="text-cyan-700 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={exp.referenceName || ""}
          onChange={(e) => updateField(exp.id, "referenceName", e.target.value)}
          placeholder={t("experience.referenceName")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />

        <input
          type="text"
          value={exp.referenceContact || ""}
          onChange={(e) =>
            updateField(exp.id, "referenceContact", e.target.value)
          }
          placeholder={t("experience.referenceContact")}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        />
      </div>
    </div>
  );
}

function ExperienceViewCard({ exp }: any) {
  const t = useTranslations("myInfo");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
          <Briefcase className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-lg">{exp.position}</h4>
          <p className="text-gray-600">{exp.company}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
            <span>
              {new Date(exp.startDate).toLocaleDateString(dateLocale)}
              {" - "}
              {exp.current
                ? t("fields.untilNow")
                : exp.endDate
                ? new Date(exp.endDate).toLocaleDateString(dateLocale)
                : ""}
            </span>
          </div>

          {exp.description && (
            <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
          )}

          {exp.skills && exp.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {exp.skills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EducationTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addEducation,
  removeEducation,
}: any) {
  const t = useTranslations("myInfo");
  const educations = editing ? formData?.education : myInfo?.education || [];

  const handleAdd = () => {
    addEducation({
      id: generateId(),
      degree: "",
      institution: "",
      startDate: new Date().toISOString().split("T")[0],
      current: false,
      description: "",
      createdAt: new Date().toISOString(),
    });
  };

  const updateField = (id: string, field: string, value: any) => {
    const newEdus =
      formData?.education?.map((x: any) =>
        x.id === id ? { ...x, [field]: value } : x
      ) || [];
    setFormData({ ...formData, education: newEdus });
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<GraduationCap className="w-5 h-5" />}
        title={`${t("education.title")} (${educations?.length || 0})`}
        editing={editing}
        onAdd={handleAdd}
      />

      {!educations || educations.length === 0 ? (
        <EmptyState icon={GraduationCap} text={t("education.empty")} />
      ) : (
        <div className="space-y-4">
          {educations.map((edu: any) =>
            editing ? (
              <EducationEditCard
                key={edu.id}
                edu={edu}
                updateField={updateField}
                onRemove={() => removeEducation(edu.id)}
              />
            ) : (
              <EducationViewCard key={edu.id} edu={edu} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function EducationEditCard({ edu, updateField, onRemove }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="bg-white rounded-xl p-4 border border-border space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={edu.degree || ""}
              onChange={(e) => updateField(edu.id, "degree", e.target.value)}
              placeholder={t("education.degree")}
              className="w-full font-bold text-lg px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
            />

            <input
              type="text"
              value={edu.institution || ""}
              onChange={(e) =>
                updateField(edu.id, "institution", e.target.value)
              }
              placeholder={t("education.institution")}
              className="w-full text-sm text-gray-600 px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <DeleteIconButton onClick={onRemove} />
      </div>

      <input
        type="text"
        value={edu.fieldOfStudy || ""}
        onChange={(e) => updateField(edu.id, "fieldOfStudy", e.target.value)}
        placeholder={t("education.fieldOfStudy")}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <DateInput
          label={t("fields.startDate")}
          value={edu.startDate || ""}
          onChange={(value: string) => updateField(edu.id, "startDate", value)}
        />

        <DateInput
          label={t("education.graduationDate")}
          value={edu.endDate || ""}
          disabled={edu.current}
          onChange={(value: string) => updateField(edu.id, "endDate", value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={edu.current || false}
          onChange={(e) => updateField(edu.id, "current", e.target.checked)}
        />
        {t("education.current")}
      </label>

      <textarea
        value={edu.description || ""}
        onChange={(e) => updateField(edu.id, "description", e.target.value)}
        placeholder={t("education.description")}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />
    </div>
  );
}

function EducationViewCard({ edu }: any) {
  const t = useTranslations("myInfo");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
          <GraduationCap className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-lg">{edu.degree}</h4>
          {edu.fieldOfStudy && <p className="text-gray-600">{edu.fieldOfStudy}</p>}
          <p className="text-gray-600">{edu.institution}</p>

          <div className="text-sm text-gray-500 mt-1">
            {new Date(edu.startDate).toLocaleDateString(dateLocale)}
            {" - "}
            {edu.current
              ? t("fields.untilNow")
              : edu.endDate
              ? new Date(edu.endDate).toLocaleDateString(dateLocale)
              : ""}
          </div>

          {edu.description && (
            <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CertificationsTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addCertification,
  removeCertification,
}: any) {
  const t = useTranslations("myInfo");
  const certs = editing ? formData?.certifications : myInfo?.certifications || [];

  const handleAdd = () => {
    addCertification({
      id: generateId(),
      name: "",
      issuer: "",
      issueDate: new Date().toISOString().split("T")[0],
      description: "",
      skills: [],
      createdAt: new Date().toISOString(),
    });
  };

  const updateField = (id: string, field: string, value: any) => {
    const newCerts =
      formData?.certifications?.map((c: any) =>
        c.id === id ? { ...c, [field]: value } : c
      ) || [];
    setFormData({ ...formData, certifications: newCerts });
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<Award className="w-5 h-5" />}
        title={`${t("certifications.title")} (${certs?.length || 0})`}
        editing={editing}
        onAdd={handleAdd}
      />

      {!certs || certs.length === 0 ? (
        <EmptyState icon={Award} text={t("certifications.empty")} />
      ) : (
        <div className="space-y-4">
          {certs.map((cert: any) =>
            editing ? (
              <CertificationEditCard
                key={cert.id}
                cert={cert}
                updateField={updateField}
                onRemove={() => removeCertification(cert.id)}
              />
            ) : (
              <CertificationViewCard key={cert.id} cert={cert} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function CertificationEditCard({ cert, updateField, onRemove }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="bg-white rounded-xl p-4 border border-border space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={cert.name || ""}
              onChange={(e) => updateField(cert.id, "name", e.target.value)}
              placeholder={t("certifications.name")}
              className="w-full font-bold text-lg px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
            />

            <input
              type="text"
              value={cert.issuer || ""}
              onChange={(e) => updateField(cert.id, "issuer", e.target.value)}
              placeholder={t("certifications.issuer")}
              className="w-full text-sm text-gray-600 px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <DeleteIconButton onClick={onRemove} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DateInput
          label={t("certifications.issueDate")}
          value={cert.issueDate || ""}
          onChange={(value: string) => updateField(cert.id, "issueDate", value)}
        />

        <DateInput
          label={t("certifications.expiryDate")}
          value={cert.expiryDate || ""}
          onChange={(value: string) => updateField(cert.id, "expiryDate", value)}
        />
      </div>

      <input
        type="text"
        value={cert.credentialId || ""}
        onChange={(e) => updateField(cert.id, "credentialId", e.target.value)}
        placeholder={t("certifications.credentialId")}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />

      <textarea
        value={cert.description || ""}
        onChange={(e) => updateField(cert.id, "description", e.target.value)}
        placeholder={t("certifications.description")}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />
    </div>
  );
}

function CertificationViewCard({ cert }: any) {
  const t = useTranslations("myInfo");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Award className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-lg">{cert.name}</h4>
          <p className="text-gray-600">{cert.issuer}</p>

          <div className="text-sm text-gray-500 mt-1">
            {new Date(cert.issueDate).toLocaleDateString(dateLocale)}
            {cert.expiryDate &&
              ` - ${new Date(cert.expiryDate).toLocaleDateString(dateLocale)}`}
          </div>

          {cert.credentialId && (
            <p className="text-xs text-gray-500 mt-1">
              🔖 {t("certifications.credentialId")}: {cert.credentialId}
            </p>
          )}

          {cert.description && (
            <p className="text-sm text-gray-700 mt-2">{cert.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementsTab({
  formData,
  setFormData,
  editing,
  myInfo,
  addAchievement,
  removeAchievement,
}: any) {
  const t = useTranslations("myInfo");
  const achievements = editing ? formData?.achievements : myInfo?.achievements || [];

  const handleAdd = () => {
    addAchievement({
      id: generateId(),
      title: "",
      description: "",
      createdAt: new Date().toISOString(),
    });
  };

  const updateField = (id: string, field: string, value: any) => {
    const newAchs =
      formData?.achievements?.map((a: any) =>
        a.id === id ? { ...a, [field]: value } : a
      ) || [];
    setFormData({ ...formData, achievements: newAchs });
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <SectionHeader
        icon={<Trophy className="w-5 h-5" />}
        title={`${t("achievements.title")} (${achievements?.length || 0})`}
        editing={editing}
        onAdd={handleAdd}
      />

      {!achievements || achievements.length === 0 ? (
        <EmptyState icon={Trophy} text={t("achievements.empty")} />
      ) : (
        <div className="space-y-4">
          {achievements.map((ach: any) =>
            editing ? (
              <AchievementEditCard
                key={ach.id}
                ach={ach}
                updateField={updateField}
                onRemove={() => removeAchievement(ach.id)}
              />
            ) : (
              <AchievementViewCard key={ach.id} ach={ach} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function AchievementEditCard({ ach, updateField, onRemove }: any) {
  const t = useTranslations("myInfo");

  return (
    <div className="bg-white rounded-xl p-4 border border-border space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <Trophy className="w-6 h-6" />
          </div>

          <input
            type="text"
            value={ach.title || ""}
            onChange={(e) => updateField(ach.id, "title", e.target.value)}
            placeholder={t("achievements.titlePlaceholder")}
            className="flex-1 font-bold text-lg px-2 py-1 border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
          />
        </div>

        <DeleteIconButton onClick={onRemove} />
      </div>

      <textarea
        value={ach.description || ""}
        onChange={(e) => updateField(ach.id, "description", e.target.value)}
        placeholder={t("achievements.description")}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />

      <input
        type="date"
        value={ach.date || ""}
        onChange={(e) => updateField(ach.id, "date", e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm"
      />
    </div>
  );
}

function AchievementViewCard({ ach }: any) {
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
          <Trophy className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-lg">{ach.title}</h4>
          <p className="text-gray-700 mt-1">{ach.description}</p>

          {ach.date && (
            <p className="text-xs text-gray-500 mt-1">
              📅 {new Date(ach.date).toLocaleDateString(dateLocale)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  editing,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  onAdd: () => void;
}) {
  const t = useTranslations("myInfo");

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
        {icon}
        {title}
      </h3>

      {editing && (
        <button
          onClick={onAdd}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {t("actions.add")}
        </button>
      )}
    </div>
  );
}

function DateInput({ label, value, onChange, disabled = false }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm disabled:bg-gray-100"
      />
    </div>
  );
}

function DeleteIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function EmptyState({ icon: Icon, text }: any) {
  return (
    <div className="text-center py-8 text-gray-500">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>{text}</p>
    </div>
  );
}