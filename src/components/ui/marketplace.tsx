"use client";
import { useCallback, useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/auth-context";
export async function request<T>(
  url: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.success === false)
    throw new Error(json.error || "Unable to complete the request.");
  return json as T;
}
export function useResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      const d = await request<T>(url);
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load.");
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    const controller = new AbortController();
    request<T>(url)
      .then((d) => {
        if (!controller.signal.aborted) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Unable to load.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url]);
  return { data, error, loading, reload };
}
export function Notice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return error || message ? (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
    >
      {error || message}
    </p>
  ) : null;
}
export function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const links =
    user?.role === "TRAINER"
      ? [
          ["/dashboard", "Overview"],
          ["/schedule", "Availability"],
          ["/dashboard/requests", "Clients & notes"],
          ["/dashboard/payouts", "Earnings"],
          ["/dashboard/profile", "Profile"],
        ]
      : user?.role === "ADMIN"
        ? [["/admin", "Operations"]]
        : [
            ["/bookings", "My sessions"],
            ["/trainers", "Find trainers"],
            ["/profile", "Profile"],
          ];
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 pt-4">
        <Link
          href="/verify-account"
          className="text-sm text-emerald-800 underline"
        >
          Account verification
        </Link>
      </div>
      <main className="market-shell">
        <nav aria-label="Dashboard" className="flex flex-wrap gap-2 mb-8">
          {links.map(([href, label]) => (
            <Link className="nav-pill" key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <header className="mb-8">
          <p className="eyebrow">YOUR TRAINRR SPACE</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
        </header>
        {children}
      </main>
    </>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="panel text-center text-slate-500 py-12">{children}</div>
  );
}
export function Metrics({ items }: { items: Record<string, string | number> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Object.entries(items).map(([label, value]) => (
        <div className="panel" key={label}>
          <p className="text-sm text-slate-500">{label}</p>
          <p
            className={`${typeof value === "string" ? "text-base" : "text-2xl"} font-bold mt-2 break-words`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
export const money = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
