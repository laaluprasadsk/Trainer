import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <>
      <Navbar />
      <main className="market-shell max-w-4xl">
        <p className="eyebrow">POLICY INFORMATION</p>
        <h1 className="text-4xl font-bold">{title}</h1>
        <div className="my-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          Pre-launch draft: this copy describes the current product behavior and
          must be reviewed by qualified Indian legal counsel before accepting
          live customer payments.
        </div>
        <p className="mb-8 text-slate-600">{intro}</p>
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="panel">
              <h2 className="mb-3 text-xl font-bold">{section.title}</h2>
              <p className="whitespace-pre-line leading-7 text-slate-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Questions?{" "}
          <Link className="underline" href="/contact">
            Contact Trainrr support
          </Link>
          .
        </p>
      </main>
    </>
  );
}
