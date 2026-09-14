"use client";

import { useLanguage } from "@/lib/language-context";
import { ShieldCheck, X, Award, CheckCircle2, QrCode, Building2, User } from "lucide-react";
import type { Worker } from "@/lib/types";

type EShramModalProps = {
  worker: Partial<Worker> & {
    id?: string;
    name: string;
    categoryName?: string;
    categoryId?: string;
    rating?: number;
    uanNumber?: string;
    ncoCode?: string;
    certifications?: string[];
    priceTier?: string;
    areaLabel?: string;
  };
  onClose: () => void;
};

export default function EShramModal({ worker, onClose }: EShramModalProps) {
  const { language } = useLanguage();
  const uan = worker.uanNumber || "9823-4109-8831";
  const nco = worker.ncoCode || "7411.0100 (General)";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-300 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto text-ink relative">
        {/* Tricolor Government Header Stripe */}
        <div className="h-2 w-full flex">
          <div className="w-1/3 bg-amber-500" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-emerald-600" />
        </div>

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Official Header */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-teal-deep" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
              Government of India · Ministry of Labour & Employment
            </div>
            <div className="text-base font-bold text-teal-deep font-display flex items-center gap-1.5">
              e-Shram National Worker Card
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Worker Identity Section */}
          <div className="flex items-center gap-4 bg-paper/60 p-3 rounded-xl border border-paper-line">
            <div className="w-14 h-14 rounded-xl bg-teal text-white flex items-center justify-center font-bold text-lg shadow-inner">
              {worker.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-ink truncate">{worker.name}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="text-ink-soft text-[11px] flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-teal" />
                <span>Kochi PACS Cooperative Federation · Member</span>
              </div>
              <div className="text-stone-500 text-[10px] mt-0.5">
                Area: {worker.areaLabel || "Ernakulam, Kerala"}
              </div>
            </div>
          </div>

          {/* Key UAN Number Block */}
          <div className="bg-stone-900 text-white p-3 rounded-xl">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">
              Universal Account Number (UAN)
            </div>
            <div className="text-lg font-mono font-bold tracking-widest text-amber-400 mt-0.5">
              {uan}
            </div>
            <div className="text-[9px] text-stone-400 mt-1 flex items-center justify-between">
              <span>National Database of Unorganised Workers (NDUW)</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> UIDAI Aadhaar Linked
              </span>
            </div>
          </div>

          {/* Trade & Certification Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <div className="text-[10px] text-stone-500 font-semibold">NCO Trade Classification</div>
              <div className="font-medium text-ink mt-0.5 truncate">{nco}</div>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <div className="text-[10px] text-stone-500 font-semibold">Cooperative Price Tier</div>
              <div className="font-medium text-teal-deep mt-0.5">
                {worker.priceTier || "Cooperative Senior"}
              </div>
            </div>
          </div>

          {/* Certifications & Badges */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
              Verified Public Credentials
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> DigiLocker Verified
              </span>
              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-medium flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-600" /> NCCT Certified
              </span>
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                Skill India Gold
              </span>
            </div>
          </div>

          {/* Cryptographic Verification Footer */}
          <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-stone-100 rounded-md border border-stone-300 flex items-center justify-center text-stone-700">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono leading-tight">
                VERIFIED HASH: <br />
                <span className="text-stone-700 font-bold">SHA-256: 8a4f...91c0</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-teal text-white hover:bg-teal-deep font-semibold text-xs transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
