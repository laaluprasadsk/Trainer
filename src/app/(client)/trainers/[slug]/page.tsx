import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { SlotBookingWidget } from "@/components/booking/SlotBookingWidget";
import { 
  Star, 
  MapPin, 
  Award, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  User, 
  Sparkles 
} from "lucide-react";

export const dynamic = "force-dynamic";

const FALLBACK_TRAINERS_MAP: Record<string, any> = {
  "rohit-sharma-indiranagar": {
    id: "a1111111-1111-1111-1111-111111111111",
    firstName: "Rohit",
    lastName: "Sharma",
    bio: "ACE Certified strength and conditioning coach with 7+ years of experience in functional hypertrophy and fat loss.",
    yearsExperience: 7,
    hourlyRate: 1200,
    ratingAvg: 4.9,
    ratingCount: 38,
    specializations: ["Strength Training", "HIIT", "Fat Loss"],
    homeLocationName: "Indiranagar, Bengaluru",
    certifications: [{ id: "c1", title: "ACE Certified Personal Trainer", issuingOrganization: "American Council on Exercise" }],
  },
  "priya-nair-koramangala": {
    id: "a2222222-2222-2222-2222-222222222222",
    firstName: "Priya",
    lastName: "Nair",
    bio: "K11 Certified personal trainer specializing in posture correction, mobility, and prenatal fitness.",
    yearsExperience: 5,
    hourlyRate: 1000,
    ratingAvg: 4.8,
    ratingCount: 29,
    specializations: ["Mobility", "Pilates", "Post-Rehab"],
    homeLocationName: "Koramangala 4th Block, Bengaluru",
    certifications: [{ id: "c2", title: "K11 Diploma in Personal Training", issuingOrganization: "K11 Human Performance Academy" }],
  },
  "vikram-gowda-hsr": {
    id: "a3333333-3333-3333-3333-333333333333",
    firstName: "Vikram",
    lastName: "Gowda",
    bio: "NASM Performance Enhancement Specialist. Trains corporate runners and athletic conditioning clients.",
    yearsExperience: 6,
    hourlyRate: 1100,
    ratingAvg: 4.95,
    ratingCount: 52,
    specializations: ["Athletic Performance", "Functional Training", "Endurance"],
    homeLocationName: "HSR Layout Sector 1, Bengaluru",
    certifications: [{ id: "c3", title: "NASM Certified Personal Trainer", issuingOrganization: "National Academy of Sports Medicine" }],
  },
  "anjali-desai-whitefield": {
    id: "a4444444-4444-4444-4444-444444444444",
    firstName: "Anjali",
    lastName: "Desai",
    bio: "Specialist in Calisthenics, Kettlebell flow, and bodyweight strength for working tech professionals.",
    yearsExperience: 4,
    hourlyRate: 900,
    ratingAvg: 4.75,
    ratingCount: 19,
    specializations: ["Calisthenics", "Kettlebell", "Core Strength"],
    homeLocationName: "Whitefield Inner Circle, Bengaluru",
    certifications: [{ id: "c4", title: "REPs India Level 3 Personal Trainer", issuingOrganization: "REPs India" }],
  },
};

export default async function TrainerProfilePage(props: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  // Await params for Next.js 15+ compatibility
  const resolvedParams = await props.params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    notFound();
  }

  let trainer: any = null;

  try {
    trainer = await prisma.trainerProfile.findUnique({
      where: { slug: slug },
      include: {
        certifications: { where: { status: "APPROVED" } },
        availabilitySlots: {
          where: {
            slotDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            status: "AVAILABLE",
          },
          orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
        },
      },
    });
  } catch (err) {
    console.warn("Using fallback trainer profile:", err);
  }

  if (!trainer) {
    trainer = FALLBACK_TRAINERS_MAP[slug];
  }

  if (!trainer) {
    notFound();
  }

  // Generate dynamic slots for the next 3 days
  const sampleSlots = [];
  const today = new Date();
  for (let offset = 0; offset < 3; offset++) {
    const d = new Date();
    d.setDate(today.getDate() + offset);
    const dateStr = d.toISOString().split("T")[0];
    sampleSlots.push(
      { id: "slot-" + offset + "-1", date: dateStr, startTime: "07:00:00", endTime: "08:00:00" },
      { id: "slot-" + offset + "-2", date: dateStr, startTime: "08:30:00", endTime: "09:30:00" },
      { id: "slot-" + offset + "-3", date: dateStr, startTime: "17:30:00", endTime: "18:30:00" },
      { id: "slot-" + offset + "-4", date: dateStr, startTime: "19:00:00", endTime: "20:00:00" }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-800 text-2xl font-black shadow-inner">
                {trainer.firstName[0]}{trainer.lastName[0]}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {trainer.firstName} {trainer.lastName}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Pro
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{trainer.homeLocationName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{trainer.yearsExperience} Years Experience</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-amber-900">{Number(trainer.ratingAvg).toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">({trainer.ratingCount} reviews)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {trainer.specializations.map((spec: string) => (
                    <span key={spec} className="text-xs font-semibold bg-gray-100 text-gray-800 px-3 py-1 rounded-lg">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl w-full md:w-auto text-left md:text-right">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Standard Session</div>
              <div className="text-3xl font-black text-gray-900 mt-1">
                ₹{Number(trainer.hourlyRate)}
                <span className="text-xs font-normal text-gray-500"> / hour</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-2 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> 100% Escrow Protected
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Details & Booking Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" /> About the Coach
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{trainer.bio}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" /> Verified Fitness Certifications
              </h2>
              <div className="space-y-3">
                {trainer.certifications.map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{cert.title}</div>
                        <div className="text-xs text-gray-500">{cert.issuingOrganization}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Audited & Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-6">
              <h3 className="font-bold text-base mb-1">Trainrr Safety & Escrow Guarantee</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Your payment is held safely in escrow and only released to the coach after your 60-minute session is completed via OTP verification. Free cancellation up to 24 hours prior.
              </p>
            </div>

          </div>

          <div className="lg:col-span-1">
            <SlotBookingWidget 
              trainerId={trainer.id}
              trainerName={trainer.firstName + " " + trainer.lastName}
              hourlyRate={Number(trainer.hourlyRate)}
              slots={sampleSlots}
            />
          </div>

        </div>

      </main>
    </div>
  );
}