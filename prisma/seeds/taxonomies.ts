import type { PrismaClient } from "@prisma/client";
import {
  AUDIENCES,
  CATALOGUE_LEVELS,
  DELIVERY_MODES,
  DOMAINS,
  INTENT_TAGS,
  ITEM_TYPE_DOMAINS,
  OUTCOME_TAGS,
  PASSION_THEMES,
} from "../../lib/taxonomy/constants";

type Term = { slug: string; label: string };

async function upsertKind(prisma: PrismaClient, kind: string, terms: readonly Term[]) {
  for (const term of terms) {
    await prisma.taxonomyTerm.upsert({
      where: { kind_slug: { kind, slug: term.slug } },
      update: { label: term.label },
      create: { kind, slug: term.slug, label: term.label },
    });
  }
}

export async function seedTaxonomies(prisma: PrismaClient) {
  await upsertKind(prisma, "domain", [...DOMAINS, ...ITEM_TYPE_DOMAINS]);
  await upsertKind(prisma, "audience", AUDIENCES);
  await upsertKind(prisma, "intent", INTENT_TAGS);
  await upsertKind(prisma, "passion", PASSION_THEMES);
  await upsertKind(prisma, "outcome", OUTCOME_TAGS);
  await upsertKind(prisma, "level", CATALOGUE_LEVELS);
  await upsertKind(prisma, "delivery", DELIVERY_MODES);
}
