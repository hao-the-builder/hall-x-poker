import type { Metadata } from "next";
import { TournamentForm } from "@/components/TournamentForm";
import { toLocalInput } from "@/lib/format";

export const metadata: Metadata = { title: "New tournament" };

export default function NewTournamentPage() {
  // Default to the next round hour, Hong Kong time.
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">New tournament</h1>
          <p className="lede">Open a table. Members sign themselves up, and you enter the finishing order afterwards.</p>
        </div>
      </div>
      <TournamentForm mode="create" defaultWhen={toLocalInput(next.toISOString())} />
    </main>
  );
}
