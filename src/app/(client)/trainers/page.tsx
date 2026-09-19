"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Empty, Notice, money, useResource } from "@/components/ui/marketplace";

const SPECIALIZATIONS = [
  "Strength & Conditioning",
  "Hypertrophy",
  "Fat Loss",
  "Calisthenics",
  "Post-Rehab",
  "Yoga",
];

type Trainer = {
  id: string;
  slug: string;
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  bio: string | null;
  homeLocationName: string;
  specializations: string[];
  acceptedSessionModes: string[];
  hourlyRate: number;
  ratingAvg: number;
  ratingCount: number;
  yearsExperience: number;
  availableSlotsCount: number;
  nextAvailableAt: string | null;
};

function todayInKolkata() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function TrainerDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { data, error, loading } = useResource<{ trainers: Trainer[] }>(
    `/api/trainers/search${query ? `?${query}` : ""}`,
  );

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      const normalized = String(value).trim();
      if (normalized) next.set(key, normalized);
    }
    router.push(`/trainers${next.size ? `?${next}` : ""}`);
  }

  return (
    <>
      <Navbar />
      <main className="market-shell">
        <p className="eyebrow">EXPERT SUPPORT. YOUR SCHEDULE.</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Find your kind of coach.
        </h1>
        <p className="mb-8 mt-4 text-slate-500">
          Browse approved professionals. Availability and prices come directly
          from each trainer&apos;s published schedule.
        </p>
        <form
          key={query}
          onSubmit={filter}
          className="panel mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="field">
            Name or keyword
            <input
              name="q"
              placeholder="Search trainers"
              defaultValue={searchParams.get("q") || ""}
            />
          </label>
          <label className="field">
            Location
            <input
              name="location"
              placeholder="Bengaluru"
              defaultValue={searchParams.get("location") || ""}
            />
          </label>
          <label className="field">
            Specialization
            <select
              name="specialization"
              defaultValue={searchParams.get("specialization") || ""}
            >
              <option value="">All categories</option>
              {SPECIALIZATIONS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Training method
            <select name="mode" defaultValue={searchParams.get("mode") || ""}>
              <option value="">All methods</option>
              {[
                ["ONLINE", "Online"],
                ["CLIENT_HOME", "At my home"],
                ["TRAINER_GYM", "Trainer gym"],
                ["PUBLIC_PARK", "Public park"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Maximum hourly price (₹)
            <input
              name="maxPrice"
              type="number"
              min="0"
              step="1"
              defaultValue={searchParams.get("maxPrice") || ""}
            />
          </label>
          <label className="field">
            Minimum rating
            <select
              name="rating"
              defaultValue={searchParams.get("rating") || ""}
            >
              <option value="">Any rating</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </label>
          <label className="field">
            Minimum experience
            <input
              name="experience"
              type="number"
              min="0"
              max="80"
              step="1"
              defaultValue={searchParams.get("experience") || ""}
            />
          </label>
          <label className="field">
            Available date (IST)
            <input
              name="date"
              type="date"
              min={todayInKolkata()}
              defaultValue={searchParams.get("date") || ""}
            />
          </label>
          <label className="field">
            Available time (IST)
            <input
              name="time"
              type="time"
              defaultValue={searchParams.get("time") || ""}
            />
          </label>
          <label className="field">
            Sort results
            <select
              name="sort"
              defaultValue={searchParams.get("sort") || "recommended"}
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Rating</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="experience">Experience</option>
              <option value="availability">Earliest availability</option>
            </select>
          </label>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-2">
            <button disabled={loading} className="button flex-1">
              {loading ? "Updating…" : "Apply filters"}
            </button>
            <Link href="/trainers" className="nav-pill text-center">
              Clear all filters
            </Link>
          </div>
        </form>
        <Notice error={error} />
        {loading ? (
          <Empty>Loading verified trainers…</Empty>
        ) : data?.trainers.length ? (
          <>
            <p aria-live="polite" className="mb-4 text-sm text-slate-500">
              {data.trainers.length} verified trainer
              {data.trainers.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.trainers.map((trainer) => (
                <article key={trainer.id} className="panel flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    {trainer.avatarUrl ? (
                      <Image
                        src={trainer.avatarUrl}
                        alt={`${trainer.firstName} ${trainer.lastName}`}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div
                        aria-label={`${trainer.firstName} ${trainer.lastName} profile placeholder`}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800"
                      >
                        {trainer.firstName[0]}
                        {trainer.lastName[0]}
                      </div>
                    )}
                    <span className="badge">✓ VERIFIED</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {trainer.firstName} {trainer.lastName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {trainer.homeLocationName} · {trainer.yearsExperience}{" "}
                      years experience
                    </p>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-600">
                    {trainer.bio || "Meet your next personal trainer."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specializations.map((value) => (
                      <span className="badge" key={value}>
                        {value}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    {trainer.acceptedSessionModes
                      .map((value) => value.replaceAll("_", " ").toLowerCase())
                      .join(" · ") || "Methods available on request"}
                  </p>
                  <p className="text-sm">
                    {trainer.ratingCount
                      ? `★ ${trainer.ratingAvg} (${trainer.ratingCount} reviews)`
                      : "New to Trainrr"}
                  </p>
                  <p className="text-sm font-medium text-emerald-800">
                    {trainer.nextAvailableAt
                      ? `Next: ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(trainer.nextAvailableAt))}`
                      : "No future availability published"}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-4 border-t pt-4">
                    <strong>
                      {money(trainer.hourlyRate)}
                      <span className="text-xs font-normal text-slate-500">
                        {" "}
                        / hour
                      </span>
                    </strong>
                    <Link href={`/trainers/${trainer.slug}`} className="button">
                      View profile & book
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : !error ? (
          <Empty>
            <h2 className="mb-2 text-lg font-bold text-slate-800">
              No published trainers match these filters
            </h2>
            <p className="mb-4">
              Try clearing a location, date, or specialization. New trainers
              appear only after their credentials are reviewed.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/trainers" className="button">
                Clear all filters
              </Link>
              <Link href="/contact" className="nav-pill">
                Ask about a trainer
              </Link>
            </div>
          </Empty>
        ) : null}
      </main>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Empty>Loading trainer search…</Empty>}>
      <TrainerDirectory />
    </Suspense>
  );
}
