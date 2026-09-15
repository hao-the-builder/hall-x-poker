import Link from "next/link";
import { Notice } from "@/components/Notice";
import { Suit } from "@/components/Suit";
import { isConfigured } from "@/lib/data";
import { EMAIL_DOMAIN, SITE_NAME } from "@/lib/site";

export default function Landing() {
  const configured = isConfigured();
  return (
    <main className="hero">
      <div className="hero__suits" aria-hidden="true">
        <Suit kind="spade" />
        <Suit kind="heart" />
        <Suit kind="diamond" />
        <Suit kind="club" />
      </div>
      <h1 className="hero__title">{SITE_NAME}</h1>
      <p className="hero__text">
        Tournament results and ratings for the hall poker circle. Sign in with your @{EMAIL_DOMAIN} address to see the
        leaderboard, join a table, and settle arguments with numbers.
      </p>
      {!configured && (
        <Notice kind="warn">
          The database isn&rsquo;t connected yet. Add the Supabase environment variables described in{" "}
          <code>docs/SETUP.md</code>, or run the preview with <code>NEXT_PUBLIC_DEMO=1</code>.
        </Notice>
      )}
      <div className="row">
        <Link href="/login" className="btn btn--primary">
          Sign in
        </Link>
        <Link href="/signup" className="btn">
          Create an account
        </Link>
      </div>
    </main>
  );
}
