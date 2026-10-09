import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export const IntentSessionRepo = {
  async getById(id: string) {
    return prisma.intentSession.findUnique({
      where: { id },
    });
  },

  async create() {
    return prisma.intentSession.create({
      data: {
        pill: "unknown",
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

  type CatalogueListOptions = {
  type?: string;
  domain?: string;
  level?: string;
  audience?: string;
  intent?: string;
};

export const CatalogueRepo = {
  async getBySlug(slug: string) {
    if (!slug.trim()) {
      throw new Error("Slug is required");
    }

    const item = await prisma.catalogueItem.findUnique({
      where: { slug },
    });

    if (!item || item.status !== "published") {
      return null;
    }

    return item;
  },

  async list(options?: CatalogueListOptions) {
    const where: Prisma.CatalogueItemWhereInput = {
      status: "published", // hard rule: public API mein drafts kabhi nahi
    };

    if (options?.type) {
      where.type = options.type;
    }
    if (options?.domain) {
      where.domain = options.domain;
    }
    if (options?.level) {
      where.level = options.level;
    }
    if (options?.audience) {
      where.audiences = { some: { tag: options.audience } };
    }
    if (options?.intent) {
      where.intents = { some: { tag: options.intent } };
    }

    return prisma.catalogueItem.findMany({
      where,
      include: { audiences: true, intents: true },
      orderBy: { name: "asc" },
    });
  },
};


