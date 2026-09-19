"use client";

import { useState } from "react";
import Link from "next/link";
import { FeaturedTrainers } from "@/components/FeaturedTrainers";
import { Navbar } from "@/components/layout/Navbar";
import {
  Dumbbell,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  HeartPulse,
  KeyRound,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const [selectedArea, setSelectedArea] = useState("indiranagar");
  const [selectedGoal, setSelectedGoal] = useState("Strength & Conditioning");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-200 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Bengaluru&apos;s On-Demand Certified Personal Trainer Network
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Find and book certified personal trainers{" "}
            <span className="text-emerald-400">based on your schedule.</span>
          </h1>

          <p className="mt-4 text-sm sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Book certified personal trainers for 1-on-1 sessions at your
            apartment clubhouse or villa. Choose a time that works for you and
            pay securely online.
          </p>

          {/* Quick Search Card */}
          <div className="mt-10 max-w-3xl mx-auto bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-gray-100 text-left text-gray-900 flex flex-col sm:flex-row items-center gap-4">
            {/* Neighborhood */}
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Your
                Neighborhood
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none text-gray-800 focus:border-emerald-500 cursor-pointer"
              >
                <option value="indiranagar">Indiranagar, Bengaluru</option>
                <option value="koramangala">Koramangala, Bengaluru</option>
                <option value="hsr">HSR Layout, Bengaluru</option>
                <option value="whitefield">Whitefield, Bengaluru</option>
              </select>
            </div>

            {/* Fitness Goal */}
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-600" /> Fitness
                Focus
              </label>
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none text-gray-800 focus:border-emerald-500 cursor-pointer"
              >
                <option value="Strength & Conditioning">
                  Strength & Conditioning
                </option>
                <option value="Hypertrophy">Hypertrophy</option>
                <option value="Fat Loss">Fat Loss</option>
                <option value="Yoga">Yoga</option>
                <option value="Calisthenics">Calisthenics</option>
              </select>
            </div>

            {/* Search CTA */}
            <Link
              href={`/trainers?location=${selectedArea}&specialization=${encodeURIComponent(selectedGoal)}`}
              className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-200 transition shrink-0"
            >
              Find Coaches <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-emerald-100 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Admin-reviewed credentials</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>Reviews from completed sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>Secure online payments</span>
            </div>
          </div>
        </div>
      </section>

      <FeaturedTrainers />
      {/* How Trainrr Works Section */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-2">
            Simple & Transparent
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            How Trainrr Works
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            Book professional, certified personal trainers near you in three
            steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Discover Nearby Coaches
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Explore audited fitness trainers within 5–10 km of your
              neighborhood. Filter by specialization (Fat loss, Strength,
              Mobility) and view real client ratings.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Lock Your Preferred Slot
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Select morning or evening time slots that fit your routine. Choose
              your training venue (*Your Home* or *Apartment Clubhouse Gym*).
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Show Up & Make Progress
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pay through Razorpay, receive a verified booking confirmation, and
              manage your session from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety Features */}
      <section className="bg-white border-y border-gray-200 py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 mb-3">
              <Award className="w-4 h-4" /> Uncompromising Quality
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-snug">
              Credentials reviewed before trainers go live
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
              We do not list unverified trainers. Admins review submitted
              certification documents before approving a public profile.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{" "}
                Reviewed credentials
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{" "}
                Experienced coaches
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{" "}
                Flexible schedules
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{" "}
                Health Waiver (PAR-Q)
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                href="/parq"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-200 transition"
              >
                <HeartPulse className="w-4 h-4" />
                Take 1-Min Health Screening (PAR-Q)
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-8 text-white shadow-xl">
            <h3 className="text-xl font-bold mb-3">
              Are You a Certified Fitness Coach?
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed mb-6">
              Join Trainrr to build your independent training business in
              Bengaluru. Keep 85% of your session price, with bookings and
              earnings in one place.
            </p>
            <div className="space-y-3 mb-6 text-xs text-emerald-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>Set your pricing and publish your schedule</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Transparent platform commission</span>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center w-full py-3.5 bg-white text-emerald-900 font-extrabold text-xs rounded-xl shadow-md hover:bg-emerald-50 transition"
            >
              Apply as a Certified Trainer{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 border-t border-gray-800 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white font-black text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span>Trainrr.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <Link href="/trainers" className="hover:text-white transition">
              Find Trainers
            </Link>
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link
              href="/cancellation-refunds"
              className="hover:text-white transition"
            >
              Cancellation & refunds
            </Link>
            <Link href="/parq" className="hover:text-white transition">
              Health Screening (PAR-Q)
            </Link>
            <Link href="/onboarding" className="hover:text-white transition">
              Trainer Application
            </Link>
          </div>

          <div className="text-xs text-gray-500">© 2026 Trainrr.</div>
        </div>
      </footer>
    </div>
  );
}
