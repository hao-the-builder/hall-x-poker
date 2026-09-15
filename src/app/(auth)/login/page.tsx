import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="auth__title">Sign in</h1>
      <p className="auth__text">Welcome back. The table&rsquo;s waiting.</p>
      <LoginForm next={next} linkError={error === "link"} />
      <p className="auth__foot">
        New here? <Link href="/signup">Create an account</Link>.
      </p>
    </>
  );
}
