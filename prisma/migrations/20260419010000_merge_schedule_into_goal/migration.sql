-- Add schedule fields to Goal
ALTER TABLE "Goal" ADD COLUMN "hour" INTEGER;
ALTER TABLE "Goal" ADD COLUMN "dayOfWeek" INTEGER;
ALTER TABLE "Goal" ADD COLUMN "dayOfMonth" INTEGER;
ALTER TABLE "Goal" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill hour/dayOfWeek/dayOfMonth from existing Schedule (1:1 at this point).
UPDATE "Goal" g
SET
  "hour"       = s."hour",
  "dayOfWeek"  = s."dayOfWeek",
  "dayOfMonth" = s."dayOfMonth"
FROM "Schedule" s
WHERE s."userId" = g."userId";

-- Goals with no Schedule row: default hour=9
UPDATE "Goal" SET "hour" = 9 WHERE "hour" IS NULL;

-- Enforce NOT NULL on hour
ALTER TABLE "Goal" ALTER COLUMN "hour" SET NOT NULL;

-- Rename EmailLog.scheduleId → goalId (data maps 1:1 via Schedule.userId = Goal.userId)
ALTER TABLE "EmailLog" DROP CONSTRAINT IF EXISTS "EmailLog_scheduleId_fkey";
DROP INDEX IF EXISTS "EmailLog_scheduleId_sentAt_idx";

ALTER TABLE "EmailLog" ADD COLUMN "goalId" TEXT;

UPDATE "EmailLog" e
SET "goalId" = g."id"
FROM "Schedule" s
JOIN "Goal" g ON g."userId" = s."userId"
WHERE e."scheduleId" = s."id";

ALTER TABLE "EmailLog" DROP COLUMN "scheduleId";

CREATE INDEX "EmailLog_goalId_sentAt_idx" ON "EmailLog"("goalId", "sentAt");
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_goalId_fkey"
  FOREIGN KEY ("goalId") REFERENCES "Goal"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop @unique on Goal.userId (allow multiple goals per user)
DROP INDEX IF EXISTS "Goal_userId_key";
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- Drop Schedule
DROP TABLE "Schedule";
