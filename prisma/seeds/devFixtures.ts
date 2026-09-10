import type { PrismaClient } from "@prisma/client";

const SESSION_DAYS = 90;
const LEAD_DAYS = 365;

export async function seedDevFixtures(prisma: PrismaClient) {
  const sessionExpiry = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const leadExpiry = new Date(Date.now() + LEAD_DAYS * 24 * 60 * 60 * 1000);

  const red = await prisma.intentSession.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      pill: "red",
      audienceDerived: "professional",
      said: { goal: "switch_career", background: "professional_nontech", timeCommitment: "5to10h", freeText: null },
      inferred: { passionTheme: "analyzing", confidence: 0.82 },
      consent: { storeFreeText: false, contactConsent: false },
      recommendation: { rankedItemIds: ["TRK-DATA"], deterministicOnly: true },
      journeyMap: [{ event: "pill_selected", payload: { pill: "red" } }],
      conversionState: "result_viewed",
      retention: { deletionRequested: false },
      expiresAt: sessionExpiry,
    },
  });

  await prisma.intentSession.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      pill: "blue",
      audienceDerived: "student",
      said: { statementTags: ["first_job", "data-analytics"] },
      inferred: { confidence: 0.71 },
      consent: { storeFreeText: false, contactConsent: false },
      recommendation: {},
      journeyMap: [{ event: "pill_selected", payload: { pill: "blue" } }],
      conversionState: "started",
      retention: { deletionRequested: false },
      expiresAt: sessionExpiry,
    },
  });

  await prisma.intentSession.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      pill: "red",
      conversionState: "abandoned",
      said: {},
      inferred: {},
      consent: {},
      recommendation: {},
      journeyMap: [{ event: "abandoned", payload: {} }],
      retention: { deletionRequested: false },
      expiresAt: sessionExpiry,
    },
  });

  const lead = await prisma.lead.upsert({
    where: { id: "00000000-0000-4000-8000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000011",
      contact: { name: "Dev Fixture", email: "dev.fixture@example.com", phone: "+910000000000", whatsappOptIn: false },
      consent: { purposeShown: "follow_up_about_recommendation", policyVersion: "privacy-v1-draft" },
      audience: "professional",
      intentTag: "switch_career",
      interestItemIds: ["TRK-DATA"],
      sourceJourney: "red",
      captureLayer: "soft",
      sessionRef: red.id,
      qualification: "unqualified",
      owner: "amit",
      status: "new",
      retention: { deletionRequested: false },
      expiresAt: leadExpiry,
    },
  });

  await prisma.intentSession.update({
    where: { id: red.id },
    data: { leadId: lead.id, conversionState: "lead_captured" },
  });

  await prisma.lead.upsert({
    where: { id: "00000000-0000-4000-8000-000000000012" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000012",
      contact: { name: "Org Fixture", email: "org.fixture@example.com", phone: "+910000000001", whatsappOptIn: false },
      consent: { purposeShown: "enterprise_enquiry", policyVersion: "privacy-v1-draft" },
      audience: "organization",
      intentTag: "solve_problem",
      sourceJourney: "blue",
      captureLayer: "enterprise_form",
      qualification: "unqualified",
      owner: "amit",
      status: "new",
      retention: { deletionRequested: false },
      expiresAt: leadExpiry,
    },
  });

  await prisma.leadFollowUp.upsert({
    where: { id: "00000000-0000-4000-8000-000000000021" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000021",
      leadId: lead.id,
      at: new Date(),
      channel: "email",
      note: "Dev outbox placeholder — not a real HubSpot send.",
      by: "system",
    },
  });
}
