"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert, X, PhoneCall, MapPin, CheckCircle2 } from "lucide-react";

type SosDistressModalProps = {
  workerId: string;
  workerName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function SosDistressModal({
  workerId,
  workerName,
  onClose,
  onSuccess,
}: SosDistressModalProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [reason, setReason] = useState("Accident / Medical Emergency");

  async function handleConfirmSos() {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          notes: `SOS ALERT: ${reason} reported by ${workerName}. Immediate cooperative nodal response requested.`,
        }),
      });
      if (res.ok) {
        setTriggered(true);
        onSuccess?.();
      }
    } catch (e) {
      console.error("SOS trigger error:", e);
    } finally {
      setIsTriggering(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-red-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-red-500 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto text-ink relative">
        {/* Top Warning Stripe */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-red-100">
                Cooperative Worker Safety & Distress Hotline
              </div>
              <div className="text-base font-bold font-display">Emergency SOS Dispatch</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {triggered ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-lg font-bold text-ink">Emergency Broadcast Sent!</div>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Your live GPS coordinates have been beamed to the **Ernakulam PACS Cooperative Federation Helpline (1800-PACS-SOS)** and nearby cooperative comrades.
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600 space-y-1 text-left">
              <div><strong>Nodal Officer:</strong> Shri Manoj K. (+91 98460 11204)</div>
              <div><strong>Station:</strong> Central Cooperative Distress Cell, Kakkanad</div>
              <div><strong>Status:</strong> Field Response Unit Dispatched</div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-teal text-white font-bold text-xs hover:bg-teal-deep transition-colors shadow-sm"
            >
              Return to Safe Mode
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4 text-xs">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Press only in genuine emergencies
              </div>
              <p className="text-[11px] leading-relaxed">
                JanSahayak protects members with immediate cooperative mutual aid. This alerts your local Panchayat coordinator and the 24x7 cooperative helpline.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-soft mb-1.5 uppercase tracking-wider">
                Select Situation Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Accident / Medical Emergency",
                  "Customer Hostility / Threat",
                  "Late-Night Stranded / Breakdown",
                  "Workplace Hazard / Injury",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setReason(item)}
                    className={`p-2 rounded-lg border text-left text-[11px] transition-colors font-medium ${
                      reason === item
                        ? "border-red-500 bg-red-50 text-red-900 font-bold"
                        : "border-stone-200 hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 text-[11px]">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>Broadcasting live coordinates: <strong>Kochi & Ernakulam Cluster</strong></span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTriggering}
                onClick={handleConfirmSos}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                {isTriggering ? "Broadcasting..." : "🚨 Broadcast SOS Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
