import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TournamentForm } from "@/components/TournamentForm";
import { getTournament, getViewer } from "@/lib/data";
import { toLocalInput } from "@/lib/format";

export const metadata: Metadata = { title: "Edit tournament" };

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [viewer, t] = await Promise.all([getViewer(), getTournament(id)]);
  if (!t) notFound();
  if (viewer?.id !== t.host_id || t.status !== "open") redirect(`/tournaments/${id}`);

  return (
    <main className="page page--narrow">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ marginBottom: "var(--s-2)" }}>
            <Link href={`/tournaments/${id}`}>{t.name}</Link>
          </p>
          <h1 className="page-title">Edit tournament</h1>
        </div>
      </div>
      <TournamentForm
        mode="edit"
        id={id}
        initial={{
          name: t.name,
          scheduled_at_local: toLocalInput(t.scheduled_at),
          max_players: t.max_players,
          seated: t.seats.length,
        }}
      />
    </main>
  );
}
