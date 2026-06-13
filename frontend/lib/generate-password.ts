/**
 * Generate a strong random temporary password for newly-created accounts.
 *
 * Replaces hardcoded defaults (e.g. "Board@123") that would otherwise give every
 * new privileged account the same publicly-known password. Uses the Web Crypto API
 * and guarantees at least one upper, lower, digit, and symbol so it satisfies common
 * password-strength rules. Surface the result to the creator once; the new user
 * should change it on first login.
 *
 * Excludes visually ambiguous characters (0/O, 1/l/I) so a human can read it aloud.
 */
export function generateTempPassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789";
  const symbol = "!@#$%^&*";
  const all = upper + lower + digit + symbol;

  const len = Math.max(12, length);
  const rnd = new Uint32Array(len);
  crypto.getRandomValues(rnd);

  // Seed one of each class so strength rules always pass.
  const chars: string[] = [
    upper[rnd[0] % upper.length],
    lower[rnd[1] % lower.length],
    digit[rnd[2] % digit.length],
    symbol[rnd[3] % symbol.length],
  ];
  for (let i = 4; i < len; i++) chars.push(all[rnd[i] % all.length]);

  // Cryptographic Fisher–Yates shuffle so the seeded classes aren't positionally fixed.
  const sh = new Uint32Array(chars.length);
  crypto.getRandomValues(sh);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = sh[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
