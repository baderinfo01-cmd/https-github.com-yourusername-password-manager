// ONE place for the identity of the program (name, version, developer contact, logo paths).
// new_app.py replaces the placeholders; edit the rest by hand. Never hard-code the name elsewhere.
export const branding = {
  appName: "Template App",
  appShortName: "Template",
  // lower-case id: npm name, data folder (%APPDATA%/<slug>), app:// host, backup tag
  slug: "template-app",
  // fallback display name of the person using the app (before they fill in their profile)
  ownerName: "Template",
  ownerRole: "مدير",
  version: "v1.0.0",
  logoText: "t",
  accent: "#0ea5e9",
  website: "https://baderinfo.com",
  email: "template@example.com",
  developer: {
    name: "Template Author",
    company: "Baderinfo",
    email: "template@example.com",
    phone: "0000000000",
    phoneIntl: "+0000000000",
    // digits only, country code first: used for wa.me links
    whatsapp: "0000000000",
    website: "https://baderinfo.com",
  },
  assets: {
    logo: "/brand/app-icon.png",
    logoPlain: "/brand/logo-light.png",
    seal: "/brand/seal.png",
  },
} as const;

export const whatsappLink = (text = "") =>
  `https://wa.me/${branding.developer.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
