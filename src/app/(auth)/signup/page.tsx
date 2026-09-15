import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="auth__title">Take a seat</h1>
      <p className="auth__text">Use your ITSC email and pick a password. You&rsquo;re in straight away.</p>
      <SignupForm />
      <p className="auth__foot">
        Already have an account? <Link href="/login">Sign in</Link>.
      </p>
    </>
  );
}
