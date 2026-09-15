import Link from "next/link";
import { Notice } from "@/components/Notice";
import { Welcome } from "@/components/Welcome";
import { isConfigured } from "@/lib/data";
import { EMAIL_DOMAIN } from "@/lib/site";

// A new line on every visit.
export const dynamic = "force-dynamic";

export default function Landing() {
  const configured = isConfigured();
  return (
    <main className="hero">
      <Welcome as="h1" />
      <p className="hero__text">
        Tournament results, dealer seats, and ratings for the hall&rsquo;s poker nights. Sign in with your @{EMAIL_DOMAIN}{" "}
        address to see the leaderboard and grab a seat.
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
