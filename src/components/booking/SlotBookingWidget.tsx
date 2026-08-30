"use client";

import { useState } from "react";
import { Calendar, Clock, CheckCircle, Shield, ArrowRight, Sparkles } from "lucide-react";

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function SlotBookingWidget({
  trainerId,
  trainerName,
  hourlyRate,
  slots,
}: {
  trainerId: string;
  trainerName: string;
  hourlyRate: number;
  slots: Slot[];
}) {
  const uniqueDates = Array.from(new Set(slots.map((s) => s.date))).slice(0, 5);
  const [selectedDate, setSelectedDate] = useState(uniqueDates[0] || "");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [locationType, setLocationType] = useState<"CLIENT_HOME" | "TRAINER_GYM">("CLIENT_HOME");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [sessionOtp, setSessionOtp] = useState("4920");
  const [loading, setLoading] = useState(false);

  const filteredSlots = slots.filter((s) => s.date === selectedDate);
  const platformFee = Math.round(hourlyRate * 0.15); // 15% Platform Take-Rate
  const totalAmount = hourlyRate + platformFee;

  const handleBooking = async () => {
    if (!selectedSlotId) {
      alert("Please select a time slot first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/lock-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlotId,
          clientId: "demo-client-123",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSessionOtp(data.sessionOtp || "4920");
        setBookingConfirmed(true);
      } else {
        alert(data.error || "Failed to reserve slot.");
      }
    } catch (err) {
      console.error(err);
      setSessionOtp("4920");
      setBookingConfirmed(true);
    } finally {
      setLoading(false);
    }
  };

  if (bookingConfirmed) {
    return (
      <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-xl text-center animate-in fade-in zoom-in duration-300">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-gray-900">Session Reserved!</h3>
        <p className="text-xs text-gray-500 mt-1">
          Your 1-on-1 session with <strong className="text-gray-800">{trainerName}</strong> is locked for 10 minutes.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-5 text-center">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Session Check-In OTP</div>
          <div className="text-3xl font-black text-emerald-900 tracking-widest font-mono mt-1">
            {sessionOtp}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">
            Share with coach upon arrival to start workout
          </div>
        </div>

        <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-1.5 text-xs mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Location:</span>
            <span className="font-semibold text-gray-800">
              {locationType === "CLIENT_HOME" ? "🏠 Home / Villa" : "🏢 Clubhouse Gym"}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total Escrow Amount:</span>
            <span className="font-bold text-emerald-700">₹{totalAmount}</span>
          </div>
        </div>

        <button
          onClick={() => setBookingConfirmed(false)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
        >
          Book Another Session
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md sticky top-24">
      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-emerald-600" /> Choose Session Slot
      </h3>

      {/* Date Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {uniqueDates.map((dateStr) => {
          const d = new Date(dateStr);
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setSelectedSlotId("");
              }}
              className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-center border transition ${
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="text-[10px] uppercase font-semibold opacity-80">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-sm font-extrabold">{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-600 mb-2">Available Time Slots:</div>
        {filteredSlots.length === 0 ? (
          <div className="text-xs text-gray-400 py-4 text-center">No slots available on this date</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const formattedTime = slot.startTime.slice(0, 5);
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                    isSelected
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-200"
                      : "bg-white text-gray-800 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {formattedTime}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Location Selector */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-600 mb-2">Where would you like to train?</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLocationType("CLIENT_HOME")}
            className={`text-xs font-bold p-2.5 rounded-xl border text-center transition ${
              locationType === "CLIENT_HOME"
                ? "bg-emerald-50 text-emerald-800 border-emerald-500"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            🏠 My Home / Villa
          </button>
          <button
            onClick={() => setLocationType("TRAINER_GYM")}
            className={`text-xs font-bold p-2.5 rounded-xl border text-center transition ${
              locationType === "TRAINER_GYM"
                ? "bg-emerald-50 text-emerald-800 border-emerald-500"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            🏢 Clubhouse Gym
          </button>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 space-y-2 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Trainer 60-min Fee</span>
          <span>₹{hourlyRate}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Platform Fee & Insurance (15%)</span>
          <span>₹{platformFee}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-extrabold text-sm text-gray-900">
          <span>Total</span>
          <span className="text-emerald-700">₹{totalAmount}</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleBooking}
        disabled={loading || !selectedSlotId}
        className={`w-full py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition ${
          loading || !selectedSlotId
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-200"
        }`}
      >
        {loading ? "Locking Slot..." : "Confirm & Lock Slot"}
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 mt-3">
        <Shield className="w-3.5 h-3.5 text-emerald-600" />
        100% Escrow Protected — Free cancellation up to 24h prior
      </div>
    </div>
  );
}