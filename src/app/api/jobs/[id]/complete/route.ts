import { NextResponse } from "next/server";
import { completeJob } from "@/lib/engine";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = completeJob(id);
  if (!job) return NextResponse.json({ error: "cannot complete" }, { status: 400 });
  return NextResponse.json({ job });
}
