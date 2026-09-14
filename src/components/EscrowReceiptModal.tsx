"use client";

import { X, CheckCircle, QrCode, ArrowDownRight, ShieldCheck, Printer } from "lucide-react";

type EscrowReceiptModalProps = {
  jobId: string;
  categoryName: string;
  amount: number;
  workerName?: string;
  consumerName?: string;
  onClose: () => void;
};

export default function EscrowReceiptModal({
  jobId,
  categoryName,
  amount,
  workerName = "Cooperative Tradesperson",
  consumerName = "Rahul",
  onClose,
}: EscrowReceiptModalProps) {
  const gross = amount || 249;
  const welfare = Number((gross * 0.015).toFixed(2));
  const workerPayout = Number((gross - welfare).toFixed(2));
  const commercialAppCut = Number((gross * 0.25).toFixed(2));
  const utr = `NPCI-${jobId.replace(/\D/g, "").slice(-6) || "984210"}-${Date.now().toString().slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-300 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-ink relative">
        {/* Header Bar */}
        <div className="bg-teal text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-teal-100 font-semibold">
                Ernakulam PACS Cooperative Federation
              </div>
              <div className="text-base font-bold font-display">
                Official Work Order & Escrow Receipt
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Metadata Block */}
          <div className="flex justify-between items-center pb-3 border-b border-dashed border-stone-300 text-stone-600">
            <div>
              <div className="font-semibold text-ink">Order #{jobId}</div>
              <div className="text-[11px] text-stone-500">{categoryName} Service</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-mono">Date: {new Date().toLocaleDateString("en-IN")}</div>
              <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200">
                ● 100% Escrow Settled
              </div>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Beneficiary (Worker)</div>
              <div className="font-bold text-ink mt-0.5">{workerName}</div>
              <div className="text-[10px] text-stone-500">Cooperative Member · e-Shram Verified</div>
            </div>
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Service Requester</div>
              <div className="font-bold text-ink mt-0.5">{consumerName}</div>
              <div className="text-[10px] text-stone-500">Kochi Cluster Premises</div>
            </div>
          </div>

          {/* Itemized Escrow Settlement Breakdown */}
          <div className="space-y-2 border border-stone-200 rounded-xl p-3.5 bg-paper/40">
            <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              Itemized Payout Breakdown
            </div>

            <div className="flex justify-between py-1 text-ink">
              <span>Gross Rate Card Amount (Fixed)</span>
              <span className="font-mono font-bold">₹{gross.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1 text-emerald-800 font-medium bg-emerald-50/70 px-2 rounded-md">
              <span className="flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                Direct Worker Take-Home (98.5% via NPCI/UPI)
              </span>
              <span className="font-mono font-bold">₹{workerPayout.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1 text-teal-deep font-medium bg-teal/5 px-2 rounded-md">
              <span className="flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-teal" />
                Shared PACS Welfare Reserve Fund (1.5%)
              </span>
              <span className="font-mono font-bold">₹{welfare.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1 text-stone-500 px-2">
              <span>JanSahayak Platform Commission Fee</span>
              <span className="font-mono font-bold text-emerald-700">₹0.00 (Zero Cut)</span>
            </div>
          </div>

          {/* Cooperative Advantage Callout */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950 text-[11px]">
                Cooperative Dividend: +₹{commercialAppCut.toFixed(2)} Retained
              </div>
              <div className="text-emerald-800 text-[10px] leading-relaxed mt-0.5">
                Commercial aggregators take 25–30% platform commissions (₹{commercialAppCut.toFixed(2)}). Under JanSahayak&apos;s cooperative charter, 100% of the economic surplus stays in the hands of the worker and their mutual welfare pool.
              </div>
            </div>
          </div>

          {/* Transaction UTR & Verification */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-100 rounded-md border border-stone-300 flex items-center justify-center text-stone-700">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono leading-tight">
                NPCI UPI UTR: <br />
                <span className="text-stone-800 font-bold">{utr}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
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
    </div>
  );
}
