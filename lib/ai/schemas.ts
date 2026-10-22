import { z } from "zod";

export const classificationV1Schema = z
  .object({
    schemaVersion: z.literal("classification.v1"),
    goalTag: z
      .enum([
        "first_job",
        "switch_career",
        "upskill",
        "grow_business",
        "explore",
        "solve_problem",
      ])
      .nullable(),
    passionTheme: z
      .enum([
        "building",
        "analyzing",
        "creating",
        "helping",
        "persuading",
        "organizing",
      ])
      .nullable()
      .optional(),
    topicKeywords: z.array(z.string().max(40)).max(5).optional(),
    confidence: z.number().min(0).max(1),
    clarificationNeeded: z.boolean(),
  })
  .strict();

export type ClassificationV1 = z.infer<typeof classificationV1Schema>;

const recommendationItemSchema = z.object({
  itemId: z.string().regex(/^(CRS-\d{3}|TRK-[A-Z]+|SVC-[A-Z]+|ENG-[A-Z]+)$/),
  reason: z.string().max(160),
});

export const recommendationV1Schema = z
  .object({
    schemaVersion: z.literal("recommendation.v1"),
    rankedItems: z.array(recommendationItemSchema).min(1).max(5),
  })
  .strict();

export type RecommendationV1 = z.infer<typeof recommendationV1Schema>;
