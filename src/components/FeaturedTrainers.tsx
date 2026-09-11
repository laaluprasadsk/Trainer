"use client";
import Link from "next/link";
import { useResource, money, Notice } from "./ui/marketplace";
export function FeaturedTrainers() {
  const { data, error, loading } = useResource<{
    trainers: {
      id: string;
      slug: string;
      firstName: string;
      lastName: string;
      homeLocationName: string;
      hourlyRate: number;
      specializations: string[];
    }[];
  }>("/api/trainers/search");
  return (
    <section className="max-w-6xl mx-auto w-full px-5 py-16">
      <p className="eyebrow">FIND YOUR FIT</p>
      <h2 className="text-3xl font-bold text-slate-900 mb-6">
        Meet our verified trainers
      </h2>
      <Notice error={error} />
      {loading ? (
        <p className="text-slate-500">Loading trainers…</p>
      ) : data?.trainers.length ? (
        <div className="grid md:grid-cols-3 gap-5">
          {data.trainers.slice(0, 3).map((t) => (
            <Link
              className="panel block hover:border-emerald-500"
              href={`/trainers/${t.slug}`}
              key={t.id}
            >
              <span className="badge">✓ VERIFIED</span>
              <h3 className="font-bold text-xl mt-4">
                {t.firstName} {t.lastName}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {t.homeLocationName}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {t.specializations.join(" · ")}
              </p>
              <p className="font-bold text-emerald-800 mt-5">
                {money(t.hourlyRate)} / hour →
              </p>
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <p className="panel text-slate-600">
            Our trainer community is growing. Check back as new coaches complete
            verification.
          </p>
        )
      )}
      <div className="flex flex-wrap gap-3 mt-7">
        {[
          "Strength & Conditioning",
          "Hypertrophy",
          "Fat Loss",
          "Calisthenics",
          "Post-Rehab",
          "Yoga",
        ].map((s) => (
          <Link
            className="nav-pill"
            key={s}
            href={`/trainers?specialization=${encodeURIComponent(s)}`}
          >
            {s}
          </Link>
        ))}
      </div>
    </section>
  );
}
