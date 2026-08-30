"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Star, 
  MapPin, 
  Award, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Filter, 
  Zap, 
  CheckCircle2, 
  Users,
  Dumbbell
} from "lucide-react";

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  slug: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  ratingAvg: number;
  ratingCount: number;
  specializations: string[];
  homeLocationName: string;
  distance_km: number;
  certifications: { title: string; org: string }[];
  availableSlotsCount: number;
}

const INITIAL_TRAINERS: Trainer[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    firstName: "Rohit",
    lastName: "Sharma",
    slug: "rohit-sharma-indiranagar",
    bio: "ACE Certified strength and conditioning coach with 7+ years of experience in functional hypertrophy and fat loss.",
    yearsExperience: 7,
    hourlyRate: 1200,
    ratingAvg: 4.9,
    ratingCount: 38,
    specializations: ["Strength Training", "HIIT", "Fat Loss"],
    homeLocationName: "Indiranagar, Bengaluru",
    distance_km: 1.8,
    certifications: [{ title: "ACE Certified Personal Trainer", org: "American Council on Exercise" }],
    availableSlotsCount: 4,
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    firstName: "Priya",
    lastName: "Nair",
    slug: "priya-nair-koramangala",
    bio: "K11 Certified personal trainer specializing in posture correction, mobility, and prenatal fitness.",
    yearsExperience: 5,
    hourlyRate: 1000,
    ratingAvg: 4.8,
    ratingCount: 29,
    specializations: ["Mobility", "Pilates", "Post-Rehab"],
    homeLocationName: "Koramangala 4th Block, Bengaluru",
    distance_km: 3.2,
    certifications: [{ title: "K11 Diploma in Personal Training", org: "K11 Human Performance Academy" }],
    availableSlotsCount: 4,
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    firstName: "Vikram",
    lastName: "Gowda",
    slug: "vikram-gowda-hsr",
    bio: "NASM Performance Enhancement Specialist. Trains corporate runners and athletic conditioning clients.",
    yearsExperience: 6,
    hourlyRate: 1100,
    ratingAvg: 4.95,
    ratingCount: 52,
    specializations: ["Athletic Performance", "Functional Training", "Endurance"],
    homeLocationName: "HSR Layout Sector 1, Bengaluru",
    distance_km: 4.5,
    certifications: [{ title: "NASM Certified Personal Trainer", org: "National Academy of Sports Medicine" }],
    availableSlotsCount: 4,
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    firstName: "Anjali",
    lastName: "Desai",
    slug: "anjali-desai-whitefield",
    bio: "Specialist in Calisthenics, Kettlebell flow, and bodyweight strength for working tech professionals.",
    yearsExperience: 4,
    hourlyRate: 900,
    ratingAvg: 4.75,
    ratingCount: 19,
    specializations: ["Calisthenics", "Kettlebell", "Core Strength"],
    homeLocationName: "Whitefield Inner Circle, Bengaluru",
    distance_km: 8.2,
    certifications: [{ title: "REPs India Level 3 Personal Trainer", org: "REPs India" }],
    availableSlotsCount: 4,
  },
];

const SPECIALIZATIONS = [
  "All",
  "Strength Training",
  "HIIT",
  "Fat Loss",
  "Mobility",
  "Pilates",
  "Athletic Performance",
  "Calisthenics",
];

const PRESET_COORDINATES: Record<string, { lat: number; lon: number }> = {
  indiranagar: { lat: 12.9784, lon: 77.6408 },
  koramangala: { lat: 12.9352, lon: 77.6245 },
  hsr: { lat: 12.9121, lon: 77.6446 },
  whitefield: { lat: 12.9698, lon: 77.7500 },
};

export default function TrainersDiscoveryPage() {
  const [trainers, setTrainers] = useState<Trainer[]>(INITIAL_TRAINERS);
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("indiranagar");
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(PRESET_COORDINATES.indiranagar);

  const handleLocationChange = (locKey: string) => {
    setSelectedLocation(locKey);
    if (locKey === "current") {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        });
      }
    } else if (PRESET_COORDINATES[locKey]) {
      setCoords(PRESET_COORDINATES[locKey]);
    }
  };

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const specQuery = selectedSpec !== "All" ? "&specialization=" + encodeURIComponent(selectedSpec) : "";
        const url = "/api/trainers/search?lat=" + coords.lat + "&lon=" + coords.lon + "&radius=50" + specQuery;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.trainers && data.trainers.length > 0) {
          setTrainers(data.trainers);
        }
      } catch (err) {
        console.warn("Using initial trainer dataset", err);
      }
    }
    fetchTrainers();
  }, [coords, selectedSpec]);

  const displayedTrainers = selectedSpec === "All"
    ? trainers
    : trainers.filter((t) => t.specializations?.includes(selectedSpec));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar selectedLocation={selectedLocation} onLocationChange={handleLocationChange} />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-300" />
              Verified In-Person & Home Personal Trainers
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Top Certified Personal Trainers <br className="hidden sm:block" />
              Near You in <span className="text-emerald-300 capitalize">{selectedLocation}</span>
            </h1>
            <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-xl">
              Book certified fitness coaches for 1-on-1 sessions at your apartment gym or home. Safe escrow payments & verified credentials.
            </p>
          </div>
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
            <div className="text-center">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-xs text-emerald-200">Verified Certs</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-xs text-emerald-200">Avg Rating</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">&lt; 15m</div>
              <div className="text-xs text-emerald-200">Radius</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Chips Bar */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider pl-1 pr-2">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpec(spec)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                selectedSpec === spec
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </section>

      {/* Trainer Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Available Trainers ({displayedTrainers.length})
          </h2>
          <span className="text-xs text-gray-500">Sorted by distance & rating</span>
        </div>

        {displayedTrainers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No trainers found for this category</h3>
            <p className="text-sm text-gray-500 mt-1">Try selecting "All" or choosing another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedTrainers.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Header: Name, Distance & Rating */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link 
                          href={"/trainers/" + t.slug}
                          className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition"
                        >
                          {t.firstName} {t.lastName}
                        </Link>
                       <span title="Verified Certification">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{t.homeLocationName}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">
                        {t.distance_km} km away
                      </span>
                    </div>
                  </div>

                    {/* Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-900">{Number(t.ratingAvg).toFixed(1)}</span>
                      <span className="text-[10px] text-gray-400">({t.ratingCount})</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                    {t.bio}
                  </p>

                  {/* Certifications Badge */}
                  {t.certifications && t.certifications.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{t.certifications[0].title}</span>
                    </div>
                  )}

                  {/* Specialization Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer: Price & Book Button */}
                <div className="bg-gray-50/80 border-t border-gray-100 p-4 px-6 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Session Rate</div>
                    <div className="text-base font-extrabold text-gray-900">
                      ₹{t.hourlyRate}
                      <span className="text-xs font-normal text-gray-500"> / hr</span>
                    </div>
                  </div>

                  <Link
                    href={"/trainers/" + t.slug}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book Slot
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}