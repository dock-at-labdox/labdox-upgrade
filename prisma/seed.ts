import { PrismaClient } from "@prisma/client";
import { seedTaxonomies } from "./seeds/taxonomies";
import { seedRoles } from "./seeds/roles";
import { seedCatalogue, type CatalogueReport } from "./seeds/catalogue";
import { seedJourneyRules } from "./seeds/journeyRules";
import { seedDevFixtures } from "./seeds/devFixtures";

const prisma = new PrismaClient();

const EXPECTED = { course: 132, track: 4, service: 8, engagement: 4 };

function assertCounts(report: CatalogueReport, expected: typeof EXPECTED) {
  for (const type of Object.keys(expected) as (keyof typeof expected)[]) {
    if (report.byType[type] !== expected[type]) {
      throw new Error(
        `Seed count drift for ${type}: got ${report.byType[type]}, expected ${expected[type]}`,
      );
    }
  }
}

async function main() {
  await seedTaxonomies(prisma);
  await seedRoles(prisma);
  const report = await seedCatalogue(prisma);
  await seedJourneyRules(prisma);
  if (process.env.NODE_ENV !== "production") await seedDevFixtures(prisma);
  assertCounts(report, EXPECTED);
  console.table(report.byType);
  console.log(`archived_pending_review flags: ${report.archived}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
