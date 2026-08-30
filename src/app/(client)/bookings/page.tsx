"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Star, 
  KeyRound, 
  Dumbbell, 
  ArrowRight, 
  MessageSquare,
  ShieldCheck
} from "lucide-react";

interface Booking {
  id: string;
  trainerName: string;
  trainerSlug: string;
  specialization: string;
  date: string;
  time: string;
  location: string;
  sessionOtp: string;
  totalAmount: number;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  rating?: number;
  reviewComment?: string;
}

const STARS = Array.from({ length: 5 }, (_, i) => i + 1);

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "bk-101",
    trainerName: "Rohit Sharma",
    trainerSlug: "rohit-sharma-indiranagar",
    specialization: "Strength & Conditioning",
    date: "Today, 29 Aug",
    time: "07:00 AM - 08:00 AM",
    location: "🏠 Home / Villa (Indiranagar)",
    sessionOtp: "1760",
    totalAmount: 1380,
    status: "CONFIRMED",
  },
  {
    id: "bk-102",
    trainerName: "Priya Nair",
    trainerSlug: "priya-nair-koramangala",
    specialization: "Mobility & Posture",
    date: "Tomorrow, 30 Aug",
    time: "08:30 AM - 09:30 AM",
    location: "🏢 Clubhouse Gym",
    sessionOtp: "8492",
    totalAmount: 1150,
    status: "CONFIRMED",
  },
  {
    id: "bk-100",
    trainerName: "Vikram Gowda",
    trainerSlug: "vikram-gowda-hsr",
    specialization: "Athletic Conditioning",
    date: "25 Aug 2026",
    time: "05:30 PM - 06:30 PM",
    location: "🏠 Home / Villa (HSR Layout)",
    sessionOtp: "3912",
    totalAmount: 1265,
    status: "COMPLETED",
    rating: 5,
    reviewComment: "Incredible session! Vikram pushed my limits safely and corrected my deadlift form.",
  },
];

export default function ClientBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const upcomingList = bookings.filter((b) => b.status === "CONFIRMED");
  const completedList = bookings.filter((b) => b.status === "COMPLETED");

  const handleCancel = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel? Free cancellation applies up to 24 hours prior.")) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === reviewModalBooking.id
          ? { ...b, rating: selectedStars, reviewComment: reviewText }
          : b
      )
    );
    setReviewModalBooking(null);
    setReviewText("");
    alert("Thank you for submitting your verified review!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              My Training Sessions
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your upcoming workouts, active check-in OTPs, and past training history.
            </p>
          </div>

          <Link
            href="/trainers"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition"
          >
            <Dumbbell className="w-4 h-4" />
            Book New Session
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "upcoming"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming Sessions ({upcomingList.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "completed"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Workout History ({completedList.length})
          </button>
        </div>

        {/* UPCOMING SESSIONS TAB */}
        {activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcomingList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No upcoming workouts</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">Book your next 1-on-1 session with a certified coach nearby.</p>
                <Link
                  href="/trainers"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Browse Coaches
                </Link>
              </div>
            ) : (
              upcomingList.map((bk) => (
                <div
                  key={bk.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Confirmed
                      </span>
                      <span className="text-xs text-gray-400">ID: {bk.id}</span>
                    </div>

                    <Link
                      href={"/trainers/" + bk.trainerSlug}
                      className="text-lg font-bold text-gray-900 hover:text-emerald-600 transition block"
                    >
                      {bk.trainerName}
                    </Link>
                    <div className="text-xs text-gray-500">{bk.specialization}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{bk.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{bk.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{bk.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* OTP & Action Box */}
                  <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto shrink-0 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-2xl">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-center w-full sm:w-auto">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
                        <KeyRound className="w-3 h-3" /> Check-In OTP
                      </div>
                      <div className="text-2xl font-black text-emerald-950 font-mono tracking-widest mt-0.5">
                        {bk.sessionOtp}
                      </div>
                      <div className="text-[9px] text-emerald-700 mt-0.5 font-medium">Share with coach upon arrival</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCancel(bk.id)}
                        className="text-[11px] font-semibold text-red-600 hover:underline"
                      >
                        Cancel Session
                      </button>
                      <span className="text-xs font-bold text-gray-900">Total: ₹{bk.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* WORKOUT HISTORY TAB */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            {completedList.map((bk) => (
              <div
                key={bk.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                      Completed Workout
                    </span>
                    <span className="text-xs text-gray-400">{bk.date} • {bk.time}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{bk.trainerName}</h3>
                  <div className="text-xs text-gray-500">{bk.location} • Paid ₹{bk.totalAmount}</div>

                  {bk.rating ? (
                    <div className="pt-2">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        {STARS.slice(0, bk.rating).map((star) => (
                          <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-gray-700 ml-1">({bk.rating}/5)</span>
                      </div>
                      {bk.reviewComment && (
                        <p className="text-xs text-gray-600 italic mt-1 bg-gray-50 p-2.5 rounded-xl">
                          "{bk.reviewComment}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewModalBooking(bk)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 mt-2 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Leave Rating & Review
                    </button>
                  )}
                </div>

                <Link
                  href={"/trainers/" + bk.trainerSlug}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-emerald-600 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition shrink-0"
                >
                  Book Again <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Review & Rating Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Rate Session with {reviewModalBooking.trainerName}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Your feedback helps maintain verified coaching quality on Trainrr.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Session Rating</label>
                <div className="flex gap-2">
                  {STARS.map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSelectedStars(star)}
                      className="p-1 text-2xl transition hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= selectedStars
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How was the workout? Describe the coach's technique correction, energy, and punctuality..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}