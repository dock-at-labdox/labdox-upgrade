import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAiMetadata } from "../ai/metadata";
import { AiUsageRepo } from "./aiUsage";

const { executeRaw } = vi.hoisted(() => ({
  executeRaw: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    $executeRaw: executeRaw,
  },
}));

describe("AI session persistence", () => {
  beforeEach(() => {
    executeRaw.mockReset().mockResolvedValue(1);
  });

  it("stores no free text or personal data without the explicit storage toggle", async () => {
    const freeText = "My personal email is private@example.test";

    await AiUsageRepo.persistClassification({
      sessionId: "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0",
      metadata: getAiMetadata({
        provider: "deterministic",
        promptVersion: "classify-v1",
        schemaVersion: "classification.v1",
        deterministicOnly: true,
      }),
      result: {
        goalTag: "switch_career",
        passionTheme: null,
        confidence: 0.8,
        clarificationNeeded: false,
        deterministicOnly: true,
      },
      freeText,
      storeFreeTextConsent: false,
      persistFreeText: false,
      consentedAt: new Date("2026-10-08T10:20:00.000Z"),
      policyVersion: "privacy-v1-draft",
    });

    const query = executeRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.sql).toContain('"said"');
    expect(query.values).toContain("null");
    expect(JSON.stringify(query.values)).not.toContain(freeText);
    expect(JSON.stringify(query.values)).not.toContain("private@example.test");

    const consentRecord = JSON.parse(String(query.values[3]));
    expect(consentRecord.granted).toBe(false);
    expect(consentRecord.textStored).toBe(false);
    expect(consentRecord.grantedAt).toBeNull();
    expect(consentRecord.policyVersion).toBe("privacy-v1-draft");
  });

  it("stores raw free text only with opt-in and stores versioned AI metadata", async () => {
    const freeText = "I want to switch careers";

    const metadata = getAiMetadata({
      provider: "gemini",
      model: "gemini-2.5-flash",
      promptVersion: "classify-v1",
      schemaVersion: "classification.v1",
      deterministicOnly: false,
    });

    await AiUsageRepo.persistClassification({
      sessionId: "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0",
      metadata,
      result: {
        goalTag: "switch_career",
        passionTheme: null,
        confidence: 0.9,
        clarificationNeeded: false,
        deterministicOnly: false,
      },
      freeText,
      storeFreeTextConsent: true,
      persistFreeText: true,
      consentedAt: new Date("2026-10-08T10:20:00.000Z"),
      policyVersion: "privacy-v1-draft",
    });

    const query = executeRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.values).toContain(JSON.stringify(freeText));
    expect(JSON.stringify(query.values)).toContain("classify-v1");
    expect(JSON.stringify(query.values)).toContain("classification.v1");
    expect(JSON.stringify(query.values)).toContain("privacy-v1-draft");

    const consentRecord = JSON.parse(String(query.values[3]));
    expect(consentRecord.granted).toBe(true);
    expect(consentRecord.textStored).toBe(true);
    expect(consentRecord.grantedAt).toBe("2026-10-08T10:20:00.000Z");
    expect(consentRecord.policyVersion).toBe("privacy-v1-draft");
  });

  it("does not persist contact details from free text even when the answer toggle is on", async () => {
    const freeText = "Please contact me at private@example.test";

    await AiUsageRepo.persistClassification({
      sessionId: "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0",
      metadata: getAiMetadata({
        provider: "deterministic",
        promptVersion: "classify-v1",
        schemaVersion: "classification.v1",
        deterministicOnly: true,
      }),
      result: {
        goalTag: null,
        passionTheme: null,
        confidence: 0,
        clarificationNeeded: true,
        deterministicOnly: true,
      },
      freeText,
      storeFreeTextConsent: true,
      persistFreeText: false,
      consentedAt: new Date("2026-10-08T10:20:00.000Z"),
      policyVersion: "privacy-v1-draft",
    });

    const query = executeRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.values).toContain("null");
    expect(JSON.stringify(query.values)).not.toContain("private@example.test");

    const consentRecord = JSON.parse(String(query.values[3]));
    expect(consentRecord.granted).toBe(true);
    expect(consentRecord.textStored).toBe(false);
    expect(consentRecord.grantedAt).toBe("2026-10-08T10:20:00.000Z");
    expect(consentRecord.policyVersion).toBe("privacy-v1-draft");
  });

  it("persists recommendation item IDs and provenance, not free-generated reasons", async () => {
    const reason = "Contains a private address private@example.test";

    await AiUsageRepo.persistRecommendation({
      sessionId: "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0",
      metadata: getAiMetadata({
        provider: "deterministic",
        promptVersion: "rank-v1",
        schemaVersion: "recommendation.v1",
        catalogueVersion: "catalogue-v1",
        deterministicOnly: true,
      }),
      itemIds: ["TRK-UX"],
    });

    const query = executeRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.sql).toContain("rankedItemIds");
    expect(JSON.stringify(query.values)).toContain("TRK-UX");
    expect(JSON.stringify(query.values)).toContain("catalogue-v1");
    expect(JSON.stringify(query.values)).not.toContain(reason);
    expect(JSON.stringify(query.values)).not.toContain("private@example.test");
  });
});
