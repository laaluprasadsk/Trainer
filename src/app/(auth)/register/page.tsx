"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Dumbbell, 
  User, 
  Phone, 
  Mail, 
  ArrowRight, 
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"CLIENT" | "TRAINER">("CLIENT");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "TRAINER") {
      router.push("/onboarding");
    } else {
      router.push("/trainers");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16 flex-1 w-full flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-gray-900">Create your Account</h1>
            <p className="text-xs text-gray-500 mt-1">
              Join Bengaluru's verified fitness network
            </p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole("CLIENT")}
              className={`py-2 rounded-xl text-xs font-extrabold transition ${
                role === "CLIENT"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🏋️ I Want to Train
            </button>
            <button
              type="button"
              onClick={() => setRole("TRAINER")}
              className={`py-2 rounded-xl text-xs font-extrabold transition ${
                role === "TRAINER"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🎖️ I Am a Coach
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Arun Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (+91) *</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="arun@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5 mt-2"
            >
              {role === "TRAINER" ? "Continue to Coach Application" : "Create Client Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-emerald-600 hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}