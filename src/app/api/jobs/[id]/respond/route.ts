import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { respondToOffer, offerToNextCandidate } from "@/lib/engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workerId, accept } = await req.json();

  let job = respondToOffer(id, workerId, accept);
  if (!job) return NextResponse.json({ error: "invalid offer" }, { status: 400 });

  if (!accept) {
    const consumer =
      store.consumers.find((c) => c.id === job!.consumerId) ??
      store.consumers[0] ?? { lat: 9.9312, lng: 76.2673 };
    job = offerToNextCandidate(id, consumer);
  }

  return NextResponse.json({ job });
}
