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
  Building2,
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
  Star,
  CheckCircle2,
} from "lucide-react";

type Category = { id: string; name: string; icon: string; baseRate: number };
type Worker = {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
  areaLabel: string;
  completedJobs: number;
};

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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const initialRole = searchParams.get("role") || "worker";
  const [role, setRole] = useState<"worker" | "consumer" | "admin">(
    initialRole === "consumer" || initialRole === "admin" ? initialRole : "worker"
  );

  const { login } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("electrician");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) {
          setCategories(d.categories);
          if (d.categories[0]) {
            setSelectedCategory(d.categories[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Update selected worker when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    fetch(`/api/workers?category=${selectedCategory}`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.candidates ?? []).map((c: { worker: Worker }) => c.worker);
        setWorkers(list);
        if (list[0]) {
          setSelectedWorkerId(list[0].id);
          setPhone(list[0].id);
        }
      })
      .catch(console.error);
  }, [selectedCategory]);

  const categoryWorkers = workers.filter((w) => w.categoryId === selectedCategory);
  const currentCategory = categories.find((c) => c.id === selectedCategory);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let identifier = phone;
      if (role === "worker" && selectedWorkerId) {
        identifier = selectedWorkerId;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          identifier,
          categoryId: role === "worker" ? selectedCategory : undefined,
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || "Login failed");
      }

      login(data.user);

      // Redirect role-wise
      if (role === "worker") {
        router.push("/worker");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-paper">
      <Nav />
      <main className="mx-auto max-w-2xl w-full px-5 py-10 flex-1">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal/10 text-teal-deep mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> SIH26089 Unified Portal
          </span>
          <h1 className="font-display text-3xl text-teal-deep tracking-tight">
            {t.auth.signInTitle}
          </h1>
          <p className="text-ink-soft text-sm mt-1.5">
            {t.auth.signInDesc}
          </p>
        </div>

        {/* Role / Category Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl border border-paper-line bg-white/60 mb-8 shadow-xs">
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
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              role === "admin"
                ? "bg-teal text-paper shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-black/5"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.auth.tabAdmin}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-terracotta/30 bg-terracotta-soft/50 p-3.5 text-xs text-terracotta font-medium">
            {error}
          </div>
        )}

        {/* WORKER LOGIN: CATEGORY-WISE */}
        {role === "worker" && (
          <div className="rounded-2xl border border-paper-line bg-white/80 p-6 shadow-xs">
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-soft mb-2">
                1. Select Your Trade Category:
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
                      className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                        active
                          ? "border-teal bg-teal text-paper shadow-xs"
                          : "border-paper-line bg-white/70 hover:border-teal/50 hover:bg-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{c.name}</span>
                      <span
                        className={`text-[10px] ${
                          active ? "text-paper/80" : "text-ink-soft"
                        }`}
                      >
                        ₹{c.baseRate}/hr card
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-soft mb-2">
                2. Choose Worker Profile in {currentCategory?.name || "Trade"}:
              </label>
              <div className="space-y-2">
                {categoryWorkers.map((w) => {
                  const selected = selectedWorkerId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWorkerId(w.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-teal bg-teal/5 ring-1 ring-teal"
                          : "border-paper-line bg-white/50 hover:border-teal/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{w.name}</span>
                          <span className="text-[10px] bg-paper-line/50 text-ink-soft px-1.5 py-0.5 rounded-sm">
                            {w.areaLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-soft mt-0.5">
                          <span className="flex items-center gap-0.5 text-marigold-deep">
                            <Star className="w-3 h-3 fill-marigold text-marigold" /> {w.rating}
                          </span>
                          <span>·</span>
                          <span>{w.completedJobs} jobs completed</span>
                        </div>
                      </div>
                      {selected && <CheckCircle2 className="w-4 h-4 text-teal" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 pt-3 border-t border-paper-line">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-soft font-medium mb-1">
                    Mobile Number (WhatsApp SIM)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98460 12345"
                    className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-xs text-ink focus:border-teal focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-soft font-medium mb-1">
                    Simulated OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={4}
                    className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-xs tracking-widest text-ink focus:border-teal focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedWorkerId}
                className="w-full rounded-full bg-teal hover:bg-teal-deep text-paper font-semibold text-sm py-2.5 flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <span>
                  {loading
                    ? "Authenticating…"
                    : `Sign In as ${
                        categoryWorkers.find((w) => w.id === selectedWorkerId)?.name || "Worker"
                      }`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* CONSUMER LOGIN */}
        {role === "consumer" && (
          <div className="rounded-2xl border border-paper-line bg-white/80 p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-ink mb-1">Citizen Household Access</h2>
            <p className="text-xs text-ink-soft mb-5">
              Access cooperative on-demand household services at fixed district rates
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setPhone("+91 94470 12345");
                  handleLogin();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-paper-line bg-white hover:border-teal hover:bg-teal/5 text-left transition-all"
              >
                <div>
                  <div className="text-sm font-semibold text-ink">Rahul (Kochi Resident)</div>
                  <div className="text-xs text-ink-soft">Registered Consumer · Kochi, Kerala</div>
                </div>
                <span className="text-xs font-semibold text-teal flex items-center gap-1">
                  1-Click Sign In <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhone("+91 94470 54321");
                  handleLogin();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-paper-line bg-white hover:border-teal hover:bg-teal/5 text-left transition-all"
              >
                <div>
                  <div className="text-sm font-semibold text-ink">Fathima (Kakkanad Resident)</div>
                  <div className="text-xs text-ink-soft">Registered Consumer · Kakkanad, Kerala</div>
                </div>
                <span className="text-xs font-semibold text-teal flex items-center gap-1">
                  1-Click Sign In <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t border-paper-line">
              <div>
                <label className="block text-xs text-ink-soft font-medium mb-1">
                  Or enter your 10-digit Mobile Number:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-xs text-ink focus:border-teal focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-teal hover:bg-teal-deep text-paper font-semibold text-sm py-2.5 flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <span>{loading ? "Authenticating…" : "Sign In with Mobile OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ADMIN LOGIN */}
        {role === "admin" && (
          <div className="rounded-2xl border border-paper-line bg-white/80 p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-ink mb-1">Cooperative Federation Portal</h2>
            <p className="text-xs text-ink-soft mb-5">
              PACS & Cooperative administrative oversight, rotational equity audits & welfare funds
            </p>

            <div className="rounded-xl border border-paper-line bg-paper/60 p-4 mb-5 text-xs text-ink-soft space-y-1">
              <div><strong>Federation:</strong> Ernakulam PACS Federation</div>
              <div><strong>Jurisdiction:</strong> Kochi, Ernakulam, Kakkanad clusters</div>
              <div><strong>Audit Access:</strong> Rotational equity & escrow split ledger</div>
            </div>

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full rounded-full bg-teal hover:bg-teal-deep text-paper font-semibold text-sm py-2.5 flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>{loading ? "Authorizing…" : "Enter Cooperative Federation Ledger"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Switch to Sign Up */}
        <div className="mt-8 text-center text-xs text-ink-soft">
          Don&rsquo;t have an account or want to register in a new trade?{" "}
          <Link
            href={`/signup?role=${role}`}
            className="font-semibold text-teal hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            Register category-wise here <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-ink-soft text-sm">Loading login portal…</div>}>
      <LoginContent />
    </Suspense>
  );
}
