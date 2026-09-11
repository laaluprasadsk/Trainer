"use client";
import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Empty, Notice, money, useResource } from "@/components/ui/marketplace";
type Trainer = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  bio: string;
  homeLocationName: string;
  specializations: string[];
  hourlyRate: number;
  ratingAvg: number;
  ratingCount: number;
  yearsExperience: number;
  availableSlotsCount: number;
};
export default function Page() {
  const [query, setQuery] = useState("");
  useEffect(() => {
    queueMicrotask(() => setQuery(window.location.search.slice(1)));
  }, []);
  const { data, error, loading } = useResource<{ trainers: Trainer[] }>(
    `/api/trainers/search?${query}`,
  );
  function filter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setQuery(
      new URLSearchParams(
        Object.fromEntries(new FormData(e.currentTarget)) as Record<
          string,
          string
        >,
      ).toString(),
    );
  }
  return (
    <>
      <Navbar />
      <main className="market-shell">
        <p className="eyebrow">EXPERT SUPPORT. YOUR SCHEDULE.</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Find your kind of coach.
        </h1>
        <p className="text-slate-500 mt-4 mb-8">
          Explore verified professionals and make room for a stronger you.
        </p>
        <form
          onSubmit={filter}
          className="panel grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <label className="field">
            Name or keyword
            <input name="q" placeholder="Search trainers" />
          </label>
          <label className="field">
            Location
            <input name="location" placeholder="Bengaluru" />
          </label>
          <label className="field">
            Specialization
            <select name="specialization">
              <option value="">All categories</option>
              {[
                "Strength & Conditioning",
                "Hypertrophy",
                "Fat Loss",
                "Calisthenics",
                "Post-Rehab",
                "Yoga",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Method
            <select name="mode">
              <option value="">All methods</option>
              {["ONLINE", "CLIENT_HOME", "TRAINER_GYM", "PUBLIC_PARK"].map(
                (m) => (
                  <option key={m} value={m}>
                    {m.replaceAll("_", " ")}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="field">
            Max hourly price (₹)
            <input name="maxPrice" type="number" min="0" />
          </label>
          <label className="field">
            Minimum rating
            <select name="rating">
              <option value="">Any rating</option>
              <option>4</option>
              <option>4.5</option>
            </select>
          </label>
          <label className="field">
            Experience (years)
            <input name="experience" type="number" min="0" max="80" />
          </label>
          <label className="field">
            Available date (IST)
            <input name="date" type="date" />
          </label>
          <label className="field">
            Available time (IST)
            <input name="time" type="time" />
          </label>
          <button className="button self-end">Find trainers</button>
        </form>
        <Notice error={error} />
        {loading ? (
          <Empty>Loading trainers…</Empty>
        ) : data?.trainers.length ? (
          <>
            <p className="text-sm text-slate-500 mb-4">
              {data.trainers.length} verified trainers
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.trainers.map((t) => (
                <article key={t.id} className="panel flex flex-col gap-4">
                  <div className="flex justify-between gap-3 items-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-xl font-bold">
                      {t.firstName[0]}
                      {t.lastName[0]}
                    </div>
                    <span className="badge">✓ VERIFIED</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {t.firstName} {t.lastName}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {t.homeLocationName} · {t.yearsExperience} years
                      experience
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {t.bio || "Meet your next personal trainer."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {t.specializations.map((s) => (
                      <span className="badge" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm">
                    {t.ratingCount
                      ? `★ ${t.ratingAvg} (${t.ratingCount} reviews)`
                      : "New to Trainrr"}{" "}
                    · {t.availableSlotsCount} available slots
                  </p>
                  <div className="border-t pt-4 mt-auto flex justify-between gap-4 items-center">
                    <strong>
                      {money(t.hourlyRate)}
                      <span className="font-normal text-xs text-slate-500">
                        {" "}
                        / hour
                      </span>
                    </strong>
                    <Link href={`/trainers/${t.slug}`} className="button">
                      View profile
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          !error && (
            <Empty>
              No trainers match these filters. Try another location or date.
            </Empty>
          )
        )}
      </main>
    </>
  );
}
