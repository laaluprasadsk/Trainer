import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export default function TrainerNotFound() {
  return (
    <>
      <Navbar />
      <main className="market-shell max-w-2xl">
        <section className="panel">
          <h1 className="text-3xl font-bold">Trainer profile unavailable</h1>
          <p className="my-5">
            This trainer may not be published, may no longer be accepting
            bookings, or the profile address may be incorrect.
          </p>
          <Link href="/trainers" className="button">
            Browse published trainers
          </Link>
        </section>
      </main>
    </>
  );
}
