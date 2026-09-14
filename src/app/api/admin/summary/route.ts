import { NextResponse } from "next/server";
import { store, categories, cooperatives } from "@/lib/store";

export async function GET() {
  const jobsWithNames = store.jobs.slice(0, 40).map((j) => {
    const assignedWorker = store.workers.find((w) => w.id === j.assignedWorkerId);
    const offeredWorker = store.workers.find((w) => w.id === j.currentOfferWorkerId);
    const workerDisplay = assignedWorker
      ? assignedWorker.name
      : offeredWorker
      ? `${offeredWorker.name} (offered)`
      : "—";

    return {
      ...j,
      categoryName: categories.find((c) => c.id === j.categoryId)?.name ?? j.categoryId,
      consumerName: store.consumers.find((c) => c.id === j.consumerId)?.name ?? "Rahul",
      assignedWorkerName: workerDisplay,
    };
  });

  const workers = [...store.workers].sort((a, b) => b.completedJobs - a.completedJobs);

  return NextResponse.json({
    jobs: jobsWithNames,
    workers,
    cooperatives,
    welfarePool: store.welfarePool,
    welfareGrants: store.welfareGrants || [],
    transactions: store.transactions.slice(0, 40),
    sosAlerts: store.sosAlerts || [],
    stats: {
      totalJobs: store.jobs.length,
      completed: store.jobs.filter((j) => j.status === "completed").length,
      inProgress: store.jobs.filter((j) => j.status === "accepted" || j.status === "offered" || j.status === "matching").length,
      upskillCount: store.workers.filter((w) => w.upskilling).length,
      totalPayout: store.transactions.reduce((s, t) => s + t.workerPayout, 0),
    },
  });
}
