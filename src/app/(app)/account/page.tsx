import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DisplayNameForm } from "@/components/AccountForms";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">Account</h1>
          <p className="lede">Signed in as {viewer.email}.</p>
        </div>
      </div>

      <section className="section" aria-labelledby="name-h">
        <div className="section-head">
          <h2 id="name-h" className="section-title">
            Display name
          </h2>
        </div>
        <DisplayNameForm current={viewer.display_name} />
      </section>

      <section className="section" aria-labelledby="pw-h">
        <div className="section-head">
          <h2 id="pw-h" className="section-title">
            Password
          </h2>
        </div>
        <p className="muted" style={{ marginBottom: "var(--s-4)" }}>
          Choose a new password while you&rsquo;re signed in. Your email address can&rsquo;t be changed; it&rsquo;s tied to
          your ITSC account.
        </p>
        <Link href="/update-password" className="btn">
          Change password
        </Link>
      </section>

      <section className="section" aria-labelledby="out-h">
        <div className="section-head">
          <h2 id="out-h" className="section-title">
            Sign out
          </h2>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn--quiet">
            Sign out of this device
          </button>
        </form>
      </section>
    </main>
  );
}
