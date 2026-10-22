import { Prisma } from "@prisma/client";
import { isSafeFreeTextForPersistence } from "../privacy/sensitive-text";

import type { AiMetadata } from "../ai/metadata";
import type { ClassifyResult } from "../api/contracts";
import { prisma } from "./prisma";

export type AiOperation = "classify" | "recommend";

type RateLimitInput = {
  identityHashes: string[];
  operation: AiOperation;
  windowStart: Date;
  limit: number;
};

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const AiUsageRepo = {
  async checkAndIncrementRateLimit({
    identityHashes,
    operation,
    windowStart,
    limit,
  }: RateLimitInput): Promise<boolean> {
    const identities = [...new Set(identityHashes)].sort();

    return prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`
        DELETE FROM "ai_rate_limit_buckets"
        WHERE "windowStart" < ${windowStart} - INTERVAL '48 hours'
      `);

      await transaction.$executeRaw(
        Prisma.sql`
          INSERT INTO "ai_rate_limit_buckets"
            ("identityHash", "operation", "windowStart", "count")
          VALUES ${Prisma.join(
            identities.map(
              (identityHash) =>
                Prisma.sql`(${identityHash}, ${operation}, ${windowStart}, 0)`,
            ),
          )}
          ON CONFLICT ("identityHash", "operation", "windowStart") DO NOTHING
        `,
      );

      const rows = await transaction.$queryRaw<
        Array<{ identityHash: string; count: number }>
      >(Prisma.sql`
        SELECT "identityHash", "count"
        FROM "ai_rate_limit_buckets"
        WHERE "operation" = ${operation}
          AND "windowStart" = ${windowStart}
          AND "identityHash" IN (${Prisma.join(identities)})
        ORDER BY "identityHash"
        FOR UPDATE
      `);

      if (
        rows.length !== identities.length ||
        rows.some((row) => row.count >= limit)
      ) {
        return false;
      }

      const updated = await transaction.$executeRaw(Prisma.sql`
        UPDATE "ai_rate_limit_buckets"
        SET "count" = "count" + 1
        WHERE "operation" = ${operation}
          AND "windowStart" = ${windowStart}
          AND "identityHash" IN (${Prisma.join(identities)})
          AND "count" < ${limit}
      `);

      return updated === identities.length;
    });
  },

  async reserveDailyCost(
    now: Date,
    reservationUsd: number,
    dailyCapUsd: number,
  ): Promise<boolean> {
    if (
      !Number.isFinite(reservationUsd) ||
      !Number.isFinite(dailyCapUsd) ||
      reservationUsd <= 0 ||
      dailyCapUsd <= 0 ||
      reservationUsd > dailyCapUsd ||
      Number(reservationUsd.toFixed(4)) !== reservationUsd ||
      Number(dailyCapUsd.toFixed(4)) !== dailyCapUsd
    ) {
      return false;
    }

    const date = utcDay(now);
    const reservation = reservationUsd.toFixed(4);
    const cap = dailyCapUsd.toFixed(4);
    const rows = await prisma.$queryRaw<Array<{ date: Date }>>(Prisma.sql`
      INSERT INTO "ai_usage" ("date", "estimatedCostUsd")
      VALUES (${date}::date, ${reservation}::numeric)
      ON CONFLICT ("date") DO UPDATE
      SET "estimatedCostUsd" =
        "ai_usage"."estimatedCostUsd" + EXCLUDED."estimatedCostUsd"
      WHERE "ai_usage"."estimatedCostUsd" + EXCLUDED."estimatedCostUsd"
        <= ${cap}::numeric
      RETURNING "date"
    `);

    return rows.length === 1;
  },

  async incrementRejectedOutput(now: Date): Promise<void> {
    const date = utcDay(now);
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "ai_usage" ("date", "rejectedOutputs")
      VALUES (${date}::date, 1)
      ON CONFLICT ("date") DO UPDATE
      SET "rejectedOutputs" = "ai_usage"."rejectedOutputs" + 1
    `);
  },

  async persistClassification(input: {
    sessionId: string;
    metadata: AiMetadata;
    result: ClassifyResult;
    freeText: string;
    storeFreeTextConsent: boolean;
    persistFreeText: boolean;
    consentedAt: Date;
    policyVersion: string;
  }): Promise<boolean> {
    const shouldPersistFreeText =
      input.storeFreeTextConsent &&
      input.persistFreeText &&
      isSafeFreeTextForPersistence(input.freeText);

    const consentRecord = {
      granted: input.storeFreeTextConsent,
      textStored: shouldPersistFreeText,
      grantedAt: input.storeFreeTextConsent
        ? input.consentedAt.toISOString()
        : null,
      policyVersion: input.policyVersion,
    };

    const freeText = JSON.stringify(
      shouldPersistFreeText ? input.freeText : null,
    );
    const metadata = JSON.stringify(input.metadata);
    const classification = JSON.stringify({
      goalTag: input.result.goalTag,
      passionTheme: input.result.passionTheme,
      confidence: input.result.confidence,
      clarificationNeeded: input.result.clarificationNeeded,
    });

    const updated = await prisma.$executeRaw(Prisma.sql`
      UPDATE "intent_sessions"
      SET
        "aiMetadata" = jsonb_set(
          COALESCE("aiMetadata", '{}'::jsonb),
          ARRAY['classification']::text[],
          ${metadata}::jsonb,
          true
        ),
        "inferred" = jsonb_set(
          COALESCE("inferred", '{}'::jsonb),
          ARRAY['classification']::text[],
          ${classification}::jsonb,
          true
        ),
        "said" = jsonb_set(
          COALESCE("said", '{}'::jsonb),
          ARRAY['freeText']::text[],
          ${freeText}::jsonb,
          true
        ),
        "consent" = jsonb_set(
          COALESCE("consent", '{}'::jsonb),
          ARRAY['freeTextStorage']::text[],
          ${JSON.stringify(consentRecord)}::jsonb,
          true
        ),
        "updatedAt" = NOW()
      WHERE "id" = ${input.sessionId}::uuid
        AND "expiresAt" > NOW()
    `);

    return updated === 1;
  },

  async persistRecommendation(input: {
    sessionId: string;
    metadata: AiMetadata;
    itemIds: string[];
  }): Promise<boolean> {
    const updated = await prisma.$executeRaw(Prisma.sql`
      UPDATE "intent_sessions"
      SET
        "aiMetadata" = jsonb_set(
          COALESCE("aiMetadata", '{}'::jsonb),
          ARRAY['recommendation']::text[],
          ${JSON.stringify(input.metadata)}::jsonb,
          true
        ),
        "recommendation" = jsonb_set(
          COALESCE("recommendation", '{}'::jsonb),
          ARRAY['rankedItemIds']::text[],
          ${JSON.stringify(input.itemIds)}::jsonb,
          true
        ),
        "updatedAt" = NOW()
      WHERE "id" = ${input.sessionId}::uuid
        AND "expiresAt" > NOW()
    `);

    return updated === 1;
  },
};
