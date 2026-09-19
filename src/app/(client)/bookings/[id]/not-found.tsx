import Link from "next/link";

export default function BookingNotFound() {
  return (
    <main className="market-shell max-w-2xl">
      <section className="panel">
        <h1 className="text-3xl font-bold">Booking unavailable</h1>
        <p className="my-5">
          This booking does not exist or is not available to your account.
        </p>
        <Link href="/bookings" className="button">
          Return to my bookings
        </Link>
      </section>
    </main>
  );
}
