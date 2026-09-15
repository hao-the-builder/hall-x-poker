import type { NextConfig } from "next";

/**
 * Hosting dashboards (e.g. Vercel) warn about NEXT_PUBLIC_* variables, so the
 * deployed site can use plain names instead:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL
 * They are copied into the NEXT_PUBLIC_* names at build time, which is what the
 * code reads. Existing NEXT_PUBLIC_* values (e.g. in .env.local) still win.
 * These values are public by design: the anon key is guarded by row-level
 * security. Never put the Supabase service_role key here.
 */
const pick = (...names: string[]) => names.map((n) => process.env[n]).find((v) => v && v.trim()) ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: pick("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"),
    NEXT_PUBLIC_SITE_URL: pick("NEXT_PUBLIC_SITE_URL", "SITE_URL"),
  },
};

export default nextConfig;
