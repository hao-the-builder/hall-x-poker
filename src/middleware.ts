import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { isDemo } from "@/lib/demo";

const PUBLIC_PREFIXES = ["/login", "/signup", "/auth"];

function isPublicPath(path: string) {
  return path === "/" || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isDemo()) {
    // Preview mode: no database, a sample member is always "signed in".
    if (path === "/" || path === "/login" || path === "/signup") {
      return NextResponse.redirect(new URL("/leaderboard", request.url));
    }
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || /YOUR-PROJECT|YOUR-ANON/i.test(url + key)) {
    // Not configured yet (or still the .env.example placeholders): let the
    // public pages render their own explanation.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not put logic between createServerClient and getUser: it refreshes the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(path)) {
    const login = new URL("/login", request.url);
    if (path !== "/leaderboard") login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (user && (path === "/" || path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/leaderboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
