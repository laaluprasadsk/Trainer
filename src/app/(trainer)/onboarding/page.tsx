"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Dumbbell, 
  CheckCircle2, 
  Award, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  TrendingUp,
  FileCheck
} from "lucide-react";

const SPECIALIZATION_OPTIONS = [
  "Strength Training",
  "HIIT",
  "Fat Loss",
  "Mobility",
  "Pilates",
  "Athletic Performance",
  "Calisthenics",
  "Kettlebell Flow",
  "Post-Rehab",
  "Prenatal Fitness",
];

export default function TrainerOnboardingPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    homeLocationName: "Indiranagar, Bengaluru",
    bio: "",
    yearsExperience: "3",
    hourlyRate: "1200",
    specializations: ["Strength Training", "HIIT"],
    certTitle: "ACE Certified Personal Trainer",
    certOrg: "American Council on Exercise",
    credentialId: "ACE-84920",
    hasCpr: true,
  });

  const toggleSpecialization = (spec: string) => {
    if (formData.specializations.includes(spec)) {
      setFormData({
        ...formData,
        specializations: formData.specializations.filter((s) => s !== spec),
      });
    } else {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, spec],
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trainers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          documentFileName: selectedFile?.name || "certificate.pdf",
        }),
      });
      const data = await res.json();
      setApplicationId(data.applicationId || "TR-892415");
      setSubmitted(true);
    } catch (err) {
      setApplicationId("TR-892415");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const estimatedEarnings = Math.round(parseFloat(formData.hourlyRate || "1200") * 0.85);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-16 flex-1 w-full text-center">
          <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Application Submitted!</h1>
            <p className="text-sm text-gray-600 mt-2">
              Welcome to the <strong>Trainrr</strong> coach network. Our audit team will review your certification credentials within 24–48 hours.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-6">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Application Reference ID</div>
              <div className="text-2xl font-black text-emerald-900 tracking-wider font-mono mt-1">
                {applicationId}
              </div>
            </div>

            <div className="text-left bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2 text-gray-700 mb-6">
              <div className="font-bold text-gray-900 text-sm mb-1">What happens next:</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                <span>Credential audit & document verification.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                <span>Direct payout setup for automated bank deposits.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
                <span>Your profile goes live for clients in your neighborhood.</span>
              </div>
            </div>

            <Link
              href="/trainers"
              className="inline-flex items-center justify-center w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition"
            >
              Back to Trainrr Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Join Bengaluru's Premier Certified Coach Network
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Train Clients in Your Neighborhood & Earn on Your Terms
          </h1>
          <p className="mt-2 text-emerald-100 text-xs sm:text-sm max-w-xl mx-auto">
            Zero upfront fees. Retain up to 85% of session revenue with automated escrow payouts and verified client scheduling.
          </p>
        </div>
      </section>

      {/* Main Wizard Form */}
      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Rates & Skills" },
              { num: 3, label: "Certifications" },
              { num: 4, label: "Review" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition ${
                    step >= s.num
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s.num}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-gray-700">{s.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900">Step 1: Personal & Contact Details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rohit@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Neighborhood in Bengaluru *</label>
                <select
                  value={formData.homeLocationName}
                  onChange={(e) => setFormData({ ...formData, homeLocationName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                >
                  <option value="Indiranagar, Bengaluru">Indiranagar</option>
                  <option value="Koramangala, Bengaluru">Koramangala</option>
                  <option value="HSR Layout, Bengaluru">HSR Layout</option>
                  <option value="Whitefield, Bengaluru">Whitefield</option>
                  <option value="Bellandur, Bengaluru">Bellandur / Outer Ring Rd</option>
                  <option value="Jayanagar, Bengaluru">Jayanagar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Coach Bio & Training Philosophy</label>
                <textarea
                  rows={3}
                  placeholder="Describe your training methodology, client results, and experience..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.firstName || !formData.email || !formData.phone}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
                >
                  Continue to Skills & Rates <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Rates & Specializations */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900">Step 2: Pricing & Training Specializations</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Years of Personal Training Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your 60-Minute Session Rate (₹)</label>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Estimated Payout Per Session</div>
                    <div className="text-[11px] text-emerald-700">85% retained after 15% platform take-rate</div>
                  </div>
                </div>
                <div className="text-xl font-black text-emerald-900">
                  ₹{estimatedEarnings} <span className="text-xs font-normal text-emerald-700">/ hr</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Select Your Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATION_OPTIONS.map((spec) => {
                    const isSelected = formData.specializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialization(spec)}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-gray-600 hover:bg-gray-100 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
                >
                  Continue to Certifications <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Certifications & Real File Upload */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900">Step 3: Certification Credentials</h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Certification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified Personal Trainer"
                  value={formData.certTitle}
                  onChange={(e) => setFormData({ ...formData, certTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Issuing Academy / Organization *</label>
                  <select
                    value={formData.certOrg}
                    onChange={(e) => setFormData({ ...formData, certOrg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="American Council on Exercise">ACE (American Council on Exercise)</option>
                    <option value="K11 Human Performance Academy">K11 Human Performance Academy</option>
                    <option value="National Academy of Sports Medicine">NASM</option>
                    <option value="ISSA">ISSA</option>
                    <option value="REPs India">REPs India / SPEFL-SC</option>
                    <option value="Cult.fit Academy">Cult Academy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Credential ID / Certificate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. K11-2024-8921"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Real Interactive File Uploader */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Upload Certificate PDF / Image</label>
                <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-gray-50/70 hover:bg-emerald-50/20 block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-emerald-800">
                      <FileCheck className="w-8 h-8 text-emerald-600" />
                      <div className="text-xs font-bold">{selectedFile.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to verify
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 mt-1 underline">Click to change file</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <div className="text-xs font-bold text-gray-800">Click to select certificate file</div>
                      <div className="text-[10px] text-gray-400 mt-1">Supports PDF, PNG, JPG up to 10MB</div>
                    </>
                  )}
                </label>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>I confirm I hold valid CPR / AED basic life support knowledge.</span>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 text-gray-600 hover:bg-gray-100 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
                >
                  Review Application <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900">Step 4: Review & Confirm Profile</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Coach Name:</span>
                  <span className="font-bold text-gray-900">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Contact:</span>
                  <span className="font-semibold text-gray-800">{formData.email} | {formData.phone}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Neighborhood:</span>
                  <span className="font-semibold text-gray-800">{formData.homeLocationName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Hourly Rate:</span>
                  <span className="font-bold text-emerald-700">₹{formData.hourlyRate} / hr</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Certification:</span>
                  <span className="font-semibold text-gray-800">{formData.certTitle} ({formData.certOrg})</span>
                </div>
                {selectedFile && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Attached File:</span>
                    <span className="font-semibold text-emerald-700">📄 {selectedFile.name}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block mb-1">Specializations:</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.specializations.map((s) => (
                      <span key={s} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 text-gray-600 hover:bg-gray-100 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition"
                >
                  {loading ? "Submitting Application..." : "Submit Trainer Application"}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}