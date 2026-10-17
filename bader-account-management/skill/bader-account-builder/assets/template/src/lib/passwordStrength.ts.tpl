export type StrengthLevel = "weak" | "medium" | "strong" | "veryStrong";

/** Returns a LEVEL key (translate it in the UI: t(`strength.${level}`)), never a hard-coded label. */
export function checkPasswordStrength(password: string): { score: number; level: StrengthLevel; color: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, level: "weak", color: "red" };
  if (score <= 4) return { score, level: "medium", color: "orange" };
  if (score <= 5) return { score, level: "strong", color: "yellow" };
  return { score, level: "veryStrong", color: "green" };
}

export function isPasswordOld(updatedAt: string, days = 180): boolean {
  const age = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return age > days;
}

/** password -> how many records use it */
export function findDuplicates(items: { password?: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  items.forEach((it) => {
    if (it.password) counts.set(it.password, (counts.get(it.password) || 0) + 1);
  });
  return counts;
}
