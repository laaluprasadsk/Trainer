"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Dumbbell, 
  MapPin, 
  Calendar, 
  UserCheck, 
  User, 
  LogOut, 
  ChevronDown, 
  ShieldCheck 
} from "lucide-react";

export function Navbar({ 
  selectedLocation, 
  onLocationChange 
}: { 
  selectedLocation?: string;
  onLocationChange?: (loc: string) => void;
}) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/trainers" className="flex items-center gap-2 font-black text-xl tracking-tight text-gray-900">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span>Train<span className="text-emerald-600">rr</span></span>
        </Link>

        {/* Location Selector */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <select 
            className="bg-transparent outline-none cursor-pointer text-gray-800"
            value={selectedLocation}
            onChange={(e) => onLocationChange?.(e.target.value)}
          >
            <option value="indiranagar">Indiranagar, BLR</option>
            <option value="koramangala">Koramangala, BLR</option>
            <option value="hsr">HSR Layout, BLR</option>
            <option value="whitefield">Whitefield, BLR</option>
            <option value="current">📍 My Current Location</option>
          </select>
        </div>

        {/* Dynamic Auth Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <Link 
            href="/onboarding"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Apply as Trainer
          </Link>

          {user ? (
            /* Logged In State: User Menu Dropdown */
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {user.name ? user.name[0] : "U"}
                </div>
                <span className="text-xs font-bold text-gray-900 hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{user.phone}</div>
                  </div>

                  <Link
                    href="/bookings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    My Bookings
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Profile & Settings
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out State: Sign In Button */
            <Link 
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-md shadow-emerald-200 transition"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}