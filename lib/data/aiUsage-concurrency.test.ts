import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiUsageRepo } from "./aiUsage";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  rateCounts: new Map<string, number>(),
  dailyCosts: new Map<string, number>(),
  sqlStatements: [] as string[],
}));

vi.mock("./prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    $queryRaw: mocks.queryRaw,
  },
}));

type FakeTransaction = {
  $executeRaw(query: Prisma.Sql): Promise<number>;
  $queryRaw<T>(query: Prisma.Sql): Promise<T>;
};

function identityHashes(query: Prisma.Sql): string[] {
  return query.values.filter(
    (value): value is string =>
      typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
  );
}

function rateKey(query: Prisma.Sql, identityHash: string): string {
  const operation = query.values.find(
    (value): value is string =>
      value === "classify" || value === "recommend",
  );
  const windowStart = query.values.find(
    (value): value is Date => value instanceof Date,
  );
  return `${identityHash}:${operation}:${windowStart?.toISOString()}`;
}

describe("AI usage atomic database operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateCounts.clear();
    mocks.dailyCosts.clear();
    mocks.sqlStatements.length = 0;

    let transactionTail: Promise<void> = Promise.resolve();
    mocks.transaction.mockImplementation(
      async (callback: (transaction: FakeTransaction) => Promise<unknown>) => {
        const previous = transactionTail;
        let release = () => {};
        transactionTail = new Promise<void>((resolve) => {
          release = resolve;
        });
        await previous;

        const transaction: FakeTransaction = {
          async $executeRaw(query) {
            mocks.sqlStatements.push(query.sql);
            if (query.sql.includes("INSERT INTO")) {
              for (const identityHash of identityHashes(query)) {
                const key = rateKey(query, identityHash);
                if (!mocks.rateCounts.has(key)) {
                  mocks.rateCounts.set(key, 0);
                }
              }
              return 0;
            }

            if (query.sql.includes("UPDATE")) {
              const identities = identityHashes(query);
              const keyParts = identities.map((identityHash) =>
                rateKey(query, identityHash),
              );
              const limit = Number(query.values[query.values.length - 1]);
              let updated = 0;
              for (const key of keyParts) {
                const count = mocks.rateCounts.get(key) ?? 0;
                if (count < limit) {
                  mocks.rateCounts.set(key, count + 1);
                  updated += 1;
                }
              }
              return updated;
            }

            return 0;
          },
          async $queryRaw<T>(query: Prisma.Sql): Promise<T> {
            mocks.sqlStatements.push(query.sql);
            const identities = identityHashes(query);
            const rows = identities.map((identityHash) => ({
              identityHash,
              count: mocks.rateCounts.get(rateKey(query, identityHash)) ?? 0,
            }));
            return rows as T;
          },
        };

        try {
          return await callback(transaction);
        } finally {
          release();
        }
      },
    );

    let costTail: Promise<void> = Promise.resolve();
    mocks.queryRaw.mockImplementation(async (query: Prisma.Sql) => {
      const previous = costTail;
      let release = () => {};
      costTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;

      try {
        mocks.sqlStatements.push(query.sql);
        const date = String(query.values[0]);
        const reservationValue = Number(query.values[1]);
        const capValue = Number(query.values[2]);
        const current = mocks.dailyCosts.get(date) ?? 0;
        const next = current + reservationValue;

        if (next > capValue) {
          return [];
        }

        mocks.dailyCosts.set(date, next);
        return [{ date }];
      } finally {
        release();
      }
    });
  });

  it("serializes concurrent IP/session bucket updates and admits only ten requests", async () => {
    const identityHashes = ["a".repeat(64), "b".repeat(64)];
    const now = new Date("2026-10-08T10:00:00.000Z");
    const outcomes = await Promise.all(
      Array.from({ length: 32 }, () =>
        AiUsageRepo.checkAndIncrementRateLimit({
          identityHashes,
          operation: "classify",
          windowStart: now,
          limit: 10,
        }),
      ),
    );

    expect(outcomes.filter(Boolean)).toHaveLength(10);
    expect(outcomes.filter((allowed) => !allowed)).toHaveLength(22);
    expect(mocks.sqlStatements.some((sql) => sql.includes("FOR UPDATE"))).toBe(
      true,
    );
  });

  it("atomically prevents concurrent reservations from exceeding the daily cap", async () => {
    const now = new Date("2026-10-08T10:00:00.000Z");
    const outcomes = await Promise.all(
      Array.from({ length: 25 }, () =>
        AiUsageRepo.reserveDailyCost(now, 0.75, 5),
      ),
    );

    expect(outcomes.filter(Boolean)).toHaveLength(6);
    expect(mocks.dailyCosts.get("2026-10-08")).toBe(4.5);
    expect(mocks.sqlStatements.some((sql) => sql.includes("ON CONFLICT"))).toBe(
      true,
    );
    expect(mocks.sqlStatements.some((sql) => sql.includes("<="))).toBe(true);
  });
});
