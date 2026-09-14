import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { rankCandidates } from "@/lib/engine";

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("category");
  const defaultConsumer = store.consumers[0] ?? {
    id: "c-rahul",
    name: "Rahul",
    lat: 9.9312,
    lng: 76.2673,
    areaLabel: "Kochi, Kerala",
  };
  const consumerId = req.nextUrl.searchParams.get("consumerId") ?? defaultConsumer.id;
  const consumer = store.consumers.find((c) => c.id === consumerId) ?? defaultConsumer;
  const skill = req.nextUrl.searchParams.get("skill");
  const query = req.nextUrl.searchParams.get("query");

  if (categoryId) {
    const ranked = rankCandidates(categoryId, consumer, skill || query || undefined);
    return NextResponse.json({ candidates: ranked });
  }

  const pendingWorkerIds = new Set(
    store.jobs
      .filter((j) => j.status === "offered" && j.currentOfferWorkerId)
      .map((j) => j.currentOfferWorkerId!)
  );

  const activeWorkerIds = new Set(
    store.jobs
      .filter((j) => j.status === "accepted" && j.assignedWorkerId)
      .map((j) => j.assignedWorkerId!)
  );

  const workersWithStatus = store.workers.map((w) => ({
    ...w,
    hasPendingOffer: pendingWorkerIds.has(w.id),
    hasActiveJob: activeWorkerIds.has(w.id),
  }));

  // Worker with a live offer comes first, or one with an active job, or default first
  const priorityWorker =
    store.workers.find((w) => pendingWorkerIds.has(w.id)) ??
    store.workers.find((w) => activeWorkerIds.has(w.id)) ??
    store.workers[0];

  return NextResponse.json({
    workers: workersWithStatus,
    activeWorkerId: priorityWorker?.id ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const { workerId, dutyStatus, action } = await req.json();
  if (!workerId) {
    return NextResponse.json({ error: "workerId is required" }, { status: 400 });
  }

  if (action === "complete_upskilling") {
    const { completeWorkerUpskilling } = await import("@/lib/store");
    const updated = completeWorkerUpskilling(workerId);
    if (!updated) return NextResponse.json({ error: "worker not found" }, { status: 404 });
    return NextResponse.json({ worker: updated, message: "NCCT upskilling certified successfully" });
  }

  if (dutyStatus) {
    const { updateWorkerDutyStatus } = await import("@/lib/store");
    const updated = updateWorkerDutyStatus(workerId, dutyStatus);
    if (!updated) return NextResponse.json({ error: "worker not found" }, { status: 404 });
    return NextResponse.json({ worker: updated });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
