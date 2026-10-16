ALTER TABLE "intent_sessions"
ADD COLUMN "aiMetadata" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "ai_rate_limit_buckets" (
    "identityHash" VARCHAR(64) NOT NULL,
    "operation" VARCHAR(16) NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_rate_limit_buckets_pkey"
        PRIMARY KEY ("identityHash", "operation", "windowStart"),
    CONSTRAINT "ai_rate_limit_buckets_count_check"
        CHECK ("count" >= 0)
);

CREATE INDEX "ai_rate_limit_buckets_windowStart_idx"
ON "ai_rate_limit_buckets"("windowStart");

ALTER TABLE "ai_rate_limit_buckets" ENABLE ROW LEVEL SECURITY;
