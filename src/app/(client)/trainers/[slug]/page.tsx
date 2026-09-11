import { currentUser } from "@/lib/auth";
import Image from "next/image";
import { availableSlots } from "@/lib/bookings";
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
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trainer = await prisma.trainerProfile.findFirst({
    where: { slug, verificationStatus: "APPROVED", user: { status: "ACTIVE" } },
    include: {
      certifications: { where: { status: "APPROVED" } },
      reviews: { take: 20, orderBy: { createdAt: "desc" } },
    },
  });
  if (!trainer) notFound();
  const viewer = await currentUser();
  const bookableSlots = (
    await availableSlots(trainer.id, viewer?.clientProfile?.id)
  ).map((s) => ({
    id: s.id,
    date: s.slotDate.toISOString().slice(0, 10),
    startTime: s.startTime,
    endTime: s.endTime,
  }));
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-800 text-2xl font-black shadow-inner">
                {trainer.avatarUrl ? (
                  <Image
                    src={trainer.avatarUrl}
                    alt={`${trainer.firstName} ${trainer.lastName}`}
                    width={96}
                    height={96}
                    unoptimized
                    loading="eager"
                    className="rounded-2xl"
                  />
                ) : (
                  <>
                    {trainer.firstName[0]}
                    {trainer.lastName[0]}
                  </>
                )}
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
                    <span className="font-bold text-amber-900">
                      {Number(trainer.ratingAvg).toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      ({trainer.ratingCount} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {trainer.specializations.map((spec: string) => (
                    <span
                      key={spec}
                      className="text-xs font-semibold bg-gray-100 text-gray-800 px-3 py-1 rounded-lg"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl w-full md:w-auto text-left md:text-right">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Standard Session
              </div>
              <div className="text-3xl font-black text-gray-900 mt-1">
                ₹{Number(trainer.hourlyRate)}
                <span className="text-xs font-normal text-gray-500">
                  {" "}
                  / hour
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-2 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Secure online checkout
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
              <p className="text-sm text-gray-700 leading-relaxed">
                {trainer.bio}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" /> Verified Fitness
                Certifications
              </h2>
              <div className="space-y-3">
                {trainer.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {cert.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cert.issuingOrganization}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Credential reviewed
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <section className="panel">
              <h2 className="text-lg font-bold mb-4">Client reviews</h2>
              {trainer.reviews.length ? (
                trainer.reviews.map((r) => (
                  <article key={r.id} className="py-3 border-b last:border-0">
                    <p className="font-semibold">★ {r.rating}/5</p>
                    <p className="text-sm mt-2">{r.comment}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No completed-session reviews yet.
                </p>
              )}
            </section>
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-6">
              <h3 className="font-bold text-base mb-1">Clear booking terms</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Bookings are confirmed after payment verification. Clients may
                cancel at least 24 hours before the session. Refund requests are
                reviewed by the platform. All times are Asia/Kolkata.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <SlotBookingWidget
              trainerId={trainer.id}
              modes={trainer.acceptedSessionModes}
              trainerName={trainer.firstName + " " + trainer.lastName}
              hourlyRate={Number(trainer.hourlyRate)}
              slots={bookableSlots}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
