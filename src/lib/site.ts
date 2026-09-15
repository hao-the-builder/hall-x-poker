export const SITE_NAME = "Hall X Poker";
export const EMAIL_DOMAIN = "connect.ust.hk";
export const EMAIL_RE = /^[a-z0-9._%+-]+@connect\.ust\.hk$/i;

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isUstEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export const ASSOCIATION_NAME = "Hall X Student Poker Association";
