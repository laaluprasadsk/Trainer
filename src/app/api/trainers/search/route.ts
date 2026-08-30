import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEED_TRAINERS = [
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
    lat: 12.9784,
    lon: 77.6408,
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
    lat: 12.9352,
    lon: 77.6245,
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
    lat: 12.9121,
    lon: 77.6446,
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
    lat: 12.9698,
    lon: 77.7500,
    certifications: [{ title: "REPs India Level 3 Personal Trainer", org: "REPs India" }],
    availableSlotsCount: 4,
  },
];

// Helper to calculate haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lon = parseFloat(searchParams.get("lon") || "77.5946");
  const specialization = searchParams.get("specialization");

  try {
    const dbTrainers: any[] = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.first_name AS "firstName",
        t.last_name AS "lastName",
        t.slug,
        t.bio,
        t.years_experience AS "yearsExperience",
        t.hourly_rate::float AS "hourlyRate",
        t.rating_avg::float AS "ratingAvg",
        t.rating_count::int AS "ratingCount",
        t.specializations,
        t.home_location_name AS "homeLocationName",
        ROUND(
          (ST_Distance(
            t.home_location_geom::geography, 
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
          ) / 1000.0)::numeric, 1
        )::float AS distance_km,
        COALESCE(
          (
            SELECT json_agg(json_build_object('title', c.title, 'org', c.issuing_organization))
            FROM certifications c
            WHERE c.trainer_id = t.id
          ), '[]'::json
        ) AS certifications,
        4 AS "availableSlotsCount"
      FROM trainer_profiles t
      ORDER BY distance_km ASC, t.rating_avg DESC;
    `;

    const filtered = specialization && specialization !== "All"
      ? dbTrainers.filter((t) => t.specializations?.includes(specialization))
      : dbTrainers;

    if (filtered && filtered.length > 0) {
      return NextResponse.json({ success: true, trainers: filtered });
    }
  } catch (error) {
    console.warn("Using fallback trainer dataset:", error);
  }

  // Guaranteed fallback with dynamic distance calculation
  const mapped = SEED_TRAINERS.map((t) => ({
    ...t,
    distance_km: calculateDistanceKm(lat, lon, t.lat, t.lon),
  }));

  const filteredFallback = specialization && specialization !== "All"
    ? mapped.filter((t) => t.specializations.includes(specialization))
    : mapped;

  filteredFallback.sort((a, b) => a.distance_km - b.distance_km || b.ratingAvg - a.ratingAvg);

  return NextResponse.json({ success: true, trainers: filteredFallback });
}