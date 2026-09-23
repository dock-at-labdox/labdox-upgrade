import { prisma } from "./prisma";

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
