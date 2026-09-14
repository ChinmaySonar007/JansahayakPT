"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import type { Worker } from "@/lib/types";
import GeoRadar from "@/components/GeoRadar";
import EShramModal from "@/components/EShramModal";
import EscrowReceiptModal from "@/components/EscrowReceiptModal";
import {
  Zap, Droplet, Hammer, Paintbrush, Home as HomeIcon,
  HeartHandshake, Sprout, Sparkles, MapPin, Star, Clock, ShieldCheck,
  Radio, FileText, CheckCircle2, ArrowRight,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Droplet, Hammer, Paintbrush, Home: HomeIcon, HeartHandshake, Sprout, Sparkles,
};

type Category = { id: string; name: string; icon: string; baseRate: number; skills?: string[] };
type Candidate = {
  worker: Worker;
  distanceKm: number;
  idleHours: number;
  score: number;
  eligible: boolean;
  skillMatchPercent?: number;
  matchedSkills?: string[];
  aiMatchReason?: string;
  priceTier?: string;
  hourlyFloor?: number;
  breakdown?: {
    proximity: number;
    fairness: number;
    skillBonus: number;
    qualityFloor: number;
    total: number;
  };
};
type Job = {
  id: string;
  status: string;
  amount: number;
  categoryId: string;
  currentOfferWorkerId: string | null;
  assignedWorkerId: string | null;
  offerLog: { workerId: string; workerName: string; outcome: string }[];
  selectedSkill?: string | null;
  issueQuery?: string | null;
  aiMatchReason?: string | null;
  priceTier?: string | null;
};

const DEFAULT_CONSUMER_ID = "c-rahul";

export default function ConsumerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const activeConsumerId = (user && user.role === "consumer" ? user.id : null) || DEFAULT_CONSUMER_ID;
  const consumerDisplayName = (user && user.role === "consumer" ? user.name : null) || (language === "hi" ? "राहुल" : language === "ml" ? "രാഹുൽ" : "Rahul");
  const consumerArea = (user && user.areaLabel ? user.areaLabel : null) || (language === "hi" ? "कोच्चि, केरल" : language === "ml" ? "കൊച്ചി, കേരളം" : "Kochi, Kerala");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [issueQuery, setIssueQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  // New SIH Winning Feature States
  const [showRadar, setShowRadar] = useState(false);
  const [selectedWorkerForEShram, setSelectedWorkerForEShram] = useState<Worker | null>(null);
  const [receiptJob, setReceiptJob] = useState<Job | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories));
  }, []);

  const loadCandidates = useCallback(async (categoryId: string, skill?: string | null, query?: string) => {
    const activeSkill = skill !== undefined ? skill : selectedSkill;
    const activeQuery = query !== undefined ? query : issueQuery;
    let url = `/api/workers?category=${categoryId}&consumerId=${activeConsumerId}`;
    if (activeSkill) url += `&skill=${encodeURIComponent(activeSkill)}`;
    if (activeQuery) url += `&query=${encodeURIComponent(activeQuery)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch (e) {
      console.error("Failed to load candidates", e);
    }
  }, [activeConsumerId, selectedSkill, issueQuery]);

  useEffect(() => {
    if (selectedCategory) loadCandidates(selectedCategory);
  }, [selectedCategory, loadCandidates]);

  // poll job status while a booking is in flight
  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "no_match") return;
    const tTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs`);
        if (!res.ok) return;
        const data = await res.json();
        const updated = data.jobs?.find((j: Job) => j.id === job.id);
        if (updated) setJob(updated);
        if (selectedCategory) loadCandidates(selectedCategory);
      } catch (e) {
        console.error("Failed to poll jobs", e);
      }
    }, 1500);
    return () => clearInterval(tTimer);
  }, [job, selectedCategory, loadCandidates]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSkill(null);
    setSelectedWorkerId(null);
    setIssueQuery("");
    loadCandidates(catId, null, "");
  };

  const handleSkillToggle = (skill: string) => {
    const nextSkill = selectedSkill === skill ? null : skill;
    setSelectedSkill(nextSkill);
    if (selectedCategory) {
      loadCandidates(selectedCategory, nextSkill, issueQuery);
    }
  };

  async function book(categoryId: string, preferredWorkerId?: string) {
    setLoading(true);
    const targetWorkerId = preferredWorkerId || selectedWorkerId || undefined;
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumerId: activeConsumerId,
          categoryId,
          selectedSkill,
          issueQuery: issueQuery.trim() || undefined,
          preferredWorkerId: targetWorkerId,
        }),
      });
      const data = await res.json();
      if (data.job) setJob(data.job);
    } catch (e) {
      console.error("Failed to book job", e);
    } finally {
      setLoading(false);
    }
  }

  const category = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <main className="mx-auto max-w-5xl w-full px-5 py-8 flex-1">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="font-display text-3xl text-teal-deep">
            {language === "hi" ? "नमस्ते" : language === "ml" ? "നമസ്കാരം" : "Namaste"}, {consumerDisplayName}
          </h1>
          <div className="flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="w-4 h-4" /> {consumerArea}
          </div>
        </div>
        <p className="text-ink-soft mb-6">{t.consumer.subtitle}</p>

        {job && (
          <div className="mb-8 rounded-xl border border-paper-line bg-white/70 p-5 shadow-xs">
            <JobTracker
              job={job}
              onReset={() => setJob(null)}
              onOpenReceipt={(j) => setReceiptJob(j)}
            />
          </div>
        )}

        <h2 className="text-sm uppercase tracking-wide text-ink-soft font-bold mb-3">{t.consumer.selectService}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] ?? Sparkles;
            const active = selectedCategory === c.id;
            const translatedName =
              t.consumer.categories[c.id as keyof typeof t.consumer.categories] || c.name;
            return (
              <button
                key={c.id}
                onClick={() => handleCategorySelect(c.id)}
                className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                  active
                    ? "border-teal bg-teal text-paper shadow-xs"
                    : "border-paper-line bg-white/50 hover:border-teal"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{translatedName}</span>
                <span className={`text-xs ${active ? "text-paper/80" : "text-ink-soft"}`}>
                  ₹{c.baseRate} · {t.consumer.fixedRate}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cooperative Guarantee Banner */}
        <div className="mb-6 rounded-xl border border-paper-line bg-white/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-deep">🤝 {t.consumer.guaranteeTitle}:</span>
            <span className="text-ink-soft">{t.consumer.guaranteeDesc}</span>
          </div>
          <span className="text-teal font-medium shrink-0">{t.consumer.fairnessBadge}</span>
        </div>

        {category && (
          <div className="space-y-4">
            {/* Smart AI Micro-Skill & Problem Selector */}
            <div className="rounded-xl border border-teal/25 bg-teal/[0.03] p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal text-paper text-xs font-bold shadow-xs">
                    AI
                  </span>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-teal-deep">
                    Smart Micro-Skill & Problem Matching
                  </h3>
                  <span className="text-[11px] text-teal bg-teal/10 px-2 py-0.5 rounded-full font-medium">
                    Instant Edge AI
                  </span>
                </div>
                <span className="text-xs text-ink-soft">
                  Select task or describe below
                </span>
              </div>

              {/* Task Chips */}
              {category.skills && category.skills.length > 0 && (
                <div className="mb-3">
                  <div className="text-[11px] text-ink-soft font-medium mb-1.5">Common {category.name} Tasks:</div>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((sk) => {
                      const active = selectedSkill === sk;
                      return (
                        <button
                          key={sk}
                          onClick={() => handleSkillToggle(sk)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                            active
                              ? "bg-teal text-paper border-teal shadow-xs font-semibold"
                              : "bg-white text-ink border-paper-line hover:border-teal hover:bg-teal/5"
                          }`}
                        >
                          {active ? `✓ ${sk}` : sk}
                        </button>
                      );
                    })}
                    {selectedSkill && (
                      <button
                        onClick={() => handleSkillToggle(selectedSkill)}
                        className="text-xs px-2 py-1.5 text-terracotta hover:underline font-medium cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Natural Language Issue Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Describe your specific problem (e.g. Inverter tripping MCB, water pump leaking)...`}
                  value={issueQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIssueQuery(val);
                    loadCandidates(category.id, selectedSkill, val);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-paper-line rounded-lg focus:outline-none focus:border-teal text-ink placeholder:text-ink-soft/70"
                />
                {issueQuery && (
                  <button
                    onClick={() => {
                      setIssueQuery("");
                      loadCandidates(category.id, selectedSkill, "");
                    }}
                    className="text-xs text-ink-soft hover:text-ink px-2 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 pt-2">
              <div>
                <h2 className="text-sm uppercase tracking-wide text-ink-soft font-bold">
                  {t.consumer.categories[category.id as keyof typeof t.consumer.categories] || category.name}
                </h2>
                <p className="text-xs text-ink-soft">{t.consumer.rotationalTitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRadar(!showRadar)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                    showRadar
                      ? "bg-teal text-white border-teal shadow-xs"
                      : "bg-white text-teal-deep border-paper-line hover:border-teal"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-500" />
                  {showRadar ? "Hide Radar" : "📡 Live Geo-Radar"}
                </button>
                {selectedWorkerId ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedWorkerId(null)}
                      className="text-xs text-terracotta hover:underline px-2 cursor-pointer font-medium"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => book(category.id, selectedWorkerId)}
                      disabled={loading || (!!job && job.status !== "completed" && job.status !== "no_match")}
                      className="rounded-full bg-teal text-white font-semibold px-4 py-2 text-sm hover:bg-teal-deep disabled:opacity-40 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>
                        {loading
                          ? t.consumer.searchingWorker
                          : `Book ${candidates.find((c) => c.worker.id === selectedWorkerId)?.worker.name.split(" ")[0] || "Selected Worker"}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => book(category.id)}
                    disabled={loading || (!!job && job.status !== "completed" && job.status !== "no_match")}
                    className="rounded-full bg-marigold text-teal-deep font-semibold px-4 py-2 text-sm hover:bg-marigold-deep disabled:opacity-40 shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? t.consumer.searchingWorker : "Auto-Dispatch Best Fair Match"}
                  </button>
                )}
              </div>
            </div>

            {/* Interactive SVG Geo-Radar View */}
            {showRadar && (
              <div className="my-3">
                <GeoRadar
                  consumerLocation={{ lat: 9.9312, lng: 76.2673 }}
                  consumerName={consumerDisplayName}
                  candidates={candidates}
                  activeWorkerId={job?.currentOfferWorkerId || job?.assignedWorkerId || selectedWorkerId || undefined}
                  onSelectWorker={(w) => {
                    const cand = candidates.find((c) => c.worker.id === w.id);
                    if (cand && cand.eligible) {
                      setSelectedWorkerId(w.id);
                    }
                    setSelectedWorkerForEShram(w);
                  }}
                />
              </div>
            )}

            {/* Dispatch Preference Selector & Rotational Equity Formula */}
            <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 text-xs text-teal-deep space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">Dispatch Preference:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedWorkerId(null)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      !selectedWorkerId
                        ? "bg-teal text-white shadow-2xs"
                        : "bg-white text-ink-soft border border-paper-line hover:border-teal hover:text-ink"
                    }`}
                  >
                    ⚖️ Fair Turn (Auto)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const firstEligible = candidates.find((c) => c.eligible);
                      if (firstEligible) setSelectedWorkerId(firstEligible.worker.id);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      selectedWorkerId
                        ? "bg-teal text-white shadow-2xs"
                        : "bg-white text-ink-soft border border-paper-line hover:border-teal hover:text-ink"
                    }`}
                  >
                    👤 Direct Choice {selectedWorkerId && `(Active)`}
                  </button>
                </div>
                {selectedWorkerId && (
                  <span className="text-[11px] text-teal-deep bg-white/80 border border-teal/20 px-2 py-0.5 rounded-full font-medium">
                    Chosen: <strong>{candidates.find((c) => c.worker.id === selectedWorkerId)?.worker.name}</strong> · Click any candidate below to switch
                  </span>
                )}
              </div>

              <div className="pt-1.5 border-t border-teal/15 text-[11px] text-ink-soft flex items-start gap-1">
                <span>📐 <strong>Formula:</strong></span>
                <span>Proximity (max 10) + IdleFairness (max 60) + AI Skill Bonus (max 12) + Safety Floor (5). You can pick your preferred candidate directly or let cooperative fairness auto-assign.</span>
              </div>
            </div>

            <ul className="space-y-2.5 mt-3">
              {candidates.map((c, index) => {
                const isSelected = selectedWorkerId === c.worker.id;
                const proximityScore = Math.max(0, 10 - c.distanceKm).toFixed(1);
                const idleScore = (Math.min(c.idleHours / 2, 40) * 1.5).toFixed(1);
                const qualityScore = c.eligible ? "5.0" : "0.0";
                const skillBonus = c.breakdown?.skillBonus ? c.breakdown.skillBonus.toFixed(1) : (c.skillMatchPercent ? "9.5" : "5.0");

                return (
                  <li
                    key={c.worker.id}
                    onClick={() => {
                      if (c.eligible) {
                        setSelectedWorkerId(isSelected ? null : c.worker.id);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-teal/[0.06] border-teal shadow-xs ring-2 ring-teal/30 cursor-pointer"
                        : !c.eligible
                        ? "bg-terracotta-soft/20 border-paper-line opacity-85"
                        : "bg-white/80 border-paper-line hover:border-teal/50 hover:bg-teal/[0.01] cursor-pointer"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {/* Radio Selection Indicator */}
                        <div
                          className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-teal bg-teal text-white"
                              : c.eligible
                              ? "border-paper-line bg-white hover:border-teal"
                              : "border-paper-line/40 bg-black/5 opacity-50"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-ink-soft/70">#{index + 1}</span>
                            <span className="font-semibold text-sm text-ink">{c.worker.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-teal text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                ✓ Your Choice
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWorkerForEShram(c.worker);
                              }}
                              className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Inspect Ministry of Labour & Employment e-Shram Card"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              e-Shram Verified
                            </button>
                            {c.skillMatchPercent && c.skillMatchPercent >= 85 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/10 text-teal-deep border border-teal/20">
                                ✨ {c.skillMatchPercent}% Skill Fit
                              </span>
                            )}
                            {c.priceTier && (
                              <span className="text-[10px] text-ink-soft bg-paper-line/50 px-2 py-0.5 rounded font-medium">
                                {c.priceTier} · {c.worker.experienceYears || 5} yrs exp
                              </span>
                            )}
                            {!c.eligible && (
                              <span className="text-[10px] text-terracotta bg-terracotta-soft font-semibold rounded-full px-2 py-0.5 border border-terracotta/20">
                                NCCT Upskilling Triggered (&lt; 3.5)
                              </span>
                            )}
                            {index === 0 && c.eligible && !isSelected && (
                              <span className="text-[10px] bg-marigold/20 text-marigold-deep font-semibold rounded-full px-2 py-0.5 border border-marigold/30">
                                Top Fair Candidate
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-ink-soft mt-1">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-marigold text-marigold" />{c.worker.rating}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-teal" />{c.distanceKm} km away</span>
                            <span className="flex items-center gap-1 text-teal-deep font-medium"><Clock className="w-3 h-3" />idle {c.idleHours} hrs</span>
                            <span className="text-teal-deep font-medium text-[11px]">Coop Floor: ₹{c.hourlyFloor || category.baseRate}/hr</span>
                          </div>

                          {/* Worker Verified Skills Chips */}
                          {c.worker.skills && c.worker.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {c.worker.skills.map((sk) => {
                                const isMatched = (c.matchedSkills && c.matchedSkills.includes(sk)) || selectedSkill === sk;
                                return (
                                  <span
                                    key={sk}
                                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                      isMatched
                                        ? "bg-teal/15 text-teal-deep border-teal/30 font-semibold"
                                        : "bg-paper-line/30 text-ink-soft border-paper-line/50"
                                    }`}
                                  >
                                    {sk}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Explainable AI Rationale */}
                          {c.aiMatchReason && (
                            <div className="text-[11px] text-teal-deep bg-teal/[0.04] px-2 py-1 rounded border border-teal/10 mt-1.5 font-medium">
                              {c.aiMatchReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-paper-line/50 gap-2">
                        <div className="flex flex-col items-start sm:items-end">
                          <div className="text-sm font-bold text-teal-deep font-mono">
                            {c.score} <span className="text-[10px] font-sans text-ink-soft font-normal">pts</span>
                          </div>
                          <span className="text-[10px] text-ink-soft">composite score</span>
                        </div>

                        {c.eligible ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkerId(c.worker.id);
                              book(category.id, c.worker.id);
                            }}
                            disabled={loading || (!!job && job.status !== "completed" && job.status !== "no_match")}
                            className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                              isSelected
                                ? "bg-teal text-white hover:bg-teal-deep"
                                : "bg-white text-teal-deep border border-teal/40 hover:bg-teal hover:text-white"
                            }`}
                            title={`Choose ${c.worker.name} directly`}
                          >
                            <span>{isSelected ? `Book Now` : `Choose`}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="mt-2 text-[10px] text-terracotta bg-terracotta-soft/70 px-2 py-1 rounded border border-terracotta/30 font-medium text-center">
                            In NCCT Training
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Algorithmic Breakdown Sub-row */}
                    <div className="mt-2.5 pt-2 border-t border-paper-line/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft font-mono">
                      <span>Proximity: <strong className="text-ink">{proximityScore}</strong></span>
                      <span>+ Idle Fairness: <strong className="text-teal font-semibold">{idleScore}</strong></span>
                      <span>+ AI Skill Match: <strong className="text-teal font-bold">{skillBonus}</strong></span>
                      <span>+ Safety Gate: <strong className="text-ink">{qualityScore}</strong></span>
                      {!c.eligible && <span className="text-terracotta font-sans text-[10px] ml-auto">Excluded from auto-dispatch until upskilled</span>}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="text-xs text-ink-soft mt-2.5">
              💡 <strong>Cooperative Equity Principle:</strong> You have the freedom to pick any verified cooperative worker of your choice, or rely on JanSahayak&rsquo;s automated fair rotation to distribute livelihood evenly without platform commission cuts.
            </p>
          </div>
        )}

        {/* Verifiable Credentials Modal */}
        {selectedWorkerForEShram && (
          <EShramModal
            worker={selectedWorkerForEShram}
            onClose={() => setSelectedWorkerForEShram(null)}
          />
        )}

        {/* Cooperative Escrow Receipt Modal */}
        {receiptJob && (
          <EscrowReceiptModal
            jobId={receiptJob.id}
            categoryName={
              categories.find((c) => c.id === receiptJob.categoryId)?.name || receiptJob.categoryId
            }
            amount={receiptJob.amount}
            consumerName={consumerDisplayName}
            onClose={() => setReceiptJob(null)}
          />
        )}
      </main>
    </div>
  );
}

function JobTracker({
  job,
  onReset,
  onOpenReceipt,
}: {
  job: Job;
  onReset: () => void;
  onOpenReceipt?: (job: Job) => void;
}) {
  const { t, language } = useLanguage();
  const latestOffer = [...job.offerLog].reverse().find((o) => o.outcome === "offered" || o.outcome === "accepted");
  const acceptedWorker = job.offerLog.find((o) => o.outcome === "accepted") ?? latestOffer;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-teal-deep">
          {language === "hi" ? "बुकिंग स्थिति" : language === "ml" ? "ബുക്കിംഗ് സ്റ്റാറ്റസ്" : "Booking Status"}
        </span>
        {(job.status === "completed" || job.status === "no_match") && (
          <button onClick={onReset} className="text-xs text-teal hover:underline font-medium cursor-pointer">
            {language === "hi" ? "दूसरी सेवा बुक करें" : language === "ml" ? "മറ്റൊരു സേവനം ബുക്ക് ചെയ്യുക" : "Book another"}
          </button>
        )}
      </div>

      {job.status === "matching" && (
        <p className="text-sm">
          {language === "hi"
            ? "आपके सहकारी क्लस्टर में सबसे निष्पक्ष उपलब्ध श्रमिक की तलाश जारी है..."
            : language === "ml"
            ? "നിങ്ങളുടെ ക്ലസ്റ്ററിൽ അനുയോജ്യനായ തൊഴിലാളിയെ കണ്ടെത്തുന്നു..."
            : "Finding the fairest available worker in your cooperative cluster…"}
        </p>
      )}

      {job.status === "offered" && (
        <div>
          <p className="text-sm">
            {language === "hi" ? (
              <>
                काम <strong>{latestOffer?.workerName ?? "पात्र श्रमिक"}</strong> को भेजा गया — मोबाइल (व्हाट्सएप/आईवीआर) पर स्वीकृति की प्रतीक्षा है…
              </>
            ) : language === "ml" ? (
              <>
                ഓഫർ <strong>{latestOffer?.workerName ?? "തൊഴിലാളി"}</strong> ക്ക് അയച്ചു — മൊബൈൽ (വാട്ട്സ്ആപ്പ്/വോയ്സ്) സ്ഥിരീകരണത്തിനായി കാത്തിരിക്കുന്നു…
              </>
            ) : (
              <>
                Job offered to <strong>{latestOffer?.workerName ?? "eligible worker"}</strong> — waiting for them to accept on their phone (WhatsApp / IVR)…
              </>
            )}
          </p>
          {(job.selectedSkill || job.aiMatchReason) && (
            <div className="mt-2 text-xs bg-teal/[0.04] p-2 rounded-lg border border-teal/15 text-teal-deep space-y-0.5">
              {job.selectedSkill && (
                <div>🎯 <strong>Matched Micro-Skill:</strong> {job.selectedSkill}</div>
              )}
              {job.aiMatchReason && (
                <div className="text-ink-soft text-[11px]">{job.aiMatchReason}</div>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/worker"
              className="inline-flex items-center gap-1.5 rounded-full bg-teal text-paper px-3.5 py-1.5 text-xs font-medium hover:bg-teal-deep shadow-xs transition-colors"
            >
              {language === "hi"
                ? "श्रमिक स्वीकृति सिम्युलेट करें (श्रमिक दृश्य खोलें) →"
                : language === "ml"
                ? "തൊഴിലാളി സ്വീകരിക്കുന്നത് കാണുക (വർക്കർ പേജ്) →"
                : "Simulate Worker Acceptance (Open Worker View) →"}
            </Link>
          </div>
        </div>
      )}

      {job.status === "accepted" && (
        <div>
          <p className="text-sm">
            {language === "hi" ? (
              <>
                <strong>{acceptedWorker?.workerName ?? "श्रमिक"}</strong> ने आपका काम स्वीकार कर लिया है और रवाना हो चुके हैं। फिक्स्ड सहकारी दर: <strong>₹{job.amount}</strong>।
              </>
            ) : language === "ml" ? (
              <>
                <strong>{acceptedWorker?.workerName ?? "തൊഴിലാളി"}</strong> ജോലി സ്വീകരിച്ചു, ഉടൻ എത്തിച്ചേരും. സ്ഥിര നിരക്ക്: <strong>₹{job.amount}</strong>.
              </>
            ) : (
              <>
                <strong>{acceptedWorker?.workerName ?? "Worker"}</strong> accepted your booking and is on the way. Fixed cooperative rate: <strong>₹{job.amount}</strong>.
              </>
            )}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/worker"
              className="inline-flex items-center gap-1.5 rounded-full bg-marigold text-teal-deep px-3.5 py-1.5 text-xs font-medium hover:bg-marigold-deep shadow-xs transition-colors"
            >
              {language === "hi"
                ? "काम पूरा होना सिम्युलेट करें (श्रमिक दृश्य में) →"
                : language === "ml"
                ? "ജോലി പൂർത്തിയാക്കുന്നത് കാണുക (വർക്കർ പേജ്) →"
                : "Simulate Completing Job in Worker View →"}
            </Link>
          </div>
        </div>
      )}

      {job.status === "completed" && (
        <div>
          <p className="text-sm text-teal-deep font-medium">
            {language === "hi"
              ? `सेवा संपन्न! एस्क्रो द्वारा सुरक्षित भुगतान। ₹${(job.amount * 0.015).toFixed(2)} (1.5%) स्वतः सहकारी स्वास्थ्य कल्याण कोष में जमा हो गए।`
              : language === "ml"
              ? `സേവനം പൂർത്തിയായി! ₹${(job.amount * 0.015).toFixed(2)} (1.5%) തുക സഹകരണ ക്ഷേമനിധിയിലേക്ക് മാറ്റി.`
              : `Service completed and paid via escrow! ₹${(job.amount * 0.015).toFixed(2)} (1.5%) went to the cooperative welfare pool automatically.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {onOpenReceipt && (
              <button
                type="button"
                onClick={() => onOpenReceipt(job)}
                className="rounded-full bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-emerald-800 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                {language === "hi" ? "सहकारी एस्क्रो रसीद देखें" : language === "ml" ? "എസ്ക്രോ രസീത് കാണുക" : "View Escrow Receipt"}
              </button>
            )}
            <button
              onClick={onReset}
              className="rounded-full bg-teal text-paper px-3.5 py-1.5 text-xs font-medium hover:bg-teal-deep shadow-xs transition-colors cursor-pointer"
            >
              {language === "hi" ? "दूसरी सेवा बुक करें" : language === "ml" ? "മറ്റൊരു സേവനം ബുക്ക് ചെയ്യുക" : "Book Another Service"}
            </button>
            <Link
              href="/admin"
              className="text-xs text-teal hover:underline font-medium"
            >
              {language === "hi"
                ? "कल्याण कोष व एस्क्रो खाता देखें →"
                : language === "ml"
                ? "ക്ഷേമനിധി ലെഡ്ജർ പരിശോധിക്കുക →"
                : "View Welfare Pool & Escrow in Admin Ledger →"}
            </Link>
          </div>
        </div>
      )}

      {job.status === "no_match" && (
        <div>
          <p className="text-sm text-terracotta">
            {language === "hi"
              ? "वर्तमान में कोई पात्र श्रमिक उपलब्ध नहीं है। सभी काम में व्यस्त हैं या कौशल उन्नयन में हैं।"
              : language === "ml"
              ? "നിലവിൽ തൊഴിലാളികൾ ലഭ്യമല്ല. എല്ലാവരും തിരക്കിലാണ്."
              : "No eligible worker available right now. All candidates were idle-locked or routed to upskilling."}
          </p>
          <button onClick={onReset} className="mt-2 text-xs text-teal underline font-medium cursor-pointer">
            {language === "hi" ? "पुनः प्रयास करें या दूसरी सेवा चुनें" : language === "ml" ? "വീണ്ടും ശ്രമിക്കുക" : "Try again or select another service"}
          </button>
        </div>
      )}
    </div>
  );
}
