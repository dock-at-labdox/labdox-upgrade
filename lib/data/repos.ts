import { prisma } from "./prisma";
import type { RecommendationCandidate } from "../engine/recommender";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export const IntentSessionRepo = {
  async getById(id: string) {
    return prisma.intentSession.findUnique({
      where: { id },
    });
  },

  async create(pill: "red" | "blue") {
    return prisma.intentSession.create({
      data: {
        pill,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    if (!id.trim()) {
      throw new Error("Session id is required");
    }

    return prisma.intentSession.update({
      where: { id },
      data,
    });
  },
};

export const LeadRepo = {
  async getById(id: string) {
    return prisma.lead.findUnique({
      where: { id },
    });
  },
};

export const FeedbackRepo = {
  async getById(id: string) {
    return prisma.feedback.findUnique({
      where: { id },
    });
  },
};

export const CatalogueRepo = {
  async getVersion(): Promise<string | null> {
    const entry = await prisma.meta.findUnique({
      where: { key: "catalogueVersion" },
      select: { value: true },
    });

    if (typeof entry?.value === "number" && Number.isInteger(entry.value)) {
      return String(entry.value);
    }

    if (
      entry?.value !== null &&
      typeof entry?.value === "object" &&
      !Array.isArray(entry.value) &&
      "n" in entry.value &&
      typeof entry.value.n === "number" &&
      Number.isInteger(entry.value.n)
    ) {
      return String(entry.value.n);
    }

    return null;
  },

  async getRecommendationCandidates(
    itemIds: string[],
  ): Promise<RecommendationCandidate[]> {
    const items = await prisma.catalogueItem.findMany({
      where: {
        itemId: { in: itemIds },
        status: "published",
        needsEditorialReview: false,
      },
      select: {
        itemId: true,
        type: true,
        name: true,
        status: true,
        needsEditorialReview: true,
        intents: { select: { tag: true } },
        audiences: { select: { tag: true } },
        themes: { select: { tag: true } },
        level: true,
      },
    });

    return items.map((item) => {
      if (
        item.type !== "course" &&
        item.type !== "track" &&
        item.type !== "service" &&
        item.type !== "engagement"
      ) {
        throw new Error("Catalogue item has an unsupported type.");
      }

      return {
        itemId: item.itemId,
        type: item.type,
        name: item.name,
        status:
          item.status === "published"
            ? "published"
            : item.status === "draft"
              ? "draft"
              : item.status === "closed"
                ? "closed"
                : "archived",
        needsEditorialReview: item.needsEditorialReview,
        intents: item.intents.map((entry) => entry.tag),
        audiences: item.audiences.map((entry) => entry.tag),
        themes: item.themes.map((entry) => entry.tag),
        levels: item.level ? [item.level] : [],
      };
    });
  },

  async getBySlug(slug: string) {
    if (!slug.trim()) {
      throw new Error("Slug is required");
    }

    const item = await prisma.catalogueItem.findUnique({
      where: { slug },
    });

    if (!item || item.status !== "published" || item.needsEditorialReview) {
      return null;
    }

    return item;
  },

  async list(options?: { type?: string }) {
    const where: Record<string, unknown> = {
      status: "published",
      needsEditorialReview: false,
    };

    if (options?.type) {
      where.type = options.type;
    }

    return prisma.catalogueItem.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },
};
