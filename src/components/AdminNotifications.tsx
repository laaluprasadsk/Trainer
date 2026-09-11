"use client";
import { useState } from "react";
import { useResource, request, Notice } from "./ui/marketplace";
export function AdminNotifications() {
  const { data, error, reload } = useResource<{
    notifications: { id: string; message: string; read: boolean }[];
  }>("/api/notifications");
  const [failure, setFailure] = useState("");
  return (
    <section className="panel mb-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="font-bold">Notifications & support</h2>
        <button
          className="text-emerald-700 text-sm"
          onClick={async () => {
            try {
              await request("/api/notifications", "PATCH");
              await reload();
            } catch (e) {
              setFailure(e instanceof Error ? e.message : "Unable to update.");
            }
          }}
        >
          Mark all read
        </button>
      </div>
      <Notice error={failure || error} />
      {data?.notifications
        .filter((n) => !n.read)
        .map((n) => (
          <p className="text-sm border-t pt-3 mt-3 break-words" key={n.id}>
            {n.message}
          </p>
        ))}
    </section>
  );
}
