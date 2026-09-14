import { NextResponse } from "next/server";
import { store, categories } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const worker = store.workers.find((w) => w.id === id);
  if (!worker) return NextResponse.json({ error: "unknown worker" }, { status: 404 });

  const pendingJob = store.jobs.find((j) => j.currentOfferWorkerId === id && j.status === "offered");
  const activeJob = store.jobs.find((j) => j.assignedWorkerId === id && j.status === "accepted");
  const recentCompleted = store.jobs
    .filter((j) => j.assignedWorkerId === id && j.status === "completed")
    .slice(0, 5);

  const withCategory = (j: (typeof store.jobs)[number]) => ({
    ...j,
    categoryName: categories.find((c) => c.id === j.categoryId)?.name ?? j.categoryId,
  });

  const cat = categories.find((c) => c.id === worker.categoryId);
  const catSkills = cat?.skills || [];
  const workerIndex = parseInt(worker.id.split("-").pop() || "0", 10) % 3;
  const defaultSkills =
    workerIndex === 0
      ? [catSkills[0], catSkills[1], catSkills[2]].filter(Boolean)
      : workerIndex === 1
      ? [catSkills[1], catSkills[2], catSkills[3]].filter(Boolean)
      : [catSkills[2], catSkills[3]].filter(Boolean);

  const enrichedWorker = {
    ...worker,
    skills: (worker.skills && worker.skills.length > 0) ? worker.skills : defaultSkills,
    experienceYears: worker.experienceYears || (workerIndex === 0 ? 12 : workerIndex === 1 ? 7 : 3),
    certifications: (worker.certifications && worker.certifications.length > 0)
      ? worker.certifications
      : workerIndex === 0
      ? ["NCCT Master Certified", "ITI Trade Diploma", "e-Shram Verified"]
      : workerIndex === 1
      ? ["Skill India Gold Badge", "Cooperative Verified"]
      : ["Cooperative Apprentice", "NCCT Upskilling"],
    priceTier: worker.priceTier || (workerIndex === 0 ? "Master Craftsman" : workerIndex === 1 ? "Senior" : "Standard"),
    hourlyFloor: worker.hourlyFloor || cat?.baseRate || 249,
  };

  return NextResponse.json({
    worker: enrichedWorker,
    pendingJob: pendingJob ? withCategory(pendingJob) : null,
    activeJob: activeJob ? withCategory(activeJob) : null,
    recentCompleted: recentCompleted.map(withCategory),
  });
}
