import { NextResponse } from "next/server";
import { CatalogueRepo } from "@/lib/data/repos";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const filters = {
    audience: params.get("audience") ?? undefined,
    intent: params.get("intent") ?? undefined,
    domain: params.get("domain") ?? undefined,
    level: params.get("level") ?? undefined,
  };

  try {
    const items = await CatalogueRepo.list(filters);

    // Jo filters caller ne diye, wahi "match reasons" hain
    const matchReasons = Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`);

    return NextResponse.json({
      count: items.length,
      items: items.map((item) => ({
        itemId: item.itemId,
        type: item.type,
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        domain: item.domain,
        level: item.level,
        durationHours: item.durationHours,
        deliveryModes: item.deliveryModes,
        audiences: item.audiences.map((a) => a.tag),
        intents: item.intents.map((i) => i.tag),
        matchReasons,
      })),
    });
  } catch {
    return NextResponse.json({ error: "catalogue_unavailable" }, { status: 503 });
  }
}