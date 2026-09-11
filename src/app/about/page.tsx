import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
export default function Page() {
  return (
    <>
      <Navbar />
      <main className="market-shell">
        <section className="panel max-w-3xl mx-auto py-12">
          <p className="eyebrow">TRAINRR</p>
          <h1 className="text-4xl font-bold">Training that fits real life.</h1>
          <p className="text-lg leading-8 text-slate-600 my-8">
            Trainrr connects clients with personal trainers whose submitted
            credentials have been reviewed by the platform. Compare experience,
            training methods, prices and real availability before choosing your
            coach.
          </p>
          <Link className="button" href="/trainers">
            Find your trainer
          </Link>
        </section>
      </main>
    </>
  );
}
