"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Nav from "@/components/Nav";
import { useLanguage } from "@/lib/language-context";
import type { Worker, SosAlert } from "@/lib/types";
import EShramModal from "@/components/EShramModal";
import EscrowReceiptModal from "@/components/EscrowReceiptModal";
import GeoRadar from "@/components/GeoRadar";
import {
  PiggyBank,
  Users,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Radio,
  FileText,
  Award,
  Volume2,
} from "lucide-react";

type WelfareGrantItem = {
  id: string;
  workerId: string;
  workerName: string;
  type: string;
  amount: number;
  description: string;
  at: number;
};

type Summary = {
  jobs: {
    id: string;
    status: string;
    categoryName: string;
    consumerName: string;
    assignedWorkerName?: string;
    amount: number;
    selectedSkill?: string | null;
    aiMatchReason?: string | null;
  }[];
  workers: (Worker & {
    skills?: string[];
    priceTier?: string;
    hourlyFloor?: number;
    experienceYears?: number;
  })[];
  welfarePool: number;
  welfareGrants?: WelfareGrantItem[];
  transactions: {
    id: string;
    jobId?: string;
    workerId?: string;
    welfareFee: number;
    workerPayout: number;
    grossAmount?: number;
    at: number;
  }[];
  sosAlerts?: SosAlert[];
  stats: { totalJobs: number; completed: number; inProgress: number; upskillCount: number; totalPayout: number };
};

export default function AdminPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<Summary | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [grantNotice, setGrantNotice] = useState<string | null>(null);

  // SIH Winning Features State
  const [showClusterRadar, setShowClusterRadar] = useState(false);
  const [selectedWorkerForEShram, setSelectedWorkerForEShram] = useState<Worker | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<{
    jobId: string;
    amount: number;
    workerName?: string;
  } | null>(null);
  const [resolvingSosId, setResolvingSosId] = useState<string | null>(null);
  const lastAlertCountRef = useRef(0);

  // Synthesized Web Audio Chime for Emergency SOS (Zero external assets needed!)
  const playAlertChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  const load = useCallback(() => {
    fetch("/api/admin/summary")
      .then((r) => r.json())
      .then((summaryData: Summary) => {
        setData(summaryData);
        const activeAlerts = (summaryData.sosAlerts || []).filter((a) => a.status === "active");
        if (activeAlerts.length > lastAlertCountRef.current) {
          playAlertChime();
        }
        lastAlertCountRef.current = activeAlerts.length;
      })
      .catch((e) => console.error("Summary fetch error", e));
  }, [playAlertChime]);

  useEffect(() => {
    load();
    const tTimer = setInterval(load, 2000);
    return () => clearInterval(tTimer);
  }, [load]);

  async function handleResolveSos(id: string) {
    setResolvingSosId(id);
    try {
      await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      load();
    } catch (e) {
      console.error("Failed to resolve SOS alert", e);
    } finally {
      setResolvingSosId(null);
    }
  }

  async function handleReset() {
    if (!confirm("Reset demo data to initial seeded state?")) return;
    setIsResetting(true);
    try {
      await fetch("/api/admin/reset", { method: "POST" });
      await load();
    } catch (e) {
      console.error("Failed to reset demo data", e);
    } finally {
      setIsResetting(false);
    }
  }

  async function handleDisburse(type: "health_cover" | "tool_upgrade" | "accident_insurance", amount: number, desc: string) {
    if (!data || data.workers.length === 0) return;
    setIsDisbursing(true);
    setGrantNotice(null);

    // Pick a deserving worker (e.g. upskilling worker or first worker)
    const targetWorker = data.workers.find((w) => w.upskilling) || data.workers[0];

    try {
      const res = await fetch("/api/admin/welfare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: targetWorker.id,
          type,
          amount,
          description: desc,
        }),
      });
      const result = await res.json();
      if (result.grant) {
        setGrantNotice(
          language === "hi"
            ? `✅ ₹${amount} की आपातकालीन सहायता ${targetWorker.name} के सहकारी खाते में सफलतापूर्वक जमा कर दी गई!`
            : language === "ml"
            ? `✅ ₹${amount} ന്റെ ധനസഹായം ${targetWorker.name} ന്റെ വാലറ്റിൽ ലഭ്യമാക്കി!`
            : `✅ Disbursed ₹${amount} grant to ${targetWorker.name} (${desc})!`
        );
        setTimeout(() => setGrantNotice(null), 5000);
      }
      await load();
    } catch (e) {
      console.error("Failed to disburse grant", e);
    } finally {
      setIsDisbursing(false);
    }
  }

  if (!data) return null;

  const totalGross =
    data.transactions.reduce((s, t) => s + (t.grossAmount ?? t.workerPayout / 0.985), 0) ||
    data.stats.totalPayout / 0.985;
  const corporateCut = Number((totalGross * 0.25).toFixed(2));

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <main className="mx-auto max-w-5xl w-full px-5 py-8 flex-1">
        {/* Real-time Emergency SOS Distress Alert Banner */}
        {data.sosAlerts && data.sosAlerts.filter((a) => a.status === "active").length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-red-950 shadow-lg animate-in slide-in-from-top-3 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-md">
                      CRITICAL SOS DISTRESS BEACON
                    </span>
                    <span className="text-xs text-red-700 font-medium animate-pulse flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-red-600" /> Live GPS Ping Received
                    </span>
                  </div>
                  {data.sosAlerts
                    .filter((a) => a.status === "active")
                    .map((alert) => (
                      <div key={alert.id} className="mt-1.5 text-xs text-red-900">
                        <strong className="text-sm text-red-950 font-bold">{alert.workerName}</strong> ({alert.categoryName}) · {alert.areaLabel} · {alert.phone || "+91 98460 12044"}
                        <p className="text-[11px] text-red-800 mt-0.5 font-mono bg-white/70 p-2 rounded-lg border border-red-200">
                          &ldquo;{alert.notes}&rdquo;
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {data.sosAlerts
                  .filter((a) => a.status === "active")
                  .map((alert) => (
                    <button
                      key={alert.id}
                      disabled={resolvingSosId === alert.id}
                      onClick={() => handleResolveSos(alert.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {resolvingSosId === alert.id ? "Resolving..." : "Mark Resolved & Safe"}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-3xl text-teal-deep">{t.admin.title}</h1>
              <span className="text-xs bg-teal/10 text-teal-deep font-semibold px-2.5 py-0.5 rounded-full border border-teal/20">
                PACS Cluster #54
              </span>
            </div>
            <p className="text-ink-soft text-sm">{t.admin.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClusterRadar(!showClusterRadar)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                showClusterRadar
                  ? "bg-teal text-white border-teal shadow-xs"
                  : "bg-white text-teal-deep border-paper-line hover:border-teal"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              {showClusterRadar ? "Hide Cluster Radar" : "📡 View Cluster Proximity Radar"}
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="rounded-full border border-paper-line bg-white/70 hover:bg-black/5 text-ink-soft text-xs px-3.5 py-1.5 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              {isResetting ? "Resetting…" : (language === "hi" ? "डेमो डेटा रीसेट करें" : language === "ml" ? "റീസെറ്റ് ചെയ്യുക" : "Reset Demo Data")}
            </button>
          </div>
        </div>

        {/* Embedded Cluster Proximity Radar if toggled */}
        {showClusterRadar && (
          <div className="mb-8">
            <GeoRadar
              consumerLocation={{ lat: 9.9312, lng: 76.2673 }}
              consumerName="PACS Central Command (Kochi)"
              candidates={data.workers.map((w, idx) => ({
                worker: w,
                distanceKm: Number((1.2 + ((idx * 7) % 30) / 10).toFixed(1)),
                idleHours: Number(((Date.now() - (w.lastJobAt || 0)) / 3600000).toFixed(1)),
                eligible: !w.upskilling,
              }))}
              onSelectWorker={(w) => setSelectedWorkerForEShram(w)}
            />
          </div>
        )}

        {/* SIH WINNER SHOWSTOPPER: Aggregator vs Cooperative Impact Card */}
        <div className="mb-8 rounded-2xl border border-teal/30 bg-gradient-to-r from-teal-deep/5 via-teal/5 to-transparent p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-paper-line/80 pb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-teal-deep flex items-center gap-1.5">
              ⚖️ {t.admin.auditTitle}
            </span>
            <span className="text-xs text-ink-soft">{t.admin.auditSubtitle}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white/70 border border-paper-line">
              <div className="text-ink-soft mb-1 font-medium">
                {language === "hi" ? "निजी एग्रीगेटर (25% कटौती)" : language === "ml" ? "വാണിജ്യ കമ്പനികൾ (25% കമ്മീഷൻ)" : "Commercial Aggregators (25% Cut)"}
              </div>
              <div className="text-lg font-bold text-terracotta">₹{corporateCut > 0 ? corporateCut : "—"}</div>
              <p className="text-[11px] text-ink-soft mt-1">
                {language === "hi"
                  ? "निजी कंपनियों द्वारा काटा गया कमीशन, जिसमें श्रमिकों को कोई पेंशन या स्वास्थ्य लाभ नहीं मिलता।"
                  : language === "ml"
                  ? "തൊഴിലാളികൾക്ക് യാതൊരു ആനുകൂല്യവും നൽകാതെ കമ്പനികൾ ചൂഷണം ചെയ്യുന്ന തുക."
                  : "Extracted by corporate platforms with ₹0 going to worker pension or healthcare."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-paper-line">
              <div className="text-ink-soft mb-1 font-medium">{t.admin.commissionSaved}</div>
              <div className="text-lg font-bold text-teal">98.5% Net Payout</div>
              <p className="text-[11px] text-ink-soft mt-1">
                ₹{data.stats.totalPayout.toFixed(0)} {language === "hi" ? "सीधे श्रमिकों के सहकारी बैंक खाते में जमा।" : language === "ml" ? "നേരിട്ട് തൊഴിലാളിയുടെ അക്കൗണ്ടിൽ ലഭ്യമാക്കി." : "directly credited to worker cooperative bank accounts."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-paper-line">
              <div className="text-ink-soft mb-1 font-medium">{t.admin.welfarePool}</div>
              <div className="text-lg font-bold text-marigold-deep">₹{data.welfarePool.toFixed(2)}</div>
              <p className="text-[11px] text-ink-soft mt-1">
                {language === "hi"
                  ? "प्रत्येक काम से 1.5% ऑटो-पूल किया गया फंड, जो सदस्यों के स्वास्थ्य और दुर्घटना बीमा के काम आता है।"
                  : language === "ml"
                  ? "1.5% ഫീസിൽ നിന്ന് സമാഹരിച്ച ആരോഗ്യ, അപകട ക്ഷേമനിധി."
                  : "1.5% micro-fee auto-pooled for health, accident insurance & tool grants."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat
            icon={<Briefcase className="w-4 h-4" />}
            label={language === "hi" ? "प्रगति पर काम" : language === "ml" ? "നടന്നുകൊണ്ടിരിക്കുന്നവ" : "Jobs in progress"}
            value={data.stats.inProgress}
          />
          <Stat
            icon={<Users className="w-4 h-4" />}
            label={t.admin.jobsCompleted}
            value={data.stats.completed}
          />
          <Stat
            icon={<GraduationCap className="w-4 h-4 text-terracotta" />}
            label={language === "hi" ? "NCCT कौशल उन्नयन" : language === "ml" ? "NCCT പരിശീലനത്തിൽ" : "NCCT Upskilling loop"}
            value={`${data.stats.upskillCount}`}
          />
          <Stat
            icon={<PiggyBank className="w-4 h-4 text-teal" />}
            label={t.admin.welfarePool}
            value={`₹${data.welfarePool.toFixed(2)}`}
          />
        </div>

        {/* Welfare Grants & Insurance Simulation Station */}
        <section className="mb-10 rounded-2xl border border-paper-line bg-white/70 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-paper-line">
            <div>
              <h2 className="text-sm font-bold text-teal-deep flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-teal" /> Cooperative Welfare Disbursements & Insurance Station
              </h2>
              <p className="text-xs text-ink-soft">Test social security distribution funded exclusively by the 1.5% micro-fee pool.</p>
            </div>
            <div className="text-xs font-semibold text-teal-deep bg-paper px-3 py-1 rounded-full border border-paper-line">
              Balance: ₹{data.welfarePool.toFixed(2)}
            </div>
          </div>

          {grantNotice && (
            <div className="mb-4 rounded-xl border border-teal/30 bg-teal/10 p-3 text-xs text-teal-deep font-semibold animate-pulse">
              {grantNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <button
              onClick={() => handleDisburse("health_cover", 250, "Ayushman Bharat / Emergency Health Cover Top-up")}
              disabled={isDisbursing || data.welfarePool < 250}
              className="flex flex-col text-left p-3 rounded-xl border border-paper-line bg-white hover:border-teal hover:bg-teal/5 transition-all disabled:opacity-40"
            >
              <span className="text-xs font-bold text-ink">🏥 Health Cover Grant</span>
              <span className="text-[11px] text-ink-soft mt-0.5">Top-up for worker hospital expense</span>
              <span className="text-xs font-semibold text-teal mt-2">+₹250 Payout →</span>
            </button>

            <button
              onClick={() => handleDisburse("tool_upgrade", 200, "NCCT Certified Safety Tool Subsidy")}
              disabled={isDisbursing || data.welfarePool < 200}
              className="flex flex-col text-left p-3 rounded-xl border border-paper-line bg-white hover:border-teal hover:bg-teal/5 transition-all disabled:opacity-40"
            >
              <span className="text-xs font-bold text-ink">⚡ Tool Upgrade Subsidy</span>
              <span className="text-[11px] text-ink-soft mt-0.5">Equipment subsidy for upskilling worker</span>
              <span className="text-xs font-semibold text-teal mt-2">+₹200 Payout →</span>
            </button>

            <button
              onClick={() => handleDisburse("accident_insurance", 350, "On-Duty Accident Micro-Insurance Claim")}
              disabled={isDisbursing || data.welfarePool < 350}
              className="flex flex-col text-left p-3 rounded-xl border border-paper-line bg-white hover:border-teal hover:bg-teal/5 transition-all disabled:opacity-40"
            >
              <span className="text-xs font-bold text-ink">🛡️ Accident Cover Claim</span>
              <span className="text-[11px] text-ink-soft mt-0.5">Instant cooperative injury relief</span>
              <span className="text-xs font-semibold text-teal mt-2">+₹350 Payout →</span>
            </button>
          </div>

          {data.welfareGrants && data.welfareGrants.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-soft font-semibold mb-2">Live Disbursement Audit Log</p>
              <div className="overflow-x-auto rounded-xl border border-paper-line bg-white/50">
                <table className="w-full text-xs min-w-[500px]">
                  <thead className="border-b border-paper-line text-left text-ink-soft">
                    <tr>
                      <th className="px-3 py-2 font-medium">Beneficiary Worker</th>
                      <th className="px-3 py-2 font-medium">Benefit Type</th>
                      <th className="px-3 py-2 font-medium">Grant Description</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-line">
                    {data.welfareGrants.slice(0, 4).map((g) => (
                      <tr key={g.id}>
                        <td className="px-3 py-2 font-semibold text-ink">{g.workerName}</td>
                        <td className="px-3 py-2 text-ink-soft capitalize">{g.type.replace("_", " ")}</td>
                        <td className="px-3 py-2 text-ink-soft">{g.description}</td>
                        <td className="px-3 py-2 text-right font-bold text-teal">₹{g.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide text-ink-soft">Live Job Feed</h2>
            <span className="text-xs text-teal font-medium bg-teal/10 px-2.5 py-0.5 rounded-full">
              🧠 AI Skill & Equity Matching Active
            </span>
          </div>
          <div className="rounded-lg border border-paper-line bg-white/50 overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="text-left text-ink-soft border-b border-paper-line">
                <tr>
                  <th className="px-4 py-2 font-normal">Service & Task</th>
                  <th className="px-4 py-2 font-normal">Consumer</th>
                  <th className="px-4 py-2 font-normal">Matched Worker</th>
                  <th className="px-4 py-2 font-normal">Amount</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.length === 0 && (
                  <tr><td className="px-4 py-4 text-ink-soft" colSpan={5}>No bookings yet — book one from the Consumer view.</td></tr>
                )}
                {data.jobs.map((j) => (
                  <tr key={j.id} className="border-b border-paper-line last:border-0">
                    <td className="px-4 py-2">
                      <span className="font-semibold text-ink">{j.categoryName}</span>
                      {j.selectedSkill && (
                        <span className="block text-[11px] text-teal-deep font-semibold">
                          🎯 {j.selectedSkill}
                        </span>
                      )}
                      {j.aiMatchReason && (
                        <span className="block text-[10px] text-ink-soft truncate max-w-xs">
                          {j.aiMatchReason}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{j.consumerName}</td>
                    <td className="px-4 py-2">{j.assignedWorkerName ?? "—"}</td>
                    <td className="px-4 py-2 font-medium">₹{j.amount}</td>
                    <td className="px-4 py-2"><StatusPill status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide text-ink-soft">Worker equity register</h2>
            <span className="text-xs text-ink-soft">
              Protected Cooperative Floors Enforced
            </span>
          </div>
          <div className="rounded-lg border border-paper-line bg-white/50 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="text-left text-ink-soft border-b border-paper-line">
                <tr>
                  <th className="px-4 py-2 font-normal">Worker</th>
                  <th className="px-4 py-2 font-normal">Trade Tier & Skills</th>
                  <th className="px-4 py-2 font-normal">Area</th>
                  <th className="px-4 py-2 font-normal">Rating</th>
                  <th className="px-4 py-2 font-normal">Jobs done</th>
                  <th className="px-4 py-2 font-normal">Wallet</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((w) => (
                  <tr key={w.id} className="border-b border-paper-line last:border-0">
                    <td className="px-4 py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink font-semibold">{w.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerForEShram(w)}
                          className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-full font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Inspect Ministry of Labour & Employment e-Shram Card"
                        >
                          <Award className="w-2.5 h-2.5 text-emerald-600" />
                          e-Shram
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-semibold text-teal-deep">{w.priceTier || "Standard"}</span>
                        <span className="text-ink-soft text-[11px]">(Floor: ₹{w.hourlyFloor || 249}/hr)</span>
                      </div>
                      {w.skills && w.skills.length > 0 && (
                        <div className="text-[10px] text-ink-soft mt-0.5 truncate max-w-xs">
                          {w.skills.slice(0, 2).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-soft">{w.areaLabel}</td>
                    <td className="px-4 py-2">{w.rating}</td>
                    <td className="px-4 py-2">{w.completedJobs}</td>
                    <td className="px-4 py-2">₹{w.walletBalance.toFixed(0)}</td>
                    <td className="px-4 py-2">
                      {w.upskilling ? (
                        <span className="text-xs text-terracotta bg-terracotta-soft rounded-full px-2 py-0.5">upskilling</span>
                      ) : (
                        <span className="text-xs text-teal bg-teal/10 rounded-full px-2 py-0.5">active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Real-time Cooperative Escrow Settlement Audit Table */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm uppercase tracking-wide text-ink-soft font-bold">
                Cooperative Escrow Payouts & 1.5% Welfare Audit Ledger
              </h2>
              <p className="text-xs text-ink-soft">
                Live NPCI/UPI escrow splits proving 0% platform extraction and 100% direct member dividend.
              </p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              ● 100% Escrow Settled
            </span>
          </div>

          <div className="rounded-lg border border-paper-line bg-white/50 overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="text-left text-ink-soft border-b border-paper-line">
                <tr>
                  <th className="px-4 py-2 font-normal">Transaction Ref</th>
                  <th className="px-4 py-2 font-normal">Worker Payout (98.5%)</th>
                  <th className="px-4 py-2 font-normal">Welfare Pool (1.5%)</th>
                  <th className="px-4 py-2 font-normal">Platform Cut</th>
                  <th className="px-4 py-2 font-normal text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-ink-soft text-xs" colSpan={5}>
                      No settled escrow transactions yet. Complete a gig to inspect instant NPCI split ledger.
                    </td>
                  </tr>
                )}
                {data.transactions.map((t) => {
                  const workerObj = data.workers.find((w) => w.id === t.workerId);
                  const gross = t.grossAmount || Number((t.workerPayout + t.welfareFee).toFixed(2));
                  return (
                    <tr key={t.id} className="border-b border-paper-line last:border-0 text-xs">
                      <td className="px-4 py-2 font-mono font-medium text-ink">
                        {t.id}
                      </td>
                      <td className="px-4 py-2 font-bold text-emerald-700 font-mono">
                        ₹{t.workerPayout.toFixed(2)}
                        <span className="text-[10px] text-ink-soft font-sans font-normal ml-1">
                          ({workerObj?.name || "Member"})
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold text-teal font-mono">
                        ₹{t.welfareFee.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 font-mono text-emerald-800 font-semibold">
                        ₹0.00 <span className="text-[10px] font-sans font-normal text-stone-500">(Cooperative)</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setReceiptTransaction({
                              jobId: t.jobId || t.id,
                              amount: gross,
                              workerName: workerObj?.name || "Cooperative Tradesperson",
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-teal/10 hover:bg-teal/20 text-teal-deep text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" /> View Work Order Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* e-Shram Verifiable Credential Modal */}
        {selectedWorkerForEShram && (
          <EShramModal
            worker={selectedWorkerForEShram}
            onClose={() => setSelectedWorkerForEShram(null)}
          />
        )}

        {/* Escrow Receipt Modal */}
        {receiptTransaction && (
          <EscrowReceiptModal
            jobId={receiptTransaction.jobId}
            categoryName="Cooperative Service"
            amount={receiptTransaction.amount}
            workerName={receiptTransaction.workerName}
            consumerName="Rahul (Kochi Cluster)"
            onClose={() => setReceiptTransaction(null)}
          />
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-paper-line bg-white/50 p-4">
      <div className="flex items-center gap-1.5 text-ink-soft text-xs mb-1">{icon}{label}</div>
      <div className="font-display text-2xl text-teal-deep">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    matching: "bg-black/5 text-ink-soft",
    offered: "bg-marigold/20 text-marigold-deep",
    accepted: "bg-teal/10 text-teal",
    completed: "bg-teal text-paper",
    no_match: "bg-terracotta-soft text-terracotta",
  };
  return <span className={`text-xs rounded-full px-2 py-0.5 ${map[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}
