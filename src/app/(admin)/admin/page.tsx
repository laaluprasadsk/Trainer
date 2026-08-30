"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Eye,
  Filter
} from "lucide-react";

interface PendingTrainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  neighborhood: string;
  certTitle: string;
  certOrg: string;
  credentialId: string;
  experience: number;
  hourlyRate: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const INITIAL_PENDING_TRAINERS: PendingTrainer[] = [
  {
    id: "app-101",
    name: "Karan Verma",
    email: "karan.verma@example.com",
    phone: "+91 98860 12345",
    neighborhood: "HSR Layout, Bengaluru",
    certTitle: "K11 Diploma in Personal Training",
    certOrg: "K11 Human Performance Academy",
    credentialId: "K11-BLR-2025-992",
    experience: 4,
    hourlyRate: 1100,
    status: "PENDING",
  },
  {
    id: "app-102",
    name: "Meera Krishnan",
    email: "meera.k@example.com",
    phone: "+91 97401 54321",
    neighborhood: "Koramangala, Bengaluru",
    certTitle: "NASM Certified Personal Trainer",
    certOrg: "National Academy of Sports Medicine",
    credentialId: "NASM-849201",
    experience: 6,
    hourlyRate: 1300,
    status: "PENDING",
  },
];

export default function AdminDashboardPage() {
  const [trainers, setTrainers] = useState<PendingTrainer[]>(INITIAL_PENDING_TRAINERS);
  const [activeTab, setActiveTab] = useState<"audits" | "metrics">("audits");

  const handleApprove = (id: string, name: string) => {
    setTrainers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "APPROVED" } : t))
    );
    alert(`✅ Coach ${name} has been APPROVED! Their profile is now live on the Trainrr discovery directory.`);
  };

  const handleReject = (id: string, name: string) => {
    setTrainers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "REJECTED" } : t))
    );
    alert(`Application for ${name} has been marked as REJECTED.`);
  };

  const pendingCount = trainers.filter((t) => t.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Platform Admin & Founder Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              Trainrr Operations Dashboard
            </h1>
          </div>

          <Link
            href="/trainers"
            className="text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Open Client Marketplace →
          </Link>
        </div>

        {/* Financial & Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Platform GMV</div>
            <div className="text-2xl font-black text-gray-900">₹1,84,000</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 134 total sessions booked
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Net Platform Revenue (15%)</div>
            <div className="text-2xl font-black text-emerald-950">₹27,600</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">Founder gross profit</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Verified Coaches</div>
            <div className="text-2xl font-black text-gray-900">12</div>
            <div className="text-[11px] text-gray-500 mt-1">Across 5 Bengaluru clusters</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Pending Certification Audits</div>
            <div className="text-2xl font-black text-amber-950">{pendingCount}</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">Requires founder review</div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("audits")}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === "audits"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Award className="w-4 h-4" />
            Coach Certification & KYC Audits ({pendingCount})
          </button>
        </div>

        {/* Coach Application Audits */}
        <div className="space-y-4">
          {trainers.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition ${
                t.status === "APPROVED"
                  ? "border-emerald-500 bg-emerald-50/20"
                  : t.status === "REJECTED"
                  ? "border-red-200 opacity-60"
                  : "border-gray-200"
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      t.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : t.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {t.status === "APPROVED" ? "Verified & Live" : t.status === "REJECTED" ? "Rejected" : "Pending Audit"}
                  </span>
                  <span className="text-xs text-gray-400">Application ID: {t.id}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                <div className="text-xs text-gray-600">{t.email} • {t.phone}</div>
                <div className="text-xs text-gray-500 font-medium">{t.neighborhood} • {t.experience} Years Exp • ₹{t.hourlyRate}/hr</div>

                {/* Certification Details Box */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{t.certTitle}</div>
                    <div className="text-gray-500 text-[11px]">{t.certOrg} (ID: {t.credentialId})</div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    📄 Document Attached
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                {t.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() => handleReject(t.id, t.name)}
                      className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(t.id, t.name)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Publish
                    </button>
                  </>
                ) : (
                  <div className="text-xs font-bold text-gray-500">
                    Decision Recorded
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}