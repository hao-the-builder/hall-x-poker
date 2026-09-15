import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <p className="auth__mark" aria-hidden="true">
        404
      </p>
      <h1 className="auth__title">Mucked.</h1>
      <p className="auth__text">That page isn&rsquo;t in the deck.</p>
      <Link href="/leaderboard" className="btn">
        Back to the leaderboard
      </Link>
    </main>
  );
}
