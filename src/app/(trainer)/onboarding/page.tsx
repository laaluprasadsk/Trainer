import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Page() {
  const user = await currentUser();
  if (user?.role === "TRAINER") redirect("/dashboard/profile");
  return (
    <>
      <Navbar />
      <main className="market-shell">
        <section className="panel max-w-3xl mx-auto py-12">
          <p className="eyebrow">BUILD YOUR COACHING BUSINESS</p>
          <h1 className="text-4xl font-bold">
            Your expertise.
            <br />A stronger community.
          </h1>
          <p className="text-slate-600 my-6">
            Create a trainer account, complete your public profile, and submit
            your certifications for admin review. Only approved trainers appear
            in the marketplace.
          </p>
          <ol className="space-y-4 mb-8">
            <li>
              01 · Create your account and select “Offer personal training”.
            </li>
            <li>
              02 · Add your experience, pricing, methods and credential
              documents.
            </li>
            <li>
              03 · Publish your schedule and receive bookings after approval.
            </li>
          </ol>
          <Link className="button" href="/register">
            Create trainer account
          </Link>
          <p className="text-sm text-slate-500 mt-5">
            The platform commission is included in session prices. Earnings
            depend on your bookings; payouts require platform settlement.
          </p>
        </section>
      </main>
    </>
  );
}
