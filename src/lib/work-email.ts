/**
 * Work-email enforcement for signup.
 * Small, explicit blocklist of free / disposable mailbox providers.
 * This is a heuristic — it is not a claim that everything else is a verified
 * corporate domain.
 */
export const BLOCKED_EMAIL_DOMAINS = [
  // free consumer providers
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mail.com",
  "gmx.com",
  "gmx.de",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "protonmail.com",
  "proton.me",
  "rediffmail.com",
  // disposable / throwaway
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "fakeinbox.com",
  "throwawaymail.com",
  "maildrop.cc",
] as const;

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export type WorkEmailCheck = { ok: true; domain: string } | { ok: false; reason: string };

export function checkWorkEmail(email: string): WorkEmailCheck {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return { ok: false, reason: "Enter a valid email address." };
  }
  const domain = emailDomain(value);
  if (BLOCKED_EMAIL_DOMAINS.includes(domain as (typeof BLOCKED_EMAIL_DOMAINS)[number])) {
    return {
      ok: false,
      reason: `${domain} is a free or disposable mailbox. Please sign up with your work email.`,
    };
  }
  return { ok: true, domain };
}
