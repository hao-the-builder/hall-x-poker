import Link from "next/link";
import { Suit } from "@/components/Suit";
import { SITE_NAME } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <Link href="/" className="auth__mark" aria-label={`${SITE_NAME} home`}>
        <Suit kind="spade" />
        <span>{SITE_NAME}</span>
      </Link>
      {children}
    </main>
  );
}
