import type { Metadata } from "next";
import Link from "next/link";
import { PasswordForm } from "@/components/AccountForms";

export const metadata: Metadata = { title: "Change password" };

export default function UpdatePasswordPage() {
  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ marginBottom: "var(--s-2)" }}>
            <Link href="/account">Account</Link>
          </p>
          <h1 className="page-title">Choose a new password</h1>
        </div>
      </div>
      <PasswordForm />
    </main>
  );
}
