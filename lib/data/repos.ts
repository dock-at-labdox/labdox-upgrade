import { prisma } from "./prisma";

export const IntentSessionRepo = {
  async getById(id: string) {
    return prisma.intentSession.findUnique({ where: { id } });
  },

  async create() {
    return prisma.intentSession.create({
      data: {
        pill: "unknown",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.intentSession.update({
      where: { id },
      data,
    });
  },
};

export const LeadRepo = {
  async getById(id: string) {
    return prisma.lead.findUnique({ where: { id } });
  },
};

export const FeedbackRepo = {
  async getById(id: string) {
    return prisma.feedback.findUnique({ where: { id } });
  },
};
