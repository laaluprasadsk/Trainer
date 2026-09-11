"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  FileUp,
  MapPin,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const SPECIALIZATIONS = [
  "Strength & Conditioning",
  "Hypertrophy",
  "Fat Loss",
  "Calisthenics",
  "Post-Rehab",
  "Yoga",
];
const MODES = [
  { value: "CLIENT_HOME", label: "Client home" },
  { value: "TRAINER_GYM", label: "My gym" },
  { value: "PUBLIC_PARK", label: "Public park" },
  { value: "ONLINE", label: "Online" },
] as const;
type Mode = (typeof MODES)[number]["value"];
type CertificateStatus = "APPROVED" | "PENDING" | "REJECTED" | "UNVERIFIED";

interface Certification {
  id: string;
  title: string;
  issuingOrganization: string;
  credentialId: string | null;
  documentUrl: string;
  status: CertificateStatus;
  issuedDate: string | null;
  adminReviewNote: string | null;
  createdAt: string;
}
interface TrainerProfile {
  firstName: string;
  lastName: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  homeLocationName: string;
  serviceRadiusKm: number;
  specializations: string[];
  acceptedSessionModes: Mode[];
  verificationStatus: CertificateStatus;
  certifications: Certification[];
}
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const initialProfile: TrainerProfile = {
  firstName: "",
  lastName: "",
  bio: "",
  yearsExperience: 0,
  hourlyRate: 0,
  homeLocationName: "",
  serviceRadiusKm: 10,
  specializations: [],
  acceptedSessionModes: [],
  verificationStatus: "UNVERIFIED",
  certifications: [],
};

function statusClasses(status: CertificateStatus) {
  if (status === "APPROVED")
    return "bg-emerald-950 text-emerald-400 border-emerald-800";
  if (status === "REJECTED") return "bg-rose-950 text-rose-400 border-rose-800";
  return "bg-amber-950 text-amber-400 border-amber-800";
}

export default function TrainerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TrainerProfile>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState({
    title: "",
    issuingOrganization: "",
    issuedDate: "",
    credentialId: "",
    documentUrl: "",
    fileName: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      if (!user?.email) {
        setLoading(false);
        setError("Sign in as a trainer to manage your profile.");
        return;
      }
      try {
        const res = await fetch("/api/trainer/profile");
        const result = (await res.json()) as ApiResponse<TrainerProfile>;
        if (!result.success || !result.data)
          throw new Error(result.error ?? "Unable to load profile.");
        setProfile(result.data);
      } catch (loadError: unknown) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load profile.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const update = <K extends keyof TrainerProfile>(
    key: K,
    value: TrainerProfile[K],
  ) => setProfile((current) => ({ ...current, [key]: value }));
  const toggle = (
    value: string,
    key: "specializations" | "acceptedSessionModes",
  ) => {
    const current = profile[key] as string[];
    update(
      key,
      (current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]) as TrainerProfile[typeof key],
    );
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setCertificate((current) => ({
        ...current,
        documentUrl: result.url,
        fileName: file.name,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    readFile(event.dataTransfer.files[0]);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        ...profile,
        ...(certificate.documentUrl
          ? {
              certification: {
                title: certificate.title,
                issuingOrganization: certificate.issuingOrganization,
                issuedDate: certificate.issuedDate,
                credentialId: certificate.credentialId,
                documentUrl: certificate.documentUrl,
              },
            }
          : {}),
      };
      if (
        certificate.documentUrl &&
        (!certificate.title.trim() ||
          !certificate.issuingOrganization.trim() ||
          !certificate.issuedDate)
      )
        throw new Error(
          "Add a title, issuer, and issue date for the certificate.",
        );
      const res = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as ApiResponse<TrainerProfile>;
      if (!res.ok || !result.success || !result.data)
        throw new Error(result.error ?? "Unable to save profile.");
      setProfile(result.data);
      setCertificate({
        title: "",
        issuingOrganization: "",
        issuedDate: "",
        credentialId: "",
        documentUrl: "",
        fileName: "",
      });
      setMessage("Profile saved successfully.");
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-950 p-8 text-sm text-neutral-400">
        Loading your trainer profile…
      </div>
    );

  return (
    <main className="min-h-screen bg-neutral-950 p-4 text-neutral-100 md:p-8">
      <div className="max-w-6xl mx-auto text-slate-900">
        <AvatarUpload />
      </div>
      <form onSubmit={save} className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col justify-between gap-4 border-b border-neutral-800 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Trainer profile</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Control how clients discover and book you.
              </p>
            </div>
          </div>
          <button
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save profile"}
          </button>
        </header>
        {error && (
          <p className="rounded-xl border border-rose-900 bg-rose-950/50 p-3 text-sm text-rose-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 lg:col-span-2">
            <h2 className="font-bold text-white">
              Personal & professional details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "firstName", label: "First name" },
                { key: "lastName", label: "Last name" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="text-xs font-medium text-neutral-400"
                >
                  {label}
                  <input
                    required
                    value={profile[key as "firstName" | "lastName"]}
                    onChange={(e) =>
                      update(key as "firstName" | "lastName", e.target.value)
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
              ))}
              <label className="text-xs font-medium text-neutral-400">
                Experience (years)
                <input
                  min="0"
                  max="80"
                  type="number"
                  value={profile.yearsExperience}
                  onChange={(e) =>
                    update("yearsExperience", Number(e.target.value))
                  }
                  className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-xs font-medium text-neutral-400">
                Hourly rate (₹)
                <input
                  required
                  min="100"
                  type="number"
                  value={profile.hourlyRate || ""}
                  onChange={(e) => update("hourlyRate", Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-neutral-400">
              Training philosophy / bio
              <textarea
                value={profile.bio}
                maxLength={2000}
                onChange={(e) => update("bio", e.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          <aside className="rounded-2xl border border-emerald-900/80 bg-emerald-950/20 p-5">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <p className="mt-3 text-sm font-bold text-white">
              Profile verification
            </p>
            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(profile.verificationStatus)}`}
            >
              {profile.verificationStatus.replace("_", " ")}
            </span>
            <p className="mt-3 text-xs leading-5 text-neutral-400">
              Approved certificates help build trust and make your profile more
              prominent.
            </p>
          </aside>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="font-bold text-white">
              Service area & training types
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-neutral-400">
                Base location
                <input
                  required
                  value={profile.homeLocationName}
                  onChange={(e) => update("homeLocationName", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-xs font-medium text-neutral-400">
                Radius (km)
                <input
                  min="0"
                  max="250"
                  type="number"
                  value={profile.serviceRadiusKm}
                  onChange={(e) =>
                    update("serviceRadiusKm", Number(e.target.value))
                  }
                  className="mt-1.5 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {MODES.map((mode) => (
                <button
                  type="button"
                  key={mode.value}
                  onClick={() => toggle(mode.value, "acceptedSessionModes")}
                  className={`rounded-xl border p-3 text-left text-xs font-semibold ${profile.acceptedSessionModes.includes(mode.value) ? "border-emerald-700 bg-emerald-950 text-emerald-400" : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"}`}
                >
                  <MapPin className="mb-1 h-3.5 w-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="font-bold text-white">Specializations</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Select the work you actively accept.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((specialization) => (
                <button
                  type="button"
                  key={specialization}
                  onClick={() => toggle(specialization, "specializations")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${profile.specializations.includes(specialization) ? "border-emerald-700 bg-emerald-950 text-emerald-400" : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:border-neutral-500"}`}
                >
                  {profile.specializations.includes(specialization) && "✓ "}
                  {specialization}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-400" />
            <h2 className="font-bold text-white">Certification hub</h2>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer rounded-2xl border border-dashed border-neutral-700 bg-neutral-950 p-7 text-center hover:border-emerald-600"
              >
                <FileUp className="mx-auto h-6 w-6 text-emerald-400" />
                <p className="mt-2 text-sm font-medium text-white">
                  Drop a certificate here
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  PDF or image · up to 2 MB
                </p>
                {certificate.fileName && (
                  <p className="mt-3 text-xs text-emerald-400">
                    Selected: {certificate.fileName}
                  </p>
                )}
                <input
                  ref={inputRef}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    readFile(e.target.files?.[0])
                  }
                  accept="application/pdf,image/*"
                  type="file"
                  className="hidden"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="Certificate title"
                  value={certificate.title}
                  onChange={(e) =>
                    setCertificate((c) => ({ ...c, title: e.target.value }))
                  }
                  className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
                <input
                  placeholder="Issuing organization"
                  value={certificate.issuingOrganization}
                  onChange={(e) =>
                    setCertificate((c) => ({
                      ...c,
                      issuingOrganization: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="date"
                  value={certificate.issuedDate}
                  onChange={(e) =>
                    setCertificate((c) => ({
                      ...c,
                      issuedDate: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
                <input
                  placeholder="Credential ID (optional)"
                  value={certificate.credentialId}
                  onChange={(e) =>
                    setCertificate((c) => ({
                      ...c,
                      credentialId: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-3">
              {profile.certifications.length === 0 ? (
                <p className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-sm text-neutral-500">
                  No certificates uploaded yet.
                </p>
              ) : (
                profile.certifications.map((cert) => (
                  <article
                    key={cert.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {cert.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {cert.issuingOrganization}
                          {cert.issuedDate
                            ? ` · Issued ${new Date(cert.issuedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusClasses(cert.status)}`}
                      >
                        {cert.status === "PENDING"
                          ? "PENDING REVIEW"
                          : cert.status}
                      </span>
                    </div>
                    {cert.status === "APPROVED" && (
                      <p className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified credential
                      </p>
                    )}
                    {cert.adminReviewNote && (
                      <p className="mt-3 rounded-lg bg-neutral-900 p-2 text-xs text-neutral-300">
                        Review note: {cert.adminReviewNote}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </form>
    </main>
  );
}
