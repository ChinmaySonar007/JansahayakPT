import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { workerId, language } = await req.json();

    if (!language || !["en", "hi", "ml"].includes(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const worker = workerId ? store.workers.find((w) => w.id === workerId) : store.workers[0];

    if (worker) {
      worker.preferredLanguage = language;
    }

    // Also update all workers in prototype or active worker
    if (!workerId && store.workers.length > 0) {
      store.workers.forEach((w) => {
        w.preferredLanguage = language;
      });
    }

    return NextResponse.json({
      success: true,
      workerId: worker?.id,
      preferredLanguage: language,
    });
  } catch (err) {
    console.error("Failed to update language", err);
    return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
  }
}
