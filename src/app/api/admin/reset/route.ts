import { NextResponse } from "next/server";
import { resetStore } from "@/lib/store";

export async function POST() {
  resetStore();
  return NextResponse.json({ success: true, message: "Store reset to initial demo state" });
}
