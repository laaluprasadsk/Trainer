"use client";
import DeliveryOperations from "@/components/DeliveryOperations";
import { AdminNotifications } from "@/components/AdminNotifications";
import { useState } from "react";
import {
  Shell,
  Metrics,
  Empty,
  Notice,
  money,
  request,
  useResource,
} from "@/components/ui/marketplace";
type Person = {
  id: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  clientProfile: null | {
    firstName: string;
    lastName: string;
    defaultLocationName: string;
    fitnessGoals: string[];
  };
  trainerProfile: null | {
    firstName: string;
    lastName: string;
    bio: string;
    homeLocationName: string;
    yearsExperience: number;
    hourlyRate: string;
    verificationStatus: string;
    certifications: {
      id: string;
      title: string;
      issuingOrganization: string;
      documentUrl: string;
      status: string;
    }[];
  };
};
type Booking = {
  id: string;
  client: { firstName: string; lastName: string };
  trainer: { firstName: string; lastName: string };
  status: string;
  slot: { slotDate: string; startTime: string };
  payment: null | {
    status: string;
    grossAmount: string;
    platformFee: string;
    trainerAmount: string;
    gatewayPaymentId: string | null;
  };
  totalAmount: string;
};
export default function Page() {
  const { data, error, loading, reload } = useResource<{
    overview: Record<string, number>;
    users: Person[];
    bookings: Booking[];
  }>("/api/admin");
  const [tab, setTab] = useState("Trainers");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState("");
  async function act(id: string, action: string) {
    setBusy(id);
    try {
      await request("/api/admin", "POST", { id, action, note });
      await reload();
      setFailure("");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy("");
    }
  }
  const users = data?.users || [];
  const bookings = data?.bookings || [];
  const matches = (v: unknown) =>
    JSON.stringify(v).toLowerCase().includes(query.toLowerCase());
  return (
    <Shell
      title="Platform operations"
      subtitle="Review credentials, manage accounts and inspect booking transactions."
    >
      <Notice error={error || failure} />
      <Metrics items={data?.overview || {}} />
      <AdminNotifications />
      <DeliveryOperations />
      <div className="flex flex-wrap gap-2 mb-5">
        {["Trainers", "Clients", "Bookings", "Payments"].map((t) => (
          <button
            className={tab === t ? "button" : "nav-pill"}
            key={t}
            onClick={() => {
              setTab(t);
              setStatus("");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="panel grid sm:grid-cols-3 gap-4 mb-6">
        <label className="field">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, date or booking ID"
          />
        </label>
        <label className="field">
          Status filter
          <input
            value={status}
            onChange={(e) => setStatus(e.target.value.toUpperCase())}
            placeholder="PENDING, CONFIRMED…"
          />
        </label>
        <label className="field">
          Admin review note
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </label>
      </div>
      {loading ? (
        <Empty>Loading operations…</Empty>
      ) : tab === "Trainers" || tab === "Clients" ? (
        <div className="space-y-4">
          {users
            .filter(
              (u) =>
                u.role === (tab === "Trainers" ? "TRAINER" : "CLIENT") &&
                matches(u) &&
                (!status ||
                  u.status === status ||
                  u.trainerProfile?.verificationStatus === status),
            )
            .map((u) => {
              const p = u.trainerProfile || u.clientProfile;
              return (
                <article className="panel" key={u.id}>
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        {p?.firstName} {p?.lastName}
                      </h2>
                      <p className="text-sm text-slate-500 break-all mt-2">
                        {u.email} · {u.phoneNumber}
                      </p>
                      <span className="badge mt-3">
                        {u.status} {u.trainerProfile?.verificationStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                      {u.trainerProfile && (
                        <>
                          <button
                            disabled={busy === u.id}
                            className="button"
                            onClick={() => act(u.id, "APPROVE")}
                          >
                            Approve
                          </button>
                          <button
                            disabled={busy === u.id}
                            className="nav-pill"
                            onClick={() => act(u.id, "REJECT")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        disabled={busy === u.id}
                        className="nav-pill"
                        onClick={() =>
                          act(
                            u.id,
                            u.status === "SUSPENDED" ? "REACTIVATE" : "SUSPEND",
                          )
                        }
                      >
                        {u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                      </button>
                    </div>
                  </div>
                  {u.trainerProfile && (
                    <>
                      <p className="text-sm mt-4">{u.trainerProfile.bio}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        {u.trainerProfile.homeLocationName} ·{" "}
                        {u.trainerProfile.yearsExperience} years ·{" "}
                        {money(u.trainerProfile.hourlyRate)} / hour
                      </p>
                      <div className="mt-4 space-y-2">
                        {u.trainerProfile.certifications.length ? (
                          u.trainerProfile.certifications.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 border rounded-xl text-sm"
                            >
                              <strong>{c.title}</strong> ·{" "}
                              {c.issuingOrganization} · {c.status}
                              {c.documentUrl.startsWith("/api/uploads/") && (
                                <a
                                  href={c.documentUrl}
                                  className="text-emerald-700 underline ml-3"
                                >
                                  Download credential for review
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-amber-700">
                            No certifications submitted.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  {u.clientProfile && (
                    <p className="mt-4 text-sm">
                      {u.clientProfile.defaultLocationName} · Goals:{" "}
                      {u.clientProfile.fitnessGoals.join(", ") ||
                        "None specified"}
                    </p>
                  )}
                </article>
              );
            })}
          {!users.length && <Empty>No accounts yet.</Empty>}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings
            .filter(
              (b) =>
                matches(b) &&
                (!status ||
                  b.status === status ||
                  b.payment?.status === status) &&
                (tab !== "Payments" || b.payment),
            )
            .map((b) => (
              <article className="panel" key={b.id}>
                <div className="flex flex-wrap justify-between gap-4">
                  <h2 className="font-bold">
                    {b.client.firstName} {b.client.lastName} →{" "}
                    {b.trainer.firstName} {b.trainer.lastName}
                  </h2>
                  <span className="badge">{b.status}</span>
                </div>
                <p className="mt-2 text-sm">
                  {b.slot.slotDate.slice(0, 10)} · {b.slot.startTime} IST ·{" "}
                  {money(b.totalAmount)}
                </p>
                <p className="text-xs text-slate-500 mt-2 break-all">{b.id}</p>
                {b.payment && (
                  <div className="text-sm mt-3">
                    <p>
                      {b.payment.status} · Gross {money(b.payment.grossAmount)}{" "}
                      · Fee {money(b.payment.platformFee)} · Trainer{" "}
                      {money(b.payment.trainerAmount)}
                    </p>
                    <p className="text-xs mt-2 break-all">
                      {b.payment.gatewayPaymentId || "Payment not completed"}
                    </p>
                    {b.payment.status === "REFUND_PENDING" && (
                      <p className="text-amber-800 mt-2">
                        Issue a full refund in the Razorpay dashboard. The
                        verified refund webhook updates this record.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          {!bookings.length && <Empty>No bookings yet.</Empty>}
        </div>
      )}
    </Shell>
  );
}
