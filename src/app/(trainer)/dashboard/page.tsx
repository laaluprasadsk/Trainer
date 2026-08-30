"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { 
  TrendingUp, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  KeyRound, 
  Star, 
  ShieldCheck, 
  Users, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowRight
} from "lucide-react";

interface ScheduledClient {
  id: string;
  clientName: string;
  location: string;
  time: string;
  date: string;
  expectedPayout: number;
  expectedOtp: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
}

const INITIAL_SCHEDULE: ScheduledClient[] = [
  {
    id: "sc-1",
    clientName: "Arun Kumar",
    location: "🏠 Client Villa (Indiranagar, 12th Main)",
    date: "Today",
    time: "07:00 AM - 08:00 AM",
    expectedPayout: 1020, // 85% of ₹1,200
    expectedOtp: "1760",
    status: "SCHEDULED",
  },
  {
    id: "sc-2",
    clientName: "Sneha Reddy",
    location: "🏢 Adarsh Palm Retreat Gym (Bellandur)",
    date: "Today",
    time: "05:30 PM - 06:30 PM",
    expectedPayout: 1020,
    expectedOtp: "8492",
    status: "SCHEDULED",
  },
];

export default function TrainerDashboardPage() {
  const [schedule, setSchedule] = useState<ScheduledClient[]>(INITIAL_SCHEDULE);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"schedule" | "slots" | "earnings">("schedule");
  const [verifiedSessionId, setVerifiedSessionId] = useState<string | null>(null);

  // Available slots state
  const [slotsState, setSlotsState] = useState([
    { id: "s1", time: "07:00 AM - 08:00 AM", active: true },
    { id: "s2", time: "08:30 AM - 09:30 AM", active: true },
    { id: "s3", time: "05:30 PM - 06:30 PM", active: true },
    { id: "s4", time: "07:00 PM - 08:00 PM", active: false },
  ]);

  const handleOtpVerify = (sessionId: string, expectedOtp: string) => {
    const entered = otpInputs[sessionId];
    if (entered === expectedOtp) {
      setSchedule((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "COMPLETED" } : s))
      );
      setVerifiedSessionId(sessionId);
      alert("✅ OTP Verified! 60-Minute Session Started. Escrow payout of ₹1,020 will disburse upon completion.");
    } else {
      alert("❌ Invalid OTP. Please ask the client for their 4-digit check-in code.");
    }
  };

  const toggleSlot = (id: string) => {
    setSlotsState((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Header Profile Summary */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-200">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">Rohit Sharma</h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Coach
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">ACE Certified Coach • Indiranagar, Bengaluru</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/trainers/rohit-sharma-indiranagar"
              className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition"
            >
              View Public Profile
            </Link>
          </div>
        </div>

        {/* 4 Core Financial & Session KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">This Month Payout</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">₹42,600</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18% from last month
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Escrow in Transit</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900">₹2,040</div>
            <div className="text-[11px] text-gray-500 mt-1">2 upcoming sessions today</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed Sessions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">34</div>
            <div className="text-[11px] text-gray-500 mt-1">100% attendance rate</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Client Rating</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-gray-900">4.9 ★</div>
            <div className="text-[11px] text-gray-500 mt-1">Based on 38 verified reviews</div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === "schedule"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Today's Client Sessions ({schedule.length})
          </button>
          <button
            onClick={() => setActiveTab("slots")}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === "slots"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            Manage Availability Slots
          </button>
        </div>

        {/* TAB 1: Today's Schedule & OTP Check-in */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">How to Check-In & Unlock Payouts:</strong> When you arrive at the client's home or apartment gym, ask the client for their 4-digit check-in OTP. Entering and verifying the OTP automatically initiates your session and releases the escrow funds.
              </div>
            </div>

            {schedule.map((sc) => (
              <div
                key={sc.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  sc.status === "COMPLETED" ? "border-emerald-500 bg-emerald-50/20" : "border-gray-200"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        sc.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sc.status === "COMPLETED" ? "Session Completed" : "Ready for Check-In"}
                    </span>
                    <span className="text-xs font-bold text-gray-900">{sc.time}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{sc.clientName}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{sc.location}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 pt-1">
                    Your Payout: ₹{sc.expectedPayout} (Net 85%)
                  </div>
                </div>

                {/* OTP Verification Form */}
                <div className="w-full md:w-auto shrink-0">
                  {sc.status === "COMPLETED" ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-4 py-2.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      Session Verified & Completed
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-2xl">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter OTP (e.g. 1760)"
                        value={otpInputs[sc.id] || ""}
                        onChange={(e) => setOtpInputs({ ...otpInputs, [sc.id]: e.target.value })}
                        className="w-36 px-3 py-2 bg-white border border-gray-200 rounded-xl text-center font-mono font-bold text-sm tracking-widest outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleOtpVerify(sc.id, sc.expectedOtp)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
                      >
                        Verify & Start
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Slot Management */}
        {activeTab === "slots" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Weekly Slot Availability</h2>
              <p className="text-xs text-gray-500 mt-1">
                Toggle your available daily hours. Active slots will be open for clients in your neighborhood to book.
              </p>
            </div>

            <div className="space-y-3">
              {slotsState.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{slot.time}</div>
                      <div className="text-[11px] text-gray-400">60-minute training block</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSlot(slot.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                      slot.active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-gray-200 text-gray-600 border-gray-300"
                    }`}
                  >
                    {slot.active ? "Open for Bookings" : "Blocked"}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert("Availability preferences saved to live calendar!")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
            >
              Save Schedule Changes
            </button>
          </div>
        )}

      </main>
    </div>
  );
}