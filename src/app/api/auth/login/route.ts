import { NextRequest, NextResponse } from "next/server";
import { store, categories, cooperatives } from "@/lib/store";
import type { AuthUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, workerId, consumerId, categoryId, phone } = body;

    if (role === "admin") {
      const adminUser: AuthUser = {
        id: "admin-central",
        name: "Ernakulam Cooperative Federation Admin",
        role: "admin",
        areaLabel: "Kochi, Kerala",
      };
      return NextResponse.json({ success: true, user: adminUser });
    }

    if (role === "worker") {
      // Find specific worker by ID, or find first worker in the selected category
      let worker = workerId ? store.workers.find((w) => w.id === workerId) : null;
      if (!worker && categoryId) {
        worker = store.workers.find((w) => w.categoryId === categoryId) || null;
      }
      if (!worker) {
        worker = store.workers[0];
      }

      if (!worker) {
        return NextResponse.json({ error: "No worker found for this category" }, { status: 404 });
      }

      const category = categories.find((c) => c.id === worker!.categoryId);
      const coop = cooperatives.find((co) => co.id === worker!.coopId);

      const workerUser: AuthUser = {
        id: worker.id,
        name: worker.name,
        role: "worker",
        phone: phone || "+91 98460 " + Math.floor(10000 + Math.random() * 90000),
        categoryId: worker.categoryId,
        categoryName: category?.name ?? worker.categoryId,
        coopId: worker.coopId,
        coopName: coop?.name ?? "District Cooperative",
        areaLabel: worker.areaLabel,
        rating: worker.rating,
        walletBalance: worker.walletBalance,
      };

      return NextResponse.json({ success: true, user: workerUser });
    }

    if (role === "consumer") {
      const consumer =
        (consumerId ? store.consumers.find((c) => c.id === consumerId) : null) ??
        store.consumers[0];

      if (!consumer) {
        return NextResponse.json({ error: "Consumer not found" }, { status: 404 });
      }

      const consumerUser: AuthUser = {
        id: consumer.id,
        name: consumer.name,
        role: "consumer",
        phone: phone || "+91 94470 12345",
        areaLabel: consumer.areaLabel,
      };

      return NextResponse.json({ success: true, user: consumerUser });
    }

    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
