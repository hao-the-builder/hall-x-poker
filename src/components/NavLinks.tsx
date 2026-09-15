"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/rating", label: "How rating works" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="nav__links" aria-label="Primary">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/") || (l.href === "/tournaments" && path.startsWith("/players"));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`nav__link${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
