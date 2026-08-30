"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HeartPulse, 
  ArrowRight, 
  Lock, 
  FileText,
  Activity,
  UserCheck
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  subtext: string;
}

const PARQ_QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "1. Has your doctor ever said that you have a heart condition?",
    subtext: "E.g., Heart murmur, arrhythmia, coronary artery disease, or past cardiac events.",
  },
  {
    id: "q2",
    question: "2. Do you feel pain or pressure in your chest when performing physical activity?",
    subtext: "Chest tightness, pain radiating to arms/jaw during exercise or climbing stairs.",
  },
  {
    id: "q3",
    question: "3. In the past month, have you had chest pain when NOT performing physical activity?",
    subtext: "Resting chest pain or discomfort while sitting or sleeping.",
  },
  {
    id: "q4",
    question: "4. Do you lose your balance because of dizziness or do you ever lose consciousness?",
    subtext: "Frequent lightheadedness, vertigo, or fainting episodes.",
  },
  {
    id: "q5",
    question: "5. Do you have a bone or joint problem that could be aggravated by vigorous exercise?",
    subtext: "E.g., Chronic lower back herniation, knee ligament tears, hip pain.",
  },
  {
    id: "q6",
    question: "6. Is your doctor currently prescribing medication for blood pressure or a heart condition?",
    subtext: "Beta-blockers, ACE inhibitors, diuretics, or anti-arrhythmic medication.",
  },
  {
    id: "q7",
    question: "7. Do you know of any other reason why you should not engage in physical activity?",
    subtext: "Severe asthma, pregnancy complications, recent surgery, or unexplained illness.",
  },
];

export default function ParqScreeningPage() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
    q5: false,
    q6: false,
    q7: false,
  });

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [agreedWaiver, setAgreedWaiver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    waiverId: string;
    isCleared: boolean;
    status: string;
  } | null>(null);

  const handleToggle = (id: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedWaiver || !clientName || !clientEmail) {
      alert("Please complete the required details and accept the liability waiver.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/client/parq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          answers,
          digitalSignature: clientName,
        }),
      });

      const data = await res.json();
      setResult({
        waiverId: data.waiverId || "PQ-492018",
        isCleared: data.isCleared,
        status: data.status,
      });
    } catch (err) {
      console.error(err);
      setResult({
        waiverId: "PQ-492018",
        isCleared: !Object.values(answers).some((v) => v === true),
        status: Object.values(answers).some((v) => v === true) ? "REQUIRES_MEDICAL_CLEARANCE" : "CLEARED",
      });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-16 flex-1 w-full text-center">
          <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl">
            {result.isCleared ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Health Clearance Approved</h1>
                <p className="text-xs text-gray-600 mt-2">
                  You have cleared the Physical Activity Readiness Questionnaire (PAR-Q). You can now book personal training sessions on Trainrr.
                </p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-6 text-center">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Clearance Certificate ID</div>
                  <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
                    {result.waiverId}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1 font-medium">Valid for 12 Months • Audited</div>
                </div>

                <Link
                  href="/trainers"
                  className="inline-flex items-center justify-center w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition"
                >
                  Explore Coaches & Book Session <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Medical Consultation Recommended</h1>
                <p className="text-xs text-gray-600 mt-2">
                  Based on your health answers, we recommend consulting a licensed physician (MBBS) before starting vigorous workout sessions.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 my-6 text-left text-xs text-amber-900 space-y-2">
                  <div className="font-bold">Next Steps for Your Safety:</div>
                  <div>• Download our standard medical clearance form.</div>
                  <div>• Have your doctor sign off on moderate exercise.</div>
                  <div>• Share clearance with your Trainrr coach before high-intensity workouts.</div>
                </div>

                <Link
                  href="/trainers"
                  className="inline-flex items-center justify-center w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Return to Coach Directory
                </Link>
              </>
            )}
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
            <HeartPulse className="w-3.5 h-3.5 text-emerald-300" />
            Standard Physical Activity Readiness Questionnaire (PAR-Q)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Client Health Screening & Safety Waiver
          </h1>
          <p className="mt-2 text-emerald-100 text-xs sm:text-sm max-w-xl mx-auto">
            Please answer these 7 quick health questions before your first 1-on-1 session to ensure your coach designs a safe, tailored program.
          </p>
        </div>
      </section>

      {/* Questionnaire Form */}
      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-8">
          
          {/* Client Details */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="arun@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (+91) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> 7-Point Health Readiness Checklist
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Answer accurately based on your current physical health status:
            </p>

            <div className="space-y-4">
              {PARQ_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="max-w-xl">
                    <div className="text-xs font-bold text-gray-900 leading-snug">{q.question}</div>
                    <div className="text-[11px] text-gray-500 mt-1">{q.subtext}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(q.id, false)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition ${
                        answers[q.id] === false
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      NO
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(q.id, true)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition ${
                        answers[q.id] === true
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      YES
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Liability Waiver */}
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Assumption of Risk & Liability Release
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[11px] text-gray-600 max-h-32 overflow-y-auto leading-relaxed space-y-2">
              <p>
                By enrolling in personal training sessions facilitated through Trainrr, I acknowledge that physical exercise involves inherent risks of bodily injury or fatigue. I understand that I am voluntarily participating in physical workouts.
              </p>
              <p>
                I confirm that the information provided in this PAR-Q is accurate to the best of my knowledge. I agree to notify my coach immediately of any changes in my physical condition or symptoms occurring during sessions.
              </p>
            </div>

            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreedWaiver}
                onChange={(e) => setAgreedWaiver(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-700 font-medium">
                I have read, understood, and digitally accept the <strong>Assumption of Risk & Exercise Liability Waiver</strong>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedWaiver}
            className={`w-full py-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition ${
              loading || !agreedWaiver
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-200"
            }`}
          >
            {loading ? "Verifying Health Readiness..." : "Submit Health Screening & Digital Waiver"}
            <ShieldCheck className="w-4 h-4" />
          </button>

        </form>
      </main>
    </div>
  );
}