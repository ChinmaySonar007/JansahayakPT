"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  Briefcase,
  User,
  Zap,
  Droplet,
  Hammer,
  Paintbrush,
  Home as HomeIcon,
  HeartHandshake,
  Sprout,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  CheckCircle2,
} from "lucide-react";

type Category = { id: string; name: string; icon: string; baseRate: number };
type Cooperative = { id: string; name: string; area: string };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Droplet,
  Hammer,
  Paintbrush,
  Home: HomeIcon,
  HeartHandshake,
  Sprout,
  Sparkles,
};

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "consumer" ? "consumer" : "worker";
  const [role, setRole] = useState<"worker" | "consumer">(initialRole);

  const { login } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);

  // Worker Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("electrician");
  const [selectedCoopId, setSelectedCoopId] = useState("coop-kochi-central");
  const [eshramNumber, setEshramNumber] = useState("");
  const [areaLabel, setAreaLabel] = useState("Kochi, Kerala");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) {
          setCategories(d.categories);
          if (d.categories[0]) setSelectedCategory(d.categories[0].id);
        }
      })
      .catch(console.error);

    fetch("/api/admin/summary")
      .then((r) => r.json())
      .then((d) => {
        if (d.cooperatives) {
          setCooperatives(d.cooperatives);
          if (d.cooperatives[0]) setSelectedCoopId(d.cooperatives[0].id);
        }
      })
      .catch(console.error);
  }, []);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, string> = {
        role,
        name: name.trim(),
        phone: phone.trim() || "+91 98460 " + Math.floor(10000 + Math.random() * 90000),
        areaLabel,
      };

      if (role === "worker") {
        payload.categoryId = selectedCategory;
        payload.coopId = selectedCoopId;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || "Registration failed");
      }

      login(data.user);
      setSuccessMsg("Registration successful! Cooperative onboarding verified.");

      setTimeout(() => {
        if (role === "worker") {
          router.push("/worker");
        } else {
          router.push("/");
        }
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const { t, language } = useLanguage();
  const currentCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-paper">
      <Nav />
      <main className="mx-auto max-w-2xl w-full px-5 py-10 flex-1">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-marigold/15 text-marigold-deep mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Cooperative Registration
          </span>
          <h1 className="font-display text-3xl text-teal-deep tracking-tight">
            {t.auth.registerTitle}
          </h1>
          <p className="text-ink-soft text-sm mt-1.5">
            {t.auth.registerDesc}
          </p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl border border-paper-line bg-white/60 mb-8 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setRole("worker");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              role === "worker"
                ? "bg-teal text-paper shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-black/5"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{t.auth.tabWorker}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("consumer");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              role === "consumer"
                ? "bg-teal text-paper shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-black/5"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.auth.tabConsumer}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-terracotta/30 bg-terracotta-soft/50 p-3.5 text-xs text-terracotta font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 rounded-xl border border-teal/30 bg-teal/10 p-3.5 text-xs text-teal-deep font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="rounded-2xl border border-paper-line bg-white/80 p-6 shadow-xs space-y-5">
          {role === "worker" && (
            <>
              {/* Step 1: Category Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-soft mb-2">
                  1. Choose Your Trade Skill Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {categories.map((c) => {
                    const Icon = ICONS[c.icon] ?? Sparkles;
                    const active = selectedCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.id)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                          active
                            ? "border-teal bg-teal text-paper shadow-xs"
                            : "border-paper-line bg-white/70 hover:border-teal/50 hover:bg-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{c.name}</span>
                        <span className={`text-[10px] ${active ? "text-paper/80" : "text-ink-soft"}`}>
                          ₹{c.baseRate}/hr fixed
                        </span>
                      </button>
                    );
                  })}
                </div>
                {currentCategory && (
                  <p className="text-[11px] text-teal-deep mt-2 font-medium">
                    ✓ Protected minimum cooperative floor: ₹{currentCategory.baseRate}/hr
                  </p>
                )}
              </div>

              {/* Step 2: Cooperative Affiliation */}
              <div>
                <label htmlFor="coop-select" className="block text-xs uppercase tracking-wider font-semibold text-ink-soft mb-1.5">
                  2. Select Affiliated Cooperative / PACS:
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-ink-soft absolute left-3 top-3" />
                  <select
                    id="coop-select"
                    value={selectedCoopId}
                    onChange={(e) => setSelectedCoopId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-paper-line bg-white text-xs font-medium text-ink focus:border-teal focus:outline-hidden"
                  >
                    {cooperatives.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name} ({co.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "worker" ? "e.g. Ramesh V." : "e.g. Ananya Nair"}
                className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-xs text-ink focus:border-teal focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Mobile Number (for WhatsApp Alerts) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98460 00000"
                className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-xs text-ink focus:border-teal focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Service Cluster / Area
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={areaLabel}
                  onChange={(e) => setAreaLabel(e.target.value)}
                  placeholder="e.g. Kochi, Kerala"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-paper-line bg-white text-xs text-ink focus:border-teal focus:outline-hidden"
                />
              </div>
            </div>

            {role === "worker" && (
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">
                  e-Shram / Aadhaar (Simulated KYC)
                </label>
                <input
                  type="text"
                  value={eshramNumber}
                  onChange={(e) => setEshramNumber(e.target.value)}
                  placeholder="UAN: 1234-5678-9012"
                  className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-xs text-ink focus:border-teal focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {role === "worker" && (
            <div className="rounded-xl bg-teal/5 border border-teal/20 p-3 text-[11px] text-teal-deep flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <span>
                By registering under the cooperative, you will receive rotational equity matches, 
                guaranteed prompt escrow payouts, and 1.5% contribution toward your cooperative health & pension pool.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-teal hover:bg-teal-deep text-paper font-semibold text-sm py-2.5 flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <span>{loading ? "Registering…" : `Complete ${role === "worker" ? "Worker" : "Citizen"} Registration`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch to Sign In */}
        <div className="mt-8 text-center text-xs text-ink-soft">
          Already registered with JanSahayak?{" "}
          <Link
            href={`/login?role=${role}`}
            className="font-semibold text-teal hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            Sign in category-wise here <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-ink-soft text-sm">Loading registration portal…</div>}>
      <SignUpContent />
    </Suspense>
  );
}
