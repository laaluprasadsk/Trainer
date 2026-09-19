"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { money, Notice, request } from "../ui/marketplace";
import { pricing } from "@/lib/booking-domain";
type Options = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  handler: (r: Record<string, string>) => void;
  modal: { ondismiss: () => void };
};
type PaymentFailure = {
  error?: { description?: string };
};
type RazorpayCheckout = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: PaymentFailure) => void,
  ) => void;
};
declare global {
  interface Window {
    Razorpay: new (options: Options) => RazorpayCheckout;
  }
}
export function SlotBookingWidget({
  trainerName,
  hourlyRate,
  slots,
  modes,
  commissionBps,
}: {
  trainerId: string;
  trainerName: string;
  hourlyRate: number;
  slots: { id: string; date: string; startTime: string; endTime: string }[];
  modes: string[];
  commissionBps: number;
}) {
  const dates = [...new Set(slots.map((s) => s.date))];
  const [date, setDate] = useState(dates[0] || "");
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState(modes[0] || "");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const slot = slots.find((s) => s.id === selected);
  const quote = slot
    ? pricing(hourlyRate, slot.startTime, slot.endTime, commissionBps)
    : null;
  const durationMinutes = slot
    ? Number(slot.endTime.slice(0, 2)) * 60 +
      Number(slot.endTime.slice(3, 5)) -
      (Number(slot.startTime.slice(0, 2)) * 60 +
        Number(slot.startTime.slice(3, 5)))
    : 0;
  async function checkout() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const order = await request<{
        bookingId: string;
        key: string;
        orderId: string;
        amount: number;
        currency: string;
      }>("/api/bookings/checkout", "POST", {
        slotId: selected,
        locationType: mode,
        addressText: address,
      });
      if (!window.Razorpay)
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(
              new Error(
                "Payment window could not load. Check your connection and retry.",
              ),
            );
          document.body.appendChild(script);
        });
      const razorpay = new window.Razorpay({
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Trainrr",
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage(
              "Checkout closed. Your reservation expires after 10 minutes.",
            );
          },
        },
        handler: async (result) => {
          try {
            const data = await request<{ booking: { status: string } }>(
              "/api/bookings/verify",
              "POST",
              result,
            );
            setMessage(
              data.booking.status === "CONFIRMED"
                ? "Your session is confirmed. View it in My dashboard."
                : "Payment received; your booking needs refund review. See your dashboard.",
            );
            if (data.booking.status === "CONFIRMED")
              router.push(`/bookings/${order.bookingId}?confirmed=1`);
            else router.push(`/bookings/${order.bookingId}`);
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Payment verification pending. Check your bookings before retrying.",
            );
          } finally {
            setBusy(false);
          }
        },
      });
      razorpay.on("payment.failed", (response) => {
        setBusy(false);
        setMessage("");
        setError(
          response.error?.description ||
            "Payment failed. Retry before your reservation expires.",
        );
      });
      razorpay.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  }
  return (
    <section className="panel space-y-5">
      <div>
        <p className="eyebrow">MAKE IT HAPPEN</p>
        <h2 className="text-xl font-bold">Book with {trainerName}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {money(hourlyRate)} / hour · Asia/Kolkata
        </p>
      </div>
      <Notice error={error} message={message} />
      {!slots.length ? (
        <p>No future slots published. Please check back later.</p>
      ) : (
        <>
          <label className="field">
            Choose a date
            <select
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelected("");
              }}
            >
              {dates.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {slots
              .filter((s) => s.date === date)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  aria-pressed={selected === s.id}
                  className={selected === s.id ? "button" : "nav-pill"}
                >
                  {s.startTime}–{s.endTime}
                </button>
              ))}
          </div>
          <label className="field">
            Training method
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {modes.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          {mode !== "ONLINE" && (
            <label className="field">
              Session address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={500}
              />
            </label>
          )}
          <div className="border-t pt-4 flex justify-between font-bold">
            <span>Final total</span>
            <span>{quote ? money(quote.totalAmount) : "Select a slot"}</span>
          </div>
          {slot && quote && (
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-600">
              <dt>Date and time</dt>
              <dd className="text-right">
                {slot.date}, {slot.startTime}–{slot.endTime} IST
              </dd>
              <dt>Duration</dt>
              <dd className="text-right">{durationMinutes} minutes</dd>
              <dt>Method / venue</dt>
              <dd className="text-right">{mode.replaceAll("_", " ")}</dd>
              <dt>Trainer session price</dt>
              <dd className="text-right">{money(quote.totalAmount)}</dd>
              <dt>Platform fee component</dt>
              <dd className="text-right">
                {money(quote.platformFee)} included
              </dd>
              <dt>Discount</dt>
              <dd className="text-right">{money(0)}</dd>
              <dt>Tax</dt>
              <dd className="text-right">No separate charge</dd>
            </dl>
          )}
          <p className="text-xs text-slate-500">
            Price includes the platform commission. A reservation lasts 10
            minutes. Cancellation requires 24 hours notice. Read the{" "}
            <Link className="underline" href="/cancellation-refunds">
              cancellation and refund policy
            </Link>
            .
          </p>
          <button
            disabled={busy || isLoading || !selected || !mode}
            onClick={checkout}
            className="button w-full"
          >
            {busy ? "Payment in progress…" : "Review & pay securely"}
          </button>
        </>
      )}
    </section>
  );
}
