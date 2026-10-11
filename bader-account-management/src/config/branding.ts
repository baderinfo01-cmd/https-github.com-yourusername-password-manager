export const branding = {
  appName: "Bader Account Management",
  appShortName: "Bader",
  // fallback display name of the person using the app (before they fill in their profile)
  ownerName: "Bader",
  ownerRole: "مدير",
  version: "v3.0.0",
  logoText: "b",
  website: "https://baderinfo.com",
  email: "baderinfo12@gmail.com",
  developer: {
    name: "Bader Eddine Hamidane",
    company: "Baderinfo",
    email: "baderinfo12@gmail.com",
    phone: "0550896115",
    phoneIntl: "+213550896115",
    // digits only, country code first: used for wa.me links (the phone number is also the WhatsApp number)
    whatsapp: "213550896115",
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
