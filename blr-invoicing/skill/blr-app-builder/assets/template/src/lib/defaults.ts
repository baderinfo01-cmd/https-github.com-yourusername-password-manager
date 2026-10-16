import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  id: "main",
  company: { name: "" },
  currency: { code: "DZD", symbol: "DA", position: "after", decimals: 2 },
  defaultTax: 19,
  autoLockMin: 0,
};
