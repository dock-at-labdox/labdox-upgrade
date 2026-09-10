import { prisma } from "./prisma";

export const IntentSessionRepo = {
  async getById(id: string) {
    return prisma.intentSession.findUnique({ where: { id } });
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
