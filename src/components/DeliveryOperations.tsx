"use client";
import { useState } from "react";
import { Notice, request, useResource } from "@/components/ui/marketplace";
export default function DeliveryOperations() {
  const settings = useResource<{ commissionPercent: number }>(
    "/api/admin/settings",
  );
  const messages = useResource<{
    deliveries: {
      id: string;
      channel: string;
      status: string;
      attempts: number;
      lastError: string | null;
    }[];
  }>("/api/admin/deliveries");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return (
    <section className="my-6 space-y-4 rounded-xl border bg-white p-5">
      <h2 className="text-xl font-semibold">Production operations</h2>
      <Notice
        error={error || settings.error || messages.error}
        message={success}
      />
      <p>
        Current commission:{" "}
        {settings.loading
          ? "Loading…"
          : `${settings.data?.commissionPercent ?? "—"}%`}
        . Applies to new bookings only.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const r = await request<{ message: string }>(
              "/api/admin/settings",
              "PATCH",
              { commissionPercent: Number(value) },
            );
            setSuccess(r.message);
            await settings.reload();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to save.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          New commission %
          <input
            className="ml-2 rounded border p-2"
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <button disabled={busy} className="rounded border p-2">
          Save commission
        </button>
      </form>
      <h3 className="font-semibold">Message delivery</h3>
      <p className="text-sm">
        SENT means accepted by the provider. UNKNOWN requires checking the
        provider delivery report before resending.
      </p>
      <button onClick={() => messages.reload()} className="rounded border p-2">
        Refresh delivery status
      </button>
      {messages.loading ? (
        <p>Loading deliveries…</p>
      ) : !messages.data?.deliveries.length ? (
        <p>No delivery records yet. The scheduled job creates them.</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-auto">
          {messages.data.deliveries.map((d) => (
            <li key={d.id} className="rounded border p-3 text-sm">
              {d.channel} · {d.status} · {d.attempts} attempts
              {d.lastError && <p>{d.lastError}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
