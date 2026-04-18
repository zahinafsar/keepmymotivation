-- Create enum
CREATE TYPE "ScheduleKind" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- Add column (nullable for backfill)
ALTER TABLE "Goal" ADD COLUMN "kind" "ScheduleKind";

-- Backfill: prefer dayOfMonth → MONTHLY, else dayOfWeek → WEEKLY, else DAILY.
UPDATE "Goal" SET "kind" = 'MONTHLY' WHERE "dayOfMonth" IS NOT NULL;
UPDATE "Goal" SET "kind" = 'WEEKLY'  WHERE "kind" IS NULL AND "dayOfWeek" IS NOT NULL;
UPDATE "Goal" SET "kind" = 'DAILY'   WHERE "kind" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "Goal" ALTER COLUMN "kind" SET NOT NULL;
