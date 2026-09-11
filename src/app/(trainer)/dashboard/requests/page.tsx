"use client";
import { FormEvent, useState } from "react";
import {
  Shell,
  Notice,
  Empty,
  request,
  useResource,
} from "@/components/ui/marketplace";
type Entry = {
  client: { id: string; name: string };
  pastSessionCount: number;
  upcomingSessionCount: number;
  note: null | { content: string; targetWeights: string; injuryNotes: string };
};
export default function Page() {
  const { data, error, loading, reload } = useResource<{
    data: { roster: Entry[] };
  }>("/api/trainer/requests");
  const [editing, setEditing] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await request("/api/trainer/requests", "POST", {
        ...Object.fromEntries(new FormData(e.currentTarget)),
        action: "SAVE_NOTE",
        clientId: editing,
      });
      setEditing("");
      await reload();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Your clients"
      subtitle="Private coaching notes for clients with confirmed or completed sessions."
    >
      <Notice error={error || failure} />
      {loading ? (
        <Empty>Loading your clients…</Empty>
      ) : data?.data.roster.length ? (
        <div className="grid md:grid-cols-2 gap-5">
          {data.data.roster.map((r) => (
            <article className="panel" key={r.client.id}>
              <h2 className="text-xl font-bold">{r.client.name}</h2>
              <p className="text-sm text-slate-500 mt-2">
                {r.pastSessionCount} completed · {r.upcomingSessionCount}{" "}
                upcoming
              </p>
              {editing === r.client.id ? (
                <form onSubmit={save} className="space-y-4 mt-4">
                  {[
                    ["content", "Coaching notes"],
                    ["targetWeights", "Training targets"],
                    ["injuryNotes", "Injury considerations"],
                  ].map(([key, label]) => (
                    <label className="field" key={key}>
                      {label}
                      <textarea
                        name={key}
                        maxLength={2000}
                        defaultValue={r.note?.[key as "content"] || ""}
                      />
                    </label>
                  ))}
                  <button className="button" disabled={busy}>
                    Save notes
                  </button>
                  <button
                    type="button"
                    className="nav-pill ml-2"
                    onClick={() => setEditing("")}
                  >
                    Close
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-sm mt-4 whitespace-pre-wrap">
                    {r.note?.content || "No coaching notes yet."}
                  </p>
                  <button
                    className="nav-pill mt-4"
                    onClick={() => setEditing(r.client.id)}
                  >
                    Edit notes
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty>
          Your client roster appears after your first confirmed booking.
        </Empty>
      )}
    </Shell>
  );
}
