export function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "ضعيفة", color: "red" };
  if (score <= 4) return { score, label: "متوسطة", color: "orange" };
  if (score <= 5) return { score, label: "قوية", color: "yellow" };
  return { score, label: "قوية جداً", color: "green" };
}

export function isPasswordOld(createdAt: string): boolean {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 180;
}

export function findDuplicates(accounts: any[]): Map<string, number> {
  const counts = new Map<string, number>();
  accounts.forEach((acc) => {
    if (acc.password) {
      counts.set(acc.password, (counts.get(acc.password) || 0) + 1);
    }
  });
  return counts;
}