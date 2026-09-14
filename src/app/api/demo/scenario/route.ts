import { NextResponse } from "next/server";
import { store, disburseWelfare, createSosAlert, resetStore } from "@/lib/store";
import { createJob, offerToNextCandidate, respondToOffer, completeJob } from "@/lib/engine";

export async function POST(req: Request) {
  try {
    const { scenario } = await req.json();

    if (scenario === "fair_rotation") {
      const consumer = store.consumers[0] || { id: "c-rahul", lat: 9.9312, lng: 76.2673 };
      const job = createJob(consumer.id, "electrician", "Inverter & MCB", "Short circuit in main board");
      const updatedJob = offerToNextCandidate(job.id, { lat: consumer.lat, lng: consumer.lng });
      const offeredWorker = store.workers.find((w) => w.id === updatedJob?.currentOfferWorkerId);

      return NextResponse.json({
        success: true,
        scenario: "fair_rotation",
        job: updatedJob,
        worker: offeredWorker,
        title: "Fair Rotational Equity Dispatched",
        message: `Job #${updatedJob?.id.slice(-4)} routed to ${offeredWorker?.name || "Member"} (Fairness priority based on ${((Date.now() - (offeredWorker?.lastJobAt || 0)) / 3600000).toFixed(1)} hrs idle time, not algorithmic bidding).`,
      });
    }

    if (scenario === "upskilling_routing") {
      // Find a worker with rating < 3.5 or make one
      let lowRated = store.workers.find((w) => w.rating < 3.5);
      if (!lowRated) {
        lowRated = store.workers[2];
        lowRated.rating = 3.2;
        lowRated.upskilling = true;
      }
      const grant = disburseWelfare({
        workerId: lowRated.id,
        type: "tool_upgrade",
        amount: 250,
        description: "National Council for Cooperative Training (NCCT) Skill Upgrade & Safety Tool Grant",
      });

      return NextResponse.json({
        success: true,
        scenario: "upskilling_routing",
        worker: lowRated,
        grant,
        title: "Dignified Upskilling Gate Activated",
        message: `${lowRated.name} (${lowRated.rating} ★) routed to NCCT Skill Workshop with ₹${grant.amount} tool grant instead of commercial delisting/deplatforming!`,
      });
    }

    if (scenario === "escrow_settlement") {
      const consumer = store.consumers[0] || { id: "c-rahul", lat: 9.9312, lng: 76.2673 };
      const job = createJob(consumer.id, "plumber", "Pipe Leakage & Taps");
      offerToNextCandidate(job.id, { lat: consumer.lat, lng: consumer.lng });
      const workerId = job.currentOfferWorkerId || store.workers[0].id;
      respondToOffer(job.id, workerId, true);
      const completion = completeJob(job.id);
      const worker = store.workers.find((w) => w.id === workerId);

      return NextResponse.json({
        success: true,
        scenario: "escrow_settlement",
        job: completion?.job,
        transaction: completion?.transaction,
        worker,
        title: "1.5% Escrow Split & Payout Settled",
        message: `Job #${job.id.slice(-4)} finished! ₹${completion?.transaction?.workerPayout} (98.5%) sent to ${worker?.name}'s UPI, ₹${completion?.transaction?.welfareFee} (1.5%) added to Cooperative Welfare Reserve, ₹0.00 platform fee.`,
      });
    }

    if (scenario === "sos_emergency") {
      const targetWorker = store.workers[0];
      const alert = createSosAlert({
        workerId: targetWorker.id,
        notes: "CRITICAL: Urgent on-site support requested near Edappally Toll Junction. Co-op nodal officer alerted.",
      });

      return NextResponse.json({
        success: true,
        scenario: "sos_emergency",
        alert,
        worker: targetWorker,
        title: "Worker SOS Distress Alert Broadcasted",
        message: `🚨 Emergency panic alert broadcasted for ${targetWorker.name} (${targetWorker.areaLabel}). Real-time beacon active in Cooperative Federation Console.`,
      });
    }

    if (scenario === "reset") {
      resetStore();
      return NextResponse.json({
        success: true,
        scenario: "reset",
        title: "Demo Data Reset",
        message: "All jobs, alerts, and balances reset to clean seeded state.",
      });
    }

    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
  } catch (e) {
    console.error("Demo scenario error:", e);
    return NextResponse.json({ error: "Failed to run scenario" }, { status: 500 });
  }
}
