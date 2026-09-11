"use client";
import { FormEvent, useState } from "react";
import {
  Shell,
  Notice,
  Empty,
  useResource,
  request,
} from "@/components/ui/marketplace";
type Slot = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
};
export default function Page() {
  const { data, error, loading, reload } = useResource<{ slots: Slot[] }>(
    "/api/trainers/slots",
  );
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    const f = new FormData(e.currentTarget);
    try {
      const start = String(f.get("date"));
      const weeks = Number(f.get("weeks"));
      const duration = Number(f.get("duration"));
      const a = String(f.get("start")).split(":").map(Number);
      const z = String(f.get("end")).split(":").map(Number);
      const slots = [];
      for (let week = 0; week < weeks; week++) {
        const date = new Date(`${start}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + week * 7);
        const format = (n: number) =>
          `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
        for (
          let min = a[0] * 60 + a[1];
          min + duration <= z[0] * 60 + z[1];
          min += duration
        )
          slots.push({
            slotDate: date.toISOString().slice(0, 10),
            startTime: format(min),
            endTime: format(min + duration),
          });
      }
      await request("/api/trainers/slots", "POST", { slots });
      setMessage(
        `${slots.length} slots published. Add another window for breaks or split shifts.`,
      );
      await reload();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to publish.");
    } finally {
      setBusy(false);
    }
  }
  async function block(id: string, remove = false) {
    setBusy(true);
    try {
      await request(
        remove ? `/api/trainers/slots?id=${id}` : "/api/trainers/slots",
        remove ? "DELETE" : "PATCH",
        remove ? undefined : { id },
      );
      await reload();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Make time for your clients."
      subtitle="Publish a custom day or repeat a weekly window. All times are Asia/Kolkata (UTC+05:30)."
    >
      <Notice error={failure || error} message={message} />
      <form
        onSubmit={save}
        className="panel grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      >
        <label className="field">
          First date
          <input type="date" name="date" required />
        </label>
        <label className="field">
          From
          <input type="time" name="start" required />
        </label>
        <label className="field">
          Until
          <input type="time" name="end" required />
        </label>
        <label className="field">
          Session duration
          <select name="duration">
            <option value="60">60 minutes</option>
            <option value="30">30 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </label>
        <label className="field">
          Repeat weekly
          <select name="weeks">
            <option value="1">Just this date</option>
            <option value="4">4 weeks</option>
            <option value="8">8 weeks</option>
            <option value="12">12 weeks</option>
          </select>
        </label>
        <button disabled={busy} className="button self-end">
          Publish slots
        </button>
        <p className="text-sm text-slate-500 sm:col-span-2">
          Add separate windows for morning and evening. Block individual slots
          for breaks or unavailable days. Reserved slots cannot be edited.
        </p>
      </form>
      {loading ? (
        <Empty>Loading availability…</Empty>
      ) : data?.slots.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.slots.map((s) => (
            <article className="panel" key={s.id}>
              <p className="font-bold">{s.slotDate.slice(0, 10)}</p>
              <p className="mt-2">
                {s.startTime}–{s.endTime}
              </p>
              <span className="badge mt-3">{s.status}</span>
              {["AVAILABLE", "BLOCKED"].includes(s.status) && (
                <>
                  {" "}
                  <button
                    disabled={busy}
                    className="nav-pill ml-3"
                    onClick={() => block(s.id)}
                  >
                    {s.status === "BLOCKED" ? "Unblock" : "Block"}
                  </button>
                  <button
                    disabled={busy}
                    className="nav-pill mt-3"
                    onClick={() => block(s.id, true)}
                  >
                    Remove
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty>No availability published yet.</Empty>
      )}
    </Shell>
  );
}
