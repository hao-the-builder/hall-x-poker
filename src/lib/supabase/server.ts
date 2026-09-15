import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || isPlaceholder(url) || isPlaceholder(key)) {
    throw new Error(
      "Supabase is not configured. Put your real project URL and anon key in .env.local (see docs/SETUP.md).",
    );
  }
  return { url, key };
}

/** True while .env.local still holds the sample values from .env.example. */
export function isPlaceholder(value: string | undefined): boolean {
  return !value || /YOUR-PROJECT|YOUR-ANON|example\.supabase/i.test(value);
}

export async function createClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the middleware refreshes sessions instead.
        }
      },
    },
  });
}
