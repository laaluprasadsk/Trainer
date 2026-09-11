"use client";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <nav
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-4 sm:px-8 min-h-20 flex flex-wrap items-center justify-between gap-3 py-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-black tracking-tight"
        >
          <span className="bg-emerald-700 text-white p-2 rounded-xl">
            <Dumbbell size={22} />
          </span>
          Trainrr<span className="text-emerald-600">.</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm font-semibold">
          <Link href="/trainers">Find trainers</Link>
          <Link href="/how-it-works" className="hidden md:block">
            How it works
          </Link>
          {user ? (
            <>
              <Link
                href={
                  user.role === "ADMIN"
                    ? "/admin"
                    : user.role === "TRAINER"
                      ? "/dashboard"
                      : "/bookings"
                }
              >
                My dashboard
              </Link>
              <button onClick={logout} className="text-slate-500">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/onboarding" className="hidden sm:block">
                Become a trainer
              </Link>
              <Link href="/login" className="button">
                Sign in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
