import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { Suit } from "@/components/Suit";
import { SITE_NAME } from "@/lib/site";
import type { Viewer } from "@/lib/types";

export function Nav({ viewer }: { viewer: Viewer }) {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/leaderboard" className="wordmark" aria-label={`${SITE_NAME} home`}>
          <Suit kind="spade" />
          {SITE_NAME}
        </Link>
        <NavLinks />
        <div className="nav__user">
          <Link href="/account" title="Account settings">
            {viewer.display_name}
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn--quiet btn--sm">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
