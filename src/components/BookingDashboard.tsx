"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  Shell,
  Empty,
  Metrics,
  Notice,
  money,
  request,
  useResource,
} from "./ui/marketplace";
type Booking = {
  id: string;
  status: string;
  locationType: string;
  totalAmount: string;
  trainerPayout: string;
  createdAt: string;
  expiresAt: string | null;
  slot: { slotDate: string; startTime: string; endTime: string };
  trainer: { id: string; firstName: string; lastName: string; slug: string };
  client: { firstName: string; lastName: string };
  payment: null | {
    status: string;
    gatewayPaymentId: string | null;
    gatewayOrderId: string;
  };
  review: null | { rating: number };
};
export function BookingDashboard({ trainer = false }: { trainer?: boolean }) {
  const { data, error, loading, reload } = useResource<{
    bookings: Booking[];
    overview: Record<string, string | number>;
  }>("/api/bookings");
  const notifications = useResource<{
    notifications: {
      id: string;
      message: string;
      href: string | null;
      read: boolean;
      createdAt: string;
    }[];
  }>("/api/notifications");
  const [tab, setTab] = useState("Upcoming");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [cancel, setCancel] = useState("");
  const [review, setReview] = useState("");
  const [reschedule, setReschedule] = useState("");
  const [replacement, setReplacement] = useState("");
  const [replacementSlots, setReplacementSlots] = useState<
    { id: string; date: string; startTime: string; endTime: string }[]
  >([]);
  const rows = data?.bookings || [];
  const cancelled = (b: Booking) =>
    b.status.startsWith("CANCELLED") ||
    (b.status === "PENDING_PAYMENT" &&
      !!b.expiresAt &&
      new Date(b.expiresAt) < new Date());
  const filtered = rows.filter((b) =>
    tab === "Payments"
      ? !!b.payment
      : tab === "Completed"
        ? b.status === "COMPLETED"
        : tab === "Cancelled"
          ? cancelled(b)
          : !cancelled(b) && b.status !== "COMPLETED",
  );
  async function action(id: string, action: string, details?: object) {
    setBusy(id);
    setActionError("");
    try {
      await request("/api/bookings", "PATCH", { id, action, ...details });
      setMessage(
        action === "COMPLETE"
          ? "Session completed."
          : action === "RESCHEDULE"
            ? "Booking rescheduled."
            : "Booking cancelled.",
      );
      setCancel("");
      setReschedule("");
      setReplacement("");
      await reload();
      await notifications.reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy("");
    }
  }
  async function openReschedule(booking: Booking) {
    setBusy(booking.id);
    setActionError("");
    try {
      const result = await request<{
        slots: {
          id: string;
          date: string;
          startTime: string;
          endTime: string;
        }[];
      }>(
        `/api/trainers/availability?trainerId=${encodeURIComponent(booking.trainer.id)}`,
      );
      const duration = (time: string) =>
        Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
      const currentDuration =
        duration(booking.slot.endTime) - duration(booking.slot.startTime);
      setReplacementSlots(
        result.slots.filter(
          (slot) =>
            duration(slot.endTime) - duration(slot.startTime) ===
            currentDuration,
        ),
      );
      setReschedule(booking.id);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to load replacement times.",
      );
    } finally {
      setBusy("");
    }
  }
  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(review);
    try {
      await request("/api/reviews", "POST", {
        ...Object.fromEntries(new FormData(e.currentTarget)),
        bookingId: review,
      });
      setReview("");
      setMessage("Thank you for your review.");
      await reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Unable to submit.");
    } finally {
      setBusy("");
    }
  }
  async function markNotificationsRead(id?: string) {
    const previous = notifications.data;
    notifications.setData((current) =>
      current
        ? {
            notifications: current.notifications.map((notification) =>
              !id || notification.id === id
                ? { ...notification, read: true }
                : notification,
            ),
          }
        : current,
    );
    try {
      await request("/api/notifications", "PATCH", id ? { id } : {});
    } catch (error) {
      notifications.setData(previous);
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update notifications.",
      );
    }
  }
  return (
    <Shell
      title={
        trainer
          ? "Your coaching, in motion."
          : "Make progress, one session at a time."
      }
      subtitle="Manage your sessions and payment history. All session times are Asia/Kolkata."
    >
      <Notice error={error || actionError} message={message} />
      <Metrics items={data?.overview || {}} />
      {trainer && (
        <div className="panel mb-6">
          <Link className="button" href="/dashboard/profile">
            Complete profile & view verification status
          </Link>
          <Link className="nav-pill ml-2 inline-block" href="/schedule">
            Publish availability
          </Link>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-6" role="tablist">
        {["Upcoming", "Completed", "Cancelled", "Payments"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "button" : "nav-pill"}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <Empty>Loading sessions…</Empty>
      ) : !filtered.length ? (
        <Empty>
          No {tab.toLowerCase()} yet.{" "}
          {!trainer && (
            <Link href="/trainers" className="text-emerald-700 underline">
              Find your trainer
            </Link>
          )}
        </Empty>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <article className="panel" key={b.id}>
              <div className="flex flex-col sm:flex-row justify-between gap-5">
                <div>
                  <span className="badge">
                    {cancelled(b)
                      ? "CANCELLED / EXPIRED"
                      : b.status.replaceAll("_", " ")}
                  </span>
                  <h2 className="text-xl font-bold mt-3">
                    {trainer
                      ? `${b.client.firstName} ${b.client.lastName}`
                      : `${b.trainer.firstName} ${b.trainer.lastName}`}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2">
                    {b.slot.slotDate.slice(0, 10)} · {b.slot.startTime}–
                    {b.slot.endTime} IST
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {b.locationType.replaceAll("_", " ")} ·{" "}
                    {money(b.totalAmount)}
                  </p>
                  <p className="text-xs text-slate-500 break-all mt-2">
                    Booking {b.id}
                  </p>
                  {!trainer && (
                    <Link
                      className="mt-2 inline-block text-sm text-emerald-700 underline"
                      href={`/bookings/${b.id}`}
                    >
                      View booking details
                    </Link>
                  )}
                  <p className="text-xs text-slate-500 break-all mt-2">
                    Payment:{" "}
                    {b.payment?.status.replaceAll("_", " ") || "Not initiated"}
                    {b.payment?.gatewayPaymentId
                      ? ` · ${b.payment.gatewayPaymentId}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3">
                  {!cancelled(b) &&
                    ["CONFIRMED", "PENDING_PAYMENT"].includes(b.status) && (
                      <button
                        className="nav-pill"
                        onClick={() => setCancel(b.id)}
                      >
                        Cancel session
                      </button>
                    )}
                  {trainer && b.status === "CONFIRMED" && (
                    <button
                      disabled={busy === b.id}
                      className="button"
                      onClick={() => action(b.id, "COMPLETE")}
                    >
                      Mark completed
                    </button>
                  )}
                  {!trainer && b.status === "CONFIRMED" && (
                    <button
                      disabled={busy === b.id}
                      className="nav-pill"
                      onClick={() => openReschedule(b)}
                    >
                      Reschedule
                    </button>
                  )}
                  {!trainer && b.status === "COMPLETED" && !b.review && (
                    <button className="button" onClick={() => setReview(b.id)}>
                      Leave a review
                    </button>
                  )}
                  {b.review && <span>★ {b.review.rating}/5</span>}
                  {!trainer &&
                    b.status === "PENDING_PAYMENT" &&
                    !cancelled(b) && (
                      <Link
                        className="button"
                        href={`/trainers/${b.trainer.slug}`}
                      >
                        Continue payment
                      </Link>
                    )}
                </div>
              </div>
              {cancel === b.id && (
                <div className="mt-5 border-t pt-4">
                  <p className="text-sm mb-3">
                    Cancel this session? Clients need 24 hours notice for
                    confirmed sessions. Captured payments enter refund review.
                  </p>
                  <button
                    disabled={busy === b.id}
                    className="button"
                    onClick={() => action(b.id, "CANCEL")}
                  >
                    Confirm cancellation
                  </button>
                  <button
                    className="nav-pill ml-2"
                    onClick={() => setCancel("")}
                  >
                    Keep session
                  </button>
                </div>
              )}
              {review === b.id && (
                <form onSubmit={submitReview} className="mt-5 grid gap-4">
                  <label className="field">
                    Rating
                    <select name="rating">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} stars
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Your experience
                    <textarea name="comment" maxLength={2000} />
                  </label>
                  <button disabled={busy === b.id} className="button">
                    Submit review
                  </button>
                </form>
              )}
              {reschedule === b.id && (
                <div className="mt-5 border-t pt-4">
                  <p className="mb-3 text-sm">
                    Choose another available time of the same duration.
                    Rescheduling requires at least 24 hours notice.
                  </p>
                  {replacementSlots.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {replacementSlots.map((slot) => (
                        <button
                          key={slot.id}
                          className={
                            replacement === slot.id ? "button" : "nav-pill"
                          }
                          aria-pressed={replacement === slot.id}
                          onClick={() => setReplacement(slot.id)}
                        >
                          {slot.date} · {slot.startTime}–{slot.endTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No replacement times of the same duration are available.
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      className="button"
                      disabled={!replacement || busy === b.id}
                      onClick={() =>
                        action(b.id, "RESCHEDULE", { slotId: replacement })
                      }
                    >
                      Confirm new time
                    </button>
                    <button
                      className="nav-pill"
                      onClick={() => setReschedule("")}
                    >
                      Keep current time
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <section className="panel mt-8">
        <div className="flex justify-between gap-3">
          <h2 className="text-xl font-bold">
            Notifications
            {!!notifications.data?.notifications.filter((item) => !item.read)
              .length && (
              <span className="badge ml-2">
                {
                  notifications.data.notifications.filter((item) => !item.read)
                    .length
                }{" "}
                unread
              </span>
            )}
          </h2>
          <button
            className="text-sm text-emerald-700"
            disabled={
              !notifications.data?.notifications.some((item) => !item.read)
            }
            onClick={() => markNotificationsRead()}
          >
            Mark all read
          </button>
        </div>
        <Notice error={notifications.error} />
        {notifications.data?.notifications.length ? (
          notifications.data.notifications.map((n) => (
            <div
              key={n.id}
              className={`flex flex-col gap-1 border-b py-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between ${n.read ? "text-slate-500" : "font-semibold"}`}
            >
              <div>
                {n.href ? <Link href={n.href}>{n.message}</Link> : n.message}
                <p className="mt-1 text-xs font-normal text-slate-400">
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  }).format(new Date(n.createdAt))}
                </p>
              </div>
              {!n.read && (
                <button
                  className="text-left text-xs text-emerald-700"
                  onClick={() => markNotificationsRead(n.id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 mt-4">You are all caught up.</p>
        )}
      </section>
    </Shell>
  );
}
