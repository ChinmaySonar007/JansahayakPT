import type { Category, Cooperative, Worker, Consumer, Job, Transaction, WelfareGrant, SosAlert, WhatsAppMessage } from "./types";

// ---- Seed reference data -------------------------------------------------

export const categories: Category[] = [
  {
    id: "electrician",
    name: "Electrician",
    icon: "Zap",
    baseRate: 249,
    skills: ["Inverter & MCB", "Short Circuit Repair", "Ceiling Fan & Lights", "Solar & Heavy Wiring"],
  },
  {
    id: "plumber",
    name: "Plumber",
    icon: "Droplet",
    baseRate: 279,
    skills: ["Pipe Leakage & Taps", "Drain Hydro-Jetting", "Water Tank & Pump", "PPR / Sanitary Fitting"],
  },
  {
    id: "carpenter",
    name: "Carpenter",
    icon: "Hammer",
    baseRate: 299,
    skills: ["Door Lock & Hinges", "Furniture Assembly", "Wood Polishing", "Custom Kitchen Shelves"],
  },
  {
    id: "painter",
    name: "Painter",
    icon: "Paintbrush",
    baseRate: 349,
    skills: ["Wall Putty & Primer", "Waterproofing", "Exterior Emulsion", "Stencil & Texture Paint"],
  },
  {
    id: "domestic",
    name: "Domestic Help",
    icon: "Home",
    baseRate: 199,
    skills: ["Deep Kitchen Cleaning", "Floor Mopping", "Utensils & Dishes", "Laundry & Ironing"],
  },
  {
    id: "caregiver",
    name: "Caregiver",
    icon: "HeartHandshake",
    baseRate: 229,
    skills: ["Elderly Bedside Care", "Post-Hospitalization", "Vitals & Medication", "Mobility Assistance"],
  },
  {
    id: "gardener",
    name: "Gardener",
    icon: "Sprout",
    baseRate: 219,
    skills: ["Lawn Mowing & Trimming", "Pest & Organic Fertilizer", "Bonsai & Potting", "Drip Irrigation"],
  },
  {
    id: "cleaner",
    name: "Cleaner",
    icon: "Sparkles",
    baseRate: 189,
    skills: ["Bathroom Sanitization", "Sofa & Carpet Wash", "Balcony & Window Wash", "Kitchen Chimney Cleaning"],
  },
];

export const cooperatives: Cooperative[] = [
  { id: "coop-kochi-central", name: "Kochi Central Service Cooperative", area: "Kochi" },
  { id: "coop-ernakulam-pacs", name: "Ernakulam PACS Federation", area: "Ernakulam" },
  { id: "coop-kakkanad", name: "Kakkanad Workers' Cooperative", area: "Kakkanad" },
];

const names = [
  "Suresh K.", "Aritha R.", "Manoj P.", "Lakshmi S.", "Biju T.", "Anjali M.",
  "Rajeev N.", "Divya V.", "Sunil J.", "Priya B.", "Ashok C.", "Meera G.",
  "Vinod D.", "Sona F.", "Ratheesh L.", "Nisha K.", "Joseph A.", "Deepa R.",
  "Sajeev M.", "Reshma T.",
];

function seedWorkers(): Worker[] {
  const base = { lat: 9.9312, lng: 76.2673 }; // Kochi
  const workers: Worker[] = [];
  let i = 0;
  for (const cat of categories) {
    const count = 3; // 3 workers per category = 24 workers
    const catSkills = cat.skills || [];
    for (let j = 0; j < count; j++) {
      const name = names[i % names.length];
      const jitterLat = (Math.random() - 0.5) * 0.08;
      const jitterLng = (Math.random() - 0.5) * 0.08;
      // deliberately vary idle time so fairness logic is visible in the demo
      const idleHours = [2, 30, 6, 48, 1, 72][j % 6] ?? 5;
      // one low-rated worker per category to demo upskill routing
      const rating = j === 2 ? 3.1 : Number((3.8 + Math.random() * 1.2).toFixed(1));

      // Distinct skill assignment so users see AI skill-based matching in action
      const workerSkills =
        j === 0
          ? [catSkills[0], catSkills[1], catSkills[2]].filter(Boolean)
          : j === 1
          ? [catSkills[1], catSkills[2], catSkills[3]].filter(Boolean)
          : [catSkills[2], catSkills[3]].filter(Boolean);

      const exp = [12, 7, 3][j];
      const tier: "Master Craftsman" | "Senior" | "Standard" =
        j === 0 ? "Master Craftsman" : j === 1 ? "Senior" : "Standard";
      const certs =
        j === 0
          ? ["NCCT Master Certified", "ITI Trade Diploma", "e-Shram Verified"]
          : j === 1
          ? ["Skill India Gold Badge", "Cooperative Verified"]
          : ["Cooperative Apprentice", "NCCT Upskilling"];

      const ncoMap: Record<string, string> = {
        electrician: "7411.0100 (General Electrician)",
        plumber: "7126.0101 (Plumber General)",
        carpenter: "7115.0100 (Carpenter General)",
        painter: "7131.0100 (Painter General)",
        domestic: "5152.0100 (Domestic Housekeeper)",
        caregiver: "5322.0100 (Home-based Personal Care)",
        gardener: "6113.0100 (Gardener General)",
        cleaner: "9112.0100 (Cleaner & Helper)",
      };

      workers.push({
        id: `w-${cat.id}-${j}`,
        name,
        coopId: cooperatives[i % cooperatives.length].id,
        categoryId: cat.id,
        lat: base.lat + jitterLat,
        lng: base.lng + jitterLng,
        areaLabel: ["Kochi", "Ernakulam", "Kakkanad", "Edappally", "Palarivattom"][i % 5],
        phone: `+91 98460 ${String(10000 + i).slice(1)}`,
        rating,
        completedJobs: Math.floor(20 + Math.random() * 200),
        lastJobAt: Date.now() - idleHours * 3600 * 1000,
        verified: true,
        walletBalance: Math.floor(500 + Math.random() * 4000),
        upskilling: rating < 3.5,
        dutyStatus: rating < 3.5 ? "upskilling" : "available",
        avatarSeed: `${cat.id}-${j}-${name}`,
        skills: workerSkills,
        experienceYears: exp,
        certifications: certs,
        priceTier: tier,
        hourlyFloor: cat.baseRate,
        uanNumber: `9823-${1000 + (i * 37) % 9000}-${2000 + (j * 91) % 8000}`,
        ncoCode: ncoMap[cat.id] || "7411.0100",
        digiLockerVerified: true,
      });
      i++;
    }
  }
  return workers;
}

function seedConsumers(): Consumer[] {
  return [
    { id: "c-rahul", name: "Rahul", lat: 9.9312, lng: 76.2673, areaLabel: "Kochi, Kerala" },
    { id: "c-fathima", name: "Fathima", lat: 9.9816, lng: 76.2999, areaLabel: "Kakkanad, Kerala" },
  ];
}

// ---- Mutable in-memory state ---------------------------------------------
type Store = {
  workers: Worker[];
  consumers: Consumer[];
  jobs: Job[];
  transactions: Transaction[];
  welfarePool: number;
  welfareGrants: WelfareGrant[];
  whatsAppMessages: WhatsAppMessage[];
  sosAlerts: SosAlert[];
};

const globalForStore = globalThis as unknown as { __jansahayakStore?: Store };

function createStore(): Store {
  const initialWorkers = seedWorkers();
  return {
    workers: initialWorkers,
    consumers: seedConsumers(),
    jobs: [],
    transactions: [],
    welfarePool: 1450.0, // Seeded cooperative welfare reserve
    sosAlerts: [],
    welfareGrants: [
      {
        id: "grant-init-1",
        workerId: initialWorkers[0].id,
        workerName: initialWorkers[0].name,
        type: "tool_upgrade",
        amount: 250,
        description: "Cooperative Safety Tool Upgrade Grant (Subsidized under NCCT)",
        at: Date.now() - 48 * 3600 * 1000,
      },
      {
        id: "grant-init-2",
        workerId: initialWorkers[1].id,
        workerName: initialWorkers[1].name,
        type: "health_cover",
        amount: 300,
        description: "Ayushman Bharat / PACS Cooperative Emergency Health Reimbursement",
        at: Date.now() - 18 * 3600 * 1000,
      },
    ],
    whatsAppMessages: [
      {
        id: "wam-seed-1",
        workerId: initialWorkers[0].id,
        from: "bot",
        text: `Namaste ${initialWorkers[0].name}! Welcome to JanSahayak Cooperative Dispatch Bot (PACS Ernakulam). You are verified and active in the rotational equity queue. Reply 'WALLET' to check balance or wait for automated gig dispatch alerts.`,
        timestamp: Date.now() - 3600 * 1000,
      },
    ],
  };
}

export const store: Store = globalForStore.__jansahayakStore ?? (globalForStore.__jansahayakStore = createStore());

export function resetStore() {
  Object.assign(store, createStore());
}

export function disburseWelfare(data: {
  workerId: string;
  type: "health_cover" | "accident_insurance" | "tool_upgrade";
  amount: number;
  description: string;
}): WelfareGrant {
  const worker = store.workers.find((w) => w.id === data.workerId) || store.workers[0];
  const grant: WelfareGrant = {
    id: `grant-${Date.now()}`,
    workerId: worker.id,
    workerName: worker.name,
    type: data.type,
    amount: data.amount,
    description: data.description,
    at: Date.now(),
  };

  store.welfarePool = Number(Math.max(0, store.welfarePool - data.amount).toFixed(2));
  worker.walletBalance = Number((worker.walletBalance + data.amount).toFixed(2));
  store.welfareGrants.unshift(grant);
  return grant;
}

export function addWorker(data: {
  name: string;
  categoryId: string;
  coopId: string;
  areaLabel?: string;
}): Worker {
  const base = { lat: 9.9312, lng: 76.2673 };
  const jitterLat = (Math.random() - 0.5) * 0.05;
  const jitterLng = (Math.random() - 0.5) * 0.05;
  const cat = categories.find((c) => c.id === data.categoryId);
  const newWorker: Worker = {
    id: `w-${data.categoryId}-${Date.now().toString().slice(-4)}`,
    name: data.name,
    coopId: data.coopId || cooperatives[0].id,
    categoryId: data.categoryId,
    lat: base.lat + jitterLat,
    lng: base.lng + jitterLng,
    areaLabel: data.areaLabel || "Kochi, Kerala",
    phone: `+91 98460 ${Math.floor(10000 + Math.random() * 90000)}`,
    rating: 4.8,
    completedJobs: 0,
    lastJobAt: Date.now() - 24 * 3600 * 1000,
    verified: true,
    walletBalance: 0,
    upskilling: false,
    avatarSeed: `${data.categoryId}-${data.name}`,
    skills: cat?.skills ? [cat.skills[0], cat.skills[1]] : ["General Trade"],
    experienceYears: 5,
    certifications: ["Cooperative Trade Verified", "e-Shram Registered"],
    priceTier: "Senior",
    hourlyFloor: cat?.baseRate || 249,
  };
  store.workers.unshift(newWorker);
  return newWorker;
}

export function addConsumer(data: { name: string; areaLabel?: string }): Consumer {
  const base = { lat: 9.9312, lng: 76.2673 };
  const newConsumer: Consumer = {
    id: `c-${Date.now().toString().slice(-4)}`,
    name: data.name,
    lat: base.lat,
    lng: base.lng,
    areaLabel: data.areaLabel || "Kochi, Kerala",
  };
  store.consumers.unshift(newConsumer);
  return newConsumer;
}

export function addWhatsAppMessage(workerId: string, from: "bot" | "worker", text: string): WhatsAppMessage {
  if (!store.whatsAppMessages) {
    store.whatsAppMessages = [];
  }
  const msg: WhatsAppMessage = {
    id: `wam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    workerId,
    from,
    text,
    timestamp: Date.now(),
  };
  store.whatsAppMessages.push(msg);
  return msg;
}

export function getWhatsAppMessages(workerId: string): WhatsAppMessage[] {
  if (!store.whatsAppMessages) {
    store.whatsAppMessages = [];
  }
  return store.whatsAppMessages.filter((m) => m.workerId === workerId);
}

export function createSosAlert(data: {
  workerId: string;
  notes?: string;
  lat?: number;
  lng?: number;
}): SosAlert {
  if (!store.sosAlerts) {
    store.sosAlerts = [];
  }
  const worker = store.workers.find((w) => w.id === data.workerId) || store.workers[0];
  const cat = categories.find((c) => c.id === worker.categoryId);
  const alert: SosAlert = {
    id: `sos-${Date.now()}`,
    workerId: worker.id,
    workerName: worker.name,
    categoryName: cat?.name || worker.categoryId,
    phone: worker.phone,
    lat: data.lat || worker.lat,
    lng: data.lng || worker.lng,
    areaLabel: worker.areaLabel,
    status: "active",
    timestamp: Date.now(),
    notes: data.notes || "Worker triggered emergency panic broadcast from cooperative field app.",
  };
  store.sosAlerts.unshift(alert);
  return alert;
}

export function resolveSosAlert(id: string): SosAlert | null {
  if (!store.sosAlerts) return null;
  const alert = store.sosAlerts.find((a) => a.id === id);
  if (!alert) return null;
  alert.status = "resolved";
  alert.resolvedAt = Date.now();
  return alert;
}

export function getSosAlerts(): SosAlert[] {
  return store.sosAlerts || [];
}

export function updateWorkerDutyStatus(
  workerId: string,
  dutyStatus: "available" | "upskilling" | "off_duty"
): Worker | null {
  const worker = store.workers.find((w) => w.id === workerId);
  if (!worker) return null;
  worker.dutyStatus = dutyStatus;
  worker.upskilling = dutyStatus === "upskilling";
  return worker;
}

export function completeWorkerUpskilling(workerId: string): Worker | null {
  const worker = store.workers.find((w) => w.id === workerId);
  if (!worker) return null;
  worker.rating = 4.6;
  worker.upskilling = false;
  worker.dutyStatus = "available";
  if (!worker.certifications) worker.certifications = [];
  if (!worker.certifications.includes("NCCT Certified Specialist")) {
    worker.certifications.push("NCCT Certified Specialist");
  }
  return worker;
}

