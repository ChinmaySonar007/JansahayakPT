"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Layers,
  Award,
} from "lucide-react";

export default function JudgeDemoBar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  async function triggerScenario(scenarioKey: string) {
    setRunningScenario(scenarioKey);
    setToast(null);
    try {
      const res = await fetch("/api/demo/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioKey }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          title: data.title || "Scenario Executed",
          message: data.message || "State updated across prototype.",
        });
        setTimeout(() => setToast(null), 6000);
      }
    } catch (e) {
      console.error("Failed to run scenario", e);
    } finally {
      setRunningScenario(null);
    }
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl animate-in slide-in-from-bottom-5 duration-300">
      {/* Dynamic Toast Feedback Notification */}
      {toast && (
        <div className="mb-2 bg-teal-deep text-white border border-teal/40 rounded-xl p-3 shadow-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-amber-300">{toast.title}</div>
            <div className="text-[11px] text-stone-200 leading-snug mt-0.5">{toast.message}</div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-stone-400 hover:text-white text-xs px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Control Pill */}
      <div className="bg-stone-900/95 backdrop-blur-md text-stone-100 border border-stone-700/80 rounded-2xl shadow-2xl p-2.5 transition-all">
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Pitch Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400 font-mono hidden sm:inline">
              SIH26089 Demo Bar
            </span>
          </div>

          {/* 4 Interactive Hackathon Scenarios */}
          {!collapsed && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs">
              <button
                disabled={runningScenario !== null}
                onClick={() => triggerScenario("fair_rotation")}
                title="Scenario 1: Auto-book and dispatch based on idle-time fairness, not algorithmic exploitation"
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-teal/60 transition-colors font-medium flex items-center gap-1 shrink-0 text-[11px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>1. Fair Rotation</span>
              </button>

              <button
                disabled={runningScenario !== null}
                onClick={() => triggerScenario("upskilling_routing")}
                title="Scenario 2: Low-rating worker gated to NCCT training with welfare grant instead of delisting"
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-blue-500/60 transition-colors font-medium flex items-center gap-1 shrink-0 text-[11px]"
              >
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>2. NCCT Upskill</span>
              </button>

              <button
                disabled={runningScenario !== null}
                onClick={() => triggerScenario("escrow_settlement")}
                title="Scenario 3: Complete gig, send 98.5% direct to worker UPI, 1.5% to PACS welfare reserve"
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-emerald-500/60 transition-colors font-medium flex items-center gap-1 shrink-0 text-[11px]"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. 1.5% Escrow</span>
              </button>

              <button
                disabled={runningScenario !== null}
                onClick={() => triggerScenario("sos_emergency")}
                title="Scenario 4: Worker SOS panic alert broadcasted with siren to cooperative federation console"
                className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 transition-colors font-medium flex items-center gap-1 shrink-0 text-[11px]"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>4. Worker SOS</span>
              </button>

              <button
                disabled={runningScenario !== null}
                onClick={() => triggerScenario("reset")}
                title="Reset prototype store to clean initial state"
                className="px-2 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 transition-colors shrink-0 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick Role Switcher + Collapse Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden md:flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700 text-[10px]">
              <Link
                href="/"
                className={`px-2 py-1 rounded-md transition-colors ${
                  pathname === "/" ? "bg-teal text-white font-bold" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Consumer
              </Link>
              <Link
                href="/worker"
                className={`px-2 py-1 rounded-md transition-colors ${
                  pathname === "/worker" ? "bg-teal text-white font-bold" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Worker
              </Link>
              <Link
                href="/admin"
                className={`px-2 py-1 rounded-md transition-colors ${
                  pathname === "/admin" ? "bg-teal text-white font-bold" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Admin
              </Link>
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
              title={collapsed ? "Expand Presentation Controller" : "Minimize"}
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
