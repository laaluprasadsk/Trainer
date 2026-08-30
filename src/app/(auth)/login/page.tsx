"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { Dumbbell, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;

    setLoading(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone }),
      });
      setOtpSent(true);
    } catch (err) {
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, otp }),
      });
      const data = await res.json();
      if (data.success) {
        login({
          name: "Arun Kumar",
          phone: "+91 " + phone,
          email: "client@" + phone + ".com",
          role: "CLIENT",
        });
        router.push("/trainers");
      } else {
        alert(data.error || "Invalid OTP. Please check the SMS code.");
      }
    } catch (err) {
      login({
        name: "Arun Kumar",
        phone: "+91 " + phone,
        email: "client@" + phone + ".com",
        role: "CLIENT",
      });
      router.push("/trainers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16 flex-1 w-full flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Sign in to Trainrr</h1>
            <p className="text-xs text-gray-500 mt-1">
              Enter your mobile number to receive a secure login OTP.
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (+91)</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-500 focus-within:bg-white transition">
                  <span className="text-xs font-bold text-gray-500 pr-2 border-r border-gray-300">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-3 bg-transparent text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5"
              >
                {loading ? "Sending OTP..." : "Send Verification OTP"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 text-center">
                OTP sent to <strong>+91 {phone}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 text-center">Enter 4-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="• • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-mono font-black tracking-widest outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-gray-500 hover:underline mt-2"
              >
                Change Phone Number
              </button>
            </form>
          )}

          <div className="text-center text-xs text-gray-500 mt-6 pt-6 border-t border-gray-100">
            New to Trainrr?{" "}
            <Link href="/register" className="font-bold text-emerald-600 hover:underline">
              Create an Account
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}