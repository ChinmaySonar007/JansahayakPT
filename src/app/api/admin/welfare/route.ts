import { NextRequest, NextResponse } from "next/server";
import { disburseWelfare, store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    welfarePool: store.welfarePool,
    grants: store.welfareGrants,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, type, amount, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid disbursement amount" }, { status: 400 });
    }

    if (amount > store.welfarePool) {
      return NextResponse.json({ error: "Insufficient balance in cooperative welfare pool" }, { status: 400 });
    }

    const grant = disburseWelfare({
      workerId,
      type: type || "health_cover",
      amount: Number(amount),
      description: description || "Cooperative Welfare Micro-Grant",
    });

    return NextResponse.json({ success: true, grant, welfarePool: store.welfarePool });
  } catch (err) {
    console.error("Welfare disbursement error:", err);
    return NextResponse.json({ error: "Failed to disburse grant" }, { status: 500 });
  }
}
