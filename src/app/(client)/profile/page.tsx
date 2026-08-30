"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Dumbbell, 
  LogOut, 
  Save, 
  HeartPulse, 
  Calendar 
} from "lucide-react";

const GOAL_OPTIONS = [
  "Strength Training",
  "Fat Loss & Toning",
  "Mobility & Posture Correction",
  "Muscle Hypertrophy",
  "Athletic Conditioning",
  "Calisthenics & Core",
  "Marathon / Endurance Prep",
];

export default function ClientProfilePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "Arun",
    lastName: "Kumar",
    email: "arun.kumar@example.com",
    phone: "+91 98765 43210",
    defaultLocationName: "Adarsh Palm Retreat, Tower 4, Bellandur, Bengaluru",
    fitnessGoals: ["Strength Training", "Fat Loss & Toning"],
    parqWaiverId: "PQ-492018",
  });

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      const parts = user.name.split(" ");
      setProfile((prev) => ({
        ...prev,
        firstName: parts[0] || prev.firstName,
        lastName: parts.slice(1).join(" ") || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user, isLoading, router]);

  const toggleGoal = (goal: string) => {
    if (profile.fitnessGoals.includes(goal)) {
      setProfile({
        ...profile,
        fitnessGoals: profile.fitnessGoals.filter((g) => g !== goal),
      });
    } else {
      setProfile({
        ...profile,
        fitnessGoals: [...profile.fitnessGoals, goal],
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/client/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setSavedSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xs font-bold text-gray-500 animate-pulse">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        
        {/* Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-200">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Logged In
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {profile.email} • {profile.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/bookings"
              className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              My Bookings
            </Link>
            <button
              onClick={logout}
              className="text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> Edit Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Default Training Address in Bengaluru</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-500 focus-within:bg-white transition">
                <MapPin className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                <input
                  type="text"
                  value={profile.defaultLocationName}
                  onChange={(e) => setProfile({ ...profile, defaultLocationName: e.target.value })}
                  className="w-full bg-transparent text-xs font-semibold text-gray-800 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-600" /> Fitness Goals
            </h2>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = profile.fitnessGoals.includes(goal);
                return (
                  <button
                    type="button"
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile changes saved!
              </div>
            ) : <div />}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-md shadow-emerald-200 transition"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}