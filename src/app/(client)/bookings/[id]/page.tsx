import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotInstant } from "@/lib/booking-domain";
import { PrintReceiptButton } from "@/components/PrintReceiptButton";
import { Navbar } from "@/components/layout/Navbar";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value),
  );

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const user = await currentUser();
  const { id } = await params;
  const booking = user?.clientProfile
    ? await prisma.booking.findFirst({
        where: { id, clientId: user.clientProfile.id },
        include: { slot: true, payment: true, trainer: true },
      })
    : null;
  if (!booking) notFound();
  const query = await searchParams;
  const start = slotInstant(booking.slot.slotDate, booking.slot.startTime);
  const end = slotInstant(booking.slot.slotDate, booking.slot.endTime);
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trainrr//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@yourtrainrr.com`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART:${start
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTEND:${end
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `SUMMARY:Training with ${booking.trainer.firstName} ${booking.trainer.lastName}`,
    `DESCRIPTION:Trainrr booking ${booking.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return (
    <>
      <Navbar />
      <main className="market-shell max-w-3xl">
        {query.confirmed === "1" && booking.status === "CONFIRMED" && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950"
          >
            <h1 className="text-2xl font-bold">Your session is confirmed.</h1>
            <p className="mt-2">
              The trainer has been notified and this slot is no longer available
              to other clients.
            </p>
          </div>
        )}
        <section className="panel">
          <p className="eyebrow">BOOKING DETAILS</p>
          <h1 className="text-3xl font-bold">
            {booking.trainer.firstName} {booking.trainer.lastName}
          </h1>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <dt className="font-semibold">Booking ID</dt>
            <dd className="break-all">{booking.id}</dd>
            <dt className="font-semibold">Status</dt>
            <dd>{booking.status.replaceAll("_", " ")}</dd>
            <dt className="font-semibold">Date</dt>
            <dd>{booking.slot.slotDate.toISOString().slice(0, 10)}</dd>
            <dt className="font-semibold">Time</dt>
            <dd>
              {booking.slot.startTime}–{booking.slot.endTime} Asia/Kolkata
            </dd>
            <dt className="font-semibold">Duration</dt>
            <dd>
              {Math.round((end.getTime() - start.getTime()) / 60000)} minutes
            </dd>
            <dt className="font-semibold">Method / venue</dt>
            <dd>
              {booking.locationType.replaceAll("_", " ")}
              {booking.addressText ? ` · ${booking.addressText}` : ""}
            </dd>
            <dt className="font-semibold">Final price</dt>
            <dd>{money(booking.totalAmount.toString())}</dd>
            <dt className="font-semibold">Payment</dt>
            <dd>
              {booking.payment?.status.replaceAll("_", " ") || "Not initiated"}
            </dd>
            {booking.payment?.gatewayPaymentId && (
              <>
                <dt className="font-semibold">Payment reference</dt>
                <dd className="break-all">
                  {booking.payment.gatewayPaymentId}
                </dd>
              </>
            )}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <Link href="/bookings" className="button">
              My dashboard
            </Link>
            <Link
              href={`/trainers/${booking.trainer.slug}`}
              className="nav-pill"
            >
              Book this trainer again
            </Link>
            <a
              className="nav-pill"
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`}
              download={`trainrr-${booking.id}.ics`}
            >
              Add to calendar
            </a>
            <PrintReceiptButton />
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Cancellation requests are subject to the policy shown before
            checkout.{" "}
            <Link className="underline" href="/cancellation-refunds">
              Review cancellation and refund information
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  );
}
