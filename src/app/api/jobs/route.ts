import { NextRequest, NextResponse } from "next/server";
import { store, categories } from "@/lib/store";
import { createJob, offerToNextCandidate, offerToSpecificWorker } from "@/lib/engine";

export async function GET() {
  return NextResponse.json({ jobs: store.jobs });
}

export async function POST(req: NextRequest) {
  const { consumerId, categoryId, selectedSkill, issueQuery, preferredWorkerId } = await req.json();
  const consumer = store.consumers.find((c) => c.id === consumerId) ?? store.consumers[0];
  if (!consumer) return NextResponse.json({ error: "unknown consumer" }, { status: 400 });

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return NextResponse.json({ error: "unknown category" }, { status: 400 });

  const job = createJob(consumer.id, categoryId, selectedSkill, issueQuery);
  let updated;
  if (preferredWorkerId) {
    updated = offerToSpecificWorker(job.id, preferredWorkerId);
  } else {
    updated = offerToNextCandidate(job.id, consumer, selectedSkill || issueQuery || undefined);
  }
  return NextResponse.json({ job: updated });
}
