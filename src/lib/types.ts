export type Category = {
  id: string;
  name: string;
  icon: string; // lucide icon name
  baseRate: number; // fixed cooperative rate card, per hour, INR
  skills?: string[]; // micro-skills under this trade
};

export type Cooperative = {
  id: string;
  name: string;
  area: string;
};

export type Worker = {
  id: string;
  name: string;
  coopId: string;
  categoryId: string;
  lat: number;
  lng: number;
  areaLabel: string;
  phone?: string;
  preferredLanguage?: "en" | "hi" | "ml";
  rating: number; // 0-5
  completedJobs: number;
  lastJobAt: number; // epoch ms, used for idle-time fairness
  verified: boolean;
  walletBalance: number;
  upskilling: boolean; // true if routed to NCCT instead of banned
  avatarSeed: string;
  skills?: string[]; // verified trade micro-skills
  experienceYears?: number; // years of trade experience
  certifications?: string[]; // e.g. "NCCT Level 3", "ITI Electrical"
  priceTier?: "Standard" | "Senior" | "Master Craftsman";
  hourlyFloor?: number; // protected cooperative floor price
  uanNumber?: string; // e-Shram 12-digit UAN
  ncoCode?: string; // National Classification of Occupations Code
  digiLockerVerified?: boolean; // DigiLocker cryptographic badge
  dutyStatus?: "available" | "upskilling" | "off_duty";
};

export type SosAlert = {
  id: string;
  workerId: string;
  workerName: string;
  categoryName: string;
  phone?: string;
  lat: number;
  lng: number;
  areaLabel: string;
  status: "active" | "resolved";
  timestamp: number;
  resolvedAt?: number | null;
  notes?: string;
};

export type WhatsAppMessage = {
  id: string;
  workerId: string;
  from: "bot" | "worker";
  text: string;
  timestamp: number;
};

export type Consumer = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  areaLabel: string;
};

export type JobStatus =
  | "matching"
  | "offered"
  | "accepted"
  | "rejected_pool"
  | "completed"
  | "no_match";

export type OfferLogEntry = {
  workerId: string;
  workerName: string;
  score: number;
  outcome: "offered" | "accepted" | "declined" | "skipped_upskilling";
  at: number;
};

export type Job = {
  id: string;
  consumerId: string;
  categoryId: string;
  status: JobStatus;
  amount: number; // fixed rate card amount for this booking
  currentOfferWorkerId: string | null;
  assignedWorkerId: string | null;
  offerLog: OfferLogEntry[];
  createdAt: number;
  completedAt: number | null;
  selectedSkill?: string | null;
  issueQuery?: string | null;
  aiMatchReason?: string | null;
  priceTier?: string | null;
};

export type Transaction = {
  id: string;
  jobId: string;
  workerId: string;
  grossAmount: number;
  welfareFee: number;
  workerPayout: number;
  at: number;
};

export type UserRole = "consumer" | "worker" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  categoryId?: string;
  categoryName?: string;
  coopId?: string;
  coopName?: string;
  areaLabel?: string;
  preferredLanguage?: "en" | "hi" | "ml";
  rating?: number;
  walletBalance?: number;
};

export type WelfareGrant = {
  id: string;
  workerId: string;
  workerName: string;
  type: "health_cover" | "accident_insurance" | "tool_upgrade";
  amount: number;
  description: string;
  at: number;
};


