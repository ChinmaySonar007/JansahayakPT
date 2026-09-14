import { NextResponse } from "next/server";
import { getSosAlerts, createSosAlert, resolveSosAlert } from "@/lib/store";

export async function GET() {
  const alerts = getSosAlerts();
  return NextResponse.json({ alerts });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.workerId) {
      return NextResponse.json({ error: "workerId is required" }, { status: 400 });
    }
    const alert = createSosAlert({
      workerId: body.workerId,
      notes: body.notes,
      lat: body.lat,
      lng: body.lng,
    });
    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (e) {
    console.error("SOS POST error:", e);
    return NextResponse.json({ error: "Failed to trigger SOS alert" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Alert id is required" }, { status: 400 });
    }
    const alert = resolveSosAlert(body.id);
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, alert });
  } catch (e) {
    console.error("SOS PATCH error:", e);
    return NextResponse.json({ error: "Failed to resolve SOS alert" }, { status: 500 });
  }
}
