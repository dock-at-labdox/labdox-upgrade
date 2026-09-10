-- Initial schema (DEC-028): Prisma → Supabase Postgres.
-- Logical shapes from 09-data schema doc §5 plus catalogue/taxonomy seed tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "intent_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT,
    "pill" TEXT NOT NULL,
    "audienceDerived" TEXT,
    "said" JSONB NOT NULL DEFAULT '{}',
    "inferred" JSONB NOT NULL DEFAULT '{}',
    "consent" JSONB NOT NULL DEFAULT '{}',
    "recommendation" JSONB NOT NULL DEFAULT '{}',
    "journeyMap" JSONB NOT NULL DEFAULT '[]',
    "conversionState" TEXT NOT NULL DEFAULT 'started',
    "retention" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "leadId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact" JSONB NOT NULL,
    "consent" JSONB NOT NULL,
    "audience" TEXT,
    "intentTag" TEXT,
    "interestItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceJourney" TEXT NOT NULL,
    "captureLayer" TEXT NOT NULL,
    "sessionRef" TEXT,
    "qualification" TEXT NOT NULL DEFAULT 'unqualified',
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "aiOutputRef" JSONB,
    "retention" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_follow_ups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionRef" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "note" TEXT,
    "retention" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_usage" (
    "date" DATE NOT NULL,
    "classifyCalls" INTEGER NOT NULL DEFAULT 0,
    "rankCalls" INTEGER NOT NULL DEFAULT 0,
    "rejectedOutputs" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "hourBuckets" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "taxonomy_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "taxonomy_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalogue_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "level" TEXT,
    "durationHours" DOUBLE PRECISION,
    "deliveryModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trackMapping" TEXT,
    "pricingMode" TEXT NOT NULL,
    "priceInrPerHour" DOUBLE PRECISION,
    "priceBasis" TEXT,
    "evidenceSource" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "needsEditorialReview" BOOLEAN NOT NULL DEFAULT false,
    "sourcePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalogue_item_audiences" (
    "itemId" UUID NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "catalogue_item_audiences_pkey" PRIMARY KEY ("itemId","tag")
);

CREATE TABLE "catalogue_item_intents" (
    "itemId" UUID NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "catalogue_item_intents_pkey" PRIMARY KEY ("itemId","tag")
);

CREATE TABLE "catalogue_item_themes" (
    "itemId" UUID NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "catalogue_item_themes_pkey" PRIMARY KEY ("itemId","tag")
);

CREATE TABLE "journey_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruleId" TEXT NOT NULL,
    "intentTag" TEXT NOT NULL,
    "trackItemId" TEXT,
    "audience" TEXT,
    "theme" TEXT,
    "templateRef" TEXT,

    CONSTRAINT "journey_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "meta_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "intent_sessions_leadId_key" ON "intent_sessions"("leadId");
CREATE INDEX "intent_sessions_conversionState_createdAt_idx" ON "intent_sessions"("conversionState", "createdAt" DESC);
CREATE INDEX "intent_sessions_expiresAt_idx" ON "intent_sessions"("expiresAt");

CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt" DESC);
CREATE INDEX "leads_owner_status_updatedAt_idx" ON "leads"("owner", "status", "updatedAt" DESC);
CREATE INDEX "leads_intentTag_createdAt_idx" ON "leads"("intentTag", "createdAt" DESC);

CREATE INDEX "lead_follow_ups_leadId_at_idx" ON "lead_follow_ups"("leadId", "at" DESC);

CREATE INDEX "feedback_helpful_createdAt_idx" ON "feedback"("helpful", "createdAt" DESC);
CREATE INDEX "feedback_expiresAt_idx" ON "feedback"("expiresAt");

CREATE UNIQUE INDEX "taxonomy_terms_kind_slug_key" ON "taxonomy_terms"("kind", "slug");

CREATE UNIQUE INDEX "catalogue_items_itemId_key" ON "catalogue_items"("itemId");
CREATE UNIQUE INDEX "catalogue_items_slug_key" ON "catalogue_items"("slug");
CREATE INDEX "catalogue_items_type_status_idx" ON "catalogue_items"("type", "status");
CREATE INDEX "catalogue_items_domain_idx" ON "catalogue_items"("domain");

CREATE UNIQUE INDEX "journey_rules_ruleId_key" ON "journey_rules"("ruleId");
CREATE INDEX "journey_rules_intentTag_idx" ON "journey_rules"("intentTag");

CREATE UNIQUE INDEX "staff_roles_slug_key" ON "staff_roles"("slug");
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

ALTER TABLE "intent_sessions" ADD CONSTRAINT "intent_sessions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalogue_item_audiences" ADD CONSTRAINT "catalogue_item_audiences_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalogue_item_intents" ADD CONSTRAINT "catalogue_item_intents_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalogue_item_themes" ADD CONSTRAINT "catalogue_item_themes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "catalogue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: deny-all to anon/authenticated. Server uses the service-role / Prisma direct connection.
ALTER TABLE "intent_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_follow_ups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "taxonomy_terms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalogue_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalogue_item_audiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalogue_item_intents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalogue_item_themes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journey_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meta" ENABLE ROW LEVEL SECURITY;
