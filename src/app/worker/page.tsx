"use client";

import { useEffect, useState, useCallback } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import EShramModal from "@/components/EShramModal";
import EscrowReceiptModal from "@/components/EscrowReceiptModal";
import SosDistressModal from "@/components/SosDistressModal";
import {
  Wallet,
  Star,
  MessageCircle,
  CheckCircle2,
  Volume2,
  PhoneCall,
  Languages,
  Radio,
  PhoneOff,
  Send,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Award,
  FileText,
  BookOpen,
  Coffee,
  Sparkles,
} from "lucide-react";

type WorkerOption = {
  id: string;
  name: string;
  categoryId: string;
  hasPendingOffer?: boolean;
  hasActiveJob?: boolean;
};

type Inbox = {
  worker: {
    id: string;
    name: string;
    rating: number;
    walletBalance: number;
    completedJobs: number;
    upskilling: boolean;
    skills?: string[];
    experienceYears?: number;
    certifications?: string[];
    priceTier?: "Standard" | "Senior" | "Master Craftsman";
    hourlyFloor?: number;
    uanNumber?: string;
    ncoCode?: string;
    areaLabel?: string;
    phone?: string;
    dutyStatus?: "available" | "upskilling" | "off_duty";
  };
  pendingJob: {
    id: string;
    categoryName: string;
    amount: number;
    selectedSkill?: string | null;
    issueQuery?: string | null;
    aiMatchReason?: string | null;
    priceTier?: string | null;
  } | null;
  activeJob: {
    id: string;
    categoryName: string;
    amount: number;
    selectedSkill?: string | null;
  } | null;
  recentCompleted: { id: string; categoryName: string; amount: number }[];
};

const MESSAGES = {
  en: {
    incoming: "🔔 Incoming Job Offer (Cooperative Dispatch)",
    accept: "Accept Job",
    decline: "Decline",
    onAssignment: "⚡ On Assignment",
    markComplete: "Mark Job Complete",
    noJobs: "No jobs waiting right now. Your turn in the rotational equity queue will trigger an automated WhatsApp / IVR call.",
    listen: "🔊 Listen in Bhashini AI Voice",
    playing: "Speaking Audio…",
    ivrTitle: "Automated IVR Dispatch Call (1800-PACS-GIG)",
    ivrDesc: "Simulating Bhashini Interactive Voice Response for basic feature-phone workers",
    dial1: "Press 1: Accept Job",
    dial2: "Press 2: Decline Offer",
  },
  hi: {
    incoming: "🔔 नया काम उपलब्ध (सहकारी मंच)",
    accept: "स्वीकार करें (Accept)",
    decline: "मना करें (Decline)",
    onAssignment: "⚡ काम प्रगति पर है",
    markComplete: "काम पूरा हुआ (Mark Complete)",
    noJobs: "वर्तमान में कोई काम प्रतीक्षारत नहीं है। कॉपरेटिव रोटेशनल कतार में आपकी बारी आते ही कॉल या व्हाट्सएप संदेश मिलेगा।",
    listen: "🔊 भाषिणी वॉयस सुनें (Bhashini AI)",
    playing: "ऑडियो चल रहा है…",
    ivrTitle: "स्वचालित आईवीआर वॉयस कॉल (1800-PACS-GIG)",
    ivrDesc: "फीचर फोन श्रमिकों के लिए भाषिणी स्वचालित वॉयस कॉल प्रणाली",
    dial1: "1 दबाएं: काम स्वीकार करें",
    dial2: "2 दबाएं: मना करें",
  },
  ml: {
    incoming: "🔔 പുതിയ ജോലി ഓഫർ (സഹകരണ സംഘം)",
    accept: "സ്വീകരിക്കുക (Accept)",
    decline: "നിരസിക്കുക (Decline)",
    onAssignment: "⚡ ജോലി പുരോഗമിക്കുന്നു",
    markComplete: "ജോലി പൂർത്തിയായി (Complete)",
    noJobs: "ഇപ്പോൾ പുതിയ ജോലികൾ ലഭ്യമല്ല. റൊട്ടേഷണൽ ഇക്വിറ്റി മുൻഗണന പ്രകാരം അടുത്ത ജോലി നിങ്ങളുടെ വാട്ട്സ്ആപ്പ്/വോയ്സ് വഴി അറിയിക്കും.",
    listen: "🔊 ഭാഷിണി വോയ്സ് കേൾക്കുക (Bhashini AI)",
    playing: "ശബ്ദം കേൾപ്പിക്കുന്നു…",
    ivrTitle: "ഓട്ടോമേറ്റഡ് ഐവിആർ കോൾ (1800-PACS-GIG)",
    ivrDesc: "സാധാരണ ഫോണുകളുള്ള തൊഴിലാളികൾക്കായുള്ള ഭാഷിണി വോയ്സ് സർവീസ്",
    dial1: "1 അമർത്തുക: സ്വീകരിക്കാൻ",
    dial2: "2 അമർത്തുക: നിരസിക്കാൻ",
  },
};

export default function WorkerPage() {
  const { user } = useAuth();
  const [options, setOptions] = useState<WorkerOption[]>([]);
  const [workerId, setWorkerId] = useState<string>("");
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Multilingual & Phygital Mode State
  const { language: lang, setLanguage: setLang, t } = useLanguage();
  const [interfaceMode, setInterfaceMode] = useState<"whatsapp" | "ivr">("whatsapp");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // WhatsApp Chat & Webhook Simulation State
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; from: "bot" | "worker"; text: string; timestamp: number }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // New SIH Winning Feature Modal States
  const [showSosModal, setShowSosModal] = useState(false);
  const [showEShramModal, setShowEShramModal] = useState(false);
  const [receiptJobId, setReceiptJobId] = useState<{ id: string; categoryName: string; amount: number } | null>(null);

  const loadWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/workers");
      if (!res.ok) return;
      const d = await res.json();
      const opts: WorkerOption[] = (d.workers ?? []).map((w: WorkerOption) => ({
        id: w.id,
        name: w.name,
        categoryId: w.categoryId,
        hasPendingOffer: !!w.hasPendingOffer,
        hasActiveJob: !!w.hasActiveJob,
      }));

      opts.sort((a, b) => {
        if (a.hasPendingOffer !== b.hasPendingOffer) return a.hasPendingOffer ? -1 : 1;
        if (a.hasActiveJob !== b.hasActiveJob) return a.hasActiveJob ? -1 : 1;
        return 0;
      });

      setOptions(opts);

      setWorkerId((curr) => {
        if (user && user.role === "worker" && opts.some((o) => o.id === user.id)) {
          return curr || user.id;
        }
        if (curr && opts.some((o) => o.id === curr)) {
          return curr;
        }
        return d.activeWorkerId || opts[0]?.id || "";
      });
    } catch (e) {
      console.error("Failed to load workers", e);
    }
  }, [user]);

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 2500);
    return () => clearInterval(interval);
  }, [loadWorkers]);

  const refresh = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}/inbox`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.worker) {
        setInbox(data);
      }
    } catch (e) {
      console.error("Failed to fetch inbox", e);
    }
  }, []);

  const fetchChatMessages = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/webhooks/whatsapp?workerId=${id}&list=true`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.messages) {
        setChatMessages(data.messages);
      }
    } catch (e) {
      console.error("Failed to load WhatsApp messages", e);
    }
  }, []);

  useEffect(() => {
    refresh(workerId);
    fetchChatMessages(workerId);
    const t = setInterval(() => {
      refresh(workerId);
      fetchChatMessages(workerId);
    }, 1800);
    return () => clearInterval(t);
  }, [workerId, refresh, fetchChatMessages]);

  async function sendChatMessage(text: string) {
    if (!text.trim() || !workerId) return;
    setIsSendingChat(true);
    try {
      await fetch(
        `/api/webhooks/whatsapp?workerId=${encodeURIComponent(workerId)}&body=${encodeURIComponent(text.trim())}&lang=${lang}`
      );
      setChatInput("");
      await fetchChatMessages(workerId);
      refresh(workerId);
      loadWorkers();
    } catch (e) {
      console.error("Failed to send WhatsApp message", e);
    } finally {
      setIsSendingChat(false);
    }
  }

  async function handleDutyStatusChange(status: "available" | "upskilling" | "off_duty") {
    if (!workerId) return;
    try {
      const res = await fetch("/api/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, dutyStatus: status }),
      });
      if (res.ok) {
        refresh(workerId);
        loadWorkers();
      }
    } catch (e) {
      console.error("Failed to update duty status", e);
    }
  }

  async function handleCompleteUpskilling() {
    if (!workerId) return;
    try {
      const res = await fetch("/api/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, action: "complete_upskilling" }),
      });
      if (res.ok) {
        setNotice("🎉 Congratulations! NCCT Skill Certificate awarded. Quality floor restored to 4.6★ and duty set to Available.");
        refresh(workerId);
        loadWorkers();
      }
    } catch (e) {
      console.error("Failed to complete upskilling", e);
    }
  }

  function copyCurlCommand() {
    const cmd = `curl -X POST "http://localhost:3000/api/webhooks/whatsapp?lang=${lang}" -d "From=whatsapp:${workerId}&Body=1"`;
    navigator.clipboard.writeText(cmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  }

  function speakOffer() {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported by this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    let text = "";
    let voiceLang = "en-IN";

    if (inbox?.pendingJob) {
      if (lang === "hi") {
        text = `नमस्ते ${inbox.worker.name}. जनसहायक सहकारी मंच से नया काम आया है: ${inbox.pendingJob.categoryName}. फिक्स्ड रेट कार्ड दो सौ उनचास रुपये. काम स्वीकार करने के लिए स्वीकार दबाएं.`;
        voiceLang = "hi-IN";
      } else if (lang === "ml") {
        text = `നമസ്കാരം ${inbox.worker.name}. ജനസഹായക് വഴി പുതിയ ജോലി വന്നിരിക്കുന്നു: ${inbox.pendingJob.categoryName}. നിരക്ക് ₹${inbox.pendingJob.amount}. ജോലി സ്വീകരിക്കാൻ സ്വീകരിക്കുക അമർത്തുക.`;
        voiceLang = "ml-IN";
      } else {
        text = `Hello ${inbox.worker.name}. New cooperative gig job offer: ${inbox.pendingJob.categoryName}. Fixed cooperative rate ₹${inbox.pendingJob.amount}. Press accept to confirm.`;
        voiceLang = "en-IN";
      }
    } else if (inbox?.activeJob) {
      text = `You are on assignment for ${inbox.activeJob.categoryName}. Fixed payout ₹${inbox.activeJob.amount}.`;
      voiceLang = "en-IN";
    } else {
      text = `No jobs waiting right now.`;
      voiceLang = "en-IN";
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }

  async function respond(accept: boolean) {
    if (!inbox?.pendingJob) return;
    try {
      const res = await fetch(`/api/jobs/${inbox.pendingJob.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, accept }),
      });
      const data = await res.json();
      if (!accept) {
        setNotice("Offer declined. The rotational equity engine is routing it to the next eligible cooperative worker.");
        setTimeout(() => setNotice(null), 6000);
      }
      refresh(workerId);
      loadWorkers();
    } catch (e) {
      console.error("Failed to respond to offer", e);
    }
  }

  async function complete() {
    if (!inbox?.activeJob) return;
    try {
      await fetch(`/api/jobs/${inbox.activeJob.id}/complete`, { method: "POST" });
      setNotice("Job marked complete! Escrow payout deposited into your wallet & welfare fee recorded.");
      setTimeout(() => setNotice(null), 6000);
      refresh(workerId);
      loadWorkers();
    } catch (e) {
      console.error("Failed to complete job", e);
    }
  }

  const pendingWorker = options.find((o) => o.hasPendingOffer && o.id !== workerId);
  const activeWorker = options.find((o) => o.hasActiveJob && o.id !== workerId);

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <main className="mx-auto max-w-md sm:max-w-xl md:max-w-2xl w-full px-4 sm:px-5 py-6 flex-1">
        {/* Phygital Header & Bhashini Controls */}
        <div className="mb-4 rounded-xl border border-paper-line bg-white/60 p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-deep">
              <Radio className="w-3.5 h-3.5 text-teal animate-pulse" />
              <span>Phygital Access · Bhashini AI Voice</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-deep font-semibold bg-white/70 px-2.5 py-0.5 rounded-full border border-paper-line shadow-2xs">
              <Languages className="w-3 h-3 text-teal" />
              <span>{lang === "hi" ? "हिन्दी (Navbar)" : lang === "ml" ? "മലയാളം (Navbar)" : "English (Navbar)"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-paper-line text-xs">
            <span className="text-ink-soft">Simulation Channel:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInterfaceMode("whatsapp")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  interfaceMode === "whatsapp" ? "bg-[#075E54] text-white" : "text-ink-soft hover:bg-black/5"
                }`}
              >
                WhatsApp Bot
              </button>
              <button
                onClick={() => setInterfaceMode("ivr")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  interfaceMode === "ivr" ? "bg-teal text-paper" : "text-ink-soft hover:bg-black/5"
                }`}
              >
                IVR Voice Call
              </button>
            </div>
          </div>
        </div>

        {/* Live offer alert banner if another worker received an offer */}
        {pendingWorker && (
          <div className="mb-4 rounded-xl border border-marigold/50 bg-marigold/15 p-3 flex items-center justify-between text-xs animate-pulse">
            <div>
              <span className="font-semibold text-marigold-deep">🔔 Job offer received!</span>
              <p className="text-ink-soft mt-0.5">Offered to <strong>{pendingWorker.name}</strong> ({pendingWorker.categoryId})</p>
            </div>
            <button
              onClick={() => setWorkerId(pendingWorker.id)}
              className="rounded-full bg-teal text-paper px-3 py-1 font-medium hover:bg-teal-deep text-xs ml-2 shrink-0"
            >
              Switch to {pendingWorker.name.split(" ")[0]}
            </button>
          </div>
        )}

        {!pendingWorker && activeWorker && (
          <div className="mb-4 rounded-xl border border-teal/30 bg-teal/10 p-3 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-teal-deep">⚡ Active job in progress</span>
              <p className="text-ink-soft mt-0.5">With <strong>{activeWorker.name}</strong> ({activeWorker.categoryId})</p>
            </div>
            <button
              onClick={() => setWorkerId(activeWorker.id)}
              className="rounded-full bg-teal text-paper px-3 py-1 font-medium hover:bg-teal-deep text-xs ml-2 shrink-0"
            >
              Switch to {activeWorker.name.split(" ")[0]}
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-xl border border-paper-line bg-paper px-3 py-2 text-xs text-teal-deep">
            {notice}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="worker-select" className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5 font-medium">
            Simulate logging in as worker:
          </label>
          <select
            id="worker-select"
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="w-full rounded-lg border border-paper-line bg-white/80 px-3 py-2.5 text-sm font-medium shadow-xs focus:border-teal focus:outline-hidden"
          >
            <option value="" disabled>Select a worker…</option>
            {options.map((o) => {
              const statusTag = o.hasPendingOffer
                ? " [🔔 NEW OFFER!]"
                : o.hasActiveJob
                ? " [⚡ ACTIVE JOB]"
                : "";
              return (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.categoryId}){statusTag}
                </option>
              );
            })}
          </select>
        </div>

        {inbox && inbox.worker && (
          <div className="rounded-2xl border border-paper-line bg-white/80 shadow-xs overflow-hidden">
            {/* Worker Identity Header */}
            <div className="bg-teal text-paper px-4 py-3.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-base">{inbox.worker.name}</div>
                <div className="text-xs text-paper/80 flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-marigold text-marigold" /> {inbox.worker.rating}</span>
                  <span>·</span>
                  <span>{inbox.worker.completedJobs} jobs done</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSosModal(true)}
                  className="px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-transform hover:scale-105 cursor-pointer"
                  title="Trigger Emergency Panic Alert to PACS Cooperative Nodal Officer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                  <span>SOS</span>
                </button>
                <div className="text-right">
                  <div className="text-xs text-paper/70">Coop Wallet</div>
                  <div className="flex items-center gap-1 text-base font-semibold"><Wallet className="w-4 h-4 text-marigold" /> ₹{inbox.worker.walletBalance.toFixed(0)}</div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5">
              {/* Worker Self-Determined Duty Status Selector */}
              <div className="rounded-xl border border-paper-line bg-paper/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-deep uppercase tracking-wide flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-teal animate-pulse" />
                    <span>Worker Duty Status (Self-Determined)</span>
                  </span>
                  <span className="text-[10px] text-ink-soft bg-white px-2 py-0.5 rounded-full border border-paper-line font-medium">
                    Cooperative Agency
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDutyStatusChange("available")}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      inbox.worker.dutyStatus === "available" || (!inbox.worker.dutyStatus && !inbox.worker.upskilling)
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-ink-soft border-paper-line hover:border-emerald-500 hover:text-emerald-800"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span>Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDutyStatusChange("upskilling")}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      inbox.worker.dutyStatus === "upskilling" || inbox.worker.upskilling
                        ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                        : "bg-white text-ink-soft border-paper-line hover:border-amber-500 hover:text-amber-800"
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>NCCT Upskill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDutyStatusChange("off_duty")}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      inbox.worker.dutyStatus === "off_duty"
                        ? "bg-slate-700 text-white border-slate-800 shadow-xs"
                        : "bg-white text-ink-soft border-paper-line hover:border-slate-400 hover:text-slate-800"
                    }`}
                  >
                    <Coffee className="w-3 h-3" />
                    <span>Off-Duty</span>
                  </button>
                </div>
              </div>

              {/* Off-Duty Calm Banner */}
              {inbox.worker.dutyStatus === "off_duty" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 flex items-start gap-2.5">
                  <Coffee className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Off-Duty Rest Mode Active:</strong> You are taking personal rest. No automated dispatches will disturb you, and your queue fairness is preserved without platform penalties. Switch to <strong>Available</strong> when ready to work.
                  </div>
                </div>
              )}

              {/* NCCT Upskilling Interactive Card */}
              {(inbox.worker.dutyStatus === "upskilling" || inbox.worker.upskilling) && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <BookOpen className="w-4 h-4 text-amber-700" />
                        <span>NCCT Trade Skill Enhancement Hub</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {inbox.worker.upskilling
                          ? "Rating dipped below 3.5 floor. Enrolled in supportive cooperative upskilling instead of delisting."
                          : "Voluntary Trade Advancement & High-Voltage Safety Standards (Level 2)"}
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                      100% Free PACS Benefit
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-amber-900 font-medium">
                      <span>Practical Unit 2 of 3: Field Diagnostics & Customer Etiquette</span>
                      <span>67% Complete</span>
                    </div>
                    <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full w-2/3" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60 text-[11px] text-amber-800">
                    <span>💡 Stipend: ₹150 / session funded by 1.5% Welfare Pool</span>
                    <button
                      type="button"
                      onClick={handleCompleteUpskilling}
                      className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Complete Module & Certify (4.6★)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Worker Verified Skills, Certifications & Price Floor Banner */}
              <div className="rounded-xl border border-paper-line bg-paper/60 p-3 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-teal-deep">🛡️ Trade Tier:</span>
                    <span className="bg-teal/10 text-teal-deep font-bold px-2 py-0.5 rounded-full border border-teal/20">
                      {inbox.worker.priceTier || "Standard"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEShramModal(true)}
                      className="text-[10px] bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-emerald-200 transition-colors cursor-pointer"
                      title="Inspect Official e-Shram Digital Card"
                    >
                      <Award className="w-3 h-3 text-emerald-700" />
                      e-Shram Card
                    </button>
                    <span className="text-ink-soft">({inbox.worker.experienceYears || 5} yrs exp)</span>
                  </div>
                  <div className="text-teal-deep font-semibold">
                    <span>Cooperative Floor: </span>
                    <span className="font-mono text-ink font-bold">₹{inbox.worker.hourlyFloor || 249}/hr</span>
                    <span className="text-[10px] text-ink-soft ml-1">(Protected)</span>
                  </div>
                </div>

                {/* Micro-Skills Badges */}
                {inbox.worker.skills && inbox.worker.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-paper-line/60">
                    <span className="text-[11px] font-semibold text-ink-soft">Verified Skills:</span>
                    {inbox.worker.skills.map((sk) => (
                      <span key={sk} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-paper-line text-ink font-medium shadow-2xs">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {inbox.worker.certifications && inbox.worker.certifications.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ink-soft">
                    <span className="font-semibold">Credentials:</span>
                    {inbox.worker.certifications.map((cert) => (
                      <span key={cert} className="bg-marigold/10 text-marigold-deep px-1.5 py-0.5 rounded border border-marigold/20 font-medium">
                        🎖️ {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bhashini Voice Assistant Trigger Bar */}
              {(inbox.pendingJob || inbox.activeJob) && (
                <div className="flex items-center justify-between bg-teal/5 border border-teal/20 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2 text-teal-deep font-semibold">
                    <Volume2 className={`w-4 h-4 text-teal ${isPlayingAudio ? "animate-bounce" : ""}`} />
                    <span>{isPlayingAudio ? MESSAGES[lang].playing : MESSAGES[lang].listen}</span>
                  </div>
                  <button
                    onClick={speakOffer}
                    disabled={isPlayingAudio}
                    className="px-3 py-1 rounded-full bg-teal text-paper font-medium hover:bg-teal-deep text-xs shadow-2xs transition-all disabled:opacity-60"
                  >
                    {isPlayingAudio ? "Playing…" : "Play Voice"}
                  </button>
                </div>
              )}

              {/* WHATSAPP MODE */}
              {interfaceMode === "whatsapp" && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#075E54]/40 bg-[#ECE5DD] overflow-hidden shadow-sm flex flex-col">
                    {/* WhatsApp Header */}
                    <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white shadow-2xs">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs leading-tight">JanSahayak Dispatch Bot</div>
                          <div className="text-[10px] text-emerald-200">Online · Cooperative Rotational Queue</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-[#128C7E] px-2 py-0.5 rounded-full font-mono text-white/90">
                          {inbox.worker.phone || workerId}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Chat Body */}
                    <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto bg-[radial-gradient(#075e54_0.75px,transparent_0.75px)] [background-size:16px_16px] bg-[#ECE5DD]">
                      {/* Bot Welcome Bubble */}
                      <div className="max-w-[88%] bg-white rounded-lg rounded-tl-xs p-2.5 shadow-2xs text-xs text-ink leading-relaxed">
                        <p className="font-semibold text-[#075E54] text-[11px] mb-0.5">JanSahayak PACS Ernakulam</p>
                        <p>
                          Namaste {inbox.worker.name}! Welcome to JanSahayak Cooperative Dispatch. When a gig is booked in your cluster, you will receive an instant prompt here or on your registered mobile.
                        </p>
                        <span className="text-[9px] text-ink-soft float-right mt-1">10:00 AM</span>
                      </div>

                      {/* Chat Messages */}
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.from === "worker" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[88%] p-2.5 shadow-2xs text-xs leading-relaxed whitespace-pre-line ${
                              msg.from === "worker"
                                ? "bg-[#DCF8C6] text-ink rounded-lg rounded-tr-xs"
                                : "bg-white text-ink rounded-lg rounded-tl-xs"
                            }`}
                          >
                            {msg.from === "bot" && (
                              <p className="font-semibold text-[#075E54] text-[11px] mb-0.5">JanSahayak Dispatch</p>
                            )}
                            <p>{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-ink-soft mt-1">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {msg.from === "worker" && <span className="text-blue-500 font-bold">✓✓</span>}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pending Job Prompt Card */}
                      {inbox.pendingJob && (
                        <div className="bg-white rounded-xl p-3 border-l-4 border-[#128C7E] shadow-2xs text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[#075E54] font-bold text-[11px]">
                            <span>{MESSAGES[lang].incoming}</span>
                            <span className="text-marigold-deep bg-marigold/20 px-1.5 py-0.5 rounded text-[10px]">
                              Turn Match
                            </span>
                          </div>
                          <p className="font-semibold text-ink">{inbox.pendingJob.categoryName} at Kochi</p>
                          {inbox.pendingJob.selectedSkill && (
                            <div className="text-[11px] text-teal-deep font-semibold bg-teal/10 px-2 py-0.5 rounded border border-teal/20">
                              🎯 AI Matched for Task: {inbox.pendingJob.selectedSkill}
                            </div>
                          )}
                          {inbox.pendingJob.aiMatchReason && (
                            <p className="text-[10px] text-ink-soft italic">
                              {inbox.pendingJob.aiMatchReason}
                            </p>
                          )}
                          <p className="text-ink-soft">
                            Fixed Rate: ₹{inbox.pendingJob.amount} · Payout: ₹{(inbox.pendingJob.amount * 0.985).toFixed(2)}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => sendChatMessage("1")}
                              className="flex-1 rounded-full bg-[#075E54] hover:bg-[#128C7E] text-white font-bold text-[11px] py-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              Reply &apos;1&apos; (Accept)
                            </button>
                            <button
                              onClick={() => sendChatMessage("2")}
                              className="flex-1 rounded-full border border-paper-line bg-gray-100 hover:bg-gray-200 text-ink-soft text-[11px] py-1.5 transition-all cursor-pointer"
                            >
                              Reply &apos;2&apos; (Decline)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Active Job Card */}
                      {inbox.activeJob && (
                        <div className="bg-amber-50 rounded-xl p-3 border-l-4 border-marigold shadow-2xs text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-teal-deep font-bold text-[11px]">
                            <span>⚡ Assignment In Progress</span>
                            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                              Active
                            </span>
                          </div>
                          <p className="font-semibold text-ink">
                            {inbox.activeJob.categoryName} · ₹{inbox.activeJob.amount}
                          </p>
                          <button
                            onClick={() => sendChatMessage("DONE")}
                            className="w-full rounded-full bg-marigold hover:bg-marigold-deep text-teal-deep font-bold text-[11px] py-1.5 shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reply &apos;DONE&apos; to Complete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Chips */}
                    <div className="bg-[#f0f2f5] px-3 py-1.5 border-t border-paper-line flex items-center gap-1.5 overflow-x-auto text-[11px]">
                      <button
                        onClick={() => sendChatMessage("1")}
                        disabled={isSendingChat}
                        className="px-2.5 py-1 rounded-full bg-white border border-paper-line text-teal-deep hover:bg-teal/10 font-medium whitespace-nowrap shadow-2xs transition-all cursor-pointer"
                      >
                        👉 1 (Accept)
                      </button>
                      <button
                        onClick={() => sendChatMessage("2")}
                        disabled={isSendingChat}
                        className="px-2.5 py-1 rounded-full bg-white border border-paper-line text-terracotta hover:bg-terracotta/10 font-medium whitespace-nowrap shadow-2xs transition-all cursor-pointer"
                      >
                        👉 2 (Decline)
                      </button>
                      <button
                        onClick={() => sendChatMessage("DONE")}
                        disabled={isSendingChat}
                        className="px-2.5 py-1 rounded-full bg-white border border-paper-line text-emerald-700 hover:bg-emerald-50 font-medium whitespace-nowrap shadow-2xs transition-all cursor-pointer"
                      >
                        👉 DONE (Finish)
                      </button>
                      <button
                        onClick={() => sendChatMessage("WALLET")}
                        disabled={isSendingChat}
                        className="px-2.5 py-1 rounded-full bg-white border border-paper-line text-ink-soft hover:bg-gray-100 font-medium whitespace-nowrap shadow-2xs transition-all cursor-pointer"
                      >
                        💼 WALLET
                      </button>
                    </div>

                    {/* Chat Input Bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendChatMessage(chatInput);
                      }}
                      className="bg-[#f0f2f5] px-2.5 py-2 flex items-center gap-2 border-t border-paper-line/80"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type 1, 2, DONE, WALLET or message..."
                        className="flex-1 bg-white rounded-full px-3.5 py-1.5 text-xs text-ink outline-hidden border border-paper-line shadow-2xs placeholder:text-ink-soft/60"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isSendingChat}
                        className="w-8 h-8 rounded-full bg-[#075E54] hover:bg-[#128C7E] text-white flex items-center justify-center shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Accordion: Live Webhook & Twilio / Meta Production Setup */}
                  <div className="rounded-xl border border-paper-line bg-white/70 overflow-hidden text-xs">
                    <button
                      onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-ink font-semibold hover:bg-black/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-teal-deep">
                        <Terminal className="w-3.5 h-3.5 text-teal" />
                        <span>Live WhatsApp Webhook & Twilio / Meta Setup</span>
                      </div>
                      {showWebhookGuide ? (
                        <ChevronUp className="w-3.5 h-3.5 text-ink-soft" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-ink-soft" />
                      )}
                    </button>

                    {showWebhookGuide && (
                      <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-paper-line/60 bg-white/40">
                        <div>
                          <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                            Active Webhook URL
                          </span>
                          <div className="mt-1 font-mono text-[11px] bg-ink/5 p-2 rounded-lg text-teal-deep break-all select-all">
                            http://localhost:3000/api/webhooks/whatsapp
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                              Test Via Terminal (cURL)
                            </span>
                            <button
                              onClick={copyCurlCommand}
                              className="flex items-center gap-1 text-[10px] text-teal hover:underline cursor-pointer"
                            >
                              {copiedCurl ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy cURL
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="font-mono text-[10px] bg-ink text-paper p-2.5 rounded-lg overflow-x-auto">
                            {`curl -X POST http://localhost:3000/api/webhooks/whatsapp \\
  -d "From=whatsapp:${workerId}&Body=1"`}
                          </pre>
                        </div>

                        <div className="text-[11px] text-ink-soft space-y-1">
                          <p className="font-medium text-ink">How to connect real WhatsApp (Free):</p>
                          <ol className="list-decimal list-inside space-y-0.5 pl-1">
                            <li>Run <code className="bg-black/5 px-1 rounded">npx ngrok http 3000</code> to get a public URL.</li>
                            <li>In Twilio Console &gt; WhatsApp Sandbox, paste: <code className="bg-black/5 px-1 rounded">https://your-ngrok-url/api/webhooks/whatsapp</code> as the incoming webhook.</li>
                            <li>Send &apos;1&apos; or &apos;WALLET&apos; from your real WhatsApp app to control the cooperative dispatch live!</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IVR VOICE CALL SIMULATION MODE */}
              {interfaceMode === "ivr" && (
                <div className="rounded-2xl border border-teal/40 bg-teal-deep text-paper p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 text-xs border-b border-white/20 pb-2">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
                      <PhoneCall className="w-3.5 h-3.5" /> Call Active · 1800-PACS-GIG
                    </span>
                    <span className="text-[10px] text-paper/70">IVR Simulated</span>
                  </div>

                  <p className="text-xs text-paper/80 mb-4">{MESSAGES[lang].ivrDesc}</p>

                  {inbox.pendingJob ? (
                    <div>
                      <div className="bg-white/10 rounded-xl p-3 text-xs mb-4">
                        <p className="font-semibold text-emerald-300 mb-1">Incoming Gig Prompt (AI Match):</p>
                        <p>&ldquo;Press 1 to Accept {inbox.pendingJob.categoryName}{inbox.pendingJob.selectedSkill ? ` (${inbox.pendingJob.selectedSkill})` : ""} for ₹{inbox.pendingJob.amount}, or Press 2 to Decline.&rdquo;</p>
                        {inbox.pendingJob.aiMatchReason && (
                          <p className="text-[10px] text-emerald-200/80 mt-1 italic">{inbox.pendingJob.aiMatchReason}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => respond(true)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <PhoneCall className="w-4 h-4" /> {MESSAGES[lang].dial1}
                        </button>
                        <button
                          onClick={() => respond(false)}
                          className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <PhoneOff className="w-4 h-4" /> {MESSAGES[lang].dial2}
                        </button>
                      </div>
                    </div>
                  ) : inbox.activeJob ? (
                    <div className="text-center py-2">
                      <p className="text-xs mb-3">On-Duty: {inbox.activeJob.categoryName} (₹{inbox.activeJob.amount})</p>
                      <button
                        onClick={complete}
                        className="w-full rounded-full bg-marigold text-teal-deep font-bold text-xs py-2.5"
                      >
                        Complete Job
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-paper/70 text-center py-4">IVR Line Standby. Waiting for rotational dispatch match.</p>
                  )}
                </div>
              )}

              {!inbox.pendingJob && !inbox.activeJob && (
                <div className="text-center py-6 text-ink-soft">
                  <p className="text-sm font-medium">No jobs waiting right now.</p>
                  <p className="text-xs text-ink-soft/70 mt-1">{MESSAGES[lang].noJobs}</p>
                </div>
              )}

              {inbox.recentCompleted && inbox.recentCompleted.length > 0 && (
                <div className="pt-3 border-t border-paper-line">
                  <p className="text-xs uppercase tracking-wider text-ink-soft font-medium mb-2">Recently Completed</p>
                  <ul className="text-sm space-y-1.5">
                    {inbox.recentCompleted.map((j) => (
                      <li key={j.id} className="flex justify-between items-center text-ink-soft bg-paper/60 px-2.5 py-1.5 rounded-md text-xs">
                        <span className="font-medium text-ink">{j.categoryName}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReceiptJobId(j)}
                            className="text-[10px] text-teal-deep bg-teal/10 hover:bg-teal/20 px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3" /> Receipt
                          </button>
                          <span className="text-teal font-semibold">+₹{j.amount}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Worker SOS Distress Panic Modal */}
        {showSosModal && inbox?.worker && (
          <SosDistressModal
            workerId={inbox.worker.id}
            workerName={inbox.worker.name}
            onClose={() => setShowSosModal(false)}
            onSuccess={() => {
              setNotice("🚨 SOS Alert successfully broadcasted to Cooperative Nodal Officer!");
              setTimeout(() => setNotice(null), 8000);
            }}
          />
        )}

        {/* Worker e-Shram Digital Card Modal */}
        {showEShramModal && inbox?.worker && (
          <EShramModal
            worker={{
              id: inbox.worker.id,
              name: inbox.worker.name,
              rating: inbox.worker.rating,
              priceTier: inbox.worker.priceTier,
              uanNumber: inbox.worker.uanNumber,
              ncoCode: inbox.worker.ncoCode,
              areaLabel: inbox.worker.areaLabel,
              certifications: inbox.worker.certifications,
            }}
            onClose={() => setShowEShramModal(false)}
          />
        )}

        {/* Work Order & Escrow Receipt Modal */}
        {receiptJobId && (
          <EscrowReceiptModal
            jobId={receiptJobId.id}
            categoryName={receiptJobId.categoryName}
            amount={receiptJobId.amount}
            workerName={inbox?.worker?.name}
            onClose={() => setReceiptJobId(null)}
          />
        )}
      </main>
    </div>
  );
}

function ChatBubble({ children, role }: { children: React.ReactNode; role?: "incoming" | "active" }) {
  const bg = role === "active" ? "bg-marigold/10 border border-marigold/30" : "bg-black/[0.03] border border-paper-line/60";
  return <div className={`rounded-xl px-3.5 py-3 ${bg}`}>{children}</div>;
}
