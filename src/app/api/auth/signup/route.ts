import { NextRequest, NextResponse } from "next/server";
import { addWorker, addConsumer, categories, cooperatives } from "@/lib/store";
import type { AuthUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, name, phone, categoryId, coopId, areaLabel } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (role === "worker") {
      if (!categoryId) {
        return NextResponse.json({ error: "Trade category is required for worker registration" }, { status: 400 });
      }

      const category = categories.find((c) => c.id === categoryId);
      if (!category) {
        return NextResponse.json({ error: "Invalid trade category selected" }, { status: 400 });
      }

      const assignedCoopId = coopId || cooperatives[0].id;
      const coop = cooperatives.find((co) => co.id === assignedCoopId);

      const worker = addWorker({
        name: name.trim(),
        categoryId,
        coopId: assignedCoopId,
        areaLabel: areaLabel || "Kochi, Kerala",
      });

      const user: AuthUser = {
        id: worker.id,
        name: worker.name,
        role: "worker",
        phone: phone || "+91 98000 " + Math.floor(10000 + Math.random() * 90000),
        categoryId: worker.categoryId,
        categoryName: category.name,
        coopId: worker.coopId,
        coopName: coop?.name ?? "District Cooperative",
        areaLabel: worker.areaLabel,
        rating: worker.rating,
        walletBalance: worker.walletBalance,
      };

      return NextResponse.json({ success: true, user });
    }

    if (role === "consumer") {
      const consumer = addConsumer({
        name: name.trim(),
        areaLabel: areaLabel || "Kochi, Kerala",
      });

      const user: AuthUser = {
        id: consumer.id,
        name: consumer.name,
        role: "consumer",
        phone: phone || "+91 94000 " + Math.floor(10000 + Math.random() * 90000),
        areaLabel: consumer.areaLabel,
      };

      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
