import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
export default function Page() {
  return (
    <>
      <Navbar />
      <main className="market-shell">
        <section className="panel max-w-3xl mx-auto py-12">
          <p className="eyebrow">TRAINRR</p>
          <h1 className="text-4xl font-bold">
            A better routine, in three steps.
          </h1>
          <p className="text-lg leading-8 text-slate-600 my-8">
            1. Explore verified trainers and choose the right expertise for your
            goals. 2. Pick an available session in Asia/Kolkata time and pay
            securely through Razorpay. 3. Receive confirmation, manage your
            booking, and leave a review after your completed session. Clients
            can cancel confirmed sessions at least 24 hours before the start;
            captured payments enter refund review.
          </p>
          <Link className="button" href="/trainers">
            Find your trainer
          </Link>
        </section>
      </main>
    </>
  );
}
