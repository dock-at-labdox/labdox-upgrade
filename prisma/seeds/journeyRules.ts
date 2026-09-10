import type { PrismaClient } from "@prisma/client";
import { INTENT_TAGS, TRACKS } from "../../lib/taxonomy/constants";

export async function seedJourneyRules(prisma: PrismaClient) {
  const trackGoals = INTENT_TAGS.filter((tag) => tag.slug !== "solve_problem");

  for (const goal of trackGoals) {
    for (const track of TRACKS) {
      const ruleId = `JR-${goal.slug.replaceAll("_", "-").toUpperCase()}-${track.itemId.replace("TRK-", "")}`;
      await prisma.journeyRule.upsert({
        where: { ruleId },
        update: { intentTag: goal.slug, trackItemId: track.itemId, templateRef: null },
        create: { ruleId, intentTag: goal.slug, trackItemId: track.itemId, templateRef: null },
      });
    }
  }

  await prisma.journeyRule.upsert({
    where: { ruleId: "JR-B2B-ORG" },
    update: { intentTag: "solve_problem", trackItemId: null, audience: "organization" },
    create: {
      ruleId: "JR-B2B-ORG",
      intentTag: "solve_problem",
      audience: "organization",
    },
  });

  await prisma.journeyRule.upsert({
    where: { ruleId: "JR-EXPLORE-MENTOR" },
    update: { intentTag: "explore", trackItemId: "ENG-MENTOR" },
    create: { ruleId: "JR-EXPLORE-MENTOR", intentTag: "explore", trackItemId: "ENG-MENTOR" },
  });
}
