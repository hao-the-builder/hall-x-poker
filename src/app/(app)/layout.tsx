import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getViewer } from "@/lib/data";
import { isDemo } from "@/lib/demo";

// Everything behind sign-in reads live data; never prerender it.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return (
    <>
      <Nav viewer={viewer} />
      {children}
      <footer className="footer">
        <div className="footer__inner">
          <span>Hall X Poker</span>
          <span>The winner scores one point per player in the field. Rating is average points per match.</span>
          {isDemo() && <span>Preview mode: sample data, changes disabled.</span>}
        </div>
      </footer>
    </>
  );
}
