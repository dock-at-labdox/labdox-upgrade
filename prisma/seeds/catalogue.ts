import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  AUDIENCE_SLUGS,
  DELIVERY_SLUGS,
  DOMAIN_SLUG_BY_LABEL,
  INTENT_SLUGS,
  ITEM_ID_PATTERN,
  LEVEL_SLUG_BY_LABEL,
} from "../../lib/taxonomy/constants";
import { slugify } from "../../lib/taxonomy/slug";

const CSV = resolve(
  process.cwd(),
  "data/COURSE_PROGRAMME_SERVICE_AND_ENGAGEMENT_CATALOGUE.csv",
);

const RowSchema = z.object({
  "Item ID": z.string().regex(ITEM_ID_PATTERN),
  Type: z.enum(["course", "track", "service", "engagement"]),
  Name: z.string().min(1),
  "Short Description": z.string().min(1),
  Domain: z.string().min(1),
  Level: z.string().min(1),
  "Duration (hours)": z.string(),
  "Delivery Mode": z.string(),
  "Audience Tags": z.string(),
  "Intent Tags": z.string(),
  "Track Mapping": z.string().optional().default(""),
  "Price Basis": z.string().optional().default(""),
  "Evidence Source": z.string().min(1),
  Status: z.string().min(1),
});

export type CatalogueReport = {
  byType: Record<string, number>;
  archived: number;
};

function stripReview(value: string): {
  tokens: string[];
  needsReview: boolean;
} {
  const needsReview = /\[auto — review\]/i.test(value);
  const tokens = value
    .replace(/\[auto — review\]/gi, "")
    .split(/[;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return { tokens, needsReview };
}

function parseHours(raw: string): number | null {
  const numeric = raw.trim().match(/^(\d+(?:\.\d+)?)$/);
  if (numeric) return Number(numeric[1]);
  return null;
}

function parseDelivery(raw: string): string[] {
  return raw
    .split(";")
    .map((part) =>
      part
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .trim()
        .replace(/in-person|in person/, "in_person")
        .replace(/\s+/g, "_"),
    )
    .filter((mode) => DELIVERY_SLUGS.has(mode));
}

function parsePrice(raw: string): {
  pricingMode: "display" | "enquiry";
  priceInrPerHour: number | null;
} {
  const match = raw.match(/INR\s+(\d+(?:\.\d+)?)\s*\/\s*hr/i);
  if (match)
    return { pricingMode: "display", priceInrPerHour: Number(match[1]) };
  return { pricingMode: "enquiry", priceInrPerHour: null };
}

export async function seedCatalogue(
  prisma: PrismaClient,
): Promise<CatalogueReport> {
  const parsed = parse(readFileSync(CSV, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows = parsed.map((row, index) => {
    const result = RowSchema.safeParse(row);
    if (!result.success) {
      throw new Error(`CSV row ${index + 2}: ${result.error.message}`);
    }
    return result.data;
  });

  const seen = new Set<string>();
  const byType: Record<string, number> = {
    course: 0,
    track: 0,
    service: 0,
    engagement: 0,
  };

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    if (seen.has(row["Item ID"]))
      throw new Error(`CSV row ${line}: duplicate itemId ${row["Item ID"]}`);
    seen.add(row["Item ID"]);

    const domainSlug = DOMAIN_SLUG_BY_LABEL.get(row.Domain.toLowerCase());
    if (!domainSlug)
      throw new Error(`CSV row ${line}: unknown domain "${row.Domain}"`);

    const levelSlug = LEVEL_SLUG_BY_LABEL.get(row.Level.toLowerCase());
    if (!levelSlug)
      throw new Error(`CSV row ${line}: unknown level "${row.Level}"`);

    const audience = stripReview(row["Audience Tags"]);
    const intents = stripReview(row["Intent Tags"]);
    for (const tag of audience.tokens) {
      if (!AUDIENCE_SLUGS.has(tag))
        throw new Error(`CSV row ${line}: unknown audience "${tag}"`);
    }
    for (const tag of intents.tokens) {
      if (!INTENT_SLUGS.has(tag))
        throw new Error(`CSV row ${line}: unknown intent "${tag}"`);
    }
    const hours = parseHours(row["Duration (hours)"]);
    const price = parsePrice(row["Price Basis"]);
    const slug = `${slugify(row.Name)}-${row["Item ID"].toLowerCase()}`;

    const mapped = {
      type: row.Type,
      name: row.Name,
      slug,
      shortDescription: row["Short Description"],
      domain: domainSlug,
      level: levelSlug,
      durationHours: hours,
      deliveryModes: parseDelivery(row["Delivery Mode"]),
      trackMapping: row["Track Mapping"] || null,
      pricingMode: price.pricingMode,
      priceInrPerHour: price.priceInrPerHour,
      priceBasis: row["Price Basis"] || null,
      evidenceSource: row["Evidence Source"],
      status: row.Status.toLowerCase().includes("editorial review")
        ? "draft"
        : "published",
      needsEditorialReview:
        audience.needsReview ||
        intents.needsReview ||
        row.Status.includes("editorial"),
      sourcePath: CSV,
    };

    const item = await prisma.catalogueItem.upsert({
      where: { itemId: row["Item ID"] },
      update: mapped,
      create: { itemId: row["Item ID"], ...mapped },
    });

    await syncAudiences(prisma, item.id, audience.tokens);
    await syncIntents(prisma, item.id, intents.tokens);

    byType[row.Type] += 1;
  }

  const missing = await prisma.catalogueItem.updateMany({
    where: {
      itemId: { notIn: [...seen] },
      status: { not: "archived_pending_review" },
    },
    data: { status: "archived_pending_review" },
  });

  const versionRow = await prisma.meta.findUnique({
    where: { key: "catalogueVersion" },
  });
  const nextVersion =
    versionRow && typeof versionRow.value === "number"
      ? versionRow.value + 1
      : versionRow &&
          typeof versionRow.value === "object" &&
          versionRow.value !== null &&
          "n" in versionRow.value
        ? Number((versionRow.value as { n: number }).n) + 1
        : 1;

  await prisma.meta.upsert({
    where: { key: "catalogueVersion" },
    update: { value: nextVersion },
    create: { key: "catalogueVersion", value: nextVersion },
  });

  return { byType, archived: missing.count };
}

async function syncAudiences(
  prisma: PrismaClient,
  itemId: string,
  tags: string[],
) {
  await prisma.catalogueItemAudience.deleteMany({
    where: { itemId, tag: { notIn: tags } },
  });
  for (const tag of tags) {
    await prisma.catalogueItemAudience.upsert({
      where: { itemId_tag: { itemId, tag } },
      update: {},
      create: { itemId, tag },
    });
  }
}

async function syncIntents(
  prisma: PrismaClient,
  itemId: string,
  tags: string[],
) {
  await prisma.catalogueItemIntent.deleteMany({
    where: { itemId, tag: { notIn: tags } },
  });
  for (const tag of tags) {
    await prisma.catalogueItemIntent.upsert({
      where: { itemId_tag: { itemId, tag } },
      update: {},
      create: { itemId, tag },
    });
  }
}
